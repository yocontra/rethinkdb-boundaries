import FTPClient from 'ftp'
import once from 'once'

export default (opt, cb) => {
  cb = once(cb)
  const client = new FTPClient()

  client.once('ready', () => {
    client.removeListener('error', cb)
    cb(null, client)
  })
  client.once('error', cb)

  client.connect(opt)
}
