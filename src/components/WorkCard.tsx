/**
 * WorkCard.tsx
 *
 * Card of one work (Ghost post) in the Works list (app/(drawer)/works/index.tsx, rendered by a FlashList): the
 * w300 thumbnail with the title on a strip (TitleStrip), the excerpt on one line and the city / year chips (TagChips).
 *
 * Pressing the card (showDetail):
 * 1. prefetches the work detail (`prefetchAPI(...workDetailRequest(id))`), so it is often ready when the screen opens;
 * 2. with the zoom transition enabled and an image: prefetches the large w1000 image and measures the image (and
 *    the chips) position in the window (hooks/useZoomTransition.tsx -> measureZoomSource);
 * 3. navigates to the detail route with the work data as params (title, excerpt, imgHeader, tagText, chips as JSON,
 *    imgThumb and the measured rects), so the detail screen can display instantly and animate from this card.
 * While the zoom overlay covers this card, its image and chips are hidden (zoomSourceKey shared value).
 *
 * Animations: MotionView entry animation of the first 4 cards ("slide" = first display, "rise" = list shown under the
 * chip flight, null = no animation, i.e. SETTLED), and an optional exit (fade + slide down) driven by `exitProgress`
 * for the cascade filter of the Works list. The component is memoized: the list passes stable callbacks.
 *
 * Props: id, title, excerpt, custom_excerpt, feature_image, tags (Ghost post fields), index, pathname, onTagPress,
 * entry, entryRun, exitProgress (see WorkCardProps below).
 */

import { Image } from "expo-image" // Thumbnail and prefetch of the large image
import { useRouter } from "expo-router" // Navigation to the work detail
import MotionView from "@/src/components/app/MotionView" // Entry animation wrapper
import { memo, useRef } from "react" // Memoized card; refs of the image and chips (measured for the zoom)
import { Pressable, Text, View } from "react-native" // Card layout
import type { HostInstance } from "react-native" // Native view ref type
import Animated, { useAnimatedStyle } from "react-native-reanimated" // Animated wrappers (exit, hidden-while-zooming)
import type { SharedValue } from "react-native-reanimated" // Type of exitProgress
import { animations, ENABLE_ZOOM_TRANSITION } from "@/src/constants" // Entry presets, zoom feature flag
import type { EntryAnimation } from "@/src/constants/animations" // Config type of the SETTLED constant
import TagChips from "@/src/components/app/TagChips" // Year / city chips row
import { TitleStrip } from "@/src/components/app/TitleStrip" // Title over the image
import { getWorkTags, workDetailRequest } from "@/src/utils/works" // Chips from tags; request tuple of the detail
import type { WorkTagChip } from "@/src/utils/works" // Chip shape
import type { GhostPost } from "@/src/types/ghost" // Post fields used as props
import { prefetchAPI } from "@/src/hooks/useAPI" // Warm the cache of the detail request
// Measure the card for the zoom; id of the card covered by the overlay
import { measureZoomSource, zoomSourceKey } from "@/src/hooks/useZoomTransition"

// Local image shown while the thumbnail loads
const placeholder = require("@/assets/images/placeholder.png")

// Without entry animation: the card is shown in place. Also snaps a recycled card whose entry animation
// was interrupted (scroll during the animation) to its final state, without remounting it
const SETTLED: EntryAnimation = {
   animate: { opacity: 1, translateX: 0, translateY: 0 },
   transition: { type: "timing", duration: 0 },
}

// Cascade filter: distance the card slides down while it fades out
// Distance (px)
const EXIT_OFFSET = 24

// Bug in expo if parentheses are used in a string
const suppressParenthesis = (value: unknown) => String(value ?? "").replace(/[()]/g, "")

// Ghost image transforms (/size/w300/) only apply to images hosted by Ghost
const resizeImage = (uri: string | null | undefined, size: string) =>
   uri ? uri.replace("/images/", `/images/size/${size}/`) : undefined

// Props of the card
interface WorkCardProps extends Pick<
   GhostPost,
   "id" | "title" | "excerpt" | "custom_excerpt" | "feature_image" | "tags"
> {
   // Position in the list (only the first 4 get an entry animation)
   index: number
   // Detail route
   pathname?: "/works/detail"
   // Makes the chips pressable
   onTagPress?: (chip: WorkTagChip) => void
   // Entry animation kind
   entry?: "slide" | "rise" | null
   // Counter used as React key to replay the entry animation
   entryRun?: number
   // 0 -> 1 shared value of the cascade filter exit
   exitProgress?: SharedValue<number>
}

// onTagPress: optional, makes the year / city chips pressable ({ type: "year" | "city", slug })
// entry: entry animation of the first cards, "slide" (list first appears), "rise" (chip flight) or null (see
// works/index.tsx)
// entryRun: changes each time an entry animation starts, so the cards are remounted to replay it
// exitProgress: optional shared value, 0 -> 1 fades the card out downward (cascade filter of the Works list)
// pathname: detail route, in the stack of the list so back returns to that list
// See header
const WorkCard = ({
   id,
   title,
   excerpt: fullExcerpt,
   custom_excerpt,
   feature_image,
   tags,
   index,
   pathname = "/works/detail",
   onTagPress,
   entry = null,
   entryRun = 0,
   exitProgress,
}: WorkCardProps) => {
   // `excerpt` is not returned when the list uses `fields=`: then custom_excerpt is used
   const excerpt = fullExcerpt ?? custom_excerpt
   // Navigation
   const router = useRouter()
   // Image container, measured for the zoom
   const imageRef = useRef<HostInstance>(null)
   // Chips row, measured for the zoom
   // Chips from the tags
   const chipsRef = useRef<HostInstance>(null)

   // Zoom transition: hide the image and the chips while the zoom overlay covers them (seamless handoff)
   // Image container: invisible while this card is the zoom source (zoomSourceKey)
   const zoomHiddenStyle = useAnimatedStyle(() => ({
      opacity: zoomSourceKey.get() === String(id) ? 0 : 1,
   }))
   // Chips: same rule
   const zoomHiddenChipsStyle = useAnimatedStyle(() => ({
      opacity: zoomSourceKey.get() === String(id) ? 0 : 1,
   }))
   // Cascade filter exit: fades out and slides down with exitProgress (nothing without it)
   const exitStyle = useAnimatedStyle(() =>
      exitProgress
         ? { opacity: 1 - exitProgress.get(), transform: [{ translateY: exitProgress.get() * EXIT_OFFSET }] }
         : {},
   )

   // Thumbnail URL (w300)
   const img = resizeImage(feature_image, "w300")
   // Large image URL (w1000) used by the detail header
   const imgHeader = resizeImage(feature_image, "w1000")

   // City / year chips, also passed as text to the detail page
   const chips = getWorkTags(tags)
   // "City • Year" text passed to the detail
   const tagText = chips.map((chip) => chip.label).join(" • ")

   // Press handler, see header
   const showDetail = async () => {
      // Starts loading the detail content now: it is often ready when the zoom transition ends
      prefetchAPI(...workDetailRequest(id))
      // Zoom transition: measure the image position and warm the large image cache
      // (without image, the detail simply fades in)
      // Measured rects (empty without zoom)
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

   // Entry config: SETTLED (no animation) except for the first 4 cards when `entry` is set
   const anim =
      entry && index < 4 ? (entry === "rise" ? animations.listItemRise(index) : animations.listItem(index)) : SETTLED

   // Structure: MotionView (entry animation) > Animated.View (cascade exit) > Pressable > image + title strip (hidden
   // while zoomed), excerpt, chips (hidden while zoomed)
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
