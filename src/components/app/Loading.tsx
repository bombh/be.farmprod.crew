/**
 * Loading.tsx
 *
 * Full-screen loading / error / offline placeholder, normally rendered by LoadingGate (components/app/LoadingGate.tsx)
 * while a screen's data is not available.
 *
 * What it shows:
 * - Normal loading: the logo (light or dark variant), an ActivityIndicator and a label ("Loading" by default).
 * - Error (isError): "Error loading data ... Try again", pressing calls `refetch`.
 * - Offline (isError and the device is offline, or error.isOffline, see OfflineError in lib/queryClient.ts): "No
 *   connection / You are offline / Try again". Try again forces react-query back online
 *   (`onlineManager.setOnline(true)`) before refetching, because NetInfo can keep reporting "none" after a
 *   reconnection (e.g. iOS Simulator).
 *
 * Animation (Reanimated): one shared value `progress` from 0 to 2: 0 -> 1 slides in from the left with a fade, 1 -> 2
 * slides out to the right (when `isLeaving` becomes true), then `onLeft` is called so LoadingGate can mount the
 * content.
 *
 * Props: label, hideLogo, isError, error, refetch, isLeaving, onLeft (see LoadingProps).
 */

// React Native building blocks of the placeholder
import { View, ActivityIndicator, Image, Text, Pressable } from "react-native"
import useThemeColors from "@/src/hooks/useThemeColors" // Spinner color and logo variant
// Reanimated: animated view, progress mapping, shared value, timing
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets" // Calls onLeft (JS) from the end of the exit animation (UI thread)
import { useEffect, useSyncExternalStore } from "react" // Start the animation; subscribe to the online status
import { onlineManager } from "@tanstack/react-query" // react-query network status (driven by NetInfo)

// Logo for light theme
const logo = require("@/assets/images/logo_128.png")
// Logo for dark theme
const logoDark = require("@/assets/images/logo_drawer.png")

// Slides in from the left, slides out to the right
// Horizontal distance (px) of the slide in / out
const SLIDE = 150
// Duration of each slide (ms)
const SLIDE_MS = 250

// Re-renders when react-query's online status changes (third callback = server snapshot, always online)
const useIsOnline = () =>
   useSyncExternalStore(
      (callback: () => void) => onlineManager.subscribe(callback),
      () => onlineManager.isOnline(),
      () => true,
   )

// Props of the placeholder
interface LoadingProps {
   // Text under the spinner and spinner accessibility label
   label?: string
   // Hides the logo (e.g. for a compact area)
   hideLogo?: boolean
   // Shows the error / offline state instead of the spinner
   isError?: boolean
   // OfflineError (queryClient.ts) has isOffline
   // Error of the query, used to detect an OfflineError
   error?: (Error & { isOffline?: boolean }) | null
   // Called by the Try again buttons
   refetch?: () => unknown
   // Plays the exit animation (data is there)
   isLeaving?: boolean
   // Called once the exit animation ended
   onLeft?: () => void
}

// isLeaving: plays the exit animation, then calls onLeft (see LoadingGate)
// isLeaving: plays the exit animation, then calls onLeft (see LoadingGate)
const Loading = ({ label, hideLogo, isError, error, refetch, isLeaving = false, onLeft }: LoadingProps) => {
   // Network status from react-query
   const isOnline = useIsOnline()
   // Error shown as "offline" when the device is offline or the error is an OfflineError
   const isOffline = isError && (!isOnline || error?.isOffline)
   // Spinner color and dark / light logo
   const theme = useThemeColors()

   // Try again while offline: a real attempt, without waiting for NetInfo to report the connection back (it can stay
   // "none" after a reconnection, e.g. in the iOS Simulator). Still offline: the request fails and shows the error.
   const retryOffline = () => {
      onlineManager.setOnline(true)
      refetch?.()
   }

   // 0 -> 1: entry, 1 -> 2: exit
   const progress = useSharedValue(0)

   // Animates progress to 1 (enter) or 2 (leave); calls onLeft at the end of the exit
   useEffect(() => {
      progress.set(
         withTiming(isLeaving ? 2 : 1, { duration: SLIDE_MS }, (finished) => {
            if (finished && isLeaving && onLeft) scheduleOnRN(onLeft)
         }),
      )
   }, [isLeaving, onLeft, progress])

   // Fade + horizontal slide mapped from progress: 0 = hidden left, 1 = shown, 2 = hidden right
   const style = useAnimatedStyle(() => ({
      opacity: interpolate(progress.get(), [0, 1, 2], [0, 1, 0]),
      transform: [{ translateX: interpolate(progress.get(), [0, 1, 2], [-SLIDE, 0, SLIDE]) }],
   }))

   return (
      <Animated.View
         className="flex-1 items-center justify-center px-5 pb-32"
         style={style}
      >
         {!hideLogo && (
            <>
               <View>
                  <Image
                     source={theme.isDark ? logoDark : logo}
                     style={{ width: 128, height: 128 }}
                     className=""
                     accessible={false}
                  />
               </View>
               <View className="h-16" />
            </>
         )}
         {!isOffline && (
            <ActivityIndicator
               className=""
               size="large"
               color={theme.spinner}
               accessibilityLabel={label ? label : "Loading"}
            />
         )}
         {isOffline ? (
            <Pressable
               className="items-center"
               onPress={retryOffline}
               accessibilityRole="button"
               accessibilityLabel="No connection. Try again"
            >
               <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300">No connection</Text>
               <Text className="text-neutral-700 dark:text-neutral-300">You are offline</Text>
               <Text className="mt-4 text-blue-600 dark:text-blue-400">Try again</Text>
            </Pressable>
         ) : isError ? (
            <Pressable
               onPress={refetch}
               accessibilityRole="button"
               accessibilityLabel="Error loading data. Try again"
            >
               <Text className="mt-4 text-black dark:text-white">
                  Error loading data ... <Text className="text-blue-600 dark:text-blue-400">Try again</Text>
               </Text>
            </Pressable>
         ) : (
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400">{label ? label : "Loading"}</Text>
         )}
      </Animated.View>
   )
}

export default Loading
