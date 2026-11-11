import "@/global.css"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import { DarkTheme, DefaultTheme, Slot, SplashScreen, ThemeProvider } from "expo-router"
import { useFonts } from "expo-font"
import { useEffect, useState } from "react"
import { Image } from "expo-image"
import MapView from "react-native-maps"
import { cssInterop, useColorScheme } from "nativewind"
import colors from "tailwindcss/colors"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { queryClient, persistOptions } from "@/src/lib/queryClient"
import { loadThemePreference } from "@/src/lib/theme"

// Register third-party components for NativeWind v4 className support
cssInterop(Image, { className: "style" })
cssInterop(MapView, { className: "style" })

SplashScreen.preventAutoHideAsync()

// Navigation theme: screen background behind the content during transitions
const darkNavigationTheme = {
   ...DarkTheme,
   colors: { ...DarkTheme.colors, background: colors.neutral[950], card: colors.neutral[950] },
}

export default function RootLayout() {
   const [fontsLoaded, error] = useFonts({
      "PermanentMarker-Regular": require("@/assets/fonts/PermanentMarker-Regular.ttf"),
   })
   const [themeLoaded, setThemeLoaded] = useState(false)
   const { colorScheme } = useColorScheme()

   // Restore the saved theme (light / dark, OS theme by default) before hiding the splash, to avoid a flash
   useEffect(() => {
      loadThemePreference().finally(() => setThemeLoaded(true))
   }, [])

   useEffect(() => {
      if (error) throw error

      if (fontsLoaded && themeLoaded) {
         SplashScreen.hideAsync()
      }
   }, [fontsLoaded, themeLoaded, error])

   if ((!fontsLoaded && !error) || !themeLoaded) {
      return null
   }

   return (
      <GestureHandlerRootView style={{ flex: 1 }}>
         <PersistQueryClientProvider
            client={queryClient}
            persistOptions={persistOptions}
         >
            <ThemeProvider value={colorScheme === "dark" ? darkNavigationTheme : DefaultTheme}>
               <StatusBar
                  style="light"
                  hidden={true}
               />
               <Slot />
            </ThemeProvider>
         </PersistQueryClientProvider>
      </GestureHandlerRootView>
   )
}
