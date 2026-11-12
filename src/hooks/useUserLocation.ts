/**
 * useUserLocation.ts
 *
 * Asks the foreground location permission (expo-location) and tracks the user's position while the component is
 * mounted. Returns `{ hasPermission, location }`: `hasPermission` is true once granted, `location` is
 * `{ latitude, longitude }` (see utils/geo.ts) or null until the first fix / when denied.
 *
 * Used by app/(drawer)/tours/detail.tsx to show the user on the tour map and distances to the stops
 * (utils/geo.ts). The position updates every 10 m with balanced accuracy (battery friendly). Failures are only logged
 * (console is stripped in production): the map simply works without the user position.
 */

import { useEffect, useState } from "react" // State + one-time effect
import * as Location from "expo-location" // Permission request and position watching

import type { Coordinates } from "@/src/utils/geo" // Shape of the position state

// Ask foreground permission and track the user's position while mounted
// No argument; the permission prompt is shown on mount
const useUserLocation = () => {
   // True once foreground permission is granted
   const [hasPermission, setHasPermission] = useState<boolean>(false)
   // Latest position, null until the first fix or when the permission is denied
   const [location, setLocation] = useState<Coordinates | null>(null)

   // Runs once: requests the permission, then subscribes to position updates; cleaned up on unmount
   useEffect(() => {
      // Guards against state updates / leaked subscriptions after unmount (the awaits can finish late)
      let isMounted = true
      // Position watcher to remove on unmount
      let subscription: Location.LocationSubscription | null = null

      // Permission, then watch. Does nothing when unmounted meanwhile or when permission is not granted
      const start = async () => {
         try {
            const { status } = await Location.requestForegroundPermissionsAsync()
            if (!isMounted || status !== "granted") return
            setHasPermission(true)

            const sub = await Location.watchPositionAsync(
               {
                  // Balanced: city-block level, saves battery
                  accuracy: Location.Accuracy.Balanced,
                  // Meters the user must move before a new update is emitted
                  distanceInterval: 10,
               },
               ({ coords }) => {
                  if (isMounted) setLocation({ latitude: coords.latitude, longitude: coords.longitude })
               },
            )
            // Unmounted while subscribing: remove the watcher right away
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
