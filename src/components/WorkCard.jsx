import { Image } from "expo-image"
import { useRouter } from "expo-router"
import { MotiView } from "moti"
import { Pressable, Text, View } from "react-native"
import { animations } from "@/src/constants"

const placeholder = require("@/assets/images/placeholder.png")

const suppressParenthesis = (string) => {
   return string.replace("(", "").replace(")", "")
}

const WorkCard = ({ id, title, excerpt, feature_image, tags, index }) => {
   const router = useRouter()

   const img = feature_image.replace("/images/", "/images/size/w300/")
   const imgHeader = feature_image.replace("/images/", "/images/size/w1000/")

   // Bug in expo if parentheses are used in a string
   const tagText = tags
      .slice(2)
      .map((tag) => suppressParenthesis(tag.name))
      .join(" • ")

   const showDetail = () => {
      router.navigate({
         pathname: `works/detail`,
         params: {
            id,
            title: suppressParenthesis(title),
            excerpt: suppressParenthesis(excerpt),
            imgHeader,
            tagText,
         },
      })
   }

   const anim = index < 4 ? animations.listItem(index) : {}

   return (
      <MotiView {...anim}>
         <Pressable
            className="mb-5 active:opacity-70"
            onPress={showDetail}
         >
            <View className="relative">
               <Image
                  source={{ uri: img }}
                  className="w-full h-40"
                  placeholder={placeholder}
                  placeholderContentFit="cover"
                  transition={500}
               />
               <View className="absolute bg-black/70 bottom-0 w-full p-2">
                  <Text
                     numberOfLines={1}
                     className="text-white font-marker text-xl text-center"
                  >
                     {title.trim()}
                  </Text>
               </View>
            </View>
            <View className="p-2">
               <Text
                  numberOfLines={1}
                  className="text-neutral-400 text-base text-center"
               >
                  {excerpt.trim()}
               </Text>
            </View>
            <View className="border border-neutral-300 border-x-0 border-y-1">
               <Text
                  numberOfLines={1}
                  className="text-xs text-center p-1"
               >
                  {tagText}
               </Text>
            </View>
         </Pressable>
      </MotiView>
   )
}

export default WorkCard
//export default memo(WorkCard, (prevProps, nextProps) => (prevProps.id === nextProps.id))
