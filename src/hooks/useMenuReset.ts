/**
 * useMenuReset.jsx
 * Choosing a section in the drawer menu shows it from the top, even when it is already open:
 * the screen stays mounted (data and images kept), only its scroll and state are reset.
 * Going back from a detail screen ("<") keeps the scroll position: only the menu triggers the reset.
 *
 * scrollRef: ref of the screen's ScrollView or FlashList
 * onReset: optional, resets the screen state (e.g. the Works filter)
 */
import { useEffect, useLayoutEffect, useRef } from "react"
import type { RefObject } from "react"
import { useNavigation } from "expo-router"
import type { NativeStackNavigationProp } from "expo-router"
import type { DrawerNavigationProp } from "expo-router/drawer"

type ParamList = Record<string, object | undefined>

// What is needed of a FlashList (scrollToOffset) or a ScrollView (scrollTo)
interface Scrollable {
   scrollToOffset?: (params: { offset: number; animated?: boolean }) => void
   scrollTo?: (options: { y?: number; animated?: boolean }) => void
}

const scrollToTop = (scrollable: Scrollable | null) => {
   if (scrollable?.scrollToOffset) scrollable.scrollToOffset({ offset: 0, animated: false })
   else scrollable?.scrollTo?.({ y: 0, animated: false })
}

const useMenuReset = (scrollRef: RefObject<Scrollable | null>, onReset?: () => void) => {
   const navigation = useNavigation<NativeStackNavigationProp<ParamList>>()
   const onResetRef = useRef(onReset)
   useLayoutEffect(() => {
      onResetRef.current = onReset
   }, [onReset])

   useEffect(() => {
      // The screen is in a stack nested in the drawer: the drawer item press targets the parent route
      const drawerRoute = navigation.getParent<DrawerNavigationProp<ParamList> | undefined>()
      if (!drawerRoute) return
      return drawerRoute.addListener("drawerItemPress", () => {
         onResetRef.current?.()
         scrollToTop(scrollRef.current)
      })
   }, [navigation, scrollRef])
}

export default useMenuReset
