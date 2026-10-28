import { View, Text, Pressable, Linking } from "react-native"
import { Image } from "expo-image"

import ScreenTitle from "@/src/components/app/ScreenTitle"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import useThemeColors from "@/src/hooks/useThemeColors"
import { MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useRef } from "react"
import useMenuReset from "@/src/hooks/useMenuReset"
import { ParallaxHeader, ParallaxScrollView, Reveal } from "@/src/components/app/Parallax"

const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/app/images/"
const placeholder = require("@/assets/images/placeholder.png")

const images = {
   team: `${baseUrl}team.jpg`,
   cover: `${baseUrl}book_cover.jpg`,
   page01: `${baseUrl}book_01.jpg`,
   page02: `${baseUrl}book_02.jpg`,
   page03: `${baseUrl}book_03.jpg`,
   expo01: `${baseUrl}expo_01.jpg`,
   expo02: `${baseUrl}expo_02.jpg`,
   expo03: `${baseUrl}expo_03.jpg`,
   expo04: `${baseUrl}expo_04.jpg`,
}

const bookPages = [images.page01, images.page02, images.page03]
const expoImages = [images.expo01, images.expo02, images.expo04, images.expo03]

// Gallery order: cover, book pages, expo images
const imagesArray = [images.cover, ...bookPages, ...expoImages]

// Full-width pressable image opening the gallery
const GalleryImage = ({ uri, isLast, onPress, label }) => (
   <View className={isLast ? "mb-0" : "mb-5"}>
      <Pressable
         className="active:opacity-70"
         onPress={() => onPress(uri)}
         accessibilityRole="button"
         accessibilityLabel={`${label}, open in full screen`}
      >
         <Image
            className="w-full aspect-video"
            source={{ uri }}
            placeholder={placeholder}
            placeholderContentFit="cover"
            transition={500}
            accessible={false}
         />
      </Pressable>
   </View>
)

