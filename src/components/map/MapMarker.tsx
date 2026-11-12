/**
 * MapMarker.tsx
 *
 * One pin of the tour map (react-native-maps `Marker`), rendered for each point of a tour by components/map/Map.tsx.
 * Pressing it calls `onPress(point)`, which opens the MapModal with that point.
 *
 * The pin color depends on the point's `group` (TourPoint.group): "fpolln" black, "kosmo12" turquoise, "kosmo15"
 * tomato, "statue" indigo, anything else yellow. `tracksViewChanges={false}` avoids re-rendering the native marker
 * view. On iOS `useLegacyPinView` uses classic pins because the default marker views hide the ones that overlap.
 */

import React from "react" // Imported for JSX
import { Marker } from "react-native-maps" // Native map marker
import type { TourPoint } from "@/src/types/map" // The tour point displayed

// index: unused (the key is set by the parent)
// point: tour point; onPress: called with it when the pin is pressed
const MapMarker = ({
   point,
   index,
   onPress,
}: {
   // Tour point (position and group)
   point: TourPoint
   // Unused
   index?: number
   // Called with the point on press
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
         // Color by group
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
