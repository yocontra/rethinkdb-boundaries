import thinky from 'thinky'
import once from 'once'

export default (opt, cb) => {
  cb = once(cb)
  const db = thinky(opt)
  db.Boundary = db.createModel(opt.table, {
    // core fields
    id: db.type.string(),

    // some display info
    name: db.type.string(),

    // geojson
    geo: db.type.array()
  }, {
    enforce_extra: 'remove',
    enforce_type: 'strict'
  })
  db.Boundary.ensureIndex('geo', { geo: true, multi: true })

  db.dbReady().then(() => cb(null, db)).error(cb)
}
