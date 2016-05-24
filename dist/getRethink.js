'use strict';

exports.__esModule = true;

var _rethinkdbdash = require('rethinkdbdash');

var _rethinkdbdash2 = _interopRequireDefault(_rethinkdbdash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (opt, cb) {
  var conn = (0, _rethinkdbdash2.default)(opt.rethink);
  cb(null, conn);
};

module.exports = exports['default'];