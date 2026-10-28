import { View } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { useCallback, useRef, useState } from "react"

import HeaderBack from "@/src/layouts/HeaderBack"
import useFetch from "@/src/hooks/useFetch"
import Loading from "@/src/components/app/Loading"
import useTransitionEnd from "@/src/hooks/useTransitionEnd"
import useUserLocation from "@/src/hooks/useUserLocation"
import useTourIntro from "@/src/hooks/useTourIntro"
import Map from "@/src/components/map/Map"
import MapModal from "@/src/components/map/MapModal"
import TourRadar from "@/src/components/map/TourRadar"

const logo_fresh = require("@/assets/images/logo_fresh.png")
const logo_kosmo = require("@/assets/images/logo_kosmo.png")

export default function Screen() {
   // States
   const [place, setPlace] = useState({})
   const [showModal, setShowModal] = useState(false)
   const { isTransitionEnd } = useTransitionEnd()
   const mapRef = useRef(null)

   // Hooks
   const params = useLocalSearchParams()
   const { id, title } = params
   const { data, isLoading, isError, refetch } = useFetch(`app/data/places.${id}.json`)
   const { hasPermission, location } = useUserLocation()

   // The map is created once the screen transition is over (heavy native view), the radar covers the wait
   const isMapShown = isTransitionEnd && !isLoading && !isError && Array.isArray(data?.points)
   // "Survol": overview -> camera flight to the tour, the markers appear when it arrives
   const intro = useTourIntro(isMapShown ? data : null, mapRef, isMapShown)

   // Handle map's marker press (stable: the markers are memoized)
   const handleMarkerPress = useCallback((point) => {
      let logo = null
      switch (point.group) {
         case "fpolln":
            logo = logo_fresh
            break
         case "kosmo15":
         case "kosmo12":
            logo = logo_kosmo
            break
      }

      setPlace({ ...point, logo })
      setShowModal(true)
   }, [])

   return (
      <>
         <HeaderBack hideLogo />
         <View className="flex-1 bg-white dark:bg-neutral-950">
            {isError ? (
               <Loading
                  key={`loading${id}`}
                  label="Loading Tour"
                  isError={isError}
                  refetch={refetch}
               />
            ) : (
               <>
                  {isMapShown && (
                     <Map
                        ref={mapRef}
                        data={data}
                        onMarkerPress={handleMarkerPress}
                        hasLocationPermission={hasPermission}
                        userLocation={location}
                        initialRegion={intro.initialRegion}
                        region={intro.region}
                        onMapReady={intro.onMapReady}
                        showMarkers={intro.showMarkers}
                     />
                  )}
                  {intro.isOverlayVisible && (
                     <TourRadar
                        title={title}
                        style={intro.overlayStyle}
                     />
                  )}
               </>
            )}
         </View>
         {showModal && (
            <MapModal
               place={place}
               userLocation={location}
               onClose={() => setShowModal(false)}
            />
         )}
      </>
   )
}