export default function Screen() {
   const router = useRouter()
   const theme = useThemeColors()
   const scrollRef = useRef(null)
   useMenuReset(scrollRef)

   const handlePressImage = (uri) => {
      const imageIndex = imagesArray.indexOf(uri)

      router.navigate({
         pathname: `20years/pictures`,
         params: {
            index: imageIndex,
            images: imagesArray,
         },
      })
   }

   return (
      <>
         <HeaderDrawer />

         {/* Parallaxe: header image zoom and parallax, bands and buttons coming in on scroll */}
         <ParallaxScrollView
            ref={scrollRef}
            className="flex-1 bg-white dark:bg-neutral-950"
         >
            <ScreenTitle title="20 years" />

            <ParallaxHeader
               source={images.team}
               accessibilityLabel="The Farm Prod team"
            />

            <Reveal className="bg-black dark:bg-neutral-800 m-5 px-5 py-3">
               <Text
                  className="text-lg font-marker text-white text-center"
                  accessibilityRole="header"
               >
                  The Book
               </Text>
            </Reveal>

            <Text className="text-xl text-black dark:text-white text-center mx-5 px-5 py-2">
               IN PAINT WE TRUST - FARM PROD {"\n"}cfc Editions
            </Text>

            <View className="mx-5 p-3">
               <Pressable
                  className="active:opacity-70"
                  onPress={() => handlePressImage(images.cover)}
                  accessibilityRole="button"
                  accessibilityLabel="Book cover, open in full screen"
               >
                  <Image
                     source={images.cover}
                     contentFit="contain"
                     className="w-full h-80"
                     accessible={false}
                  />
               </Pressable>
            </View>

            <View className="flex items-center justify-center">
               <Reveal
                  variant="pop"
                  className="mb-2"
               >
                  <Pressable
                     className="flex bg-black dark:bg-white w-14 h-14 rounded-full active:bg-red-500 dark:active:bg-red-500 items-center justify-center"
                     onPress={() => {
                        Linking.openURL("https://www.maisoncfc.be/fr/products/1349-in-paint-we-trust-farm-prod")
                     }}
                     accessibilityRole="link"
                     accessibilityLabel="Buy the book at cfc Editions"
                  >
                     <MaterialIcons
                        name="shopping-cart"
                        size={24}
                        color={theme.actionIcon}
                     />
                  </Pressable>
               </Reveal>
               <Text
                  className="text-sm text-black dark:text-white text-center mb-5"
                  importantForAccessibility="no"
                  accessibilityElementsHidden
               >
                  Buy the Book @ cfc Editions
               </Text>
            </View>

            <Text className="text-base text-black dark:text-white text-justify mx-5 px-5 py-2 mb-5">
               This publication, richly illustrated with rare and original documents traces the history of Farm Prod, a
               collective of cosmopolitan street artists.
            </Text>

            <Text className="text-base text-black dark:text-white text-justify italic mx-5 px-5 py-2 mb-5">
               Twenty years ago, a group of graphic communications students decided to share a living and working space
               by moving into an isolated farmhouse that quickly became a buzzing hive of creativity. It&apos;s the
               birth of one of the most original groups in urban art in recent years. From squats to artists&apos;
               studios, we follow the progress of a close-knit team capable of regularly reinventing itself to meet the
               challenges of an artistic career moving from spontaneous art to official commissions, without ever losing
               its singular aesthetic and its sense of friendship...
            </Text>

            {bookPages.map((uri, index) => (
               <GalleryImage
                  key={uri}
                  uri={uri}
                  label={`Book page ${index + 1}`}
                  onPress={handlePressImage}
               />
            ))}

            <Text className="text-base text-black dark:text-white text-justify mx-5 px-5 py-2 mb-5">
               THANK YOU to Maison cfc Editions for the support and the great collaboration throughout the long process
               ; to Collin Hotermans for the graphic design and Éric Van Essche for the texts.
            </Text>

            <Reveal className="bg-black dark:bg-neutral-800 m-5 px-5 py-3">
               <Text
                  className="text-lg font-marker text-white text-center"
                  accessibilityRole="header"
               >
                  The Expo
               </Text>
            </Reveal>

            <Text className="text-base text-black dark:text-white text-justify mx-5 px-5 py-2 mb-5">
               An immersive experience within Brussels and (inter)national urban painting scene that offered to see and
               live two decades of the life of the collective historical members, dedicated to their art, friendship and
               passion.
            </Text>

            <View className="flex items-center justify-center">
               <Reveal
                  variant="pop"
                  className="mb-2"
               >
                  <Pressable
                     className="flex bg-black dark:bg-white w-14 h-14 rounded-full active:bg-red-500 dark:active:bg-red-500 items-center justify-center"
                     onPress={() => {
                        Linking.openURL("https://www.facebook.com/media/set/?set=a.903700701758943&type=3")
                     }}
                     accessibilityRole="link"
                     accessibilityLabel="See the expo photos on Facebook"
                  >
                     <MaterialIcons
                        name="photo-camera"
                        size={24}
                        color={theme.actionIcon}
                     />
                  </Pressable>
               </Reveal>
               <Text
                  className="text-sm text-black dark:text-white text-center mb-5"
                  importantForAccessibility="no"
                  accessibilityElementsHidden
               >
                  See the Expo @ Facebook
               </Text>
            </View>

            <Text className="text-base text-black dark:text-white text-justify mx-5 px-5 py-2 mb-10">
               Highlights allowed anyone to meet and get to know the artists throug the month during concerts but also
               workshops and tours, in collaboration with Fais le trottoir asbl, IceScreen collective, Maison des
               Cultures et de la Cohésion Sociale de Molenbeek, and many more.
            </Text>

            {/* Images */}
            {expoImages.map((uri, index) => (
               <GalleryImage
                  key={uri}
                  uri={uri}
                  label={`Expo picture ${index + 1}`}
                  isLast={index === expoImages.length - 1}
                  onPress={handlePressImage}
               />
            ))}
         </ParallaxScrollView>
      </>
   )
}
