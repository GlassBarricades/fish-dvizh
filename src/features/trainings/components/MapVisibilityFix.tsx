import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

export function MapVisibilityFix() {
  const map = useMap()
  
  useEffect(() => {
    if (!map) return
    
    const container = map.getContainer()
    if (!container) return
    
    const invalidate = () => {
      try {
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize()
          }
        }, 0)
        setTimeout(() => {
          if (map && map.getContainer()) {
            map.invalidateSize()
          }
        }, 200)
      } catch (error) {
        // Ignore errors during map invalidation
      }
    }
    
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) invalidate()
    }, { threshold: [0, 0.1, 0.5, 1] })
    
    const ro = new ResizeObserver(() => {
      try {
        if (map && map.getContainer()) {
          map.invalidateSize()
        }
      } catch (error) {
        // Ignore errors during map invalidation
      }
    })
    
    io.observe(container)
    ro.observe(container)
    
    invalidate()
    
    return () => { 
      io.disconnect()
      ro.disconnect() 
    }
  }, [map])
  
  useEffect(() => {
    if (!map) return
    
    const onMove = () => { 
      try {
        (window as any).__lastMapCenter = map.getCenter() 
      } catch (error) {
        // Ignore errors during map center access
      }
    }
    
    map.on('moveend', onMove)
    onMove()
    
    return () => { 
      map.off('moveend', onMove) 
    }
  }, [map])
  
  return null
}
