/**
 * useTransitionEnd.ts
 */
import { useEffect, useState } from "react"
import { useNavigation } from "expo-router"
import type { NativeStackNavigationProp } from "expo-router"

type ParamList = Record<string, object | undefined>

const useTransitionEnd = () => {
   // Hooks
   const [isTransitionEnd, setIsTransitionEnd] = useState(false)
   const navigation = useNavigation<NativeStackNavigationProp<ParamList>>()

   useEffect(() => {
      const unsubscribe = navigation.addListener("transitionEnd", () => {
         setIsTransitionEnd(true)
      })

      return unsubscribe
   }, [navigation])

   return { isTransitionEnd }
}

export default useTransitionEnd
