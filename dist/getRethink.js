'use strict';

exports.__esModule = true;

var _thinky = require('thinky');

var _thinky2 = _interopRequireDefault(_thinky);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (opt, cb) {
  var db = (0, _thinky2.default)(opt);
  db.r.getPoolMaster()._flushErrors = function () {};

  db.Boundary = db.createModel('Boundary', {
    // core fields
    id: db.type.string(),

    // some display info
    name: db.type.string(),

    // geojson
    geo: db.type.array()
  }, {
    enforce_extra: 'remove',
    enforce_type: 'strict'
  });
  db.Boundary.ensureIndex('geo', { geo: true, multi: true });

  cb(null, db);
};

module.exports = exports['default'];