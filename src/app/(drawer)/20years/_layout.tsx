/**
 * _layout.tsx (src/app/(drawer)/20years)
 *
 * Stack layout of the 20 years section, with the native header hidden (screens draw their own). Screens: index (the
 * anniversary content) and pictures (the gallery, presented as a fullScreenModal over the content).
 */

import { Stack } from "expo-router" // Native stack navigator

// Stack of the section
const Layout = () => {
   // Screens: index = content; pictures = gallery modal
   return (
      <Stack
         screenOptions={{
            // Screens draw their own header
            headerShown: false,
         }}
      >
         <Stack.Screen name="index" />
         <Stack.Screen
            name="pictures"
            options={{ presentation: "fullScreenModal" }}
         />
      </Stack>
   )
}

export default Layout
