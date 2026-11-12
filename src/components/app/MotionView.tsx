/**
 * MotionView.tsx
 *
 * Entry animation of a view, with Reanimated: from -> animate, on mount (change the `key` to replay it). Used to
 * animate list items (WorkCard, ArtistCard, TourCard) and other blocks, with the configs of constants/animations.ts.
 * Same shape as those configs (`EntryAnimation`):
 * - from / animate: opacity, translateX, translateY, scale
 * - transition: { duration, delay, easing } (timing; defaults 300 ms, no delay)
 * Without "from": the view is shown in its final state, and an entry animation in progress snaps to its end
 * (recycled list card whose animation was interrupted).
 *
 * How it works: one shared value `progress` from 0 to 1 (timing, with the optional delay and easing). The animated
 * style linearly mixes each property between its `from` and `animate` value, so an overshooting easing (elastic)
 * overshoots the values too. Missing values fall back to neutral ones (opacity 1, translate 0, scale 1), and all
 * properties are always set so a recycled FlashList cell never keeps a stale state. Other props are passed to the
 * Animated.View; `style` is combined with the animated style.
 */

import { useEffect } from "react" // Starts the animation on mount
import type { ComponentProps } from "react" // Animated.View props
// Reanimated: animated view, shared value, animated style, cancel / delay / timing animations
import Animated, {
   cancelAnimation,
   useAnimatedStyle,
   useSharedValue,
   withDelay,
   withTiming,
} from "react-native-reanimated"

import type { EntryAnimation } from "@/src/constants/animations" // Config type: { from, animate, transition }

// Used from the UI thread (worklet)
// Value at progress p: linear, so an overshooting easing (elastic) overshoots the value too
const mix = (p: number, from: number, to: number) => {
   "worklet"
   return from + (to - from) * p
}

// Props: EntryAnimation + Animated.View props
const MotionView = ({
   from,
   animate,
   transition,
   style,
   ...props
}: EntryAnimation & ComponentProps<typeof Animated.View>) => {
   // 0 = start, 1 = end; starts at 1 without `from` (final state)
   const progress = useSharedValue(from ? 0 : 1)
   // Timing options, with defaults
   const { duration = 300, delay = 0, easing } = transition ?? {}

   // Plays the entry animation (delay, then timing 0 -> 1); without `from`, jumps to the end and cancels a running one
   useEffect(() => {
      if (!from) {
         cancelAnimation(progress)
         progress.set(1)
         return
      }
      progress.set(withDelay(delay, withTiming(1, easing ? { duration, easing } : { duration })))
      // Played once per mount (or when "from" is removed): the configs are recreated on each render
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [!from])

   // Always sets all the values (final ones without config): a recycled view never keeps a stale state
   // Mixes opacity, translateX, translateY and scale between `from` and `animate` according to progress
   const animatedStyle = useAnimatedStyle(() => {
      // Effective progress
      const p = from ? progress.get() : 1
      const start = from ?? {}
      const end = animate ?? {}
      // Value of one property: from (or animate, or neutral) -> animate (or neutral)
      const value = (key: keyof NonNullable<EntryAnimation["from"]>, rest: number) =>
         mix(p, start[key] ?? end[key] ?? rest, end[key] ?? rest)
      return {
         opacity: value("opacity", 1),
         transform: [
            { translateX: value("translateX", 0) },
            { translateY: value("translateY", 0) },
            { scale: value("scale", 1) },
         ],
      }
   })

   // Animated style last so it wins over the style prop
   return (
      <Animated.View
         style={[style, animatedStyle]}
         {...props}
      />
   )
}

export default MotionView
