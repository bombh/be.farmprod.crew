/**
 * useMenuReset.jsx
 * Choosing a section in the drawer menu shows it from the top, even when it is already open:
 * the screen stays mounted (data and images kept), only its scroll and state are reset.
 * Going back from a detail screen ("<") keeps the scroll position: only the menu triggers the reset.
 *
 * scrollRef: ref of the screen's ScrollView or FlashList
 * onReset: optional, resets the screen state (e.g. the Works filter)
 */
import { useEffect, useRef } from "react"
import { useNavigation } from "expo-router"

const scrollToTop = (scrollable) => {
   if (scrollable?.scrollToOffset) scrollable.scrollToOffset({ offset: 0, animated: false })
   else scrollable?.scrollTo?.({ y: 0, animated: false })
}

const useMenuReset = (scrollRef, onReset) => {
   const navigation = useNavigation()
   const onResetRef = useRef(onReset)
   onResetRef.current = onReset

   useEffect(() => {
      // The screen is in a stack nested in the drawer: the drawer item press targets the parent route
      const drawerRoute = navigation.getParent()
      if (!drawerRoute) return
      return drawerRoute.addListener("drawerItemPress", () => {
         onResetRef.current?.()
         scrollToTop(scrollRef.current)
      })
   }, [navigation, scrollRef])
}

export default useMenuReset
