import { useEffect } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import type { LatLng } from 'leaflet'

interface CatchClickProps {
  setPoint: (p: LatLng | null) => void
}

export function CatchClick({ setPoint }: CatchClickProps) {
  useMapEvents({
    click(e) { setPoint(e.latlng) },
    dblclick() { setPoint(null) }
  })
  
  const map = useMap()
  
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0)
  }, [map])
  
  return null
}
