import React, { forwardRef, memo, useImperativeHandle, useRef } from "react"
import { View, Pressable } from "react-native"
import MapView from "react-native-maps"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import MapMarker from "./MapMarker"
import useThemeColors from "@/src/hooks/useThemeColors"

// Google Maps only (Android): Apple Maps (iOS) follows the system / app appearance by itself
const mapStyle = require("@/src/data/mapStyle.json")
const mapStyleDark = require("@/src/data/mapStyleDark.json")

const USER_DELTA = 0.005

// Markers rebuilt only when the points change, not on each map re-render
const Markers = memo(({ points, onPress }) =>
   points.map((point, index) => (
      <MapMarker
         key={index}
         point={point}
         onPress={onPress}
      />
   )),
)

Markers.displayName = "Markers"

/**
 * Tour map.
 * initialRegion: optional, defaults to the tour region (data.param)
 * region: optional, instant camera jump when it changes (intro overview)
 * onMapReady: map started rendering (intro start)
 * showMarkers: false hides the markers (during the intro flight)
 * ref: exposes animateToRegion (camera flight)
 */
const Map = forwardRef(
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
      const mapRef = useRef(null)
      const theme = useThemeColors()

      useImperativeHandle(ref, () => ({
         animateToRegion: (region, duration) => mapRef.current?.animateToRegion(region, duration),
      }))

      // Center the map on the user's position
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
