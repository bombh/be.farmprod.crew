import { View, Text } from "react-native"
import { Image } from "expo-image"
import { MotiView } from "moti"
import { animations } from "@/src/constants"

const placeholder = require("@/assets/images/placeholder.png")

const ArtistCard = ({ name, profile_image, index }) => {
   const anim = index < 4 ? animations.listItem(index) : {}

   return (
      <MotiView {...anim}>
         <View className="flex-row items-center justify-center">
            <View className="w-44 h-44 rounded-full bg-neutral-200">
               <Image
                  source={{ uri: profile_image }}
                  className="w-44 h-44 rounded-full border border-black"
                  placeholder={placeholder}
                  placeholderContentFit="cover"
                  transition={500}
               />
            </View>
         </View>
         <View className="p-2 mb-5">
            <Text
               numberOfLines={1}
               className="text-black font-semibold text-lg text-center"
            >
               {name}
            </Text>
         </View>
      </MotiView>
   )
}

export default ArtistCard
