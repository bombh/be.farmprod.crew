/**
 * Parallax.tsx
 *
 * "Parallaxe" motion of the About and 20 years screens (app/(drawer)/about/index.tsx and 20years/index.tsx). Three
 * exported components share one scroll state, created by hooks/useParallaxScroll.tsx and passed through a React
 * context:
 * - ParallaxScrollView: Animated.ScrollView sharing its scroll state (useParallaxScroll) with the blocks below
 * - ParallaxHeader: header image zooming out on arrival, then moving slower than the content while scrolling
 * - Reveal: block coming in once, when it enters the viewport (black band sliding from the left, round button popping)
 * With reduce motion, outside a ParallaxScrollView or with enabled = false, the blocks are rendered at rest (plain
 * Image / View, no animation).
 *
 * How the header parallax works (MovingHeader): the image lives in an overflow-hidden frame. It is made taller than the
 * frame by `overflow` px (= frame position in the content x headerSpeed + a margin, measured with measureLayout), and
 * translated down by scrollY x headerSpeed (it moves slower than the content). It also scales from headerScale to 1
 * over the first headerScaleDistance px of scroll, and zooms out on arrival (arrivalScale -> 1 with a fade).
 * How Reveal works (RevealOnScroll): the block measures its top / height in the scroll content; a Reanimated reaction
 * on the UI thread compares it with scrollY + viewportHeight and starts the entry animation once (`shown`), delayed by
 * nextRevealDelay() so blocks arriving together are staggered. All timings come from `parallax`
 * (constants/animations.ts).
 */

// Shared scroll context, arrival animation, refs and measured overflow state
import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ComponentProps, ReactNode } from "react" // ScrollView props, children type
import { View } from "react-native" // Plain containers
import type { HostInstance } from "react-native" // Native view ref type (measureLayout)
import { Image } from "expo-image" // Header image
import type { ImageProps } from "expo-image" // Props forwarded to the header image
// Reanimated: animated views, shared values, interpolation, UI-thread reaction, timing
import Animated, {
   Extrapolation,
   interpolate,
   // Visible = not yet shown, measured, and the block (revealThreshold of its height) is above the bottom margin of the
   // viewport
   useAnimatedReaction,
   useAnimatedStyle,
   useSharedValue,
   withDelay,
   withTiming,
} from "react-native-reanimated"

// Scroll state hook (scrollY, viewportHeight, nextRevealDelay...)
import useParallaxScroll from "@/src/hooks/useParallaxScroll"
import { parallax } from "@/src/constants/animations" // Timing / distance constants

// Constants of the parallax motion, documented in constants/animations.ts
const {
   easing,
   arrivalScale,
   arrivalDuration,
   arrivalDelay,
   headerSpeed,
   headerScale,
   headerScaleDistance,
   headerOverflowMargin,
   revealThreshold,
   revealBottomMargin,
   bandOffset,
   bandDuration,
   bandTextDelay,
   bandTextDuration,
   popDuration,
} = parallax

// Return value of useParallaxScroll, shared through the context
type ParallaxScroll = ReturnType<typeof useParallaxScroll>

// null outside a ParallaxScrollView: blocks then render at rest
const ParallaxContext = createContext<ParallaxScroll | null>(null)

// Scroll view that publishes its scroll state to ParallaxHeader and Reveal
// ref: forwarded to the ScrollView (scrollTo, e.g. useMenuReset)
export function ParallaxScrollView({
   ref,
   children,
   ...props
}: Omit<ComponentProps<typeof Animated.ScrollView>, "children"> & { children?: ReactNode }) {
   // Scroll state created once per scroll view
   const parallaxScroll = useParallaxScroll()

   return (
      <ParallaxContext.Provider value={parallaxScroll}>
         <Animated.ScrollView
            ref={ref}
            onScroll={parallaxScroll.onScroll}
            onLayout={parallaxScroll.onLayout}
            {...props}
         >
            <ParallaxContent>{children}</ParallaxContent>
         </Animated.ScrollView>
      </ParallaxContext.Provider>
   )
}

