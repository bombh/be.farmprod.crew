/**
 * Parallax.jsx
 * "Parallaxe" motion of the About and 20 years screens:
 * - ParallaxScrollView: Animated.ScrollView sharing its scroll state (useParallaxScroll) with the blocks below
 * - ParallaxHeader: header image zooming out on arrival, then moving slower than the content while scrolling
 * - Reveal: block coming in once, when it enters the viewport (black band sliding from the left, round button popping)
 * With reduce motion, outside a ParallaxScrollView or with enabled = false, the blocks are rendered at rest.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { View } from "react-native"
import { Image } from "expo-image"
import Animated, {
   Extrapolation,
   interpolate,
   useAnimatedReaction,
   useAnimatedStyle,
   useSharedValue,
   withDelay,
   withTiming,
} from "react-native-reanimated"

import useParallaxScroll from "@/src/hooks/useParallaxScroll"
import { parallax } from "@/src/constants/animations"

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

const ParallaxContext = createContext(null)

// ref: forwarded to the ScrollView (scrollTo, e.g. useMenuReset)
export function ParallaxScrollView({ ref, children, ...props }) {
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
function ParallaxContent({ children }) {
   const { contentRef } = useContext(ParallaxContext)

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
export function ParallaxHeader({ className = "w-full h-36", ...imageProps }) {
   const context = useContext(ParallaxContext)

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

function MovingHeader({ className, context, ...imageProps }) {
   const { contentRef, scrollY } = context
   const frameRef = useRef(null)
   const arrival = useSharedValue(0)
   // Image height added above the frame, from the frame position in the scroll content
   const [overflow, setOverflow] = useState(0)

   const onLayout = () => {
      if (!contentRef.current) return
      frameRef.current?.measureLayout(
         contentRef.current,
         (x, y) => setOverflow(Math.ceil(y * headerSpeed) + headerOverflowMargin),
         () => {},
      )
   }

   useEffect(() => {
      arrival.set(withDelay(arrivalDelay, withTiming(1, { duration: arrivalDuration, easing })))
   }, [arrival])

   // Pulled down past the top (iOS bounce): the image stays at rest, no gap under it
   const scrollStyle = useAnimatedStyle(() => {
      const y = Math.max(0, scrollY.get())
      return {
         transform: [
            { translateY: y * headerSpeed },
            { scale: interpolate(y, [0, headerScaleDistance], [headerScale, 1], Extrapolation.CLAMP) },
         ],
      }
   })

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

// variant: "band" (slides from the left, children fade a little later) or "pop" (children scale up, e.g. a round button)
// className: the block (the band itself, or the row holding the button)
export function Reveal({ enabled = true, variant = "band", className, children }) {
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

function RevealOnScroll({ context, variant, className, children }) {
   const { contentRef, scrollY, viewportHeight, nextRevealDelay } = context
   const ref = useRef(null)
   // Position in the scroll content, -1 until measured
   const top = useSharedValue(-1)
   const height = useSharedValue(0)
   const shown = useSharedValue(false)
   const progress = useSharedValue(0)
   const textProgress = useSharedValue(0)

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
         if (variant === "pop") {
            progress.set(withDelay(delay, withTiming(1, { duration: popDuration, easing })))
            return
         }
         progress.set(withDelay(delay, withTiming(1, { duration: bandDuration, easing })))
         textProgress.set(withDelay(delay + bandTextDelay, withTiming(1, { duration: bandTextDuration, easing })))
      },
   )

   const bandStyle = useAnimatedStyle(() => ({
      opacity: progress.get(),
      transform: [{ translateX: (1 - progress.get()) * bandOffset }],
   }))
   const textStyle = useAnimatedStyle(() => ({ opacity: textProgress.get() }))
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
