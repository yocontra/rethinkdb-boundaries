import rethink from 'rethinkdbdash'

export default (opt, cb) => {
  const conn = rethink(opt.rethink)
  cb(null, conn)
}