// Reveal blocks measure their position in this wrapper (content coordinates)
// Wrapper of the scroll content
function ParallaxContent({ children }: { children?: ReactNode }) {
   // Only rendered by ParallaxScrollView, inside its provider
   // Wrapper view ref from the hook
   const { contentRef } = useContext(ParallaxContext)!

   return (
      <View
         ref={contentRef}
         collapsable={false}
      >
         {children}
      </View>
   )
}

// Header image (expo-image props), in an overflow-hidden frame (className: its size)
// Chooses the moving or the static image
export function ParallaxHeader({ className = "w-full h-36", ...imageProps }: ImageProps & { className?: string }) {
   // Scroll state, null outside a ParallaxScrollView
   const context = useContext(ParallaxContext)

   // Static image: no scroll state or reduce motion
   if (!context || context.reduceMotion) {
      return (
         <Image
            className={className}
            {...imageProps}
         />
      )
   }

   return (
      <MovingHeader
         className={className}
         context={context}
         {...imageProps}
      />
   )
}

// Header with arrival zoom and scroll parallax (see header comment)
function MovingHeader({
   className,
   context,
   ...imageProps
}: ImageProps & { className?: string; context: ParallaxScroll }) {
   // Wrapper of the scroll content, scroll offset (shared value)
   const { contentRef, scrollY } = context
   // Overflow-hidden frame, measured relative to the scroll content
   const frameRef = useRef<HostInstance>(null)
   // Arrival animation progress 0 -> 1
   const arrival = useSharedValue(0)
   // Image height added above the frame, from the frame position in the scroll content
   const [overflow, setOverflow] = useState(0)

   // Measures the frame inside the scroll content and computes the extra image height above the frame
   const onLayout = () => {
      if (!contentRef.current) return
      frameRef.current?.measureLayout(
         contentRef.current,
         (x, y) => setOverflow(Math.ceil(y * headerSpeed) + headerOverflowMargin),
         () => {},
      )
   }

   // Starts the arrival zoom-out on mount
   useEffect(() => {
      arrival.set(withDelay(arrivalDelay, withTiming(1, { duration: arrivalDuration, easing })))
   }, [arrival])

   // Pulled down past the top (iOS bounce): the image stays at rest, no gap under it
   // Parallax: translate by scroll x headerSpeed, and scale down to 1 over headerScaleDistance px; scroll is clamped at
   // 0
   const scrollStyle = useAnimatedStyle(() => {
      const y = Math.max(0, scrollY.get())
      return {
         transform: [
            { translateY: y * headerSpeed },
            { scale: interpolate(y, [0, headerScaleDistance], [headerScale, 1], Extrapolation.CLAMP) },
         ],
      }
   })

   // Arrival: fade in and zoom from arrivalScale to 1
   const arrivalStyle = useAnimatedStyle(() => ({
      opacity: arrival.get(),
      transform: [{ scale: interpolate(arrival.get(), [0, 1], [arrivalScale, 1]) }],
   }))

   return (
      <View
         ref={frameRef}
         onLayout={onLayout}
         className={`overflow-hidden ${className}`}
      >
         {/* Taller than the frame: the image moving down never uncovers its top while the frame is on screen */}
         <Animated.View
            className="absolute inset-x-0 bottom-0"
            style={[{ top: -overflow }, scrollStyle]}
         >
            <Animated.View
               className="flex-1"
               style={arrivalStyle}
            >
               <Image
                  className="w-full h-full"
                  {...imageProps}
               />
            </Animated.View>
         </Animated.View>
      </View>
   )
}

