import { View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { AnimatePresence, MotiView } from "moti"

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
   const [showModal, setShowModal] = useState(false)
   const { isTransitionEnd } = useTransitionEnd()

   // Hooks
   const params = useLocalSearchParams()
   const { id } = params
   const { data, isLoading, isError, refetch } = useFetch(`app/data/places.${id}.json`)

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
      setShowModal(true)
   }

   return (
      <>
         <HeaderBack />
         <View className="flex-1 bg-white">
            <AnimatePresence exitBeforeEnter>
               {isLoading || isError || !isTransitionEnd ? (
                  // Loading...
                  <Loading
                     key={`loading${id}`}
                     label="Loading Tour"
                     isError={isError}
                     refetch={refetch}
                  />
               ) : (
                  // Map view
                  <MotiView
                     key="map"
                     className="flex-1"
                     from={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                  >
                     <Map
                        data={data}
                        onMarkerPress={handleMarkerPress}
                     />
                  </MotiView>
               )}
            </AnimatePresence>
         </View>
         {showModal && (
            <MapModal
               place={place}
               onClose={() => setShowModal(false)}
            />
         )}
      </>
   )
}
