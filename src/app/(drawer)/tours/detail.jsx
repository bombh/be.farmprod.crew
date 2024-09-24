import { View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useRef, useState } from "react"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
// TODO: replace Reanimated with Moti

import HeaderBack from "@/src/layouts/HeaderBack"
import useFetch from "@/src/hooks/useFetch"
import Loading from "@/src/components/app/Loading"
import useTransitionEnd from "@/src/hooks/useTransitionEnd"
import Map from "@/src/components/map/Map"
import MapModal from "@/src/components/map/MapModal"

const logo_fresh = require("@/assets/images/logo_fresh.png")
const logo_kosmo = require("@/assets/images/logo_kosmo.png")

export default function Screen() {
   // States
   const [place, setPlace] = useState({})
   const { isTransitionEnd } = useTransitionEnd()

   // Refs
   const _bottomSheet = useRef(null)

   // Hooks
   const params = useLocalSearchParams()
   const { id } = params
   const { data, isLoading, error } = useFetch(`app/data/places.${id}.json`)

   // Handle map's marker press
   const handleMarkerPress = (point) => {
      switch (point.group) {
         case "fpolln":
            point.logo = logo_fresh
            break
         case "kosmo15":
            point.logo = logo_kosmo
            break
         case "kosmo12":
            point.logo = logo_kosmo
            break
         default:
            point.logo = null
      }

      setPlace(point)
      _bottomSheet.current?.snapToIndex(0)
   }

   return (
      <>
         <HeaderBack />
         <View className="flex-1 bg-white">
            {isLoading || !isTransitionEnd ? (
               // Loading...
               <Loading label="Loading Tour" />
            ) : (
               // Map view
               <Animated.View
                  className="flex-1"
                  entering={FadeIn}
                  exiting={FadeOut}
               >
                  <Map
                     data={data}
                     onMarkerPress={handleMarkerPress}
                  />
               </Animated.View>
            )}
         </View>
         {/* Map modal */}
         <MapModal
            ref={_bottomSheet}
            place={place}
         />
      </>
   )
}
