/**
 * useTransitionEnd.jsx
 */
import { useEffect, useState } from "react"
import { useNavigation } from "expo-router"

const useTransitionEnd = () => {
   // Hooks
   const [isTransitionEnd, setIsTransitionEnd] = useState(false)
   const navigation = useNavigation()

   useEffect(() => {
      const unsubscribe = navigation.addListener("transitionEnd", (e) => {
         setIsTransitionEnd(true)
         //console.log("Transition end")
      })

      return unsubscribe
   }, [navigation])

   return { isTransitionEnd }
}

export default useTransitionEnd
