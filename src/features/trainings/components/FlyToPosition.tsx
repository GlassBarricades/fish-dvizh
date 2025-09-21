import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

interface FlyToPositionProps {
  lat?: number | null
  lng?: number | null
  zoom?: number
  when?: 'onMount' | 'onChange'
}

export function FlyToPosition({ lat, lng, zoom = 16, when = 'onChange' }: FlyToPositionProps) {
  const map = useMap()

  useEffect(() => {
    if (lat == null || lng == null) return
    // Небольшая задержка, чтобы карта гарантированно отрисовалась в модалке
    const id = window.setTimeout(() => {
      try { map.flyTo([lat, lng], zoom, { duration: 0.8 }) } catch {}
    }, 100)
    return () => window.clearTimeout(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, when === 'onMount' ? [] : [lat, lng, zoom])

  return null
}


