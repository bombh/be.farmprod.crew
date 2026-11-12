/**
 * useMenuReset.ts
 *
 * Choosing a section in the drawer menu shows it from the top, even when it is already open: the screen stays mounted
 * (data and images kept), only its scroll and state are reset. Going back from a detail screen ("<") keeps the scroll
 * position: only the menu triggers the reset.
 *
 * How it works: each drawer screen is a stack nested in the drawer, so `navigation.getParent()` is the drawer
 * navigator. The hook subscribes to its "drawerItemPress" event (fired when a menu item is pressed, including the
 * already focused one), then calls the optional `onReset` and scrolls to the top without animation. The latest
 * `onReset` is kept in a ref, so the listener is subscribed once and never re-created when the callback changes.
 *
 * Used by the list screens: works, artists, tours, about, 20 years (app/(drawer)/<section>/index.tsx).
 *
 * scrollRef: ref of the screen's ScrollView or FlashList
 * onReset: optional, resets the screen state (e.g. the Works filter)
 */
// Effects to subscribe / keep the latest callback; ref to store it
import { useEffect, useLayoutEffect, useRef } from "react"
import type { RefObject } from "react" // Type of the scroll ref
import { useNavigation } from "expo-router" // Gives the navigation object of the current screen
import type { NativeStackNavigationProp } from "expo-router" // Navigation type of a stack screen
// Navigation type of the parent drawer (has "drawerItemPress")
import type { DrawerNavigationProp } from "expo-router/drawer"

// Generic param list: routes are not typed in this app
type ParamList = Record<string, object | undefined>

// What is needed of a FlashList (scrollToOffset) or a ScrollView (scrollTo): both optional, the helper uses
// whichever exists
interface Scrollable {
   scrollToOffset?: (params: { offset: number; animated?: boolean }) => void
   scrollTo?: (options: { y?: number; animated?: boolean }) => void
}

// Instant scroll to offset 0 on a FlashList (scrollToOffset) or a ScrollView (scrollTo); null-safe
const scrollToTop = (scrollable: Scrollable | null) => {
   if (scrollable?.scrollToOffset) scrollable.scrollToOffset({ offset: 0, animated: false })
   else scrollable?.scrollTo?.({ y: 0, animated: false })
}

// scrollRef: scrollable of the screen; onReset: optional state reset
const useMenuReset = (scrollRef: RefObject<Scrollable | null>, onReset?: () => void) => {
   // Navigation of this screen (a stack nested in the drawer)
   const navigation = useNavigation<NativeStackNavigationProp<ParamList>>()
   // Always holds the latest onReset, read when the event fires
   const onResetRef = useRef(onReset)
   // Updates the ref right after each render where onReset changed
   useLayoutEffect(() => {
      onResetRef.current = onReset
   }, [onReset])

   // Subscribes to the drawer "drawerItemPress" event; returns the unsubscribe function
   useEffect(() => {
      // The screen is in a stack nested in the drawer: the drawer item press targets the parent route
      const drawerRoute = navigation.getParent<DrawerNavigationProp<ParamList> | undefined>()
      if (!drawerRoute) return
      // On menu press: reset the state, then scroll to top
      return drawerRoute.addListener("drawerItemPress", () => {
         onResetRef.current?.()
         scrollToTop(scrollRef.current)
      })
   }, [navigation, scrollRef])
}

export default useMenuReset
