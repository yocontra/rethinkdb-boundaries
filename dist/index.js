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

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

var _defaultConfig = require('./defaultConfig');

var _defaultConfig2 = _interopRequireDefault(_defaultConfig);

var _getFTP = require('./getFTP');

var _getFTP2 = _interopRequireDefault(_getFTP);

var _getRethink = require('./getRethink');

var _getRethink2 = _interopRequireDefault(_getRethink);

var _saveBoundary = require('./saveBoundary');

var _saveBoundary2 = _interopRequireDefault(_saveBoundary);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*eslint no-console: 0 */

exports.default = function (overrides, cb) {
  cb = (0, _once2.default)(cb);
  var options = (0, _lodash2.default)({}, overrides, _defaultConfig2.default);

  console.log(_chalk2.default.bold('Establishing connections:'));
  console.log('  -- ' + _chalk2.default.cyan('US Census Bureau @ ' + options.ftp.host));
  console.log('  -- ' + _chalk2.default.cyan('RethinkDB @ ' + options.rethink.db));

  getConnections(options, function (err, conns) {
    if (err) return cb(err);
    var context = (0, _extends3.default)({}, conns, {
      options: options
    });

    _async2.default.forEachSeries(options.objects, processObject.bind(null, context), cb);
  });
};

function getConnections(options, cb) {
  cb = (0, _once2.default)(cb);
  _async2.default.parallel({
    ftp: _getFTP2.default.bind(null, options.ftp),
    rethink: _getRethink2.default.bind(null, options.rethink)
  }, cb);
}

function processObject(context, object, cb) {
  cb = (0, _once2.default)(cb);
  fetchObjectFiles(context, object, function (err, filePaths) {
    if (err) return cb(err);
    console.log(_chalk2.default.bold('Processing ' + filePaths.length + ' boundary ' + (0, _plural2.default)('file', filePaths.length) + ' for ' + object));
    _async2.default.forEachSeries(filePaths, processFilePath.bind(null, context), cb);
  });
}

function processFilePath(context, file, cb) {
  cb = (0, _once2.default)(cb);
  var ftp = context.ftp;

  ftp.get(file.path, function (err, stream) {
    if (err) return cb(err);

    var srcStream = (0, _shp2json2.default)(stream);
    var chunks = [];

    srcStream.on('data', function (data) {
      chunks.push(data);
    });

    srcStream.once('error', function (err) {
      return cb(err);
    });
    srcStream.once('end', function () {
      var docs = JSON.parse(_buffer.Buffer.concat(chunks)).features;
      console.log('  -- ' + _chalk2.default.cyan('Parsed ' + file.path + ', inserting ' + docs.length + ' boundaries now...'));
      _async2.default.forEach(docs, _saveBoundary2.default.bind(null, context), cb);
    });

    stream.resume();
  });
}

function fetchObjectFiles(_ref, object, cb) {
  var ftp = _ref.ftp;
  var options = _ref.options;

  cb = (0, _once2.default)(cb);
  var folderName = _path2.default.join(options.base, object);
  ftp.list(folderName, function (err, list) {
    if (err) return cb(err);
    var newList = list.filter(function (i) {
      return i.type === '-';
    }).map(function (i) {
      return {
        type: object,
        path: _path2.default.join(folderName, i.name)
      };
    });
    cb(null, newList);
  });
}
module.exports = exports['default'];