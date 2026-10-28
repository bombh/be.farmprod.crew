const EARTH_RADIUS_M = 6371000

const toRad = (deg) => (deg * Math.PI) / 180

// Great-circle distance (haversine) in meters between two { latitude, longitude } points
export const getDistance = (from, to) => {
   const dLat = toRad(to.latitude - from.latitude)
   const dLng = toRad(to.longitude - from.longitude)
   const a =
      Math.sin(dLat / 2) ** 2 + Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2
   return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// "350 m" / "1.2 km" / "12 km"
export const formatDistance = (meters) => {
   if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
   if (meters < 10000) return `${(meters / 1000).toFixed(1)} km`
   return `${Math.round(meters / 1000)} km`
}
