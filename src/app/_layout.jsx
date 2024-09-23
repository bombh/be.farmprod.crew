import { GestureHandlerRootView } from "react-native-gesture-handler"
import "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import { Slot } from "expo-router"

export default function RootLayout() {
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
