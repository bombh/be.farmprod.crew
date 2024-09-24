import { View, Text, Pressable, Platform, Linking } from "react-native"
import React, { forwardRef, useCallback, useMemo } from "react"
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from "@gorhom/bottom-sheet"
import { Image } from "expo-image"
import { FontAwesome6 } from "@expo/vector-icons"

const placeholder = require("@/assets/images/placeholder.png")

const MapModal = forwardRef(({ place }, ref) => {
   const snapPoints = useMemo(() => ["75%"], [])

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
      []
   )

   return (
      <BottomSheet
         snapPoints={snapPoints}
         ref={ref}
         index={-1}
         enablePanDownToClose={true}
         backdropComponent={renderBackdrop}
         backgroundStyle={{ backgroundColor: "#333" }}
         handleComponent={null}
      >
         <BottomSheetView className="relative bg-white rounded-xl rounded-b-none">
            {/* Image */}
            <Image
               source={{
                  uri: `https://map.farmprod.be/street-art-map-olln/public/img/art/${place.image}`,
               }}
               className="w-full h-full rounded-xl rounded-b-none"
               placeholder={placeholder}
               placeholderContentFit="cover"
               transition={500}
            />

            {/* Text */}
            <View className="bg-black/60 absolute m-0 p-5 pb-12 w-full rounded-xl rounded-b-none bottom-0">
               {place.logo && (
                  <Image
                     source={place.logo}
                     className="w-28 h-28 mx-auto mb-4"
                  />
               )}
               <Text className="text-white font-marker text-center text-xl">{place.name}</Text>

               <Text className="text-white text-center mt-2 text-md">{place.place}</Text>

               {place.comment && <Text className="text-white text-center mt-2 text-xs">{place.comment}</Text>}
            </View>

            {/* Indicator line */}
            <View className="flex absolute top-2 items-center w-full">
               <View className="bg-white/50 w-12 h-1 rounded-sm"></View>
            </View>

            {/* Open Maps app */}
            <Pressable
               onPress={() => openURL(place)}
               className="absolute bg-black/70 active:bg-black top-5 right-5 w-16 h-16 rounded-full flex items-center justify-center"
            >
               <FontAwesome6
                  name="person-walking-arrow-right"
                  size={28}
                  color="white"
               />
            </Pressable>
         </BottomSheetView>
      </BottomSheet>
   )
})

export default MapModal
