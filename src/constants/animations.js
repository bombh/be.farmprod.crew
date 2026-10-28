import { Dimensions } from "react-native"
import { Easing } from "react-native-reanimated"

// "Parallaxe" motion of the About and 20 years screens (useParallaxScroll, components/app/Parallax.jsx)
export const parallax = {
   easing: Easing.bezier(0.2, 0, 0, 1),
   // Header image: zooms out on arrival...
   arrivalScale: 1.25,
   arrivalDuration: 700,
   arrivalDelay: 60,
   // ...then moves slower than the content, and ends its zoom-out over the first points of scroll
   headerSpeed: 0.38,
   headerScale: 1.14,
   headerScaleDistance: 150,
   // Image height added above the header, uncovered by the parallax: headerSpeed x the header position in the
   // content (the least that leaves no gap while the header is on screen, the image keeps its framing) + this margin
   headerOverflowMargin: 4,
   // Blocks entering the viewport: shown once 12% of their height is above the bottom 6% of the screen
   revealThreshold: 0.12,
   revealBottomMargin: 0.06,
   // Blocks visible on arrival wait for the header zoom, blocks entering together are staggered
   revealIntro: 400,
   revealStagger: 70,
   // Black band: slides from the left, its text fades in a little later
   bandOffset: -32,
   bandDuration: 480,
   bandTextDelay: 160,
   bandTextDuration: 340,
   // Round button: scales up with an overshoot (0.5 > 1.1 at 60% > 1)
   popDuration: 520,
}

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

   // for items in a flatlist, when they come from underneath another screen (chip flight to a filtered list)
   listItemRise: (index) => {
      return {
         from: {
            opacity: 0,
            translateY: 18,
         },
         animate: {
            opacity: 1,
            translateY: 0,
         },
         transition: {
            type: "timing",
            duration: 380,
            delay: 220 + index * 70,
            easing: Easing.bezier(0.2, 0, 0, 1),
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
      }
   },
}
