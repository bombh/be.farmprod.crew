/**
 * TourRadar.tsx
 *
 * Loading overlay of a tour map: the tour name in Permanent Marker (font-marker) over three pulsing rings (a "radar"),
 * shown while the data and the map load (see hooks/useTourIntro.tsx, which fades it out through `style`; used by
 * app/(drawer)/tours/detail.tsx). It covers the whole screen (absolute inset-0, opaque white / neutral-950 background)
 * and ignores touches.
 *
 * Each Ring is a bordered circle whose `pulse` shared value loops 0 -> 1 forever (withRepeat, quad ease-out): it grows
 * from 30% to 180% of RING_SIZE while fading from 70% opacity to 0. The three rings are offset by a third of the
 * period (PULSE_MS / 3). With reduce motion the rings stay static at half way.
 *
 * Props: title (tour name), style (animated style from useTourIntro, i.e. the opacity of the fade-out).
 */

import { useEffect } from "react" // Starts the pulse
import { Text, View } from "react-native" // Title and ring container
import type { ComponentProps } from "react" // Type of the style prop
// Reanimated: animated view, easing, shared value, delayed repeating timing, reduce-motion flag
import Animated, {
   Easing,
   useAnimatedStyle,
   useReducedMotion,
   useSharedValue,
   withDelay,
   withRepeat,
   withTiming,
} from "react-native-reanimated"

// Diameter of a ring at scale 1 (px)
const RING_SIZE = 90
// Duration of one pulse (ms)
const PULSE_MS = 1400
// One entry per ring (its value is the ring index)
const RINGS = [0, 1, 2]

// One pulsing ring; index staggers the start
const Ring = ({ index }: { index: number }) => {
   // OS "reduce motion" setting
   const reduceMotion = useReducedMotion()
   // Pulse progress 0 -> 1, repeated
   const pulse = useSharedValue(reduceMotion ? 0.5 : 0)

   // Starts the infinite pulse, delayed by index x PULSE_MS / 3
   useEffect(() => {
      if (reduceMotion) return
      pulse.set(
         withDelay(
            (index * PULSE_MS) / RINGS.length,
            withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1, false),
         ),
      )
   }, [index, pulse, reduceMotion])

   // Ring grows and fades out as pulse goes 0 -> 1
   const style = useAnimatedStyle(() => ({
      opacity: 0.7 * (1 - pulse.get()),
      transform: [{ scale: 0.3 + pulse.get() * 1.5 }],
   }))

   return (
      <Animated.View
         className="absolute rounded-full border-2 border-black dark:border-white"
         style={[{ width: RING_SIZE, height: RING_SIZE }, style]}
      />
   )
}

// title: tour name; style: animated style of the overlay (fade-out)
const TourRadar = ({ title, style }: { title?: string; style?: ComponentProps<typeof Animated.View>["style"] }) => (
   <Animated.View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center bg-white dark:bg-neutral-950"
      style={style}
      accessibilityLabel={`Loading the ${title ?? ""} tour`}
   >
      <View className="items-center justify-center">
         {RINGS.map((index) => (
            <Ring
               key={index}
               index={index}
            />
         ))}
      </View>
      {!!title && (
         <Text
            className="absolute mt-40 text-2xl font-marker text-black dark:text-white text-center"
            maxFontSizeMultiplier={1.4}
         >
            {title}
         </Text>
      )}
   </Animated.View>
)

export default TourRadar
