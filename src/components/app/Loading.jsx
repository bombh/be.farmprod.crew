import { View, ActivityIndicator, Image, Text, Pressable } from "react-native"
import useThemeColors from "@/src/hooks/useThemeColors"
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { useEffect, useSyncExternalStore } from "react"
import { onlineManager } from "@tanstack/react-query"

const logo = require("@/assets/images/logo_128.png")
const logoDark = require("@/assets/images/logo_drawer.png")

// Slides in from the left, slides out to the right
const SLIDE = 150
const SLIDE_MS = 250

const useIsOnline = () =>
   useSyncExternalStore(
      (callback) => onlineManager.subscribe(callback),
      () => onlineManager.isOnline(),
      () => true,
   )

// isLeaving: plays the exit animation, then calls onLeft (see LoadingGate)
const Loading = ({ label, hideLogo, isError, error, refetch, isLeaving = false, onLeft }) => {
   const isOnline = useIsOnline()
   const isOffline = isError && (!isOnline || error?.isOffline)
   const theme = useThemeColors()

   // 0 -> 1: entry, 1 -> 2: exit
   const progress = useSharedValue(0)

   useEffect(() => {
      progress.value = withTiming(isLeaving ? 2 : 1, { duration: SLIDE_MS }, (finished) => {
         if (finished && isLeaving && onLeft) scheduleOnRN(onLeft)
      })
   }, [isLeaving, onLeft, progress])

   const style = useAnimatedStyle(() => ({
      opacity: interpolate(progress.value, [0, 1, 2], [0, 1, 0]),
      transform: [{ translateX: interpolate(progress.value, [0, 1, 2], [-SLIDE, 0, SLIDE]) }],
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
               onPress={refetch}
               accessibilityRole="button"
               accessibilityLabel="No connection. Try again"
            >
               <Text className="text-lg font-bold text-neutral-700 dark:text-neutral-300">No connection</Text>
               <Text className="mt-2 text-center text-neutral-500 dark:text-neutral-400">
                  {"You're offline — saved content will show when available."}
               </Text>
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
