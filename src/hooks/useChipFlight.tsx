/**
 * useChipFlight.tsx
 *
 * Chip flight animation. A city / year chip pressed on the Work detail page flies to the subtitle of the Works list
 * (filtered on that chip, mounted underneath the detail page) and turns into the marker subtitle, while the detail
 * page fades out. The detail page is then closed.
 *
 * Used by screens/WorkDetail.tsx (the hook state is applied to a root view, the chips and an absolutely positioned
 * overlay holding the flying chip). The other side of the flight lives in app/(drawer)/works/index.tsx via the
 * lib/chipFlight.ts event bus.
 *
 * How `start(chip, chipView)` works, step by step:
 * 1. Ignored if a flight is already running (isFlying ref).
 * 2. Measures the pressed chip and the root view in window coordinates, and asks Works for the filter
 *    (requestWorksFilter), which answers with the position of its subtitle.
 * 3. Without all three rects (Works not reachable in time) the flight is impossible: the page only fades out
 *    (`page` 0 -> 1) and onLeave is called at the end.
 * 4. Otherwise the overlay starts on the chip (x / y = chip center in root coordinates), then x / y animate to the
 *    subtitle center; `morph` crossfades the chip (shrinking out) into the plain subtitle text (growing in).
 *    When the flight ends, the real subtitle is made visible again and onLeave closes the detail page.
 *
 * Reanimated (UI thread) shared values: x, y (flight position), page (page fade, 0 -> 1), morph (chip -> text, 0 -> 1).
 * Returns { rootRef, flyingChip, start, pageStyle, overlayStyle, chipStyle, textStyle }:
 * - rootRef: ref of the root view of the detail page
 * - flyingChip: chip being animated (null when no flight) = what the overlay renders
 * - pageStyle: opacity + slight scale-down of the page content; overlayStyle: position of the flying box;
 *   chipStyle / textStyle: opacity + scale of the two crossfading faces
 *
 * onLeave: closes the detail page (called on the JS thread through scheduleOnRN)
 */

import { useCallback, useRef, useState } from "react" // Stable start callback, refs, flying chip state
import type { HostInstance } from "react-native" // Type of a native view ref (has measureInWindow)
// Reanimated animation primitives
import { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets" // Calls a JS function from a worklet (UI thread -> JS thread)
// Event bus with the Works list: request the filter, hide the real subtitle
import { requestWorksFilter, subtitleOpacity } from "@/src/lib/chipFlight"
import type { SubtitleRect } from "@/src/lib/chipFlight" // Rect of the subtitle / of a measured view
import type { WorkTagChip } from "@/src/utils/works" // Chip shape { type, slug, label }

// Same "emphasized decelerate" curve as the other transitions
const EASING = Easing.bezier(0.2, 0, 0, 1)
// Duration of the chip flight (ms)
const FLIGHT_DURATION = 520
// Duration of the detail page fade-out (ms)
const PAGE_FADE_DURATION = 360
// Chip -> marker text crossfade, during the flight
const MORPH_DELAY = 160
const MORPH_DURATION = 360
// Box around the flying chip / text, centered on the flight position (both are centered inside)
const BOX_WIDTH = 320
const BOX_HEIGHT = 60

// Position and size of a view in window coordinates; resolves null when it cannot be measured (or is 0 x 0)
const measure = (view?: HostInstance | null) =>
   new Promise<SubtitleRect | null>((resolve) => {
      if (!view?.measureInWindow) return resolve(null)
      view.measureInWindow((x, y, width, height) => resolve(width && height ? { x, y, width, height } : null))
   })

// onLeave closes the detail page
const useChipFlight = (onLeave: () => void) => {
   // Root view of the detail page: its window position converts window coordinates to overlay coordinates
   const rootRef = useRef<HostInstance>(null)
   // Guard against a second press while a flight runs (a ref: no re-render needed)
   const isFlying = useRef(false)
   // Chip drawn by the overlay during the flight, null otherwise
   const [flyingChip, setFlyingChip] = useState<WorkTagChip | null>(null)

   // Flight position (center of the chip, root coordinates), page fade and chip -> text morph (0 -> 1)
   const x = useSharedValue(0)
   const y = useSharedValue(0)
   const page = useSharedValue(0)
   const morph = useSharedValue(0)

   // Starts the flight (see header). chip = pressed chip data, chipView = its native view to measure
   const start = useCallback(
      async (chip: WorkTagChip, chipView: HostInstance | null) => {
         if (isFlying.current) return
         isFlying.current = true

         // Chip rect and root rect, measured in parallel
         const [from, root] = await Promise.all([measure(chipView), measure(rootRef.current)])
         // Subtitle rect reported by the Works list, null when unreachable
         const to = await requestWorksFilter(chip)
         // True only when the three rects are known
         const canFly = !!(from && root && to)

         // Fade the page out; when there is no flight, close the detail page at the end of the fade
         page.set(
            withTiming(1, { duration: PAGE_FADE_DURATION, easing: EASING }, (finished) => {
               if (finished && !canFly) scheduleOnRN(onLeave)
            }),
         )
         // No flight: make sure the real subtitle is visible and stop here
         if (!canFly) {
            subtitleOpacity.set(1)
            return
         }

         // Place the overlay on the pressed chip (centers, in root coordinates)
         x.set(from.x + from.width / 2 - root.x)
         y.set(from.y + from.height / 2 - root.y)
         morph.set(0)
         setFlyingChip(chip)

         // Fly to the subtitle center; the end of the vertical animation (same duration) closes the page
         x.set(withTiming(to.x + to.width / 2 - root.x, { duration: FLIGHT_DURATION, easing: EASING }))
         y.set(
            withTiming(to.y + to.height / 2 - root.y, { duration: FLIGHT_DURATION, easing: EASING }, (finished) => {
               if (!finished) return
               // The flying text is on the real subtitle: show it, then close the detail page
               subtitleOpacity.set(1)
               scheduleOnRN(onLeave)
            }),
         )
         // Crossfade chip -> text a bit after the flight starts
         morph.set(withDelay(MORPH_DELAY, withTiming(1, { duration: MORPH_DURATION, easing: EASING })))
      },
      [onLeave, page, x, y, morph],
   )

   // Page content: fades out and shrinks a little (3%) with `page`
   const pageStyle = useAnimatedStyle(() => ({
      opacity: 1 - page.get(),
      transform: [{ scale: 1 - page.get() * 0.03 }],
   }))

   // Absolute box centered on the flight position (translate = center - half box)
   const overlayStyle = useAnimatedStyle(() => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      transform: [{ translateX: x.get() - BOX_WIDTH / 2 }, { translateY: y.get() - BOX_HEIGHT / 2 }],
   }))

   // Chip face: fades out and grows by 50% as morph goes 0 -> 1
   const chipStyle = useAnimatedStyle(() => ({
      opacity: 1 - morph.get(),
      transform: [{ scale: 1 + morph.get() * 0.5 }],
   }))

   // Subtitle text face: fades in and grows from 60% to 100%
   const textStyle = useAnimatedStyle(() => ({
      opacity: morph.get(),
      transform: [{ scale: 0.6 + morph.get() * 0.4 }],
   }))

   return { rootRef, flyingChip, start, pageStyle, overlayStyle, chipStyle, textStyle }
}

export default useChipFlight
