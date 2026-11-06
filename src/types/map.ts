// Tour map JSON (map.farmprod.be/street-art-map-olln/public/app/data/places.<tour>.json)

export interface TourLatLng {
   lat: number
   lng: number
}

export interface TourPoint {
   name: string
   place: string
   address: string
   geo: TourLatLng
   // File name in .../public/img/art/
   image: string
   // Marker color group: "fpolln", "kosmo12", "kosmo15", "statue" or any other (default marker)
   group: string
   // Only some points are numbered
   num?: number
   comment?: string
}

// Point shown in the map modal: the pressed point and the logo of its group (null without)
export interface TourPlace extends TourPoint {
   logo?: number | null
}

export interface TourParam {
   mapCenter: TourLatLng
   delta: number
}

export interface TourPlaces {
   comment?: string
   param: TourParam
   points: TourPoint[]
}
