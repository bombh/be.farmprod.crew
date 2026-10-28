/**
 * useChipFlight.jsx
 * Chip flight: a city / year chip pressed on the work detail page flies to the subtitle of the
 * Works list (filtered on that chip, mounted underneath the detail page) and turns into the marker subtitle,
 * while the detail page fades out. The detail page is then closed.
 *
 * - start(chip, chipView): chip = { type, slug, label }, chipView = the pressed chip (measured)
 * - The filter is requested from Works (src/lib/chipFlight.js), which answers with the subtitle position.
 * - Without that position (Works not reachable in time): the detail page simply fades out.
 *
 * onLeave: closes the detail page
 */
import { useCallback, useRef, useState } from "react"
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { requestWorksFilter, subtitleOpacity } from "@/src/lib/chipFlight"

const EASING = Easing.bezier(0.2, 0, 0, 1)
const FLIGHT_DURATION = 520
const PAGE_FADE_DURATION = 360
// Chip -> marker text crossfade, during the flight
const MORPH_DELAY = 160
const MORPH_DURATION = 360
// Box around the flying chip / text, centered on the flight position (both are centered inside)
const BOX_WIDTH = 320
const BOX_HEIGHT = 60

const measure = (view) =>
   new Promise((resolve) => {
      if (!view?.measureInWindow) return resolve(null)
      view.measureInWindow((x, y, width, height) => resolve(width && height ? { x, y, width, height } : null))
   })

const useChipFlight = (onLeave) => {
   const rootRef = useRef(null)
   const isFlying = useRef(false)
   const [flyingChip, setFlyingChip] = useState(null)

   // Flight position (center of the chip, root coordinates), page fade and chip -> text morph (0 -> 1)
   const x = useSharedValue(0)
   const y = useSharedValue(0)
   const page = useSharedValue(0)
   const morph = useSharedValue(0)

   const start = useCallback(
      async (chip, chipView) => {
         if (isFlying.current) return
         isFlying.current = true

         const [from, root] = await Promise.all([measure(chipView), measure(rootRef.current)])
         const to = await requestWorksFilter(chip)
         const canFly = !!(from && root && to)

         page.value = withTiming(1, { duration: PAGE_FADE_DURATION, easing: EASING }, (finished) => {
            if (finished && !canFly) scheduleOnRN(onLeave)
         })
         if (!canFly) {
            subtitleOpacity.value = 1
            return
         }

         x.value = from.x + from.width / 2 - root.x
         y.value = from.y + from.height / 2 - root.y
         morph.value = 0
         setFlyingChip(chip)

         x.value = withTiming(to.x + to.width / 2 - root.x, { duration: FLIGHT_DURATION, easing: EASING })
         y.value = withTiming(
            to.y + to.height / 2 - root.y,
            { duration: FLIGHT_DURATION, easing: EASING },
            (finished) => {
               if (!finished) return
               // The flying text is on the real subtitle: show it, then close the detail page
               subtitleOpacity.value = 1
               scheduleOnRN(onLeave)
            },
         )
         morph.value = withDelay(MORPH_DELAY, withTiming(1, { duration: MORPH_DURATION, easing: EASING }))
      },
      [onLeave, page, x, y, morph],
   )

   const pageStyle = useAnimatedStyle(() => ({
      opacity: 1 - page.value,
      transform: [{ scale: 1 - page.value * 0.03 }],
   }))

   const overlayStyle = useAnimatedStyle(() => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      transform: [{ translateX: x.value - BOX_WIDTH / 2 }, { translateY: y.value - BOX_HEIGHT / 2 }],
   }))

   const chipStyle = useAnimatedStyle(() => ({
      opacity: 1 - morph.value,
      transform: [{ scale: 1 + morph.value * 0.5 }],
   }))

   const textStyle = useAnimatedStyle(() => ({
      opacity: morph.value,
      transform: [{ scale: 0.6 + morph.value * 0.4 }],
   }))

   return { rootRef, flyingChip, start, pageStyle, overlayStyle, chipStyle, textStyle }
}

export default useChipFlight
