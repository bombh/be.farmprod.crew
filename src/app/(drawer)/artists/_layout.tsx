/**
 * _layout.tsx (src/app/(drawer)/artists)
 *
 * Stack layout of the Artists section, with the native header hidden (the screen draws its own). The only screen is
 * artists/index.tsx (the grid of artists).
 */

import { Stack } from "expo-router" // Native stack navigator

// Stack of the section
const Layout = () => {
   return (
      <Stack
         screenOptions={{
            // The screen draws its own header
            headerShown: false,
         }}
      >
         <Stack.Screen name="index" />
      </Stack>
   )
}

export default Layout
