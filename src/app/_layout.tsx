/**
 * _layout.tsx (src/app, root layout)
 *
 * Root layout of the expo-router app: it wraps every screen and is the first component rendered after src/app/index.tsx
 * loads. Responsibilities, in order:
 * - imports global.css (Tailwind / NativeWind directives) and react-native-reanimated;
 * - registers expo-image `Image` and react-native-maps `MapView` with NativeWind `cssInterop` so they accept
 *   `className`;
 * - keeps the splash screen visible (`preventAutoHideAsync`) until the Permanent Marker font is loaded AND the saved
 *   theme (lib/theme.ts `loadThemePreference`) is applied, then hides it: no flash of the wrong theme or font. The
 *   component returns null while waiting; a font loading error is thrown;
 * - provides, from outside in: GestureHandlerRootView (needed by gestures and the bottom sheet), the persisted
 *   react-query cache (PersistQueryClientProvider, lib/queryClient.ts), the navigation ThemeProvider (dark theme with
 *   neutral-950 background so transitions do not flash white, following NativeWind's color scheme), a hidden light
 *   StatusBar, and the <Slot /> where the current route renders (the `(drawer)` group).
 */

import "@/global.css"
// Root view required by gesture-handler (swipes, bottom sheet)
import { GestureHandlerRootView } from "react-native-gesture-handler"
// Side-effect import so Reanimated is initialized early
import "react-native-reanimated"
import { StatusBar } from "expo-status-bar" // Status bar component (hidden in this app)
// Navigation themes, route outlet, splash control
import { DarkTheme, DefaultTheme, Slot, SplashScreen, ThemeProvider } from "expo-router"
import { useFonts } from "expo-font" // Loads the custom font
import { useEffect, useState } from "react" // Startup effects and the theme-loaded flag
import { Image } from "expo-image" // expo-image, registered for className
import MapView from "react-native-maps" // Map component, registered for className
import { cssInterop, useColorScheme } from "nativewind" // className support for third-party components; current scheme
import colors from "tailwindcss/colors" // Tailwind colors for the dark navigation theme
// react-query provider with disk persistence
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { queryClient, persistOptions } from "@/src/lib/queryClient" // Shared client and persistence options
import { loadThemePreference } from "@/src/lib/theme" // Restores the saved light / dark choice

// Register third-party components for NativeWind v4 className support
// `className` is mapped to `style`
cssInterop(Image, { className: "style" })
cssInterop(MapView, { className: "style" })

// Keep the splash screen until the fonts and theme are ready (hidden in the effect below)
SplashScreen.preventAutoHideAsync()

// Navigation theme: screen background behind the content during transitions
// Dark theme of expo-router with the app background colors
const darkNavigationTheme = {
   ...DarkTheme,
   colors: { ...DarkTheme.colors, background: colors.neutral[950], card: colors.neutral[950] },
}

// Takes no props
export default function RootLayout() {
   // Custom font; `error` is set when loading failed
   const [fontsLoaded, error] = useFonts({
      "PermanentMarker-Regular": require("@/assets/fonts/PermanentMarker-Regular.ttf"),
   })
   // True once the saved theme has been restored
   const [themeLoaded, setThemeLoaded] = useState(false)
   // Current scheme, to pick the navigation theme
   const { colorScheme } = useColorScheme()

   // Restore the saved theme (light / dark, OS theme by default) before hiding the splash, to avoid a flash
   // Restores the theme preference, whatever the result
   useEffect(() => {
      loadThemePreference().finally(() => setThemeLoaded(true))
   }, [])

   // Hides the splash screen once fonts and theme are ready; a font error crashes on purpose
   useEffect(() => {
      if (error) throw error

      if (fontsLoaded && themeLoaded) {
         SplashScreen.hideAsync()
      }
   }, [fontsLoaded, themeLoaded, error])

   // Render nothing until ready (the splash screen is still displayed)
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
