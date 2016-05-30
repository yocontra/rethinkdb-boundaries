import FTPClient from 'ftp'
import once from 'once'

const makeConnection = (opt, cb) => {
  cb = once(cb)
  const client = new FTPClient()
  const retry = setTimeout(() => {
    console.log('Trying FTP again...')
    client.end()
    makeConnection(opt, cb)
  }, 2000)

  client.once('ready', () => {
    client.removeListener('error', cb)
    clearTimeout(retry)
    cb(null, client)
  })
  client.once('error', cb)

  client.connect(opt)
}

export default makeConnection
