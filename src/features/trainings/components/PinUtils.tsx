import L from 'leaflet'

export function pinIcon(kind: 'bite' | 'strike' | 'lost' | 'snag') {
  const color = kind === 'bite' ? '#2f9e44' : 
                kind === 'strike' ? '#1971c2' : 
                kind === 'lost' ? '#e8590c' : '#c92a2a'
  
  const svg = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path fill="${color}" d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24C24 5.373 18.627 0 12 0z"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`)
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${svg}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
  })
}

export function pinLabel(kind: 'bite' | 'strike' | 'lost' | 'snag') {
  return kind === 'bite' ? 'Клёв' : 
         kind === 'strike' ? 'Поклёвка' : 
         kind === 'lost' ? 'Сход' : 'Зацеп'
}
