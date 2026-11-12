/**
 * index.tsx (src/app/(drawer)/20years, route "/20years")
 *
 * 20 years anniversary screen of the collective, with static content written in the file (nothing is fetched from
 * Ghost): the team photo, "The Book" (cfc Editions book "In Paint We Trust": cover, text, three page images, a round
 * button to buy it) and "The Expo" (text, a round button to the Facebook photos, four photos). Images are hosted on
 * map.farmprod.be.
 *
 * Motion: the whole screen is a ParallaxScrollView (components/app/Parallax.tsx): the team photo is a ParallaxHeader
 * (zooms out on arrival, then moves slower than the content), and the black title bands and round buttons are
 * <Reveal> blocks that come in when they enter the viewport.
 * Gallery: pressing the cover, a book page or an expo photo navigates to "/20years/pictures" (screens/Gallery.tsx) with
 * `index` (position in `imagesArray`: cover, book pages, expo images) and `images` (all URIs) as params.
 * `useMenuReset` scrolls back to the top when the drawer item is pressed. Icon colors come from useThemeColors.
 */

import { View, Text, Pressable, Linking } from "react-native" // Layout, text, pressable images, external links
import { Image } from "expo-image" // Images with placeholder and fade

import ScreenTitle from "@/src/components/app/ScreenTitle" // Big title
import HeaderDrawer from "@/src/layouts/HeaderDrawer" // Menu button + logo header
import useThemeColors from "@/src/hooks/useThemeColors" // Icon color of the round buttons
import MaterialIcons from "@react-native-vector-icons/material-icons" // Icons of the round buttons
import { useRouter } from "expo-router" // Navigation to the gallery route
import { useRef } from "react" // Ref of the scroll view
import useMenuReset from "@/src/hooks/useMenuReset" // Scroll to top when the menu item is pressed
// Parallax scroll view, header image, scroll-revealed blocks
import { ParallaxHeader, ParallaxScrollView, Reveal } from "@/src/components/app/Parallax"

// Folder of the images on map.farmprod.be
const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/app/images/"
// Local image shown while images load
const placeholder = require("@/assets/images/placeholder.png")

// URL of each image of the screen
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

// The three book page images, in display order
const bookPages = [images.page01, images.page02, images.page03]
// The four expo images, in display order
const expoImages = [images.expo01, images.expo02, images.expo04, images.expo03]

// Gallery order: cover, book pages, expo images
const imagesArray = [images.cover, ...bookPages, ...expoImages]

// Props: uri (image), isLast (no bottom margin), onPress (receives the uri), label (accessibility)
// Full-width pressable image opening the gallery
// See comment above
const GalleryImage = ({
   uri,
   isLast,
   onPress,
   label,
}: {
   uri: string
   isLast?: boolean
   onPress: (uri: string) => void
   label: string
}) => (
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

// Screen of the route
export default function Screen() {
   // Navigation
   const router = useRouter()
   // Theme colors (actionIcon)
   const theme = useThemeColors()
   // Scroll view ref, for the menu reset
   const scrollRef = useRef(null)
   // Pressing the menu item scrolls back to the top
   useMenuReset(scrollRef)

   // Opens the gallery at the pressed image: index in imagesArray + the list of all URIs
   const handlePressImage = (uri: string) => {
      const imageIndex = imagesArray.indexOf(uri)

      router.navigate({
         pathname: `/20years/pictures`,
         params: {
            index: imageIndex,
            images: imagesArray,
         },
      })
   }

   // Header, then the parallax content (the JSX is long: title, team photo, book section, expo section)
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
               Highlights allowed anyone to meet and get to know the artists through the month during concerts but also
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
