/**
 * GlassButton.tsx
 *
 * Round icon button with the iOS 26 "Liquid Glass" press feedback: the button swells and lights up while pressed, then
 * springs back with a small wobble. Used for the round buttons of the header and screens (drawer button in
 * layouts/HeaderDrawer.tsx, back button in layouts/HeaderBack.tsx, share / gallery buttons).
 *
 * How it works: one shared value `pressed` (0 -> 1). onPressIn springs it to 1 (scale up to PRESSED_SCALE, glow
 * overlay fades in); onPressOut first guarantees a minimum swell (a quick tap would otherwise release before anything
 * is visible), then springs back to 0 with a low damping (overshoot below 1 = "jelly" settle). The glow is an
 * absolutely positioned rounded View over the content, tinted by `highlightClassName`.
 *
 * Same props as Pressable (className styles the button itself; `style` and `children` are replaced by the component).
 * highlightClassName: color of the pressed glow (defaults to a theme-aware tint)
 * actionDelay: ms before onPress runs, so the swell stays visible when the action immediately covers or removes the
 *   button (drawer opening, going back)
 */
import { useEffect, useRef } from "react" // Timeout cleanup on unmount; ref holding the pending action timeout
import type { ComponentProps, ReactNode } from "react" // Pressable props, children type
import { Pressable } from "react-native" // Base touchable
import type { GestureResponderEvent } from "react-native" // Press event type
// Reanimated: animated Pressable / View, shared value, spring / timing animations
import Animated, {
   useAnimatedStyle,
   useSharedValue,
   withSequence,
   withSpring,
   withTiming,
} from "react-native-reanimated"

// Pressable whose `style` can be an animated style
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Scale reached while pressed
const PRESSED_SCALE = 1.18
// Spring of the press (fast, slightly bouncy)
const PRESS_SPRING = { damping: 14, stiffness: 420, mass: 0.6 }
// Lower damping on release: slight overshoot below 1 gives the "jelly" settle
const RELEASE_SPRING = { damping: 9, stiffness: 220, mass: 0.6 }
// A quick tap releases before the swell is visible: always reach full size first
const MIN_SWELL = { duration: 110 }

// Pressable props minus children / style (re-declared below)
interface GlassButtonProps extends Omit<ComponentProps<typeof Pressable>, "children" | "style"> {
   // NativeWind classes of the button itself
   className?: string
   // NativeWind classes of the glow overlay (background color + opacity)
   highlightClassName?: string
   // Delay in ms before onPress is called (0 = immediate)
   actionDelay?: number
   // Icon or content of the button
   children?: ReactNode
}

// Props not listed are forwarded to the Pressable (`...props`)
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
   // 0 = rest, 1 = fully pressed (drives scale and glow)
   const pressed = useSharedValue(0)
   // Pending delayed onPress, so it can be cleared
   const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

   // Cancels a pending delayed action on unmount
   useEffect(() => () => clearTimeout(actionTimeout.current), [])

   // Scale from 1 to PRESSED_SCALE
   const buttonStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 1 + pressed.get() * (PRESSED_SCALE - 1) }],
   }))

   // Glow opacity follows `pressed` (clamped to 0..1 because the spring overshoots)
   const highlightStyle = useAnimatedStyle(() => ({
      opacity: Math.min(Math.max(pressed.get(), 0), 1),
   }))

   // Pressable with animated scale; the glow overlay ignores touches (pointerEvents none)
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
