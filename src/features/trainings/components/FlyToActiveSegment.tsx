import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface FlyToActiveSegmentProps {
  segments: any[]
  activeSegmentId?: string
}

export function FlyToActiveSegment({ segments, activeSegmentId }: FlyToActiveSegmentProps) {
  const map = useMap()
  
  useEffect(() => {
    if (!activeSegmentId) return
    
    const s = (segments || []).find((x) => x.id === activeSegmentId)
    const ring = s?.area_geojson?.coordinates?.[0] || []
    
    if (!ring.length) return
    
    const latlngs = ring.map((p: [number, number]) => [p[1], p[0]]) as any
    
    try {
      const bounds = L.latLngBounds(latlngs)
      map.fitBounds(bounds.pad(0.2))
    } catch {}
  }, [activeSegmentId, segments, map])
  
  return null
}
