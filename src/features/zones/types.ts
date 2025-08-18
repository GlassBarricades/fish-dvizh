export type Zone = {
  id: string
  competition_id: string
  name: string
  polygon_geojson: any // GeoJSON Polygon
  created_by: string
  created_at: string
}

export type CreateZoneInput = {
  competition_id: string
  name: string
  polygon_geojson: any // GeoJSON Polygon
}

export type UpdateZoneInput = {
  name?: string
  polygon_geojson?: any
}


