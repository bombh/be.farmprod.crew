import { Dimensions, Platform } from "react-native"
import { Easing } from "react-native-reanimated"

export const animations = {
   // for items in a flatlist
   listItem: (index) => {
      return {
         from: {
            opacity: 0,
            translateX: -Dimensions.get("window").width,
         },
         animate: {
            opacity: 1,
            translateX: 0,
         },
         transition: {
            type: "timing",
            duration: 600,
            delay: index * 200,
            easing: Easing.elastic(1),
         },
      }
   },

   // for logo during screen loading
   loadingLogo: () => {
      return {
         from: {
            opacity: 0.4,
            rotate: "0deg",
            translateY: -40,
            scale: 0.5,
         },
         animate: {
            opacity: 1,
            rotate: "360deg",
            translateY: 0,
            scale: 1,
         },
         transition: {
            type: "timing",
            duration: 2500,
            loop: true,
            repeatReverse: true,
            easing: Easing.elastic(3),
         },
         exit: {
            opacity: 0,
            rotate: "0deg",
            translateY: -50,
            scale: 0.5,
         },
         exitTransition: {
            type: "timing",
            duration: 200,
            easing: Easing.elastic(2),
         },
      }
   },
}
