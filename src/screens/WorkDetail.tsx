/**
 * WorkDetail.tsx
 *
 * Work detail screen: header image, title, city / year chips, excerpt and the full Ghost HTML content of a work.
 * Exposed as the route `(drawer)/works/detail` (its file re-exports this component). `picturesPathname` selects the
 * gallery route opened when a content picture is pressed (default "/works/pictures").
 *
 * Route params (set by components/WorkCard.tsx, all strings): id, title, excerpt, imgHeader (large image), imgThumb
 * (the card thumbnail), tagText ("City • Year"), chips (JSON of { type, slug, label }) and the measured card rects
 * used by the zoom transition. Title / excerpt / image come from the params so the screen shows instantly; the HTML
 * content is loaded with `useAPI(...workDetailRequest(id))` (same query as the prefetch done by the card).
 *
 * Features and how they combine:
 * - Zoom transition (hooks/useZoomTransition.tsx): the screen is a transparent modal; a ZoomImage overlay flies from
 *   the card image to the header, the card chips move under the header, the background and content fade in, and the
 *   heavy RenderHtml content mounts once the image is in place (`isContentReady`). An iOS edge swipe (GestureDetector)
 *   goes back, and the BackBar (back + share) is drawn inside the screen. Without the zoom (flag off): a native
 *   HeaderBack is used instead and the content shows directly.
 * - Chip flight (hooks/useChipFlight.tsx): pressing a chip makes it fly to the subtitle of the Works list filtered on
 *   it (overlay at the bottom of the tree), then the screen closes.
 * - Share button (utils/share.ts) appears when the post has a url.
 * - Loading / error of the content: <Loading> under the excerpt.
 * HEADER_HEIGHT is set as a style (336 px) because it is also the zoom transition target.
 */

import { ScrollView, View, Text } from "react-native" // Scrollable content and text
import type { HostInstance } from "react-native" // Native view ref type
import { Image } from "expo-image" // Header image
import { useLocalSearchParams, useNavigation } from "expo-router" // Route params; goBack
import { GestureDetector } from "react-native-gesture-handler" // Wraps the screen for the iOS swipe-back
import Animated from "react-native-reanimated" // Animated wrappers driven by the zoom / flight styles
import { useCallback, useMemo } from "react" // Memoized callbacks and chip lists

import useAPI from "@/src/hooks/useAPI" // Loads the work content
import HeaderBack, { BackBar } from "@/src/layouts/HeaderBack" // Native header (no zoom) / in-screen bar (zoom)
import RenderHtml from "@/src/components/app/RenderHtml" // Renders the Ghost content
import Loading from "@/src/components/app/Loading" // Loading / error placeholder
import ZoomImage from "@/src/components/app/ZoomImage" // Flying image overlay of the zoom
import { TitleStrip } from "@/src/components/app/TitleStrip" // Title over the header image
// Chips row; fallback items from the "City • Year" text
import TagChips, { labelsToItems } from "@/src/components/app/TagChips"
import Chip from "@/src/components/app/Chip" // Chip drawn by the chip flight overlay
import useZoomTransition from "@/src/hooks/useZoomTransition" // Zoom transition state and styles
import useChipFlight from "@/src/hooks/useChipFlight" // Chip flight state and styles
import { shareLink } from "@/src/utils/share" // Native share sheet
import { workDetailRequest } from "@/src/utils/works" // Request tuple of the detail (shared with the card prefetch)
import type { WorkTagChip } from "@/src/utils/works" // Chip shape
import type { GhostPostsResponse } from "@/src/types/ghost" // Shape of the detail response

// Local image shown while the header loads
const placeholder = require("@/assets/images/placeholder.png")

// Header image height, also the zoom transition target: set as a style (h-96 is 336px with NativeWind rem = 14,
// a mismatch made the image and title jump at the end of the transition)
const HEADER_HEIGHT = 336
// Space between the header image and the city / year chips (also the zoom transition target of the chips)
// Gap in px
const CHIPS_GAP = 14

