/**
 * GlassButton.tsx
 * Round icon button with the iOS 26 "Liquid Glass" press feedback:
 * the button swells and lights up while pressed, then springs back with a small wobble.
 * Same props as Pressable (className styles the button itself).
 * highlightClassName: color of the pressed glow (defaults to a theme-aware tint)
 * actionDelay: ms before onPress runs, so the swell stays visible when the action
 *   immediately covers or removes the button (drawer opening, going back)
 */
import { useEffect, useRef } from "react"
import type { ComponentProps, ReactNode } from "react"
import { Pressable } from "react-native"
import type { GestureResponderEvent } from "react-native"
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withSequence,
   withSpring,
   withTiming,
} from "react-native-reanimated"

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const PRESSED_SCALE = 1.18
const PRESS_SPRING = { damping: 14, stiffness: 420, mass: 0.6 }
// Lower damping on release: slight overshoot below 1 gives the "jelly" settle
const RELEASE_SPRING = { damping: 9, stiffness: 220, mass: 0.6 }
// A quick tap releases before the swell is visible: always reach full size first
const MIN_SWELL = { duration: 110 }

interface GlassButtonProps extends Omit<ComponentProps<typeof Pressable>, "children" | "style"> {
   className?: string
   highlightClassName?: string
   actionDelay?: number
   children?: ReactNode
}

export default function GlassButton({
   className,
   highlightClassName = "bg-black/10 dark:bg-white/20",
   actionDelay = 0,
   onPress,
   onPressIn,
   onPressOut,
   children,
   ...props
}: GlassButtonProps) {
   const pressed = useSharedValue(0)
   const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

   useEffect(() => () => clearTimeout(actionTimeout.current), [])

   const buttonStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 + pressed.get() * (PRESSED_SCALE - 1) }],
   }))

   const highlightStyle = useAnimatedStyle(() => ({
      opacity: Math.min(Math.max(pressed.get(), 0), 1),
   }))

   return (
      <AnimatedPressable
         className={className}
         style={buttonStyle}
         onPressIn={(event: GestureResponderEvent) => {
            pressed.set(withSpring(1, PRESS_SPRING))
            onPressIn?.(event)
         }}
         onPressOut={(event: GestureResponderEvent) => {
            pressed.set(withSequence(withTiming(1, MIN_SWELL), withSpring(0, RELEASE_SPRING)))
            onPressOut?.(event)
         }}
         onPress={(event: GestureResponderEvent) => {
            if (!onPress) return
            if (actionDelay <= 0) return onPress(event)
            clearTimeout(actionTimeout.current)
            actionTimeout.current = setTimeout(() => onPress(event), actionDelay)
         }}
         {...props}
      >
         <Animated.View
            pointerEvents="none"
            className={`absolute inset-0 rounded-full ${highlightClassName}`}
            style={highlightStyle}
         />
         {children}
      </AnimatedPressable>
   )
}
