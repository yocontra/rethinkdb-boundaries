'use strict';

exports.__esModule = true;
function saveBoundary(_ref, json, cb) {
  var rethink = _ref.rethink;
  var options = _ref.options;

  var polygons = getPolygons(json.geometry);
  var data = {
    id: json.properties.GEOID,
    type: inferType(json),
    name: json.properties.GEOID10 || json.properties.NAME,
    geo: polygons.map(function (p) {
      return rethink.geojson(p);
    })
  };

  rethink.Boundary.insert(data, { conflict: 'replace' }).run().catch(function (err) {
    return cb(err);
  }).then(function () {
    return cb();
  });
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

function inferType(feature) {
  if (feature.properties.STATENS) return 'state';
  if (feature.properties.GEOID10) return 'zip';
  if (feature.properties.PLACENS) return 'place';
  throw new Error('Unknown feature type for ' + feature.properties.NAME);
}

exports.default = saveBoundary;
module.exports = exports['default'];