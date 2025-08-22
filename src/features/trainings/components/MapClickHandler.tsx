import { useMapEvents } from 'react-leaflet'
import L from 'leaflet'

interface MapClickHandlerProps {
  setPoint: (point: L.LatLng | null) => void
}

export function MapClickHandler({ setPoint }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      setPoint(e.latlng)
    },
    dblclick: () => {
      setPoint(null)
    },
  })

  return null
}
