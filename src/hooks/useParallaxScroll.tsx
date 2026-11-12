/**
 * useParallaxScroll.tsx
 *
 * Scroll state of the "Parallaxe" screens (About, 20 years), created once by ParallaxScrollView and handed to
 * ParallaxHeader and Reveal (src/components/app/Parallax.tsx). A single scroll shared value is updated on the UI
 * thread: the header parallax and the "enters the viewport" checks of the Reveal blocks run in worklets, without JS
 * work while scrolling.
 *
 * Returns { reduceMotion, contentRef, scrollY, viewportHeight, onScroll, onLayout, nextRevealDelay }
 * - reduceMotion: OS "reduce motion" setting (animations are skipped when true)
 * contentRef: wrapper of the scroll content, the Reveal blocks measure their position from it
 * - scrollY: vertical scroll offset (shared value)
 * - viewportHeight: height of the scroll viewport (shared value, set by onLayout)
 * onScroll / onLayout: props of the Animated.ScrollView
 * nextRevealDelay: worklet, delay of a block entering the viewport now
 *
 * Reveal delay logic: blocks visible on arrival wait until `revealIntro` ms after the content was shown (the header
 * zoom-out), and blocks entering the viewport within 20 ms of each other are staggered by `revealStagger` ms each.
 * Constants come from `parallax` in constants/animations.ts.
 */

import { useEffect, useMemo, useRef } from "react" // Mount timestamp effect, memoized return object, content ref
import type { HostInstance, LayoutChangeEvent } from "react-native" // Native view ref type; layout event type
// Scroll handler on the UI thread, OS reduce-motion flag, shared values
import { useAnimatedScrollHandler, useReducedMotion, useSharedValue } from "react-native-reanimated"

import { parallax } from "@/src/constants/animations" // Shared timing constants of the parallax screens

// revealIntro: wait after arrival (ms); revealStagger: gap between blocks of a group (ms)
const { revealIntro, revealStagger } = parallax
// Blocks entering the viewport within this time (ms) are staggered as one group
const REVEAL_GROUP_WINDOW = 20

// No arguments; call once per screen
const useParallaxScroll = () => {
   // True when the user enabled "reduce motion" in the OS
   const reduceMotion = useReducedMotion()
   // Wrapper of the scroll content (blocks measure from it)
   const contentRef = useRef<HostInstance>(null)
   // Scroll offset in px, written by onScroll on the UI thread
   const scrollY = useSharedValue(0)
   // Visible height of the ScrollView, written by onLayout
   const viewportHeight = useSharedValue(0)
   // When the content was shown, and the last group of blocks entering the viewport (for the stagger)
   // Date.now() when the screen mounted (0 until the effect runs)
   const shownAt = useSharedValue(0)
   // Timestamp of the last block that entered the viewport
   const groupAt = useSharedValue(0)
   // Rank of the last block inside its group of simultaneous entries
   const groupIndex = useSharedValue(0)

   // Records the mount time once, to delay the first reveals until the header zoom is done
   useEffect(() => {
      shownAt.set(Date.now())
   }, [shownAt])

   // UI-thread scroll handler: copies the vertical offset into scrollY
   const onScroll = useAnimatedScrollHandler((event) => {
      scrollY.set(event.contentOffset.y)
   })

   // Memoized so consumers get a stable object (worklets capture its fields)
   return useMemo(() => {
      // Stores the viewport height
      const onLayout = (event: LayoutChangeEvent) => {
         viewportHeight.set(event.nativeEvent.layout.height)
      }

      // Blocks visible on arrival wait for the end of the header zoom, blocks entering together follow each other
      // Delay (ms) for the block that enters now: remaining intro time + group rank x stagger. Worklet.
      const nextRevealDelay = () => {
         "worklet"
         const now = Date.now()
         groupIndex.set(now - groupAt.get() > REVEAL_GROUP_WINDOW ? 0 : groupIndex.get() + 1)
         groupAt.set(now)
         return Math.max(0, revealIntro - (now - shownAt.get())) + groupIndex.get() * revealStagger
      }

      return { reduceMotion, contentRef, scrollY, viewportHeight, onScroll, onLayout, nextRevealDelay }
   }, [reduceMotion, scrollY, viewportHeight, onScroll, shownAt, groupAt, groupIndex])
}

export default useParallaxScroll
