import { ScrollView, View, Text, useWindowDimensions } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams } from "expo-router"

import useAPI from "@/src/hooks/useAPI"
import HeaderBack from "@/src/layouts/HeaderBack"
import RenderHtml from "@/src/components/app/RenderHtml"
import Loading from "@/src/components/app/Loading"

const placeholder = require("@/assets/images/placeholder.png")

const Screen = () => {
   // Get route params
   const params = useLocalSearchParams()
   const { id, title, excerpt, imgHeader, tagText } = params

   // Get content
   const { data, isLoading, error } = useAPI("GET", `posts/${id}`, "include=authors")
   const { width } = useWindowDimensions()

   return (
      <>
         <HeaderBack />
         <ScrollView className="relative w-full bg-white">
            <View className="">
               <Image
                  source={{ uri: imgHeader }}
                  className="w-full h-96"
                  placeholder={placeholder}
                  placeholderContentFit="cover"
                  transition={500}
               />
            </View>
            <View className="bg-black w-full px-3 py-5">
               <Text
                  numberOfLines={1}
                  className="text-2xl text-white font-medium text-center"
               >
                  {title}
               </Text>
               <Text className="text-xs font-semibold text-center mt-2 text-white">{tagText}</Text>
            </View>
            <View className="px-5 pt-1"></View>
            <View className="px-3 py-5">
               <Text className="text-lg text-center text-neutral-500 leading-6">{excerpt}</Text>
            </View>

            {isLoading ? (
               <Loading
                  label={"Loading " + title}
                  hideLogo={true}
               />
            ) : (
               <>
                  <RenderHtml
                     html={data?.posts[0].html}
                     authors={data?.posts[0].authors}
                  />
               </>
            )}
         </ScrollView>
      </>
   )
}

export default Screen
