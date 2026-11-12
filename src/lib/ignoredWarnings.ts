/**
 * ignoredWarnings.ts
 *
 * Dev only: hides known, harmless warnings emitted by third-party libraries, both in the Metro terminal
 * (console.warn is wrapped) and in the on-device LogBox. Matched on the START of their exact text, so any other
 * warning (including future ones) still shows. Does nothing in production (`__DEV__` is false).
 *
 * Loaded first by index.js (the app entry), before the libraries that emit the warnings, so the patched console.warn
 * is in place when they run. Remove an entry once its library is fixed.
 */

import { LogBox } from "react-native" // LogBox = the in-app yellow/red warning overlay

// Warning texts (prefixes) to hide, each with the library that emits it
const IGNORED_WARNINGS = [
   // NativeWind (react-native-css-interop) registers ImageBackground for className at startup
   "ImageBackground is deprecated and will be removed in a future release.",
   // react-native-drawer-layout (expo-router drawer) passes dependency arrays to Reanimated hooks
   "[Reanimated] Dependencies should only be used on the web and are always ignored on native.",
   // expo-router's own DrawerItemList dispatches CommonActions.navigate(route) with the route's nested state
   "A navigation action carried state without the internal __internal__routerActionState marker.",
]

// Development builds only
if (__DEV__) {
   // True when the first console.warn argument is a string starting with an ignored text
   const isIgnored = (message: unknown) =>
      typeof message === "string" && IGNORED_WARNINGS.some((text) => message.startsWith(text))

   // Original console.warn, still called for every warning that is not ignored
   const warn = console.warn
   console.warn = (...args) => {
      if (!isIgnored(args[0])) warn(...args)
   }

   // Same list for the on-screen LogBox
   LogBox.ignoreLogs(IGNORED_WARNINGS)
}