// Route params set by WorkCard (strings): the card, its image / chips rects (zoom transition) and its chips (JSON)
// id and title are always set by WorkCard, the others may be missing (no image, no chips...)
// Fields below are all strings (route params)
type WorkDetailParams = {
   // Ghost post id
   id: string
   // Work title
   title: string
   // Short text under the header
   excerpt?: string
   // Large header image URL
   imgHeader?: string
   // Thumbnail URL already cached by the list (placeholder)
   imgThumb?: string
   // "City • Year" text (fallback chips)
   tagText?: string
   // JSON of the chip list
   chips?: string
}

// City / year chips passed by the card (JSON): [{ type, slug, label }]
// Parses the chips param; [] when missing or invalid
const parseChips = (value?: string): WorkTagChip[] => {
   try {
      // Items of the chips row: pressable (start the flight) when chip data exists, else plain labels
      const chips = JSON.parse(value ?? "[]")
      return Array.isArray(chips) ? chips : []
   } catch {
      return []
   }
}

/**
 * Work detail screen (works/detail route).
 * picturesPathname: gallery route opened when an image is pressed (in the same stack)
 */
// See header
const WorkDetail = ({
   // Gallery route opened by a pressed picture
   picturesPathname = "/works/pictures",
}: {
   picturesPathname?: "/works/pictures" | "/20years/pictures"
}) => {
   // Get route params
   // All route params
   const params = useLocalSearchParams<WorkDetailParams>()
   // Params displayed right away
   const { id, title, excerpt, imgHeader, imgThumb, tagText } = params
   // Used to close the screen
   const navigation = useNavigation()

   // Zoom transition from the list (no-op when ENABLE_ZOOM_TRANSITION is false)
   // Zoom state / styles; HEADER_HEIGHT is the target image height and the chips go to HEADER_HEIGHT + CHIPS_GAP
   const zoom = useZoomTransition(params, HEADER_HEIGHT, HEADER_HEIGHT + CHIPS_GAP)

   // Chip flight: a pressed chip flies to the subtitle of the Works list filtered on it, then the page closes
   // Closes the screen (after the chip flight)
   const leave = useCallback(() => navigation.goBack(), [navigation])
   // Chip flight state / styles
   const flight = useChipFlight(leave)
   // Stable start function
   const startFlight = flight.start

   // City / year chips of the card: pressable with their filter data, plain labels otherwise ("City • Year")
   // Chips parsed from the param, recomputed only when it changes
   const chipData = useMemo(() => parseChips(params.chips), [params.chips])
   const chips = useMemo(
      () =>
         chipData.length > 0
            ? chipData.map((chip) => ({
                 key: chip.slug,
                 label: chip.label,
                 accessibilityLabel: `Show the works ${chip.type === "year" ? "of" : "in"} ${chip.label}`,
                 onPress: (view: HostInstance | null) => startFlight(chip, view),
              }))
            : labelsToItems(tagText),
      [chipData, tagText, startFlight],
   )
   // Same chips without press, for the zoom transition overlay
   // Same chips without press
   const chipLabels = useMemo(() => chips.map(({ key, label }) => ({ key, label })), [chips])

   // Get content
   // Content request (cached, often already prefetched)
   const { data, isLoading, isError, refetch } = useAPI<GhostPostsResponse>(...workDetailRequest(id))
   // The loaded work
   const post = data?.posts?.[0]
   // Share handler, only when the post has a public url
   const onShare = post?.url ? () => shareLink(title, post.url!, "Share this work") : undefined

   // Layers, from the outside: chip-flight root > page fade > swipe gesture / zoom root > (native header | background)
   // + scroll content > overlays (zoom image, chips, in-screen bar); the chip flight overlay is last
   return (
      <View
         ref={flight.rootRef}
         collapsable={false}
         className="flex-1"
      >
         <Animated.View
            className="flex-1"
            style={flight.pageStyle}
         >
            <GestureDetector gesture={zoom.swipeGesture}>
               <Animated.View
                  ref={zoom.rootRef}
                  collapsable={false}
                  onLayout={zoom.onRootLayout}
                  className="flex-1"
                  style={zoom.swipeStyle}
               >
                  {/* Without the zoom transition: native header. With it: header drawn in the screen (see below) */}
                  {!zoom.active && (
                     <HeaderBack
                        onShare={onShare}
                        shareLabel="Share this work"
                     />
                  )}
                  {zoom.active && (
                     <Animated.View
                        pointerEvents="none"
                        className="absolute inset-0 bg-white dark:bg-neutral-950"
                        style={zoom.backgroundStyle}
                     />
                  )}
                  <ScrollView
                     className={zoom.active ? "relative w-full" : "relative w-full bg-white dark:bg-neutral-950"}
                  >
                     <Animated.View
                        ref={zoom.headerRef}
                        collapsable={false}
                        style={zoom.headerStyle}
                     >
                        <Image
                           source={imgHeader ? { uri: imgHeader } : placeholder}
                           className="w-full"
                           style={{ height: HEADER_HEIGHT }}
                           placeholder={zoom.enabled && imgThumb ? { uri: imgThumb } : placeholder}
                           placeholderContentFit="cover"
                           transition={500}
                           accessible={false}
                        />
                        <TitleStrip
                           title={title}
                           size="header"
                           isHeader
                        />
                     </Animated.View>
                     {chips.length > 0 && (
                        <Animated.View style={[{ paddingTop: CHIPS_GAP }, zoom.chipsStyle]}>
                           <TagChips
                              ref={zoom.chipsRef}
                              items={chips}
                           />
                        </Animated.View>
                     )}
                     <Animated.View style={zoom.contentStyle}>
                        <View className="px-3 py-5">
                           <Text className="text-lg text-center text-neutral-500 dark:text-neutral-400 leading-6">
                              {excerpt}
                           </Text>
                        </View>

                        {(isLoading || isError) && (
                           <Loading
                              key="loadingWorks"
                              label="Loading Works"
                              isError={isError}
                              refetch={refetch}
                           />
                        )}

                        {/* Rendered once the zoom image is in place: building it during the animation dropped frames */}
                        {!isLoading && !isError && !!post && zoom.isContentReady && (
                           <RenderHtml
                              html={post.html}
                              authors={post.authors}
                              gallery={true}
                              picturesPathname={picturesPathname}
                           />
                        )}
                     </Animated.View>
                  </ScrollView>
                  {zoom.enabled && (
                     <ZoomImage
                        style={zoom.overlayStyle}
                        uri={imgHeader}
                        thumbUri={imgThumb}
                        title={title}
                        progress={zoom.progress}
                     />
                  )}
                  {/* Zoom transition: the card chips move to their place under the header */}
                  {zoom.chipsEnabled && (
                     <Animated.View
                        pointerEvents="none"
                        style={zoom.chipsOverlayStyle}
                     >
                        <TagChips items={chipLabels} />
                     </Animated.View>
                  )}
                  {/* Zoom transition: the header fades with the content and follows the swipe-back */}
                  {zoom.active && (
                     <Animated.View
                        pointerEvents="box-none"
                        className="absolute inset-0"
                        style={zoom.chromeStyle}
                     >
                        <BackBar
                           onBack={zoom.goBack}
                           onShare={onShare}
                           shareLabel="Share this work"
                        />
                     </Animated.View>
                  )}
               </Animated.View>
            </GestureDetector>
         </Animated.View>
         {/* Chip flight: the pressed chip turns into the Works subtitle */}
         {!!flight.flyingChip && (
            <Animated.View
               pointerEvents="none"
               style={flight.overlayStyle}
            >
               <Animated.View
                  className="absolute inset-0 items-center justify-center"
                  style={flight.chipStyle}
               >
                  <Chip label={flight.flyingChip.label} />
               </Animated.View>
               <Animated.View
                  className="absolute inset-0 items-center justify-center"
                  style={flight.textStyle}
               >
                  <Text
                     className="text-[24px] font-marker text-black dark:text-white text-center"
                     maxFontSizeMultiplier={1.4}
                  >
                     {flight.flyingChip.label}
                  </Text>
               </Animated.View>
            </Animated.View>
         )}
      </View>
   )
}

export default WorkDetail
