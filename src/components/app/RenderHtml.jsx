import { View, Text, Pressable, Linking } from "react-native"
import React, { useMemo } from "react"
import { Image } from "expo-image"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import useThemeColors from "@/src/hooks/useThemeColors"
import {
   cleanHtml,
   getImages,
   getImageSrc,
   getImageURI,
   getTagAttribute,
   getTagContent,
   getTagName,
} from "@/src/utils/html"
import { useRouter } from "expo-router"
import { Reveal } from "@/src/components/app/Parallax"

const placeholder = require("@/assets/images/placeholder.png")

// Pictures loaded first (the top of the content), the next ones wait with a low priority
const HIGH_PRIORITY_IMAGES = 2
// Large gallery pictures preloaded when the gallery opens: the pressed one and its neighbours
const GALLERY_PRELOAD_RANGE = 1

// picturesPathname: gallery route opened when an image is pressed (gallery = true)
// reveal: bands and email button come in when they enter the viewport (inside a ParallaxScrollView, About screen)
export default function RenderHtml({
   html,
   authors,
   email,
   textAlign,
   gallery,
   picturesPathname = "works/pictures",
   reveal = false,
}) {
   const router = useRouter()
   const theme = useThemeColors()
   const htmlArray = useMemo(() => cleanHtml(html), [html])
   const images = useMemo(() => getImages(htmlArray), [htmlArray])
   const artists = authors
      ?.map((author) => author?.name)
      .filter(Boolean)
      .join(" / ")

   const textClass = textAlign === "justify" ? "text-justify" : "text-center"

   const handlePressImage = (tag) => {
      if (!gallery) return

      const imageIndex = images.indexOf(getImageURI(tag))
      if (imageIndex < 0) return

      images
         .slice(Math.max(0, imageIndex - GALLERY_PRELOAD_RANGE), imageIndex + GALLERY_PRELOAD_RANGE + 1)
         .forEach((uri) => Image.prefetch(uri).catch(() => {}))

      router.navigate({
         pathname: picturesPathname,
         params: {
            index: imageIndex,
            images,
         },
      })
   }

   return (
      <View className="px-0">
         {/* HTML tags from array  */}
         {htmlArray.map((item, index) => {
            switch (getTagName(item)) {
               case "p":
                  return (
                     <Text
                        className={`text-base text-black dark:text-white ${textClass} mx-5 px-5 py-2 mb-5`}
                        key={index}
                     >
                        {getTagContent(item)}
                     </Text>
                  )
               case "h2":
                  return (
                     <Reveal
                        enabled={reveal}
                        className="bg-black dark:bg-neutral-800 mx-5 p-5"
                        key={index}
                     >
                        <Text
                           className="text-white text-center"
                           accessibilityRole="header"
                        >
                           {getTagContent(item)}
                        </Text>
                     </Reveal>
                  )
               case "h3":
                  return (
                     <Text
                        className={`text-base font-bold text-black dark:text-white ${textClass} mx-5 px-5 pt-2`}
                        accessibilityRole="header"
                        key={index}
                     >
                        {getTagContent(item)}
                     </Text>
                  )
               case "li": {
                  const value = getTagAttribute(item, "value")
                  return (
                     <Text
                        className={`text-base text-black dark:text-white ${textClass} mx-5 px-5 py-1 mb-1`}
                        key={index}
                     >
                        {`${value ? `${value}.` : "•"} ${getTagContent(item)}`}
                     </Text>
                  )
               }
               case "img": {
                  const position = images.indexOf(getImageURI(item)) + 1
                  return (
                     <View
                        className="w-full"
                        key={index}
                     >
                        <Pressable
                           onPress={() => handlePressImage(item)}
                           className="active:opacity-70"
                           disabled={!gallery}
                           accessibilityRole={gallery ? "button" : "image"}
                           accessibilityLabel={
                              gallery ? `Open picture ${position} of ${images.length} in full screen` : "Picture"
                           }
                        >
                           <Image
                              className="w-full aspect-video mb-5"
                              source={{ uri: getImageSrc(item) }}
                              placeholder={placeholder}
                              placeholderContentFit="cover"
                              transition={500}
                              priority={position <= HIGH_PRIORITY_IMAGES ? "normal" : "low"}
                           />
                        </Pressable>
                     </View>
                  )
               }
               default:
                  return null
            }
         })}

         {/* Authors if exists */}
         {!!artists && (
            <>
               <Reveal
                  enabled={reveal}
                  className="bg-black dark:bg-neutral-800 mx-5 p-5"
                  key="authors"
               >
                  <Text
                     className="text-white text-center"
                     accessibilityRole="header"
                  >
                     Artists
                  </Text>
               </Reveal>
               <Text
                  className="text-base text-black dark:text-white mx-5 px-5 py-2 mb-10 text-center"
                  key="artists"
               >
                  {artists}
               </Text>
            </>
         )}

         {/* Email if exists */}
         {!!email && (
            <Reveal
               enabled={reveal}
               variant="pop"
               className="flex items-center justify-center mb-10"
            >
               <Pressable
                  className="flex bg-black dark:bg-white w-14 h-14 rounded-full active:bg-red-500 dark:active:bg-red-500 items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Send an email to ${email}`}
                  onPress={() => {
                     Linking.openURL(`mailto:${email}`)
                  }}
               >
                  <MaterialIcons
                     name="email"
                     size={24}
                     color={theme.actionIcon}
                  />
               </Pressable>
            </Reveal>
         )}
      </View>
   )
}
