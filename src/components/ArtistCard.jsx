import { View, Text } from "react-native"
import { Image } from "expo-image"
import { MotiView } from "moti"
import { animations } from "@/src/constants"

const placeholder = require("@/assets/images/placeholder.png")

const ArtistCard = ({ name, profile_image, index }) => {
   const anim = index < 4 ? animations.listItem(index) : {}

   return (
      <MotiView
         {...anim}
         className="items-center justify-center mb-5"
      >
         <View className="bg-white shadow-md p-6">
            <View className="w-44 h-44">
               <Image
                  source={{ uri: profile_image }}
                  className="w-44 h-44 border border-neutral-300 "
                  placeholder={placeholder}
                  placeholderContentFit="cover"
                  transition={500}
               />
            </View>
            <View className="pt-3">
               <Text
                  numberOfLines={1}
                  className="text-black font-marker text-xl text-center"
               >
                  {name}
               </Text>
            </View>
         </View>
      </MotiView>
   )
}

export default ArtistCard
