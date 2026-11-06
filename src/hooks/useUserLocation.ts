import { useEffect, useState } from "react"
import * as Location from "expo-location"

import type { Coordinates } from "@/src/utils/geo"

// Ask foreground permission and track the user's position while mounted
const useUserLocation = () => {
   const [hasPermission, setHasPermission] = useState<boolean>(false)
   const [location, setLocation] = useState<Coordinates | null>(null)

   useEffect(() => {
      let isMounted = true
      let subscription: Location.LocationSubscription | null = null

      const start = async () => {
         try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (!isMounted || status !== "granted") return
            setHasPermission(true)

            const sub = await Location.watchPositionAsync(
               {
                  accuracy: Location.Accuracy.Balanced,
                  distanceInterval: 10,
               },
               ({ coords }) => {
                  if (isMounted) setLocation({ latitude: coords.latitude, longitude: coords.longitude })
               }
            )
            if (isMounted) subscription = sub
            else sub.remove()
         } catch (error) {
            console.log("useUserLocation error", error)
         }
      }

      start()

      return () => {
         isMounted = false
         subscription?.remove()
      }
   }, [])

   return { hasPermission, location }
}

export default useUserLocation
