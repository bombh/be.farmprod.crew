import "@/global.css"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import { Slot, SplashScreen } from "expo-router"
import { useFonts } from "expo-font"
import { useEffect } from "react"
import { Image } from "expo-image"
import MapView from "react-native-maps"
import { cssInterop } from "nativewind"

// Register third-party components for NativeWind v4 className support
cssInterop(Image, { className: "style" })
cssInterop(MapView, { className: "style" })

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
   const [fontsLoaded, error] = useFonts({
      "PermanentMarker-Regular": require("@/assets/fonts/PermanentMarker-Regular.ttf"),
   })

   useEffect(() => {
      if (error) throw error

      if (fontsLoaded) {
         SplashScreen.hideAsync()
      }
   }, [fontsLoaded, error])

   if (!fontsLoaded && !error) {
      return null
   }

   return (
      <GestureHandlerRootView style={{ flex: 1 }}>
         <StatusBar
            style="light"
            hidden={true}
         />
         <Slot />
      </GestureHandlerRootView>
   )
}
