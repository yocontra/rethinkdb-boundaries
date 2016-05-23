/*eslint no-console: 0 */

import meow from 'meow'
import loader from '../src'

const helpText = `
    Usage
      $ rethinkdb-boundaries <input>

    Options
      -r, --rainbow  Include a rainbow

    Examples
      $ rethinkdb-boundaries unicorns --rainbow
      🌈 unicorns 🌈
`

const cli = meow({
  inferType: true,
  help: helpText
}, {
  alias: {
    r: 'rainbow'
  }
})

const flags = undefined // cli.flags

loader(flags, (err) => {
  if (err) return console.error('ERROR:', err)
  console.log('Finished!')
  process.exit(1)
})
