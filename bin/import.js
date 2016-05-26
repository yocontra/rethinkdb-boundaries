/*eslint no-console: 0 */

import meow from 'meow'
import loader from '../src'

const helpText = `
    Usage
      $ rethinkdb-boundaries <input>

    Options
      --host   Set the RethinkDB host name (default: localhost')
      --port   Set the RethinkDB port (default: 28015)
      --db     Set the database name (default: test)
      --table  Set the table name (default: Boundary)

    Examples
      $ rethinkdb-boundaries --db my_app
`

const cli = meow({
  inferType: true,
  help: helpText
})

const flags = {
  rethink: {
    host: cli.flags.host,
    port: cli.flags.port,
    db: cli.flags.db,
    table: cli.flags.table
  }
}

loader(flags, (err) => {
  if (err) return console.error('ERROR:', err)
  console.log('Finished!')
  process.exit(1)
})
