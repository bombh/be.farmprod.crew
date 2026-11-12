/**
 * detail.tsx (src/app/(drawer)/tours, route "/tours/detail")
 *
 * Tour detail screen: the interactive map of one tour. Pushed by components/TourCard.tsx with the route params `id`
 * (tour JSON name) and `title` (shown on the radar).
 *
 * How it works:
 * 1. `useFetch("app/data/places.<id>.json")` downloads the tour (camera param + points), cached on disk.
 * 2. `useTransitionEnd` waits for the push animation to finish; `isMapShown` = transition over, data loaded, points ok.
 *    The heavy native MapView is only created then, while the TourRadar overlay (pulsing rings + title) covers
 *    the wait.
 * 3. `useTourIntro` plays the fly-over (preloads zoom levels under the overlay, fades the overlay, flies the camera to
 *    the tour, then shows the markers); its values are passed to <Map>.
 * 4. `useUserLocation` asks the location permission: the map shows the user and a "locate me" button, and the modal
 *    shows the distance to the point.
 * 5. Pressing a marker (`handleMarkerPress`) sets the point as `place` (with the logo of its group: "fpolln" -> Fresh
 *    logo, "kosmo12" / "kosmo15" -> Kosmo logo) and opens the MapModal bottom sheet; closing it clears `showModal`.
 * On a download error a <Loading> with a Try again button replaces the map. The back bar (no logo) is HeaderBack.
 */

import { View } from "react-native" // Containers
import { useLocalSearchParams } from "expo-router" // Route params (id, title)
import { useCallback, useRef, useState } from "react" // Stable marker handler, map ref, local state

import HeaderBack from "@/src/layouts/HeaderBack" // Back bar
import useFetch from "@/src/hooks/useFetch" // Downloads the tour JSON
import Loading from "@/src/components/app/Loading" // Error / Try again placeholder
import useTransitionEnd from "@/src/hooks/useTransitionEnd" // Waits for the push animation before creating the map
import useUserLocation from "@/src/hooks/useUserLocation" // Foreground location permission and position
import useTourIntro from "@/src/hooks/useTourIntro" // Fly-over intro state machine
import Map from "@/src/components/map/Map" // Interactive map
import MapModal from "@/src/components/map/MapModal" // Bottom sheet with the details of a point
import TourRadar from "@/src/components/map/TourRadar" // Loading overlay
import type { TourPlace, TourPoint } from "@/src/types/map" // Pressed point (+ logo) / tour point

// Logo of the "fpolln" group (shown in the modal)
const logo_fresh = require("@/assets/images/logo_fresh.png")
// Logo of the "kosmo12" and "kosmo15" groups
const logo_kosmo = require("@/assets/images/logo_kosmo.png")

// Screen of the route
export default function Screen() {
   // States
   // Point shown in the modal
   const [place, setPlace] = useState<TourPlace | null>(null)
   // True while the modal is open
   const [showModal, setShowModal] = useState(false)
   // True once the push animation is over
   const { isTransitionEnd } = useTransitionEnd()
   // Imperative handle of the map (camera flights by the intro)
   const mapRef = useRef(null)

   // Hooks
   // Route params
   const params = useLocalSearchParams<{ id: string; title?: string }>()
   // Tour name and title from the route
   const { id, title } = params
   // Tour JSON (typed TourPlaces)
   const { data, isLoading, isError, refetch } = useFetch(`app/data/places.${id}.json`)
   // Permission state and user position
   const { hasPermission, location } = useUserLocation()

   // The map is created once the screen transition is over (heavy native view), the radar covers the wait
   // The map can be mounted
   const isMapShown = isTransitionEnd && !isLoading && !isError && Array.isArray(data?.points)
   // "Survol": overview -> camera flight to the tour, the markers appear when it arrives
   // Intro state and handlers (see hooks/useTourIntro.tsx)
   const intro = useTourIntro(isMapShown ? data : null, mapRef, isMapShown)

   // Handle map's marker press (stable: the markers are memoized)
   // Called with the pressed point: picks the group logo and opens the modal
   const handleMarkerPress = useCallback((point: TourPoint) => {
      // Logo of the point group, none by default
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

   // HeaderBack, then the map + radar (or the error), then the modal outside the container so it covers the screen
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
         {showModal && place && (
            <MapModal
               place={place}
               userLocation={location}
               onClose={() => setShowModal(false)}
            />
         )}
      </>
   )
}
