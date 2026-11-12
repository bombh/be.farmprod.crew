/**
 * Map.tsx
 *
 * Interactive tour map (react-native-maps), rendered by app/(drawer)/tours/detail.tsx once the screen transition is
 * over (hooks/useTransitionEnd.ts) and driven by hooks/useTourIntro.tsx (camera fly-over, delayed markers).
 *
 * What it renders:
 * - a MapView opened on `initialRegion` (or the tour region from `data.param`: mapCenter + delta), with a custom
 *   JSON style on Android / Google Maps (src/data/mapStyle.json, mapStyleDark.json; Apple Maps on iOS follows the
 *   appearance through `userInterfaceStyle`), the user position dot when the location permission is granted;
 * - one MapMarker per tour point (memoized `Markers`), hidden while `showMarkers` is false (intro flight);
 * - a round "locate me" button (bottom right, only with the location permission, disabled until a position is known)
 *   that animates the camera to the user (500 ms, USER_DELTA zoom).
 * The ref exposes `animateToRegion` (MapHandle) so the intro can fly the camera.
 *
 * Props: data (tour JSON), onMarkerPress (opens the MapModal), hasLocationPermission, userLocation (from
 * hooks/useUserLocation.ts), initialRegion, region (instant camera jump when it changes), onMapReady, showMarkers.
 */

// forwardRef + useImperativeHandle: expose animateToRegion; memo: markers; ref: native map
import React, { forwardRef, memo, useImperativeHandle, useRef } from "react"
import { View, Pressable } from "react-native" // Container and locate button
import MapView from "react-native-maps" // Native map component
import type { Region } from "react-native-maps" // Camera region type (center + deltas)
import FontAwesome6 from "@react-native-vector-icons/fontawesome6" // Locate icon
import MapMarker from "./MapMarker" // One marker per tour point
import useThemeColors from "@/src/hooks/useThemeColors" // Dark / light map style and button icon color
import type { Coordinates } from "@/src/utils/geo" // User position shape
import type { TourPlaces, TourPoint } from "@/src/types/map" // Tour JSON and one point

// Map styles (JSON files in src/data), light and dark
// Google Maps only (Android): Apple Maps (iOS) follows the system / app appearance by itself
const mapStyle = require("@/src/data/mapStyle.json")
const mapStyleDark = require("@/src/data/mapStyleDark.json")

// Zoom (lat / lng delta in degrees) when centering on the user
const USER_DELTA = 0.005

// Markers rebuilt only when the points change, not on each map re-render
// Props: points to draw, onPress called with the pressed point
const Markers = memo(({ points, onPress }: { points: TourPoint[]; onPress: (point: TourPoint) => void }) =>
   points.map((point, index) => (
      <MapMarker
         key={index}
         point={point}
         onPress={onPress}
      />
   )),
)

Markers.displayName = "Markers"

// Imperative API exposed through the ref
export interface MapHandle {
   // Flies the camera to the region; duration in ms (native default when omitted)
   animateToRegion: (region: Region, duration?: number) => void
}

// Props of the map
interface MapProps {
   // Tour JSON (camera param + points)
   data: TourPlaces
   // Called with the point of the pressed marker
   onMarkerPress: (point: TourPoint) => void
   // Shows the user dot and the locate button
   hasLocationPermission?: boolean
   // Latest user position, for the locate button
   userLocation?: Coordinates | null
   // Region the map opens on (default: the tour region)
   initialRegion?: Region
   // Controlled region: the camera jumps to it when it changes
   region?: Region
   // Called when the map has started rendering
   onMapReady?: () => void
   // false hides the markers
   showMarkers?: boolean
}

/**
 * Tour map.
 * initialRegion: optional, defaults to the tour region (data.param)
 * region: optional, instant camera jump when it changes (intro overview)
 * onMapReady: map started rendering (intro start)
 * showMarkers: false hides the markers (during the intro flight)
 * ref: exposes animateToRegion (camera flight)
 */
// See the comment above
const Map = forwardRef<MapHandle, MapProps>(
   (
      {
         data,
         onMarkerPress,
         hasLocationPermission = false,
         userLocation = null,
         initialRegion,
         region,
         onMapReady,
         showMarkers = true,
      },
      ref,
   ) => {
      // Native MapView, used to move the camera
      const mapRef = useRef<MapView>(null)
      // Theme colors (isDark, actionIcon)
      const theme = useThemeColors()

      // Public handle: animateToRegion
      useImperativeHandle(ref, () => ({
         animateToRegion: (region: Region, duration?: number) => mapRef.current?.animateToRegion(region, duration),
      }))

      // Center the map on the user's position
      // Animate the camera to the user position (does nothing without one)
      const handleLocatePress = () => {
         if (!userLocation) return
         mapRef.current?.animateToRegion(
            {
               latitude: userLocation.latitude,
               longitude: userLocation.longitude,
               latitudeDelta: USER_DELTA,
               longitudeDelta: USER_DELTA,
            },
            500,
         )
      }

      // The MapView with its markers, then the optional locate button (absolute, bottom right)
      return (
         <View className="flex-1">
            <MapView
               ref={mapRef}
               className="flex-1"
               initialRegion={
                  initialRegion ?? {
                     latitude: data.param.mapCenter.lat,
                     longitude: data.param.mapCenter.lng,
                     latitudeDelta: data.param.delta,
                     longitudeDelta: data.param.delta,
                  }
               }
               region={region}
               onMapReady={onMapReady}
               customMapStyle={theme.isDark ? mapStyleDark : mapStyle}
               userInterfaceStyle={theme.isDark ? "dark" : "light"}
               showsUserLocation={hasLocationPermission}
               showsMyLocationButton={false}
            >
               {showMarkers && (
                  <Markers
                     points={data.points}
                     onPress={onMarkerPress}
                  />
               )}
            </MapView>

            {/* Locate me */}
            {hasLocationPermission && (
               <Pressable
                  onPress={handleLocatePress}
                  disabled={!userLocation}
                  accessibilityRole="button"
                  accessibilityLabel="Center the map on my location"
                  className={`absolute bottom-8 right-5 bg-black dark:bg-white rounded-full w-14 h-14 items-center justify-center active:bg-red-500 dark:active:bg-red-500 ${
                     userLocation ? "" : "opacity-50"
                  }`}
               >
                  <FontAwesome6
                     name="location-crosshairs"
                     iconStyle="solid"
                     size={24}
                     color={theme.actionIcon}
                  />
               </Pressable>
            )}
         </View>
      )
   },
)

Map.displayName = "Map"

export default Map
