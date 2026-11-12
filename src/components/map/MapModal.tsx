/**
 * MapModal.tsx
 *
 * Bottom sheet (@gorhom/bottom-sheet) showing the details of the tour point pressed on the map. Opened by
 * app/(drawer)/tours/detail.tsx when a marker is pressed (it mounts the modal with the `place`), and removed from
 * there when `onClose` is called.
 *
 * Content: the artwork image full size (from map.farmprod.be/.../img/art/<image>), and over its bottom a translucent
 * black block with the group logo (when `place.logo`), the title in the marker font, the place name, the optional
 * comment and the walking distance from the user (haversine distance from utils/geo.ts, only when the user position
 * is known). A small indicator line at the top, and a round button at the top right that opens the system maps app
 * (Apple Maps `maps://` on iOS, `geo:` on Android) on the place.
 * The sheet opens at one snap point (75% of the screen), can be dragged down to close (onClose), and has a backdrop
 * that blocks touches behind it.
 *
 * Props: place (TourPlace), onClose, userLocation (optional).
 */

// Layout; Platform.select for the maps URL scheme; Linking opens the maps app
import { View, Text, Pressable, Platform, Linking } from "react-native"
import { useCallback, useMemo } from "react" // Memoized snap points and backdrop renderer
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet" // Sheet and its dimmed backdrop
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet" // Props given to the backdrop renderer
import { Image } from "expo-image" // Artwork image and group logo
import FontAwesome6 from "@react-native-vector-icons/fontawesome6" // Walking icons
import { getDistance, formatDistance } from "@/src/utils/geo" // Distance between user and place, formatted
import type { Coordinates } from "@/src/utils/geo" // User position shape
import type { TourPlace } from "@/src/types/map" // Pressed point (+ group logo)
import useThemeColors from "@/src/hooks/useThemeColors" // Sheet background color

// Local image shown while the artwork loads
const placeholder = require("@/assets/images/placeholder.png")

// place: point to show; onClose: called when the sheet is closed; userLocation: for the distance
const MapModal = ({
   place,
   onClose,
   userLocation = null,
}: {
   // Point to detail
   place: TourPlace
   // Called when the sheet is dismissed
   onClose: () => void
   // User position; without it the distance is not shown
   userLocation?: Coordinates | null
}) => {
   // Single snap point: the sheet takes 75% of the screen height
   const snapPoints = useMemo(() => ["75%"], [])
   // Theme colors (surface)
   const theme = useThemeColors()

   // Distance as the crow flies from the user to the place
   // Formatted distance ("350 m", "1.2 km") or null
   const distance =
      userLocation && place.geo
         ? formatDistance(getDistance(userLocation, { latitude: place.geo.lat, longitude: place.geo.lng }))
         : null

   // Open Maps/Plan to visit
   // Builds the platform maps URL (search query with the label at the coordinates) and opens it
   const openURL = (point: TourPlace) => {
      const latLng = `${point.geo.lat},${point.geo.lng}`
      const label = encodeURIComponent(point.place)
      const url = Platform.select({
         // Apple Plans
         ios: `maps://0,0?q=${label}@${latLng}`,
         // Default maps app (Google Maps...)
         android: `geo:0,0?q=${latLng}(${label})`,
         // Web: Google Maps in a new tab
         default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
      })

      Linking.openURL(url)
   }

   // Render backdrop for Bottom Sheet
   // Dimmed backdrop visible from index 0, which swallows touches
   const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
         <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            enableTouchThrough={false}
            {...props}
         />
      ),
      [],
   )

   // Sheet with dynamic sizing off and pan-down-to-close; no handle component (a custom indicator line is drawn)
   return (
      <BottomSheet
         snapPoints={snapPoints}
         index={0}
         enableDynamicSizing={false}
         enablePanDownToClose={true}
         onClose={onClose}
         backdropComponent={renderBackdrop}
         backgroundStyle={{ backgroundColor: theme.surface }}
         handleComponent={null}
      >
         <View className="flex-1 relative bg-white dark:bg-neutral-900 rounded-t-xl overflow-hidden">
            {/* Image */}
            <Image
               source={{
                  uri: `https://map.farmprod.be/street-art-map-olln/public/img/art/${place.image}`,
               }}
               className="w-full h-full rounded-t-xl"
               placeholder={placeholder}
               placeholderContentFit="cover"
               transition={500}
               accessibilityLabel={place.name ? `Artwork: ${place.name}` : "Artwork"}
            />

            {/* Text */}
            <View className="bg-black/60 absolute m-0 p-5 pb-12 w-full rounded-xl rounded-b-none bottom-0">
               {place.logo && (
                  <Image
                     source={place.logo}
                     className="w-28 h-28 mx-auto mb-4"
                     accessible={false}
                  />
               )}
               <Text
                  className="text-white font-marker text-center text-xl"
                  accessibilityRole="header"
               >
                  {place.name}
               </Text>

               <Text className="text-white text-center mt-2 text-md">{place.place}</Text>

               {place.comment && <Text className="text-white text-center mt-2 text-xs">{place.comment}</Text>}

               {distance && (
                  <View className="flex-row items-center justify-center gap-2 mt-3">
                     <FontAwesome6
                        name="person-walking"
                        iconStyle="solid"
                        size={14}
                        color="white"
                     />
                     <Text
                        className="text-white text-center text-sm"
                        accessibilityLabel={`${distance} from your location`}
                     >
                        {distance}
                     </Text>
                  </View>
               )}
            </View>

            {/* Indicator line */}
            <View className="flex absolute top-2 items-center w-full">
               <View className="bg-white/50 w-12 h-1 rounded-sm"></View>
            </View>

            {/* Open Maps app */}
            <Pressable
               onPress={() => openURL(place)}
               accessibilityRole="button"
               accessibilityLabel={`Directions to ${place.place || place.name || "this place"}`}
               className="absolute bg-black/70 active:bg-black top-5 right-5 w-16 h-16 rounded-full flex items-center justify-center"
            >
               <FontAwesome6
                  name="person-walking-arrow-right"
                  iconStyle="solid"
                  size={28}
                  color="white"
               />
            </Pressable>
         </View>
      </BottomSheet>
   )
}

export default MapModal
