/**
 * map.ts
 *
 * TypeScript shapes of the tour map JSON published by the Farm Prod map site
 * (map.farmprod.be/street-art-map-olln/public/app/data/places.<tour>.json). Type-only file.
 *
 * Role in the app: the JSON is downloaded with `useFetch<TourPlaces>()` (hooks/useFetch.ts) in the tour detail screen
 * (app/(drawer)/tours/detail.tsx), then drawn by components/map/Map.tsx (one MapMarker per point) and
 * detailed in components/map/MapModal.tsx when a marker is pressed. `TourLatLng` is also used by utils/geo.ts and
 * hooks/useUserLocation.ts.
 */

// Tour map JSON (map.farmprod.be/street-art-map-olln/public/app/data/places.<tour>.json)

// A GPS coordinate in degrees
export interface TourLatLng {
   // Latitude in degrees
   lat: number
   // Longitude in degrees
   lng: number
}

// One artwork / stop of a tour
export interface TourPoint {
   // Title of the artwork
   name: string
   // Name of the place (street, building...)
   place: string
   // Postal address, shown in the modal
   address: string
   // Position of the artwork
   geo: TourLatLng
   // File name in .../public/img/art/
   image: string
   // Marker color group: "fpolln", "kosmo12", "kosmo15", "statue" or any other (default marker)
   group: string
   // Only some points are numbered
   num?: number
   // Optional description of the artwork, shown in the modal
   comment?: string
}

// Point shown in the map modal: the pressed point and the logo of its group (null without)
export interface TourPlace extends TourPoint {
   // `require()` id of the group's logo image, null/undefined when the group has no logo
   logo?: number | null
}

// Initial camera of the map
export interface TourParam {
   // Center the map opens on
   mapCenter: TourLatLng
   // Latitude/longitude delta (zoom level) the map opens with
   delta: number
}

// Whole content of a tour JSON file
export interface TourPlaces {
   // Free comment of the tour (not displayed)
   comment?: string
   // Initial camera of the map
   param: TourParam
   // All the stops of the tour
   points: TourPoint[]
}
