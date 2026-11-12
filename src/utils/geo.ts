/**
 * geo.ts
 *
 * Small geography helpers (pure functions, no dependency) used by the tours feature: distance between the user and a
 * tour stop, and its human readable form ("350 m", "1.2 km").
 *
 * Used by components/map/MapModal.tsx, which shows the walking distance between the user (position from
 * hooks/useUserLocation.ts) and the pressed point of a tour.
 * Both functions work on `{ latitude, longitude }` objects (the shape of expo-location coordinates), NOT on the
 * `{ lat, lng }` shape of src/types/map.ts: convert before calling.
 */

// Mean Earth radius in meters, used by the haversine formula
const EARTH_RADIUS_M = 6371000

// A GPS position as given by expo-location
export interface Coordinates {
   // Degrees, -90 to 90
   latitude: number
   // Degrees, -180 to 180
   longitude: number
}

// Degrees -> radians
const toRad = (deg: number) => (deg * Math.PI) / 180

// Great-circle distance (haversine) in meters between two { latitude, longitude } points
export const getDistance = (from: Coordinates, to: Coordinates) => {
   const dLat = toRad(to.latitude - from.latitude)
   const dLng = toRad(to.longitude - from.longitude)
   // Haversine "a" term: squared half-chord length between the two points
   const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2
   return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// "350 m" / "1.2 km" / "12 km"
export const formatDistance = (meters: number) => {
   if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
   if (meters < 10000) return `${(meters / 1000).toFixed(1)} km`
   return `${Math.round(meters / 1000)} km`
}
