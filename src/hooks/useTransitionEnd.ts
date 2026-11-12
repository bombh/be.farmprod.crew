/**
 * useTransitionEnd.ts
 *
 * Delays heavy renders until the screen transition animation has finished, so the push animation stays smooth
 * (the JS thread is not blocked by mounting a map while the screen slides in).
 *
 * Returns `{ isTransitionEnd }`: false on mount, true once the native stack fires its "transitionEnd" event for this
 * screen (it never goes back to false). Used by app/(drawer)/tours/detail.tsx, which only renders the MapView after it.
 * Gotcha: the hook relies on the stack's "transitionEnd" event, so it only fits screens that are pushed with an
 * animation (a screen shown without transition might never fire it).
 */

import { useEffect, useState } from "react" // State flag + subscription
import { useNavigation } from "expo-router" // Navigation object of the current screen
import type { NativeStackNavigationProp } from "expo-router" // Type of a native-stack navigation (has "transitionEnd")

// Generic param list: routes are not typed in this app
type ParamList = Record<string, object | undefined>

const useTransitionEnd = () => {
   // Hooks
   // Becomes true when the screen transition has ended
   const [isTransitionEnd, setIsTransitionEnd] = useState(false)
   // Navigation of the current screen
   const navigation = useNavigation<NativeStackNavigationProp<ParamList>>()

   // Subscribes once to the "transitionEnd" event; returns the unsubscribe function
   useEffect(() => {
      const unsubscribe = navigation.addListener("transitionEnd", () => {
         setIsTransitionEnd(true)
      })

      return unsubscribe
   }, [navigation])

   return { isTransitionEnd }
}

export default useTransitionEnd
