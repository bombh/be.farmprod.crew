/**
 * ignoredWarnings.js
 * Dev only: hides two known warnings of third-party libraries, in the Metro terminal and in LogBox.
 * Matched on the start of their exact text, so any other warning (including future ones) still shows.
 * Loaded first by index.js, before the libraries that emit them. Remove an entry once its library is fixed.
 */
import { LogBox } from "react-native"

const IGNORED_WARNINGS = [
   // NativeWind (react-native-css-interop) registers ImageBackground for className at startup
   "ImageBackground is deprecated and will be removed in a future release.",
   // react-native-drawer-layout (expo-router drawer) passes dependency arrays to Reanimated hooks
   "[Reanimated] Dependencies should only be used on the web and are always ignored on native.",
]

if (__DEV__) {
   const isIgnored = (message) =>
      typeof message === "string" && IGNORED_WARNINGS.some((text) => message.startsWith(text))

   const warn = console.warn
   console.warn = (...args) => {
      if (!isIgnored(args[0])) warn(...args)
   }

   LogBox.ignoreLogs(IGNORED_WARNINGS)
}
