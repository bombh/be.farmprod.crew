import { View, Text, Pressable, Linking } from "react-native"
import React from "react"
import { Image } from "expo-image"
import { MaterialIcons } from "@expo/vector-icons"
import colors from "tailwindcss/colors"
import { cleanHtml, getImages, getImageURI } from "@/src/utils/html"
import { useRouter } from "expo-router"

const placeholder = require("@/assets/images/placeholder.png")

export default function RenderHtml({ html, authors, email, textAlign, gallery }) {
   const router = useRouter()
   const htmlArray = cleanHtml(html)
   const images = getImages(htmlArray)
   const artists = authors?.map((author) => author.name).join(" / ")
   let content = ""

   if (textAlign === "justify") {
      textClass = "text-justify"
   } else {
      textClass = "text-center"
   }

   const handlePressImage = (uri) => {
      if (gallery) {
         const image = getImageURI(uri)
         const imageIndex = images.indexOf(image)
         //console.log("images", uri, images, imageIndex)

         router.navigate({
            pathname: `works/pictures`,
            params: {
               index: imageIndex,
               images,
            },
         })
      }
   }

   return (
      <View className="px-0">
         {/* HTML tags from array  */}
         {htmlArray.map((item, index) => {
            switch (item.substring(0, 3)) {
               case "<p>":
                  // <p>
                  content = item.replace(/<p>/, "").replace(/<\/p>/, "")
                  return (
                     <Text
                        className={`text-base ${textClass} mx-5 px-5 py-2 mb-5`}
                        key={index}
                     >
                        {content}
                     </Text>
                  )
                  break
               case "<h2":
                  // <h2>
                  content = item.replace(/<h2.+?>/, "").replace(/<\/h2>/, "")
                  return (
                     <View
                        className="bg-black mx-5 p-5"
                        key={index}
                     >
                        <Text className="text-white text-center">{content}</Text>
                     </View>
                  )
                  break
               case "<im":
                  // <image>
                  return (
                     <View
                        className="w-full"
                        key={index}
                     >
                        <Pressable
                           onPress={() => handlePressImage(item)}
                           className="active:opacity-70"
                        >
                           <Image
                              className="w-full aspect-video mb-5"
                              source={{ uri: item.substring(10, item.length - 2) }}
                              placeholder={placeholder}
                              placeholderContentFit="cover"
                              transition={500}
                           />
                        </Pressable>
                     </View>
                  )
                  break
               default:
                  return null
            }
         })}

         {/* Authors if exists */}
         {artists && (
            <>
               <View
                  className="bg-black mx-5 p-5"
                  key="authors"
               >
                  <Text className="text-white text-center">Artists</Text>
               </View>
               <Text
                  className="text-base mx-5 px-5 py-2 mb-10 text-center"
                  key="artists"
               >
                  {artists}
               </Text>
            </>
         )}

         {/* Email if exists */}
         {email && (
            <View className="flex items-center justify-center">
               <Pressable
                  className="flex bg-black w-14 h-14 rounded-full active:bg-red-500 items-center justify-center mb-10"
                  onPress={() => {
                     Linking.openURL(`mailto:${email}`)
                  }}
               >
                  <MaterialIcons
                     name="email"
                     size={24}
                     color={colors.white}
                  />
               </Pressable>
            </View>
         )}
      </View>
   )
}
