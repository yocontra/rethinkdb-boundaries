/*eslint no-console: 0 */

import async from 'async'
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

function getConnections(options, done) {
  async.parallel({
    ftp: getFTP.bind(null, options.ftp),
    rethink: getRethink.bind(null, options.rethink)
  }, done)
}

function inferType(feature) {
  if (feature.properties.STATEFP) return 'state'
  if (feature.properties.GEOID10) return 'zip'
  return 'place'
}
function writeGeoJSON({ rethink, options }, json, done) {
  if (json.geometry.type !== 'Polygon') return done() // TODO: figure this out
  const data = {
    type: inferType(json),
    name: json.properties.GEOID10 || json.properties.NAME,
    geojson: rethink.geojson(json.geometry)
  }

  const writeDoc = () => {
    rethink
      .table(options.rethink.table)
      .insert(data, { conflict: 'replace' })
      .run()
      .catch((err) => done(err))
      .then(() => {
        done()
      })
  }

  rethink
    .tableCreate(options.rethink.table, { primaryKey: 'name' })
    .run()
    .then(writeDoc)
    .catch(writeDoc)
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
    let docs = ''

    srcStream.on('data', (data) => {
      docs += data.toString()
    })

    srcStream.once('error', (err) => done(err))
    srcStream.once('end', () => done(null, JSON.parse(docs).features))

    stream.resume()
  })
}
