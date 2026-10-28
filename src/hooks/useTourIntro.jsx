/**
 * useTourIntro.jsx
 * "Survol" intro of a tour map:
 * - while the data and the map load, a radar overlay covers the screen (overlayStyle)
 * - under the overlay, the map shows each zoom level of the flight in turn (tour -> overview) to load its tiles
 * - the overlay fades out and the camera flies from the overview to the tour (animateToRegion, native)
 * - the markers appear when the camera arrives
 * Without this preload, Apple Maps shows an empty grid while zooming through levels it has not loaded.
 * With reduce motion: the map opens on the tour with its markers, the overlay just disappears.
 *
 * isMapShown: the MapView is mounted (the intro waits for it)
 * Returns { initialRegion, region, onMapReady, overlayStyle, isOverlayVisible, showMarkers }
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { Easing, useReducedMotion, useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"

// Region delta x zoom, one map tile level each (x2): tour, intermediate level, overview (start of the flight)
const PRELOAD_ZOOMS = [1, 2, 4]
// No "tiles loaded" event on Apple Maps: fixed time to load each level
const TILES_MS = 700
const OVERLAY_FADE_MS = 300
const FLY_MS = 1100
// onMapReady never fires in some cases: the intro starts anyway
const MAP_READY_TIMEOUT = 2500
const EASING = Easing.bezier(0.2, 0, 0, 1)

const useTourIntro = (data, mapRef, isMapShown) => {
   const reduceMotion = useReducedMotion()
   const param = data?.param

   // "loading" (overlay, preload of each level) -> "flying" (camera) -> "done"
   const [phase, setPhase] = useState("loading")
   const [step, setStep] = useState(0)
   const [isMapReady, setIsMapReady] = useState(false)
   const overlay = useSharedValue(1)
   const [isOverlayVisible, setIsOverlayVisible] = useState(true)

   const target = useMemo(
      () =>
         param && {
            latitude: param.mapCenter.lat,
            longitude: param.mapCenter.lng,
            latitudeDelta: param.delta,
            longitudeDelta: param.delta,
         },
      [param],
   )

   // Instant camera jump to the preloaded level (step 0 = initialRegion). Unset afterwards: the flight moves the camera freely
   const region = useMemo(
      () =>
         target &&
         phase === "loading" &&
         step > 0 && {
            ...target,
            latitudeDelta: target.latitudeDelta * PRELOAD_ZOOMS[step],
            longitudeDelta: target.longitudeDelta * PRELOAD_ZOOMS[step],
         },
      [target, phase, step],
   )

   const hideOverlay = useCallback(() => setIsOverlayVisible(false), [])

   const fadeOverlay = useCallback(() => {
      overlay.value = withTiming(0, { duration: reduceMotion ? 0 : OVERLAY_FADE_MS, easing: EASING }, (finished) => {
         if (finished) scheduleOnRN(hideOverlay)
      })
   }, [overlay, reduceMotion, hideOverlay])

   const onMapReady = useCallback(() => setIsMapReady(true), [])

   // Fallback when the map never reports it is ready
   useEffect(() => {
      if (!target || !isMapShown || isMapReady) return
      const timeout = setTimeout(onMapReady, MAP_READY_TIMEOUT)
      return () => clearTimeout(timeout)
   }, [target, isMapShown, isMapReady, onMapReady])

   // Level loaded -> next level, then the flight (reduce motion: the map opens on the tour)
   useEffect(() => {
      if (!target || !isMapReady || phase !== "loading") return
      const timeout = setTimeout(() => {
         if (reduceMotion) {
            fadeOverlay()
            return setPhase("done")
         }
         if (step < PRELOAD_ZOOMS.length - 1) return setStep(step + 1)
         setPhase("flying")
      }, TILES_MS)
      return () => clearTimeout(timeout)
   }, [target, isMapReady, phase, step, reduceMotion, fadeOverlay])

   // The overlay fades out, the camera flies to the tour, then the markers
   useEffect(() => {
      if (phase !== "flying") return
      fadeOverlay()
      mapRef.current?.animateToRegion(target, FLY_MS)
      const timeout = setTimeout(() => setPhase("done"), FLY_MS)
      return () => clearTimeout(timeout)
   }, [phase, fadeOverlay, mapRef, target])

   const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }))

   return {
      initialRegion: target,
      region: region || undefined,
      onMapReady,
      overlayStyle,
      isOverlayVisible,
      // No marker during the overview and the flight: they would pile up on the zoomed-out map
      showMarkers: phase === "done",
   }
}

export default useTourIntro
