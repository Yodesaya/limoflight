// LimoFlight V4 — maps.js
// Google Maps JS API + Routes API + real-time WebSocket vehicle tracking

import { Loader } from '@googlemaps/js-api-loader'

const loader = new Loader({
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  version: 'weekly',
  libraries: ['maps', 'routes', 'marker', 'geometry'],
})

let mapInstance = null
const vehicleMarkers = new Map()
const routePolylines = new Map()
let wsConnection = null

// ── Initialize map ─────────────────────────────────────────────────────────
export async function initLiveMap(container) {
  const { Map } = await loader.importLibrary('maps')
  mapInstance = new Map(container, {
    center: { lat: 34.0522, lng: -118.2437 }, // Los Angeles default
    zoom: 12,
    mapId: import.meta.env.VITE_MAP_ID,
    disableDefaultUI: true,
    gestureHandling: 'greedy',
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a2030' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#445066' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252a3a' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#131825' }] },
    ],
  })
  return mapInstance
}

// ── Add vehicle marker ─────────────────────────────────────────────────────
async function addVehicleMarker(vehicleId, position, vehicleData) {
  const { AdvancedMarkerElement } = await loader.importLibrary('marker')
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="background:${vehicleData.color};border-radius:50% 50% 50% 0;
    width:24px;height:24px;transform:rotate(-45deg);border:2px solid rgba(0,0,0,.3);
    display:flex;align-items:center;justify-content:center">
      <span style="transform:rotate(45deg);font-size:10px">🚗</span>
    </div>`
  const marker = new AdvancedMarkerElement({ map: mapInstance, position, content: el })
  marker.addListener('click', () => onVehicleClick(vehicleId, vehicleData))
  vehicleMarkers.set(vehicleId, marker)
}

// ── Draw route polyline ────────────────────────────────────────────────────
async function drawRoute(vehicleId, origin, destination, color) {
  const { DirectionsService, DirectionsRenderer } = await loader.importLibrary('routes')
  const service = new DirectionsService()
  const renderer = new DirectionsRenderer({
    map: mapInstance,
    suppressMarkers: true,
    polylineOptions: { strokeColor: color, strokeOpacity: 0.7, strokeWeight: 3 },
  })
  service.route({ origin, destination, travelMode: 'DRIVING' }, (result, status) => {
    if (status === 'OK') renderer.setDirections(result)
  })
  routePolylines.set(vehicleId, renderer)
}

// ── Real-time WebSocket vehicle tracking ───────────────────────────────────
export function startLiveTracking(onUpdate) {
  const wsUrl = import.meta.env.VITE_WS_URL
  wsConnection = new WebSocket(wsUrl)

  wsConnection.onopen = () => console.log('[Maps] WebSocket connected ✓')

  wsConnection.onmessage = async ({ data }) => {
    const { vehicleId, lat, lng, heading, speed, eta, progress } = JSON.parse(data)
    const position = { lat, lng }
    const marker = vehicleMarkers.get(vehicleId)
    if (marker) {
      marker.position = position
    } else {
      await addVehicleMarker(vehicleId, position, { color: '#C9A84C' })
    }
    onUpdate?.({ vehicleId, position, heading, speed, eta, progress })
  }

  wsConnection.onclose = () => {
    console.log('[Maps] WebSocket disconnected — reconnecting in 3s')
    setTimeout(() => startLiveTracking(onUpdate), 3000)
  }
}

export function stopLiveTracking() {
  wsConnection?.close()
}

// ── ETA calculation via Routes API ────────────────────────────────────────
export async function getETA(origin, destination) {
  const { RoutesService } = await loader.importLibrary('routes')
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    }),
  })
  const data = await response.json()
  const seconds = parseInt(data.routes[0].duration)
  return { etaMinutes: Math.round(seconds / 60), distanceMiles: Math.round(data.routes[0].distanceMeters / 1609) }
}

function onVehicleClick(vehicleId, vehicleData) {
  console.log('[Maps] Vehicle clicked:', vehicleId, vehicleData)
}
