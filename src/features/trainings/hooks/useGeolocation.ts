import { useEffect, useRef, useState } from 'react'

type GeolocationState = {
  coords: { lat: number; lng: number } | null
  accuracy: number | null
  isSupported: boolean
  isLoading: boolean
  error: string | null
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    accuracy: null,
    isSupported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    isLoading: true,
    error: null,
  })

  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!state.isSupported) {
      setState((s) => ({ ...s, isLoading: false, error: 'Геолокация не поддерживается' }))
      return
    }

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setState({
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            accuracy: pos.coords.accuracy ?? null,
            isSupported: true,
            isLoading: false,
            error: null,
          })
        },
        (err) => {
          setState((s) => ({ ...s, isLoading: false, error: err.message || 'Не удалось получить геопозицию' }))
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
          ...options,
        }
      )
    } catch (e) {
      setState((s) => ({ ...s, isLoading: false, error: 'Ошибка инициализации геолокации' }))
    }

    return () => {
      if (watchIdRef.current != null && state.isSupported) {
        try { navigator.geolocation.clearWatch(watchIdRef.current) } catch {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCurrentPosition = async () => {
    if (!state.isSupported) return null
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    })
  }

  return { ...state, getCurrentPosition }
}