// Block revealed once when it enters the viewport (static when disabled, in reduce motion or outside the view)
// variant: "band" (slides from the left, children fade a little later) or "pop" (children scale up, e.g. a round
// button)
// className: the block (the band itself, or the row holding the button)
export function Reveal({
   enabled = true,
   variant = "band",
   className,
   children,
}: {
   enabled?: boolean
   variant?: "band" | "pop"
   className?: string
   children?: ReactNode
}) {
   // Scroll state, null outside a ParallaxScrollView
   const context = useContext(ParallaxContext)

   if (!enabled || !context || context.reduceMotion) {
      return <View className={className}>{children}</View>
   }

   return (
      <RevealOnScroll
         context={context}
         variant={variant}
         className={className}
      >
         {children}
      </RevealOnScroll>
   )
}

// Animated version of Reveal
function RevealOnScroll({
   context,
   variant,
   className,
   children,
}: {
   // Scroll state shared by ParallaxScrollView
   context: ParallaxScroll
   // Animation style
   variant: "band" | "pop"
   // Classes of the block
   className?: string
   // Content of the block
   children?: ReactNode
}) {
   // Scroll state used to decide when the block enters the viewport
   const { contentRef, scrollY, viewportHeight, nextRevealDelay } = context
   // Block view, measured relative to the scroll content
   const ref = useRef<HostInstance>(null)
   // Position in the scroll content, -1 until measured
   // Position in the scroll content, -1 until measured
   const top = useSharedValue(-1)
   // Height of the block
   const height = useSharedValue(0)
   // True once the entry animation was started (it plays only once)
   const shown = useSharedValue(false)
   // Entry progress 0 -> 1 (band slide, or pop scale)
   const progress = useSharedValue(0)
   // Band text fade 0 -> 1, a little after the band
   const textProgress = useSharedValue(0)

   // Measures the block position and height in the scroll content
   const onLayout = () => {
      if (!contentRef.current) return
      ref.current?.measureLayout(
         contentRef.current,
         (x, y, width, blockHeight) => {
            top.set(y)
            height.set(blockHeight)
         },
         () => {},
      )
   }

   // UI thread: compares the block position with the scroll, until it has been shown once
   useAnimatedReaction(
      () =>
         !shown.get() &&
         top.get() >= 0 &&
         viewportHeight.get() > 0 &&
         top.get() + height.get() * revealThreshold <= scrollY.get() + viewportHeight.get() * (1 - revealBottomMargin),
      (visible) => {
         if (!visible) return
         shown.set(true)
         const delay = nextRevealDelay()
         // Pop variant: a view with the children scaling up
         if (variant === "pop") {
            progress.set(withDelay(delay, withTiming(1, { duration: popDuration, easing })))
            return
         }
         progress.set(withDelay(delay, withTiming(1, { duration: bandDuration, easing })))
         textProgress.set(withDelay(delay + bandTextDelay, withTiming(1, { duration: bandTextDuration, easing })))
      },
   )

   // Band: fade in while sliding from the left
   const bandStyle = useAnimatedStyle(() => ({
      opacity: progress.get(),
      transform: [{ translateX: (1 - progress.get()) * bandOffset }],
   }))
   // Band children fade in later
   const textStyle = useAnimatedStyle(() => ({ opacity: textProgress.get() }))
   // Pop: scales 0.5 -> 1.1 (at 60%) -> 1 while fading in
   const popStyle = useAnimatedStyle(() => ({
      opacity: interpolate(progress.get(), [0, 0.6], [0, 1], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(progress.get(), [0, 0.6, 1], [0.5, 1.1, 1]) }],
   }))

   if (variant === "pop") {
      return (
         <View
            ref={ref}
            collapsable={false}
            onLayout={onLayout}
            className={className}
         >
            <Animated.View style={popStyle}>{children}</Animated.View>
         </View>
      )
   }

   return (
      <Animated.View
         ref={ref}
         onLayout={onLayout}
         className={className}
         style={bandStyle}
      >
         <Animated.View style={textStyle}>{children}</Animated.View>
      </Animated.View>
   )
}
