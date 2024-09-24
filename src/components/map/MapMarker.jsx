import React from "react"
import { Marker } from "react-native-maps"

const MapMarker = ({ point, index, onPress }) => {
   return (
      <Marker
         onPress={() => onPress(point)}
         key={index}
         coordinate={{
            latitude: point.geo.lat,
            longitude: point.geo.lng,
         }}
         tracksViewChanges={false}
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
