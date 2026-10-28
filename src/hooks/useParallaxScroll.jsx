/**
 * useParallaxScroll.jsx
 * Scroll state of the "Parallaxe" screens (About, 20 years), given by ParallaxScrollView to ParallaxHeader and Reveal
 * (src/components/app/Parallax.jsx). A single scroll shared value, updated on the UI thread: the header parallax and
 * the "enters the viewport" checks of the Reveal blocks run in worklets, without JS work while scrolling.
 *
 * Returns { reduceMotion, contentRef, scrollY, viewportHeight, onScroll, onLayout, nextRevealDelay }
 * contentRef: wrapper of the scroll content, the Reveal blocks measure their position from it
 * onScroll / onLayout: props of the Animated.ScrollView
 * nextRevealDelay: worklet, delay of a block entering the viewport now
 */
import { useEffect, useMemo, useRef } from "react"
import { useAnimatedScrollHandler, useReducedMotion, useSharedValue } from "react-native-reanimated"

import { parallax } from "@/src/constants/animations"

const { revealIntro, revealStagger } = parallax
// Blocks entering the viewport within this time (ms) are staggered as one group
const REVEAL_GROUP_WINDOW = 20

const useParallaxScroll = () => {
   const reduceMotion = useReducedMotion()
   const contentRef = useRef(null)
   const scrollY = useSharedValue(0)
   const viewportHeight = useSharedValue(0)
   // When the content was shown, and the last group of blocks entering the viewport (for the stagger)
   const shownAt = useSharedValue(0)
   const groupAt = useSharedValue(0)
   const groupIndex = useSharedValue(0)

   useEffect(() => {
      shownAt.value = Date.now()
   }, [shownAt])

   const onScroll = useAnimatedScrollHandler((event) => {
      scrollY.value = event.contentOffset.y
   })

   return useMemo(() => {
      const onLayout = (event) => {
         viewportHeight.value = event.nativeEvent.layout.height
      }

      // Blocks visible on arrival wait for the end of the header zoom, blocks entering together follow each other
      const nextRevealDelay = () => {
         "worklet"
         const now = Date.now()
         groupIndex.value = now - groupAt.value > REVEAL_GROUP_WINDOW ? 0 : groupIndex.value + 1
         groupAt.value = now
         return Math.max(0, revealIntro - (now - shownAt.value)) + groupIndex.value * revealStagger
      }

      return { reduceMotion, contentRef, scrollY, viewportHeight, onScroll, onLayout, nextRevealDelay }
   }, [reduceMotion, scrollY, viewportHeight, onScroll, shownAt, groupAt, groupIndex])
}

export default useParallaxScroll
