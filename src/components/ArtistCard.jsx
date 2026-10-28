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
         <View
            className="bg-white dark:bg-neutral-900 shadow-md p-6"
            accessible
            accessibilityLabel={name}
         >
            <View className="w-44 h-44">
               <Image
                  source={{ uri: profile_image }}
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
      </MotiView>
   )
}

export default ArtistCard
