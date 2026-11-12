/**
 * ArtistCard.tsx
 *
 * Card of one artist in the Artists grid (app/(drawer)/artists/index.tsx): white (neutral-900 in dark) tile with a
 * shadow, the square profile picture (w-44) and the artist name in the marker font, on at most 2 lines.
 *
 * Entry animation: the first 4 cards (index < 4) slide in from the left with `animations.listItem(index)`
 * (constants/animations.ts), played by MotionView; later cards (scrolled into view) get no animation (`{}`).
 * The picture uses expo-image with the local placeholder while loading (500 ms fade). The tile is one accessible
 * element labelled with the artist name (the image is hidden from screen readers).
 *
 * Props: name, profile_image (Ghost author fields), index (position in the list, drives the animation).
 */

import { View, Text } from "react-native" // Containers and the name text
import { Image } from "expo-image" // Profile picture with placeholder
import MotionView from "@/src/components/app/MotionView" // Entry animation wrapper
import { animations } from "@/src/constants" // Slide-in preset
import type { GhostAuthor } from "@/src/types/ghost" // Author fields used as props

// Local image shown while the profile picture loads
const placeholder = require("@/assets/images/placeholder.png")

// name / profile_image: Ghost author; index: position in the list (first 4 are animated)
const ArtistCard = ({
   name,
   profile_image,
   index,
}: Pick<GhostAuthor, "name" | "profile_image"> & { index: number }) => {
   // Slide-in config for the first 4 cards, none afterwards
   const anim = index < 4 ? animations.listItem(index) : {}

   // The animation config is spread on the MotionView
   return (
      <MotionView
         {...anim}
         className="items-center justify-center mb-5"
      >
         <View
            className="bg-white dark:bg-neutral-900 shadow-md p-6"
            accessible
            accessibilityLabel={name}
         >
            <View className="w-44 h-44">
               <Image
                  source={{ uri: profile_image ?? undefined }}
                  className="w-44 h-44"
                  placeholder={placeholder}
                  placeholderContentFit="cover"
                  transition={500}
                  accessible={false}
               />
            </View>
            <View className="pt-3 items-center">
               <Text
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.4}
                  className="text-black dark:text-white font-marker text-xl text-center w-40"
               >
                  {name}
               </Text>
            </View>
         </View>
      </MotionView>
   )
}

export default ArtistCard
