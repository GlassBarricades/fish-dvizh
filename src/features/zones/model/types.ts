export type Zone = {
  id: string
  competition_id: string
  name: string
  polygon_geojson: any
  created_by: string
  created_at: string
}

export type CreateZoneInput = {
  competition_id: string
  name: string
  polygon_geojson: any
}

export type UpdateZoneInput = {
  name?: string
  polygon_geojson?: any
}


