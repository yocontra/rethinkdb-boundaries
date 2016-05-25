#!/usr/bin/env node

require('babel-register')({
  ignore: false,
  only: /(rethinkdb-boundaries\/bin|rethinkdb-boundaries\/src)/
})
require('./import.js')
