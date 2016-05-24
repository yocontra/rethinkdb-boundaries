/*eslint no-console: 0 */

import async from 'async'
import { Buffer } from 'buffer'
import path from 'path'
import chalk from 'chalk'
import toJSON from 'shp2json'
import plural from 'plural'
import config from './defaultConfig'
import getFTP from './getFTP'
import getRethink from './getRethink'

export default (options = config, cb) => {
  console.log(chalk.bold('Connecting to US Census Bureau...'))
  getConnections(options, (err, conns) => {
    if (err) return cb(err)
    const context = {
      ...conns,
      options
    }
    async.auto({
      filePaths: (done) => {
        console.log(chalk.bold('Fetching available boundaries'))
        async.concatSeries(options.objects, fetchObjectFiles.bind(null, context), done)
      },
      json: [ 'filePaths', ({ filePaths }, done) => {
        console.log(chalk.bold(`Downloading and converting ${filePaths.length} boundary ${plural('file', filePaths.length)}`))
        async.concatSeries(filePaths, fetchObjectData.bind(null, context), done)
      } ],
      records: [ 'json', ({ json }, done) => {
        console.log(chalk.bold(`Writing ${json.length} ${plural('boundary', json.length)} to RethinkDB`))
        async.mapSeries(json, writeGeoJSON.bind(null, context), done)
      } ]
    }, cb)
  })
}

function getConnections(options, cb) {
  async.parallel({
    ftp: getFTP.bind(null, options.ftp),
    rethink: getRethink.bind(null, options.rethink)
  }, cb)
}

function inferType(feature) {
  if (feature.properties.STATENS) return 'state'
  if (feature.properties.GEOID10) return 'zip'
  if (feature.properties.PLACENS) return 'place'
  console.log(feature.properties.NAME, feature.properties)
  throw new Error('Unknown feature type?')
}

function getPolygons(geometry) {
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coords) => ({
      type: 'Polygon',
      coordinates: coords,
      properties: geometry.properties
    }))
  }

  return [ geometry ]
}

function writeGeoJSON({ rethink, options }, json, cb) {
  const polygons = getPolygons(json.geometry)
  const data = {
    id: json.properties.GEOID,
    type: inferType(json),
    name: json.properties.GEOID10 || json.properties.NAME,
    geo: polygons.map((p) => rethink.geojson(p))
  }

  async.auto({
    db: (done) => {
      const finish = () =>
        done(null, rethink.db(options.rethink.db))

      rethink.dbCreate(options.rethink.db)
        .run()
        .then(finish)
        .catch(finish)
    },
    table: [ 'db', ({ db }, done) => {
      const finish = () =>
        done(null, rethink.table(options.rethink.table))

      db
        .tableCreate(options.rethink.table)
        .run()
        .then(finish)
        .catch(finish)
    } ],
    indexes: [ 'table', ({ table }, done) => {
      const finish = () => done()
      table
        .indexCreate('geo', { geo: true, multi: true })
        .run()
        .then(finish)
        .catch(finish)
    } ],
    doc: [ 'indexes', 'table', ({ indexes, table }, done) => {
      table
        .insert(data, { conflict: 'replace' })
        .run()
        .catch((err) => done(err))
        .then(() => done())
    } ]
  }, cb)
}

function fetchObjectFiles({ ftp, options }, object, done) {
  const folderName = path.join(options.base, object)
  console.log(`  -- ${chalk.cyan(object)}`)
  ftp.list(folderName, (err, list) => {
    if (err) return done(err)
    const newList = list
      .filter((i) => i.type === '-')
      .map((i) => ({
        type: object,
        path: path.join(folderName, i.name)
      }))
    done(null, newList)
  })
}

function fetchObjectData({ ftp, options }, file, done) {
  console.log(`  -- ${chalk.cyan(file.path)}`)
  ftp.get(file.path, (err, stream) => {
    if (err) return done(err)

    const srcStream = toJSON(stream)
    const chunks = []

    srcStream.on('data', (data) => {
      chunks.push(data)
    })

    srcStream.once('error', (err) => done(err))
    srcStream.once('end', () =>
      done(null, JSON.parse(Buffer.concat(chunks)).features)
    )

    stream.resume()
  })
}
