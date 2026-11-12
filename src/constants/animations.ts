/**
 * animations.ts
 *
 * Shared motion configuration of the app, as plain objects (no hooks, no JSX).
 *
 * Contains:
 * - `EntryAnimation`: the config format played by components/app/MotionView.tsx (Reanimated): the element starts at
 *   `from`, animates to `animate` with the timing `transition`.
 * - `animations.listItem(index)`: slide-in from the left with an elastic easing, staggered by 200 ms per index. Used
 *   by the list screens (works, artists, tours) for each row/card.
 * - `animations.listItemRise(index)`: gentler fade + rise from below, staggered by 70 ms, used when the list appears
 *   from underneath another screen (the chip flight to a filtered Works list, see lib/chipFlight.ts).
 * - `parallax`: all numeric constants (scales, durations, delays, thresholds) of the About / 20 years parallax
 *   screens, consumed by hooks/useParallaxScroll.tsx and components/app/Parallax.tsx.
 *
 * Gotcha: `listItem` reads `Dimensions.get("window").width` when called, so the start offset is one full screen width
 * to the left on the current device size.
 */

import { Dimensions } from "react-native" // Screen width: start offset of the list item slide-in
import { Easing } from "react-native-reanimated" // Easing curves (elastic, bezier) of the transitions
import type { EasingFunction, EasingFunctionFactory } from "react-native-reanimated" // Types of the `easing` field

// Entry animation config played by MotionView (components/app/MotionView.tsx): from -> animate, timing transition
interface EntryValues {
   // 0 (transparent) to 1 (opaque)
   opacity?: number
   // Horizontal offset in px (negative = left)
   translateX?: number
   // Vertical offset in px (positive = down)
   translateY?: number
   // Scale factor, 1 = normal size
   scale?: number
}

export interface EntryAnimation {
   // Values at mount, before the animation starts
   from?: EntryValues
   // Values at the end of the animation
   animate?: EntryValues
   // How to go from `from` to `animate`
   transition?: {
      // Only timing (no spring) is supported by MotionView
      type?: "timing"
      // Duration in ms
      duration?: number
      // Wait before starting, in ms (used to stagger list items)
      delay?: number
      // Reanimated easing function (e.g. Easing.elastic(1), Easing.bezier(...))
      easing?: EasingFunction | EasingFunctionFactory
   }
}

// "Parallaxe" motion of the About and 20 years screens (useParallaxScroll, components/app/Parallax.tsx)
export const parallax = {
   // Material-like "emphasized decelerate" curve shared by all the parallax animations
   easing: Easing.bezier(0.2, 0, 0, 1),
   // Header image: zooms out on arrival...
   arrivalScale: 1.25,
   arrivalDuration: 700,
   arrivalDelay: 60,
   // ...then moves slower than the content, and ends its zoom-out over the first points of scroll
   headerSpeed: 0.38,
   headerScale: 1.14,
   headerScaleDistance: 150,
   // Image height added above the header, uncovered by the parallax: headerSpeed x the header position in the
   // content (the least that leaves no gap while the header is on screen, the image keeps its framing) + this margin
   headerOverflowMargin: 4,
   // Blocks entering the viewport: shown once 12% of their height is above the bottom 6% of the screen
   revealThreshold: 0.12,
   revealBottomMargin: 0.06,
   // Blocks visible on arrival wait for the header zoom, blocks entering together are staggered
   revealIntro: 400,
   revealStagger: 70,
   // Black band: slides from the left, its text fades in a little later
   bandOffset: -32,
   bandDuration: 480,
   bandTextDelay: 160,
   bandTextDuration: 340,
   // Round button: scales up with an overshoot (0.5 > 1.1 at 60% > 1)
   popDuration: 520,
}

export const animations = {
   // for items in a flatlist
   // `index` = position of the item in the list: it sets the delay (index x 200 ms) so items arrive one after another
   listItem: (index: number) => {
      return {
         from: {
            opacity: 0,
            translateX: -Dimensions.get("window").width,
         },
         animate: {
            opacity: 1,
            translateX: 0,
         },
         transition: {
            type: "timing",
            duration: 600,
            // 200 ms between two items
            delay: index * 200,
            easing: Easing.elastic(1),
         },
      } satisfies EntryAnimation
   },

   // for items in a flatlist, when they come from underneath another screen (chip flight to a filtered list)
   // `index` = position in the list: 220 ms base delay (lets the incoming screen settle) + index x 70 ms
   listItemRise: (index: number) => {
      return {
         from: {
            opacity: 0,
            translateY: 18,
         },
         animate: {
            opacity: 1,
            translateY: 0,
         },
         transition: {
            type: "timing",
            duration: 380,
            delay: 220 + index * 70,
            easing: Easing.bezier(0.2, 0, 0, 1),
         },
      } satisfies EntryAnimation
   },
}
