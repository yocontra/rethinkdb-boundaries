<p align='center'>
  <img src='https://i.imgur.com/JXSMT0k.png' width='400'/>
</p>

# rethinkdb-boundaries [![NPM version][npm-image]][npm-url] [![Downloads][downloads-image]][npm-url]

Downloads, converts, and indexes US Census TIGER data representing all boundaries in the United States to RethinkDB.

By default, this imports the boundaries of every state and incorporated place (~30K boundaries). Takes quite a bit of time depending on your internet speed.

Basically makes it easy to apply a city/state/whatever geo-lens on top of arbitrary data, making queries like these simple:

- What state and city is this location in?
- What states and cities does this line pass through?
- Get all documents that have a line passing through New York, Boston, and Providence
- Subscribe to all new documents created in Boston, MA
- Get all documents created within New York City
- Get all documents created outside of a city

Still a work in progress, more functionality and power being added soon!

#### TODO:

- Query sugar
  - Example: Replace `r.table('geo').filter({type: 'place', name: 'New York City'})` with `geo.place('New York City')` in queries
- Options to import zip codes and more data
- Store more city meta-information from census data
- Sample queries for docs!

## Install

```
npm install rethinkdb-boundaries -g
```

## CLI

```sh
$ rethinkdb-boundaries --help
Usage
  $ rethinkdb-boundaries

Options
  --host  Set the RethinkDB host name (default: 'localhost')
  --port  Set the RethinkDB port (default: '29015')
  --db  Set the database name (default: 'test')
  --table  Set the table name (default: 'Boundary')

Examples
  $ rethinkdb-boundaries --db my_app

$ rethinkdb-boundaries --db my_app
Connecting to US Census Bureau...
Fetching available boundaries
  -- STATE
  -- PLACE
Downloading and converting 57 boundary files
  -- /geo/tiger/TIGER2015/STATE/tl_2015_us_state.zip
```

[downloads-image]: http://img.shields.io/npm/dm/rethinkdb-boundaries.svg
[npm-url]: https://npmjs.org/package/rethinkdb-boundaries
[npm-image]: http://img.shields.io/npm/v/rethinkdb-boundaries.svg
