/*eslint no-console: 0 */

import async from 'async'
import { Buffer } from 'buffer'
import path from 'path'
import chalk from 'chalk'
import toJSON from 'shp2json'
import plural from 'plural'
import defaultsDeep from 'lodash.defaultsdeep'
import config from './defaultConfig'
import getFTP from './getFTP'
import getRethink from './getRethink'
import saveBoundary from './saveBoundary'

export default (overrides, cb) => {
  const options = defaultsDeep({}, overrides, config)

  console.log(chalk.bold('Establishing connections:'))
  console.log(`  -- ${chalk.cyan(`US Census Bureau @ ${options.ftp.host}`)}`)
  console.log(`  -- ${chalk.cyan(`RethinkDB @ ${options.rethink.db}`)}`)

  getConnections(options, (err, conns) => {
    if (err) return cb(err)
    const context = {
      ...conns,
      options
    }

    async.forEachSeries(options.objects, processObject.bind(null, context), cb)
  })
}

function getConnections(options, cb) {
  async.parallel({
    ftp: getFTP.bind(null, options.ftp),
    rethink: getRethink.bind(null, options.rethink)
  }, cb)
}

function processObject(context, object, cb) {
  fetchObjectFiles(context, object, (err, filePaths) => {
    if (err) return cb(err)
    console.log(chalk.bold(`Processing ${filePaths.length} boundary ${plural('file', filePaths.length)} for ${object}`))
    async.forEach(filePaths, processFilePath.bind(null, context), cb)
  })
}

function processFilePath(context, file, cb) {
  const { ftp } = context
  ftp.get(file.path, (err, stream) => {
    if (err) return cb(err)

    const srcStream = toJSON(stream)
    const chunks = []

    srcStream.on('data', (data) => {
      chunks.push(data)
    })

    srcStream.once('error', (err) => cb(err))
    srcStream.once('end', () => {
      const docs = JSON.parse(Buffer.concat(chunks)).features
      console.log(`  -- ${chalk.cyan(`Parsed ${file.path}, inserting ${docs.length} boundaries now...`)}`)
      async.forEach(docs, saveBoundary.bind(null, context), cb)
    })

    stream.resume()
  })
}

function fetchObjectFiles({ ftp, options }, object, done) {
  const folderName = path.join(options.base, object)
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
