function saveBoundary({ rethink, options }, json, cb) {
  const polygons = getPolygons(json.geometry)
  const data = {
    id: json.properties.GEOID,
    type: inferType(json),
    name: json.properties.GEOID10 || json.properties.NAME,
    geo: polygons.map((p) => rethink.r.geojson(p))
  }

  rethink.Boundary
    .insert(data, { conflict: 'replace' })
    .run()
    .catch((err) => cb(err))
    .then(() => cb())
}

function getPolygons(geometry) {
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coords) => ({
      type: 'Polygon',
      coordinates: coords,
      properties: geometry.properties
    }))
  }

  return [ geometry ]
}

function inferType(feature) {
  if (feature.properties.STATENS) return 'state'
  if (feature.properties.GEOID10) return 'zip'
  if (feature.properties.PLACENS) return 'place'
  throw new Error(`Unknown feature type for ${feature.properties.NAME}`)
}

export default saveBoundary
