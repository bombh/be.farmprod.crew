import { Stack } from "expo-router"
import { zoomDetailScreenOptions } from "@/src/hooks/useZoomTransition"

const Layout = () => {
   return (
      <Stack
         screenOptions={{
            headerShown: false,
         }}
      >
         <Stack.Screen name="index" />
         {/* Zoom transition (ENABLE_ZOOM_TRANSITION): transparent modal, the Works list stays visible underneath */}
         <Stack.Screen
            name="detail"
            options={zoomDetailScreenOptions}
         />
         <Stack.Screen
            name="pictures"
            options={{ presentation: "fullScreenModal" }}
         />
      </Stack>
   )
}

export default Layout
