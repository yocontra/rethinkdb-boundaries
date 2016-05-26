'use strict';

exports.__esModule = true;

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _buffer = require('buffer');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _shp2json = require('shp2json');

var _shp2json2 = _interopRequireDefault(_shp2json);

var _plural = require('plural');

var _plural2 = _interopRequireDefault(_plural);

var _lodash = require('lodash.defaultsdeep');

var _lodash2 = _interopRequireDefault(_lodash);

var _defaultConfig = require('./defaultConfig');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _getFTP = require('./getFTP');

var _getFTP2 = _interopRequireDefault(_getFTP);

var _getRethink = require('./getRethink');

var _getRethink2 = _interopRequireDefault(_getRethink);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-console: 0 */

exports.default = function (overrides, cb) {
  var options = (0, _lodash2.default)(_defaultConfig2.default, overrides);

  console.log(_chalk2.default.bold('Establishing connections:'));
  console.log('  -- ' + _chalk2.default.cyan('US Census Bureau'));
  console.log('  -- ' + _chalk2.default.cyan('RethinkDB @ ' + options.rethink.db));
  getConnections(options, function (err, conns) {
    if (err) return cb(err);
    var context = (0, _extends3.default)({}, conns, {
      options: options
    });
    _async2.default.auto({
      filePaths: function filePaths(done) {
        console.log(_chalk2.default.bold('Fetching available boundaries'));
        _async2.default.concatSeries(options.objects, fetchObjectFiles.bind(null, context), done);
      },
      json: ['filePaths', function (_ref, done) {
        var filePaths = _ref.filePaths;

        console.log(_chalk2.default.bold('Downloading and converting ' + filePaths.length + ' boundary ' + (0, _plural2.default)('file', filePaths.length)));
        _async2.default.concatSeries(filePaths, fetchObjectData.bind(null, context), done);
      }],
      records: ['json', function (_ref2, done) {
        var json = _ref2.json;

        console.log(_chalk2.default.bold('Writing ' + json.length + ' ' + (0, _plural2.default)('boundary', json.length) + ' to RethinkDB'));
        _async2.default.mapSeries(json, writeGeoJSON.bind(null, context), done);
      }]
    }, cb);
  });
};

function getConnections(options, cb) {
  _async2.default.parallel({
    ftp: _getFTP2.default.bind(null, options.ftp),
    rethink: _getRethink2.default.bind(null, options.rethink)
  }, cb);
}

function inferType(feature) {
  if (feature.properties.STATENS) return 'state';
  if (feature.properties.GEOID10) return 'zip';
  if (feature.properties.PLACENS) return 'place';
  console.log(feature.properties.NAME, feature.properties);
  throw new Error('Unknown feature type?');
}

function getPolygons(geometry) {
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(function (coords) {
      return {
        type: 'Polygon',
        coordinates: coords,
        properties: geometry.properties
      };
    });
  }

  return [geometry];
}

function writeGeoJSON(_ref3, json, cb) {
  var rethink = _ref3.rethink;
  var options = _ref3.options;

  var polygons = getPolygons(json.geometry);
  var data = {
    id: json.properties.GEOID,
    type: inferType(json),
    name: json.properties.GEOID10 || json.properties.NAME,
    geo: polygons.map(function (p) {
      return rethink.geojson(p);
    })
  };

  _async2.default.auto({
    db: function db(done) {
      var finish = function finish() {
        return done(null, rethink.db(options.rethink.db));
      };

      rethink.dbCreate(options.rethink.db).run().then(finish).catch(finish);
    },
    table: ['db', function (_ref4, done) {
      var db = _ref4.db;

      var finish = function finish() {
        return done(null, rethink.table(options.rethink.table));
      };

      db.tableCreate(options.rethink.table).run().then(finish).catch(finish);
    }],
    indexes: ['table', function (_ref5, done) {
      var table = _ref5.table;

      var finish = function finish() {
        return done();
      };
      table.indexCreate('geo', { geo: true, multi: true }).run().then(finish).catch(finish);
    }],
    doc: ['indexes', 'table', function (_ref6, done) {
      var indexes = _ref6.indexes;
      var table = _ref6.table;

      table.insert(data, { conflict: 'replace' }).run().catch(function (err) {
        return done(err);
      }).then(function () {
        return done();
      });
    }]
  }, cb);
}

function fetchObjectFiles(_ref7, object, done) {
  var ftp = _ref7.ftp;
  var options = _ref7.options;

  var folderName = _path2.default.join(options.base, object);
  console.log('  -- ' + _chalk2.default.cyan(object));
  ftp.list(folderName, function (err, list) {
    if (err) return done(err);
    var newList = list.filter(function (i) {
      return i.type === '-';
    }).map(function (i) {
      return {
        type: object,
        path: _path2.default.join(folderName, i.name)
      };
    });
    done(null, newList);
  });
}

function fetchObjectData(_ref8, file, done) {
  var ftp = _ref8.ftp;
  var options = _ref8.options;

  console.log('  -- ' + _chalk2.default.cyan(file.path));
  ftp.get(file.path, function (err, stream) {
    if (err) return done(err);

    var srcStream = (0, _shp2json2.default)(stream);
    var chunks = [];

    srcStream.on('data', function (data) {
      chunks.push(data);
    });

    srcStream.once('error', function (err) {
      return done(err);
    });
    srcStream.once('end', function () {
      return done(null, JSON.parse(_buffer.Buffer.concat(chunks)).features);
    });

    stream.resume();
  });
}
module.exports = exports['default'];