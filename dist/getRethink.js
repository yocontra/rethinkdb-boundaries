'use strict';

exports.__esModule = true;

var _thinky = require('thinky');

var _thinky2 = _interopRequireDefault(_thinky);

var _once = require('once');

var _once2 = _interopRequireDefault(_once);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (opt, cb) {
  cb = (0, _once2.default)(cb);
  var db = (0, _thinky2.default)(opt);
  db.Boundary = db.createModel(opt.table, {
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

  db.dbReady().then(function () {
    return cb(null, db);
  }).error(cb);
};

module.exports = exports['default'];