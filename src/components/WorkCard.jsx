import { Image } from "expo-image"
import { useRouter } from "expo-router"
import MotionView from "@/src/components/app/MotionView"
import { memo, useRef } from "react"
import { Pressable, Text, View } from "react-native"
import Animated, { useAnimatedStyle } from "react-native-reanimated"
import { animations, ENABLE_ZOOM_TRANSITION } from "@/src/constants"
import TagChips from "@/src/components/app/TagChips"
import { TitleStrip } from "@/src/components/app/TitleStrip"
import { getWorkTags, workDetailRequest } from "@/src/utils/works"
import { prefetchAPI } from "@/src/hooks/useAPI"
import { measureZoomSource, zoomSourceKey } from "@/src/hooks/useZoomTransition"

const placeholder = require("@/assets/images/placeholder.png")

// Without entry animation: the card is shown in place. Also snaps a recycled card whose entry animation
// was interrupted (scroll during the animation) to its final state, without remounting it
const SETTLED = {
   animate: { opacity: 1, translateX: 0, translateY: 0 },
   transition: { type: "timing", duration: 0 },
}

// Cascade filter: distance the card slides down while it fades out
const EXIT_OFFSET = 24

// Bug in expo if parentheses are used in a string
const suppressParenthesis = (value) => String(value ?? "").replace(/[()]/g, "")

// Ghost image transforms (/size/w300/) only apply to images hosted by Ghost
const resizeImage = (uri, size) => (uri ? uri.replace("/images/", `/images/size/${size}/`) : undefined)

// onTagPress: optional, makes the year / city chips pressable ({ type: "year" | "city", slug })
// entry: entry animation of the first cards, "slide" (list first appears), "rise" (chip flight) or null (see works/index.jsx)
// entryRun: changes each time an entry animation starts, so the cards are remounted to replay it
// exitProgress: optional shared value, 0 -> 1 fades the card out downward (cascade filter of the Works list)
// pathname: detail route, in the stack of the list so back returns to that list
const WorkCard = ({
   id,
   title,
   excerpt: fullExcerpt,
   custom_excerpt,
   feature_image,
   tags,
   index,
   pathname = "works/detail",
   onTagPress,
   entry = null,
   entryRun = 0,
   exitProgress,
}) => {
   const excerpt = fullExcerpt ?? custom_excerpt
   const router = useRouter()
   const imageRef = useRef(null)
   const chipsRef = useRef(null)

   // Zoom transition: hide the image and the chips while the zoom overlay covers them (seamless handoff)
   const zoomHiddenStyle = useAnimatedStyle(() => ({
      opacity: zoomSourceKey.value === String(id) ? 0 : 1,
   }))
   const zoomHiddenChipsStyle = useAnimatedStyle(() => ({
      opacity: zoomSourceKey.value === String(id) ? 0 : 1,
   }))
   const exitStyle = useAnimatedStyle(() =>
      exitProgress
         ? { opacity: 1 - exitProgress.value, transform: [{ translateY: exitProgress.value * EXIT_OFFSET }] }
         : {},
   )

   const img = resizeImage(feature_image, "w300")
   const imgHeader = resizeImage(feature_image, "w1000")

   // City / year chips, also passed as text to the detail page
   const chips = getWorkTags(tags)
   const tagText = chips.map((chip) => chip.label).join(" • ")

   const showDetail = async () => {
      // Starts loading the detail content now: it is often ready when the zoom transition ends
      prefetchAPI(...workDetailRequest(id))
      // Zoom transition: measure the image position and warm the large image cache
      // (without image, the detail simply fades in)
      let zoomParams = {}
      if (ENABLE_ZOOM_TRANSITION && imgHeader) {
         Image.prefetch(imgHeader).catch(() => {})
         const [image, chipsRect] = await Promise.all([
            measureZoomSource(imageRef),
            chips.length > 0 ? measureZoomSource(chipsRef, "chips") : {},
         ])
         zoomParams = { imgThumb: img, ...image, ...chipsRect }
      }

      router.navigate({
         pathname,
         params: {
            id,
            title: suppressParenthesis(title),
            excerpt: suppressParenthesis(excerpt),
            ...(imgHeader && { imgHeader }),
            tagText,
            // City / year chips with their filter data: pressable on the detail page (chip flight to Works)
            chips: JSON.stringify(chips),
            ...zoomParams,
         },
      })
   }

   const anim =
      entry && index < 4 ? (entry === "rise" ? animations.listItemRise(index) : animations.listItem(index)) : SETTLED

   return (
      // The key only changes when an entry animation starts (remount to replay it, hidden under the detail page
      // for the chip flight). Not when it stops: remounting then made the images fade in a second time.
      // No per-work key: FlashList keeps recycling the cards instead of remounting them
      <MotionView
         key={entryRun}
         {...anim}
      >
         <Animated.View style={exitStyle}>
            <Pressable
               className="mb-5 active:opacity-70"
               onPress={showDetail}
               accessibilityRole="button"
               accessibilityLabel={`Open ${String(title ?? "").trim()}`}
            >
               <Animated.View style={ENABLE_ZOOM_TRANSITION ? zoomHiddenStyle : undefined}>
                  <View
                     ref={imageRef}
                     collapsable={false}
                     className="relative"
                  >
                     <Image
                        source={img ? { uri: img } : placeholder}
                        className="w-full h-40"
                        placeholder={placeholder}
                        placeholderContentFit="cover"
                        transition={500}
                        // Recycled card: clears the previous work's image instead of cross-fading from it
                        recyclingKey={String(id)}
                        accessible={false}
                     />
                     <TitleStrip title={String(title ?? "").trim()} />
                  </View>
               </Animated.View>
               <View className="p-2">
                  <Text
                     numberOfLines={1}
                     className="text-neutral-500 dark:text-neutral-400 text-base text-center"
                  >
                     {String(excerpt ?? "").trim()}
                  </Text>
               </View>
               {chips.length > 0 && (
                  <Animated.View style={ENABLE_ZOOM_TRANSITION ? zoomHiddenChipsStyle : undefined}>
                     <TagChips
                        ref={chipsRef}
                        items={chips.map((chip) => ({
                           key: chip.slug,
                           label: chip.label,
                           accessibilityLabel: `${chip.type === "year" ? "Year" : "City"}: ${chip.label}`,
                           onPress: onTagPress ? () => onTagPress(chip) : undefined,
                        }))}
                     />
                  </Animated.View>
               )}
            </Pressable>
         </Animated.View>
      </MotionView>
   )
}

// Memoized: the lists pass stable callbacks, so a card only re-renders when its own props change
export default memo(WorkCard)
