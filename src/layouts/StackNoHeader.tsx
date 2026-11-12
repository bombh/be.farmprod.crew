/**
 * StackNoHeader.tsx
 *
 * Minimal stack layout with the native header hidden. It is the `_layout.tsx` of the sections whose screens draw their
 * own header (HeaderDrawer / HeaderBack): re-exported by src/app/(drawer)/tours/_layout.tsx and about/_layout.tsx.
 * Each section is a Stack nested in the drawer, which is what makes the iOS swipe-back and the
 * list -> detail navigation work.
 */

import { Stack } from "expo-router" // Native stack navigator

// Stack without header
const Layout = () => {
   return (
      <Stack
         screenOptions={{
            headerShown: false,
         }}
      />
   )
}

export default Layout
