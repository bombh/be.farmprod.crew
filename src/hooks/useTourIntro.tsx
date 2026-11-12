/**
 * useTourIntro.tsx
 *
 * "Survol" (fly-over) intro of a tour map, used by app/(drawer)/tours/detail.tsx around components/map/Map.tsx
 * (TourRadar is the overlay shown during the loading phase).
 * - while the data and the map load, a radar overlay covers the screen (overlayStyle)
 * - under the overlay, the map shows each zoom level of the flight in turn (tour -> overview) to load its tiles
 * - the overlay fades out and the camera flies from the overview to the tour (animateToRegion, native)
 * - the markers appear when the camera arrives
 * Without this preload, Apple Maps shows an empty grid while zooming through levels it has not loaded.
 * With reduce motion: the map opens on the tour with its markers, the overlay just disappears.
 *
 * State machine: phase "loading" (overlay + preload steps 0..2 with a fixed wait per level) -> "flying" (overlay fade
 * + camera animation, FLY_MS) -> "done" (markers visible). Each transition is driven by a timeout inside an effect.
 *
 * data: tour places (null while loading); mapRef: imperative handle of the map; isMapShown: the MapView is mounted
 * (the intro waits for it)
 * Returns { initialRegion, region, onMapReady, overlayStyle, isOverlayVisible, showMarkers }
 * - initialRegion: camera the map opens on (the tour); region: instant jump to a preload level (undefined otherwise)
 * - onMapReady: to give to the MapView; overlayStyle: animated opacity of the overlay
 * - isOverlayVisible: false once the fade is over (unmount the overlay); showMarkers: true in phase "done"
 */

import { useCallback, useEffect, useMemo, useState } from "react" // State machine, memoized camera, timeouts
import type { RefObject } from "react" // Type of the map handle ref
// Overlay fade animation and reduce-motion flag
import { Easing, useReducedMotion, useSharedValue, withTiming, useAnimatedStyle } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets" // Calls a JS function from an animation callback (UI -> JS thread)

import type { MapHandle } from "@/src/components/map/Map" // Imperative handle of Map (animateToRegion)
import type { TourPlaces } from "@/src/types/map" // Tour data (camera param)

// Region delta x zoom, one map tile level each (x2): tour, intermediate level, overview (start of the flight)
// Region delta x zoom, one map tile level each
const PRELOAD_ZOOMS = [1, 2, 4]
// No "tiles loaded" event on Apple Maps: fixed time to load each level
// Wait per preload level
const TILES_MS = 700
// Duration of the overlay fade-out (ms)
const OVERLAY_FADE_MS = 300
// Duration of the camera flight (ms), also the delay before showing the markers
const FLY_MS = 1100
// onMapReady never fires in some cases: the intro starts anyway
const MAP_READY_TIMEOUT = 2500
// Same "emphasized decelerate" curve as the other transitions
const EASING = Easing.bezier(0.2, 0, 0, 1)

// See header for parameters and return value
const useTourIntro = (data: TourPlaces | null, mapRef: RefObject<MapHandle | null>, isMapShown: boolean) => {
   // OS "reduce motion" setting
   const reduceMotion = useReducedMotion()
   // Camera parameters of the tour (mapCenter + delta), undefined until the data arrives
   const param = data?.param

   // "loading" (overlay, preload of each level) -> "flying" (camera) -> "done"
   // Intro stage: see header
   const [phase, setPhase] = useState("loading")
   // Index in PRELOAD_ZOOMS of the level currently shown
   const [step, setStep] = useState(0)
   // True once the map reported onMapReady (or the fallback timeout fired)
   const [isMapReady, setIsMapReady] = useState(false)
   // Overlay opacity shared value, 1 -> 0
   const overlay = useSharedValue(1)
   // Keeps the overlay mounted until its fade ended
   const [isOverlayVisible, setIsOverlayVisible] = useState(true)

   // Final camera region of the tour (Region format of react-native-maps); undefined without data
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

   // Instant camera jump to the preloaded level (step 0 = initialRegion). Unset afterwards: the flight moves the
   // camera freely
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

   // Unmounts the overlay (called from the animation callback)
   const hideOverlay = useCallback(() => setIsOverlayVisible(false), [])

   // Fades the overlay out (instantly with reduce motion), then hides it
   const fadeOverlay = useCallback(() => {
      overlay.set(
         withTiming(0, { duration: reduceMotion ? 0 : OVERLAY_FADE_MS, easing: EASING }, (finished) => {
            if (finished) scheduleOnRN(hideOverlay)
         }),
      )
   }, [overlay, reduceMotion, hideOverlay])

   // Passed to the MapView
   const onMapReady = useCallback(() => setIsMapReady(true), [])

   // Fallback when the map never reports it is ready
   // Fallback: start the intro after MAP_READY_TIMEOUT even if the map never reports ready
   useEffect(() => {
      if (!target || !isMapShown || isMapReady) return
      const timeout = setTimeout(onMapReady, MAP_READY_TIMEOUT)
      return () => clearTimeout(timeout)
   }, [target, isMapShown, isMapReady, onMapReady])

   // Level loaded -> next level, then the flight (reduce motion: the map opens on the tour)
   // Preload loop: after TILES_MS go to the next level, then to the "flying" phase
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
   // Flight: fade the overlay, animate the camera to the tour, then show the markers
   useEffect(() => {
      if (phase !== "flying") return
      fadeOverlay()
      if (target) mapRef.current?.animateToRegion(target, FLY_MS)
      const timeout = setTimeout(() => setPhase("done"), FLY_MS)
      return () => clearTimeout(timeout)
   }, [phase, fadeOverlay, mapRef, target])

   // Animated opacity of the radar overlay
   const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.get() }))

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
