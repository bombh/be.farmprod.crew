import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
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
         },
      })
   }

   const anim = index < 4 ? animations.listItem(index) : {}

   return (
      <MotiView {...anim}>
         <Pressable
            className="relative mb-5 active:opacity-70"
            onPress={showDetail}
         >
            <Image
               source={{ uri: img }}
               className="w-full h-44"
               placeholder={placeholder}
               placeholderContentFit="cover"
               transition={500}
            />

            <View className="absolute bottom-0 w-full bg-black/70 p-2">
               <Text
                  numberOfLines={1}
                  className="text-white font-marker text-base text-center"
               >
                  {title}
               </Text>
            </View>
         </Pressable>
      </MotiView>
   )
}
