/**
 * TourRadar.jsx
 * Loading overlay of a tour map: the tour name in Permanent Marker over pulsing rings,
 * shown while the data and the map load (see useTourIntro). style: animated fade-out.
 */
import { useEffect } from "react"
import { Text, View } from "react-native"
import Animated, {
   Easing,
   useAnimatedStyle,
   useReducedMotion,
   useSharedValue,
   withDelay,
   withRepeat,
   withTiming,
} from "react-native-reanimated"

const RING_SIZE = 90
const PULSE_MS = 1400
const RINGS = [0, 1, 2]

const Ring = ({ index }) => {
   const reduceMotion = useReducedMotion()
   const pulse = useSharedValue(reduceMotion ? 0.5 : 0)

   useEffect(() => {
      if (reduceMotion) return
      pulse.set(
         withDelay(
            (index * PULSE_MS) / RINGS.length,
            withRepeat(withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) }), -1, false),
         ),
      )
   }, [index, pulse, reduceMotion])

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

const TourRadar = ({ title, style }) => (
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
