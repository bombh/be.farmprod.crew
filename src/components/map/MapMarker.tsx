import React from "react"
import { Marker } from "react-native-maps"
import type { TourPoint } from "@/src/types/map"

// index: unused (the key is set by the parent)
const MapMarker = ({
   point,
   index,
   onPress,
}: {
   point: TourPoint
   index?: number
   onPress: (point: TourPoint) => void
}) => {
   return (
      <Marker
         onPress={() => onPress(point)}
         key={index}
         coordinate={{
            latitude: point.geo.lat,
            longitude: point.geo.lng,
         }}
         tracksViewChanges={false}
         // iOS: classic pins, the default marker views hide the ones that overlap (only ~10 of 35 shown in the center)
         useLegacyPinView
         pinColor={
            point.group === "fpolln"
               ? "black"
               : point.group === "kosmo12"
                 ? "turquoise"
                 : point.group === "kosmo15"
                   ? "tomato"
                   : point.group === "statue"
                     ? "indigo"
                     : "yellow"
         }
      />
   )
}

export default MapMarker
