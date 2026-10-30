/**
 * MotionView.jsx
 * Entry animation of a view, with Reanimated: from -> animate, on mount (change the key to replay it).
 * Same shape as the configs of constants/animations.js:
 * - from / animate: opacity, translateX, translateY, scale
 * - transition: { duration, delay, easing } (timing)
 * Without "from": the view is shown in its final state, and an entry animation in progress snaps to its end
 * (recycled list card whose animation was interrupted).
 */
import { useEffect } from "react"
import Animated, {
   cancelAnimation,
   useAnimatedStyle,
   useSharedValue,
   withDelay,
   withTiming,
} from "react-native-reanimated"

// Value at progress p: linear, so an overshooting easing (elastic) overshoots the value too
const mix = (p, from, to) => {
   "worklet"
   return from + (to - from) * p
}

const MotionView = ({ from, animate, transition, style, ...props }) => {
   const progress = useSharedValue(from ? 0 : 1)
   const { duration = 300, delay = 0, easing } = transition ?? {}

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
   const animatedStyle = useAnimatedStyle(() => {
      const p = from ? progress.get() : 1
      const start = from ?? {}
      const end = animate ?? {}
      const value = (key, rest) => mix(p, start[key] ?? end[key] ?? rest, end[key] ?? rest)
      return {
         opacity: value("opacity", 1),
         transform: [
            { translateX: value("translateX", 0) },
            { translateY: value("translateY", 0) },
            { scale: value("scale", 1) },
         ],
      }
   })

   return (
      <Animated.View
         style={[style, animatedStyle]}
         {...props}
      />
   )
}

export default MotionView
