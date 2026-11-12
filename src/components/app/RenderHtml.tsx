/**
 * RenderHtml.tsx
 *
 * Renders the HTML content of a Ghost post / page as native React Native elements. Used by the Work detail screen
 * (screens/WorkDetail.tsx), the About screen and the 20 years screen.
 *
 * How it works: `html` (Ghost HTML string) is cleaned by `cleanHtml` (utils/html.ts) into a flat array of simple tags
 * (memoized on `html`), and each item is mapped to an element by its tag name:
 * - "p"  -> centered / justified text paragraph;
 * - "h2" -> white title on a black band (a <Reveal> from components/app/Parallax.tsx: animated on scroll when
 *   `reveal` is true, plain View otherwise);
 * - "h3" -> bold text header;
 * - "li" -> text line prefixed with its number ("1.") or a bullet;
 * - "img" -> a pressable w600 image with a placeholder (the first 2 load with normal priority, the others low). When
 *   `gallery` is true, a press prefetches the pressed picture and its neighbours (w1600) and navigates to the pictures
 *   route (`picturesPathname`) with `index` and `images` (all large URIs) as params: see screens/Gallery.tsx.
 * After the content: an "Artists" band + names joined by " / " (when `authors` is given) and a round email button
 * opening the mail app (when `email` is given).
 * Text colors come from NativeWind `dark:` classes; the icon color from useThemeColors.
 *
 * Props: html, authors, email, textAlign ("center" default or "justify"), gallery, picturesPathname, reveal.
 * Unit tested in components/app/__tests__/RenderHtml.test.tsx.
 */

import { View, Text, Pressable, Linking } from "react-native" // Layout, text, pressable image, mailto link
import { useMemo } from "react" // Memoizes the parsed HTML and the image list
import { Image } from "expo-image" // Content images (placeholder, fade, prefetch)
import MaterialIcons from "@react-native-vector-icons/material-icons" // Email icon of the contact button
import useThemeColors from "@/src/hooks/useThemeColors" // Icon color
import {
   cleanHtml,
   getImages,
   getImageSrc,
   getImageURI,
   getTagAttribute,
   getTagContent,
   getTagName,
} from "@/src/utils/html"
// Navigation to the pictures gallery route
import { useRouter } from "expo-router"
import { Reveal } from "@/src/components/app/Parallax" // Scroll-revealed black band / email button
import type { GhostAuthor } from "@/src/types/ghost" // Shape of the authors prop

// Local image shown while a content picture loads
const placeholder = require("@/assets/images/placeholder.png")

// Pictures loaded first (the top of the content), the next ones wait with a low priority
const HIGH_PRIORITY_IMAGES = 2
// Large gallery pictures preloaded when the gallery opens: the pressed one and its neighbours
const GALLERY_PRELOAD_RANGE = 1

// Props of the renderer
interface RenderHtmlProps {
   // Ghost HTML string; empty or missing renders nothing
   html?: string | null
   // Artists of the work, shown under an "Artists" band
   authors?: Pick<GhostAuthor, "name">[]
   // Shows a round contact button that opens a mailto link
   email?: string
   // Alignment of paragraphs and list items (default "center")
   textAlign?: "center" | "justify"
   // Images open the full screen gallery when pressed
   gallery?: boolean
   // Gallery route to open (default works pictures)
   picturesPathname?: "/works/pictures" | "/20years/pictures"
   // Animate bands and the email button when they enter the viewport
   reveal?: boolean
}

// picturesPathname: gallery route opened when an image is pressed (gallery = true)
// reveal: bands and email button come in when they enter the viewport (inside a ParallaxScrollView, About screen)
// See header
export default function RenderHtml({
   html,
   authors,
   email,
   textAlign,
   gallery,
   picturesPathname = "/works/pictures",
   reveal = false,
}: RenderHtmlProps) {
   // Navigation
   const router = useRouter()
   // Theme colors
   const theme = useThemeColors()
   // Cleaned simple tags, recomputed only when the html changes
   const htmlArray = useMemo(() => cleanHtml(html), [html])
   // Large (w1600) URIs of all content images, in order: the gallery content
   const images = useMemo(() => getImages(htmlArray), [htmlArray])
   // Artist names joined by " / ", undefined without authors
   const artists = authors
      ?.map((author) => author?.name)
      .filter(Boolean)
      .join(" / ")

   // Text alignment class shared by paragraphs and list items
   const textClass = textAlign === "justify" ? "text-justify" : "text-center"

   // Opens the gallery at the pressed image (only when `gallery`): prefetches neighbours, navigates with the image list
   const handlePressImage = (tag: string) => {
      if (!gallery) return

      const imageIndex = images.indexOf(getImageURI(tag)!)
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

   // Renders each cleaned tag; any other tag gives null
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
                  const position = images.indexOf(getImageURI(item)!) + 1
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
                              source={{ uri: getImageSrc(item)! }}
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
