/**
 * _layout.tsx (src/app/(drawer)/works)
 *
 * Stack layout of the Works section, with the native header hidden (screens draw their own). Screens:
 * - index: the Works list;
 * - detail: a work. With the zoom transition enabled (constants/features.ts) it is a transparent modal without native
 *   animation (`zoomDetailScreenOptions` from hooks/useZoomTransition.tsx), so the list stays visible underneath while
 *   the image zooms; otherwise default stack options (slide);
 * - pictures: the gallery of a work, presented as a fullScreenModal.
 */

import { Stack } from "expo-router" // Native stack navigator
// Options of the detail screen (transparent modal when the zoom transition is on)
import { zoomDetailScreenOptions } from "@/src/hooks/useZoomTransition"

// Stack of the section
const Layout = () => {
   return (
      <Stack
         screenOptions={{
            // Screens draw their own header
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
