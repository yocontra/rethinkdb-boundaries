'use strict';

exports.__esModule = true;

var _ftp = require('ftp');

var _ftp2 = _interopRequireDefault(_ftp);

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (opt, cb) {
  cb = (0, _once2.default)(cb);
  var client = new _ftp2.default();

  client.once('ready', function () {
    client.removeListener('error', cb);
    cb(null, client);
  });
  client.once('error', cb);

  client.connect(opt);
};

module.exports = exports['default'];