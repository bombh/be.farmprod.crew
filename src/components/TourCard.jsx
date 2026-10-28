import { Image } from "expo-image"
import { useRouter } from "expo-router"
import MotionView from "@/src/components/app/MotionView"
import { Pressable, Text, View } from "react-native"
import { animations } from "@/src/constants"

const placeholder = require("@/assets/images/placeholder.png")

export default function TourCard({ id, title, img, index }) {
   const router = useRouter()

   const showDetail = () => {
      if (!id) return

      router.navigate({
         pathname: `tours/detail`,
         params: {
            id,
            // Shown on the loading radar of the tour map
            title,
         },
      })
   }

   const anim = index < 4 ? animations.listItem(index) : {}
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
