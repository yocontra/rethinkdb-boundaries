export default {
  ftp: {
    host: 'ftp2.census.gov',
    port: 21
  },
  rethink: {
    silent: true,
    host: 'localhost',
    port: 28015,
    db: 'test',
    table: 'Boundary'
  },
  base: '/geo/tiger/TIGER2015/',
  objects: [
    'STATE',
    'PLACE'
  ]
}
