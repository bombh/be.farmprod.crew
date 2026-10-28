import { View, ActivityIndicator, Image, Text, Pressable } from "react-native"
import useThemeColors from "@/src/hooks/useThemeColors"
import { MotiView } from "moti"
import { useSyncExternalStore } from "react"
import { onlineManager } from "@tanstack/react-query"

const logo = require("@/assets/images/logo_128.png")
const logoDark = require("@/assets/images/logo_drawer.png")

const useIsOnline = () =>
   useSyncExternalStore(
      (callback) => onlineManager.subscribe(callback),
      () => onlineManager.isOnline(),
      () => true,
   )

const Loading = ({ label, hideLogo, isError, error, refetch }) => {
   const isOnline = useIsOnline()
   const isOffline = isError && (!isOnline || error?.isOffline)
   const theme = useThemeColors()

   return (
      <MotiView
         className="flex-1 items-center justify-center px-5 pb-32"
         from={{
            opacity: 0,
            translateX: -150,
         }}
         animate={{
            opacity: 1,
            translateX: 0,
         }}
         exit={{
            opacity: 0,
            translateX: 150,
         }}
         transition={{
            type: "timing",
            duration: 250,
         }}
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
      </MotiView>
   )
}

export default Loading
