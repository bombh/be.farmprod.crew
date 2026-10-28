import { View, Text, Pressable, Platform, Linking } from "react-native"
import React, { useCallback, useMemo } from "react"
import BottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { Image } from "expo-image"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { getDistance, formatDistance } from "@/src/utils/geo"
import useThemeColors from "@/src/hooks/useThemeColors"

const placeholder = require("@/assets/images/placeholder.png")

const MapModal = ({ place, onClose, userLocation = null }) => {
   const snapPoints = useMemo(() => ["75%"], [])
   const theme = useThemeColors()

   // Distance as the crow flies from the user to the place
   const distance =
      userLocation && place.geo
         ? formatDistance(getDistance(userLocation, { latitude: place.geo.lat, longitude: place.geo.lng }))
         : null

   // Open Maps/Plan to visit
   const openURL = (point) => {
      const scheme = Platform.select({
         ios: "maps://0,0?q=",
         android: "geo:0,0?q=",
      })
      const latLng = `${point.geo.lat},${point.geo.lng}`
      const label = encodeURIComponent(point.place)
      const url = Platform.select({
         ios: `${scheme}${label}@${latLng}`,
         android: `${scheme}${latLng}(${label})`,
      })

      Linking.openURL(url)
   }

   // Render backdrop for Bottom Sheet
   const renderBackdrop = useCallback(
      (props) => (
         <BottomSheetBackdrop
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            enableTouchThrough={false}
            {...props}
         />
      ),
      [],
   )

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
