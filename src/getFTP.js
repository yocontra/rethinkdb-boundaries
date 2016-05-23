import FTPClient from 'ftp'

export default (opt, cb) => {
  const client = new FTPClient()

  client.once('ready', () => {
    client.removeListener('error', cb)
    cb(null, client)
  })
  client.once('error', cb)

  client.connect(opt)
}
