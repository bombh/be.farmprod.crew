/**
 * useZoomTransition.jsx
 * Zoom transition between a list thumbnail and a detail header image.
 *
 * - The source rect is measured on press (measureZoomSource) and passed as route params.
 * - The detail screen is presented as a native "transparentModal" without native animation
 *   (zoomDetailScreenOptions, used in works/_layout.jsx),
 *   so the Works list stays mounted and visible underneath.
 * - The detail screen draws its own white background (backgroundStyle) and fades it in/out,
 *   so the list is visible behind the image while it grows (forward) and shrinks (reverse).
 * - The card chips move the same way to their place under the header (chipsOverlayStyle), and back.
 * - <ZoomImage /> is animated from the source rect to the header rect, and back,
 *   its title strip growing from the card size to the header size (progress, with a small spring bounce).
 * - goBack() (back button, Android hardware back) plays the reverse animation, then pops the screen.
 * - iOS: a modal has no native swipe-back, so an edge swipe is re-implemented with Gesture Handler
 *   (swipeGesture + swipeStyle): the screen follows the finger and the list is visible behind it.
 * - The source card hides its image (zoomSourceKey) while the overlay covers it, for a seamless handoff.
 *
 * Everything is disabled with ENABLE_ZOOM_TRANSITION = false (src/constants/features.js).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { BackHandler, Dimensions, Platform } from "react-native"
import { useFocusEffect, useNavigation } from "expo-router"
import { Gesture } from "react-native-gesture-handler"
import {
   Easing,
   makeMutable,
   useAnimatedStyle,
   useSharedValue,
   withDelay,
   withSpring,
   withTiming,
} from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { ENABLE_ZOOM_TRANSITION } from "@/src/constants"

const DURATION = 400
const FADE_DURATION = 250
const EASING = Easing.bezier(0.2, 0, 0, 1)
const CONTENT_OFFSET = 24
// Opening: the title strip follows a spring (~20% overshoot) while the image keeps the bezier (small elastic bounce)
const TITLE_SPRING = { damping: 17, stiffness: 340, mass: 1 }

// iOS edge swipe (replaces the native swipe-back, unavailable on modals)
const SWIPE_ENABLED = Platform.OS === "ios"
const SWIPE_EDGE = 30
const SWIPE_DISTANCE = 0.35
const SWIPE_VELOCITY = 800
const SWIPE_DURATION = 220

// Stack.Screen options of a detail screen opened with the zoom transition (works/detail):
// a transparent modal so the list stays rendered underneath, all the animations being done in JS
export const zoomDetailScreenOptions = ENABLE_ZOOM_TRANSITION
   ? { presentation: "transparentModal", animation: "none", contentStyle: { backgroundColor: "transparent" } }
   : undefined

// Key of the card currently covered by the zoom overlay (read by WorkCard to hide its image)
export const zoomSourceKey = makeMutable(null)

// Measure a view in window coordinates and return route params (numbers): {prefix}X, {prefix}Y, {prefix}W, {prefix}H
export const measureZoomSource = (ref, prefix = "zoom") => {
   return new Promise((resolve) => {
      if (!ENABLE_ZOOM_TRANSITION || !ref?.current?.measureInWindow) return resolve({})
      ref.current.measureInWindow((x, y, width, height) => {
         if (!width || !height) return resolve({})
         resolve({ [`${prefix}X`]: x, [`${prefix}Y`]: y, [`${prefix}W`]: width, [`${prefix}H`]: height })
      })
   })
}

const toRect = (params, prefix = "zoom") => {
   const rect = {
      x: parseFloat(params?.[`${prefix}X`]),
      y: parseFloat(params?.[`${prefix}Y`]),
      width: parseFloat(params?.[`${prefix}W`]),
      height: parseFloat(params?.[`${prefix}H`]),
   }
   const isValid = Object.values(rect).every((v) => Number.isFinite(v)) && rect.width > 0 && rect.height > 0
   return isValid ? rect : null
}

const isOnScreen = (rect) => {
   const { height } = Dimensions.get("window")
   return rect.y + rect.height > 0 && rect.y < height
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

// chipsTop: top of the detail chips row (the chips overlay goes from the card chips to there)
const useZoomTransition = (params, headerHeight, chipsTop) => {
   const navigation = useNavigation()
   const { id, zoomX, zoomY, zoomW, zoomH, chipsX, chipsY, chipsW, chipsH } = params ?? {}
   const source = useMemo(() => toRect({ zoomX, zoomY, zoomW, zoomH }), [zoomX, zoomY, zoomW, zoomH])
   const chipsSource = useMemo(
      () => toRect({ chipsX, chipsY, chipsW, chipsH }, "chips"),
      [chipsX, chipsY, chipsW, chipsH],
   )
   const sourceKey = id != null ? String(id) : null
   // active: the screen is presented as a transparent modal (feature flag)
   // enabled: a source rect is available, the zoom animation can run
   const active = ENABLE_ZOOM_TRANSITION
   const enabled = active && source !== null
   // The card chips move with the image (same duration and easing), when the card has some
   const chipsEnabled = enabled && chipsSource !== null

   const rootRef = useRef(null)
   const headerRef = useRef(null)
   const chipsRef = useRef(null)
   const isStarted = useRef(false)
   const isOpened = useRef(false)
   // The heavy detail content is rendered once the image is in place, not during the zoom animation
   const [isContentReady, setIsContentReady] = useState(!active)
   const isClosing = useRef(false)

   // Overlay rect in root coordinates
   const x = useSharedValue(source?.x ?? 0)
   const y = useSharedValue(source?.y ?? 0)
   const width = useSharedValue(source?.width ?? 0)
   const height = useSharedValue(source?.height ?? 0)
   // 0 = card, 1 = header: drives the title strip size in the overlay
   const progress = useSharedValue(enabled ? 0 : 1)
   // Opening: image and title end at different times, the handoff waits for both (count of finished parts)
   const finishedParts = useSharedValue(0)
   const overlayOpacity = useSharedValue(enabled ? 1 : 0)
   const headerOpacity = useSharedValue(enabled ? 0 : 1)
   const content = useSharedValue(active ? 0 : 1)
   const background = useSharedValue(active ? 0 : 1)
   const swipeX = useSharedValue(0)
   // Chips overlay position and width in root coordinates (chips centered in that width)
   const chipsOffsetX = useSharedValue(chipsSource?.x ?? 0)
   const chipsOffsetY = useSharedValue(chipsSource?.y ?? 0)
   const chipsWidth = useSharedValue(chipsSource?.width ?? 0)

   const hideSource = useCallback(() => {
      if (sourceKey) zoomSourceKey.value = sourceKey
   }, [sourceKey])

   const showSource = useCallback(() => {
      if (sourceKey && zoomSourceKey.value === sourceKey) zoomSourceKey.value = null
   }, [sourceKey])

   // Never leave a card hidden behind
   useEffect(() => showSource, [showSource])

   const measureRoot = useCallback(() => {
      return new Promise((resolve) => {
         if (!rootRef.current?.measureInWindow) return resolve({ x: 0, y: 0, width: 0 })
         rootRef.current.measureInWindow((rx, ry, rw) => resolve({ x: rx, y: ry, width: rw }))
      })
   }, [])

   const markContentReady = useCallback(() => setIsContentReady(true), [])

   const markOpened = useCallback(() => {
      isOpened.current = true
      // The detail background is opaque now: the card can be shown again behind it
      showSource()
   }, [showSource])

   const markClosing = useCallback(() => {
      isClosing.current = true
   }, [])

   // Pop the screen (presented without native animation: everything is animated in JS)
   const leave = useCallback(() => navigation.goBack(), [navigation])

   // Reverse handoff: show the card under the overlay (same image and title strip), then pop right away
   // so the list gets the touches back as soon as the animation looks finished
   const land = useCallback(async () => {
      showSource()
      await nextFrame()
      leave()
   }, [showSource, leave])

   // Forward: source rect -> header rect (or a simple fade without source rect)
   const onRootLayout = useCallback(async () => {
      if (!active || isStarted.current || isClosing.current) return
      isStarted.current = true

      if (!enabled) {
         background.value = withTiming(1, { duration: FADE_DURATION })
         content.value = withTiming(1, { duration: FADE_DURATION }, (finished) => {
            if (!finished) return
            scheduleOnRN(markContentReady)
            scheduleOnRN(markOpened)
         })
         return
      }

      hideSource()
      const root = await measureRoot()
      const targetWidth = root.width || Dimensions.get("window").width

      x.value = source.x - root.x
      y.value = source.y - root.y
      if (chipsEnabled) {
         chipsOffsetX.value = chipsSource.x - root.x
         chipsOffsetY.value = chipsSource.y - root.y
         chipsWidth.value = chipsSource.width
         chipsOffsetX.value = withTiming(0, { duration: DURATION, easing: EASING })
         chipsOffsetY.value = withTiming(chipsTop, { duration: DURATION, easing: EASING })
         chipsWidth.value = withTiming(targetWidth, { duration: DURATION, easing: EASING })
      }
      // Once the image and the title are both in place: reveal the real header,
      // then remove the overlay once the header is painted
      const onOpenPartDone = (finished) => {
         "worklet"
         if (!finished) return
         finishedParts.value += 1
         if (finishedParts.value < 2) return
         headerOpacity.value = 1
         overlayOpacity.value = withDelay(80, withTiming(0, { duration: 0 }))
         scheduleOnRN(markOpened)
      }

      finishedParts.value = 0
      x.value = withTiming(0, { duration: DURATION, easing: EASING })
      y.value = withTiming(0, { duration: DURATION, easing: EASING })
      progress.value = withSpring(1, TITLE_SPRING, onOpenPartDone)
      width.value = withTiming(targetWidth, {
         duration: DURATION,
         easing: EASING,
      })
      height.value = withTiming(headerHeight, { duration: DURATION, easing: EASING }, (finished) => {
         "worklet"
         // The image is in place: the content can be rendered (the title may still be bouncing)
         if (finished) scheduleOnRN(markContentReady)
         onOpenPartDone(finished)
      })
      // The list stays visible behind the growing image, then the white background covers it
      background.value = withTiming(1, {
         duration: DURATION * 0.6,
         easing: EASING,
      })
      content.value = withDelay(DURATION * 0.3, withTiming(1, { duration: DURATION, easing: EASING }))
   }, [
      active,
      enabled,
      source,
      chipsEnabled,
      chipsSource,
      chipsTop,
      chipsOffsetX,
      chipsOffsetY,
      chipsWidth,
      headerHeight,
      measureRoot,
      markOpened,
      markContentReady,
      hideSource,
      x,
      y,
      width,
      height,
      progress,
      finishedParts,
      overlayOpacity,
      headerOpacity,
      content,
      background,
   ])

   // Reverse: current header rect -> source rect, then go back
   // Used by the back button and the Android hardware back
   const goBack = useCallback(async () => {
      if (!active) return navigation.goBack()
      if (isClosing.current) return
      isClosing.current = true

      // No source rect, or card not reachable anymore: simple fade out
      if (!enabled || !isOnScreen(source)) {
         overlayOpacity.value = withTiming(0, { duration: FADE_DURATION })
         background.value = withTiming(0, { duration: FADE_DURATION })
         content.value = withTiming(0, { duration: FADE_DURATION }, (finished) => {
            if (finished) scheduleOnRN(leave)
         })
         return
      }

      const root = await measureRoot()
      const target = { ...source, x: source.x - root.x, y: source.y - root.y }

      // Start from the header current position (it may be scrolled)
      if (isOpened.current && headerRef.current?.measureInWindow) {
         await new Promise((resolve) => {
            headerRef.current.measureInWindow((hx, hy, hw, hh) => {
               if (hw && hh) {
                  x.value = hx - root.x
                  y.value = hy - root.y
                  width.value = hw
                  height.value = hh
               }
               resolve()
            })
         })
      }

      // Chips: from the detail chips current position (it may be scrolled) back to the card chips
      if (chipsEnabled) {
         if (isOpened.current && chipsRef.current?.measureInWindow) {
            await new Promise((resolve) => {
               chipsRef.current.measureInWindow((cx, cy, cw, ch) => {
                  if (cw && ch) {
                     chipsOffsetX.value = cx - root.x
                     chipsOffsetY.value = cy - root.y
                     chipsWidth.value = cw
                  }
                  resolve()
               })
            })
         }
         chipsOffsetX.value = withTiming(chipsSource.x - root.x, { duration: DURATION, easing: EASING })
         chipsOffsetY.value = withTiming(chipsSource.y - root.y, { duration: DURATION, easing: EASING })
         chipsWidth.value = withTiming(chipsSource.width, { duration: DURATION, easing: EASING })
      }

      hideSource()
      progress.value = 1
      overlayOpacity.value = 1
      headerOpacity.value = 0
      content.value = withTiming(0, { duration: DURATION * 0.5, easing: EASING })
      // Reveal the list behind the shrinking image
      background.value = withTiming(0, {
         duration: DURATION * 0.6,
         easing: EASING,
      })
      // No title bounce on the way back: the title follows the image, and the screen is popped
      // as soon as they land (the transparent modal blocks the list touches until it is popped)
      x.value = withTiming(target.x, { duration: DURATION, easing: EASING })
      y.value = withTiming(target.y, { duration: DURATION, easing: EASING })
      progress.value = withTiming(0, { duration: DURATION, easing: EASING })
      width.value = withTiming(target.width, {
         duration: DURATION,
         easing: EASING,
      })
      height.value = withTiming(target.height, { duration: DURATION, easing: EASING }, () => {
         scheduleOnRN(land)
      })
   }, [
      active,
      enabled,
      navigation,
      source,
      chipsEnabled,
      chipsSource,
      chipsOffsetX,
      chipsOffsetY,
      chipsWidth,
      measureRoot,
      hideSource,
      land,
      leave,
      x,
      y,
      width,
      height,
      progress,
      overlayOpacity,
      headerOpacity,
      content,
      background,
   ])

   // Android hardware back plays the reverse zoom too
   // Only while focused: a fullScreenModal gallery on top must handle its own back press
   useFocusEffect(
      useCallback(() => {
         if (!active) return
         const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            goBack()
            return true
         })
         return () => subscription.remove()
      }, [active, goBack]),
   )

   // iOS edge swipe-back: the screen follows the finger, the list is visible behind it
   const swipeGesture = useMemo(() => {
      const screenWidth = Dimensions.get("window").width
      return Gesture.Pan()
         .enabled(active && SWIPE_ENABLED)
         .hitSlop({ left: 0, width: SWIPE_EDGE })
         .activeOffsetX(10)
         .failOffsetY([-20, 20])
         .onUpdate((e) => {
            swipeX.value = Math.max(0, e.translationX)
         })
         .onEnd((e) => {
            const shouldClose = e.translationX > screenWidth * SWIPE_DISTANCE || e.velocityX > SWIPE_VELOCITY
            if (shouldClose) {
               scheduleOnRN(markClosing)
               swipeX.value = withTiming(
                  screenWidth,
                  { duration: SWIPE_DURATION, easing: Easing.out(Easing.cubic) },
                  (finished) => {
                     if (finished) scheduleOnRN(leave)
                  },
               )
            } else {
               swipeX.value = withTiming(0, {
                  duration: SWIPE_DURATION,
                  easing: Easing.out(Easing.cubic),
               })
            }
         })
   }, [active, swipeX, markClosing, leave])

   const overlayStyle = useAnimatedStyle(() => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: width.value,
      height: height.value,
      opacity: overlayOpacity.value,
      transform: [{ translateX: x.value }, { translateY: y.value }],
   }))

   const headerStyle = useAnimatedStyle(() => ({
      opacity: headerOpacity.value,
   }))

   // Chips overlay: shown and handed off together with the image overlay
   const chipsOverlayStyle = useAnimatedStyle(() => ({
      position: "absolute",
      left: 0,
      top: 0,
      width: chipsWidth.value,
      opacity: overlayOpacity.value,
      transform: [{ translateX: chipsOffsetX.value }, { translateY: chipsOffsetY.value }],
   }))

   // Detail chips: hidden while the overlay chips move, revealed with the real header
   const chipsStyle = useAnimatedStyle(() => ({
      opacity: headerOpacity.value,
   }))

   const contentStyle = useAnimatedStyle(() => ({
      opacity: content.value,
      transform: [{ translateY: (1 - content.value) * CONTENT_OFFSET }],
   }))

   // Navigation header (back button, logo): fades with the content
   const chromeStyle = useAnimatedStyle(() => ({
      opacity: content.value,
   }))

   const backgroundStyle = useAnimatedStyle(() => ({
      opacity: background.value,
   }))

   const swipeStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: swipeX.value }],
   }))

   return {
      active,
      isContentReady,
      enabled,
      goBack,
      rootRef,
      headerRef,
      chipsRef,
      chipsEnabled,
      onRootLayout,
      swipeGesture,
      progress,
      swipeStyle: active ? swipeStyle : undefined,
      backgroundStyle: active ? backgroundStyle : undefined,
      chromeStyle: active ? chromeStyle : undefined,
      overlayStyle: enabled ? overlayStyle : undefined,
      headerStyle: enabled ? headerStyle : undefined,
      chipsOverlayStyle: chipsEnabled ? chipsOverlayStyle : undefined,
      chipsStyle: chipsEnabled ? chipsStyle : undefined,
      contentStyle: active ? contentStyle : undefined,
   }
}

export default useZoomTransition
