/**
 * TourCard.tsx
 *
 * Card of one tour in the Tours list (app/(drawer)/tours/index.tsx): the tour image (h-44) with its title in the marker
 * font on a translucent black strip at the bottom. Pressing it opens the tour detail (app/(drawer)/tours/detail.tsx)
 * with the tour `id` and `title` as route params (the title is displayed on the loading radar of the map).
 *
 * A tour that is not available yet ("Soon") has no `id` (and usually no image): the card is then disabled and its
 * accessibility label says "coming soon". The first 4 cards slide in from the left (animations.listItem), the next
 * ones are not animated.
 *
 * Props: id (tour JSON name, missing for a "Soon" tour), title, img (image URL), index (position in the list).
 */

import { Image } from "expo-image" // Tour picture with placeholder
import { useRouter } from "expo-router" // Navigation to the tour detail
import MotionView from "@/src/components/app/MotionView" // Entry animation wrapper
import { Pressable, Text, View } from "react-native" // Pressable card, title strip
import { animations } from "@/src/constants" // Slide-in preset

// Local image shown while the tour image loads
const placeholder = require("@/assets/images/placeholder.png")

// id and img: missing for a tour that is not available yet ("Soon")
// See header
export default function TourCard({
   id,
   title,
   img,
   index,
}: {
   // Tour identifier used to load its JSON; undefined = not available yet
   id?: string
   // Tour name
   title: string
   // Image URL
   img?: string
   // Position in the list (first 4 are animated)
   index: number
}) {
   // Navigation
   const router = useRouter()

   // Opens the tour detail screen; does nothing for a "Soon" tour
   const showDetail = () => {
      if (!id) return

      router.navigate({
         pathname: `/tours/detail`,
         params: {
            id,
            // Shown on the loading radar of the tour map
            title,
         },
      })
   }

   // Slide-in config for the first 4 cards, none afterwards
   const anim = index < 4 ? animations.listItem(index) : {}
   // True for a tour without id
   const isSoon = !id

   return (
      <MotionView {...anim}>
         <Pressable
            className="relative mb-5 active:opacity-70"
            onPress={showDetail}
            disabled={isSoon}
            accessibilityRole="button"
            accessibilityLabel={isSoon ? `${title}, coming soon` : `Open ${title} tour`}
            accessibilityState={{ disabled: isSoon }}
         >
            <Image
               source={{ uri: img }}
               className="w-full h-44"
               placeholder={placeholder}
               placeholderContentFit="cover"
               transition={500}
               accessible={false}
            />

            <View className="absolute bottom-0 w-full bg-black/70 p-2">
               <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.4}
                  className="text-white font-marker text-base text-center"
               >
                  {title}
               </Text>
            </View>
         </Pressable>
      </MotionView>
   )
}
