import { ScrollView, View, Text } from "react-native"
import { Image } from "expo-image"
import { useLocalSearchParams, useNavigation } from "expo-router"
import { GestureDetector } from "react-native-gesture-handler"
import Animated from "react-native-reanimated"
import { useCallback, useMemo } from "react"

import useAPI from "@/src/hooks/useAPI"
import HeaderBack, { BackBar } from "@/src/layouts/HeaderBack"
import RenderHtml from "@/src/components/app/RenderHtml"
import Loading from "@/src/components/app/Loading"
import ZoomImage from "@/src/components/app/ZoomImage"
import { TitleStrip } from "@/src/components/app/TitleStrip"
import TagChips, { labelsToItems } from "@/src/components/app/TagChips"
import Chip from "@/src/components/app/Chip"
import useZoomTransition from "@/src/hooks/useZoomTransition"
import useChipFlight from "@/src/hooks/useChipFlight"
import { shareLink } from "@/src/utils/share"
import { workDetailRequest } from "@/src/utils/works"

const placeholder = require("@/assets/images/placeholder.png")

// Header image height, also the zoom transition target: set as a style (h-96 is 336px with NativeWind rem = 14,
// a mismatch made the image and title jump at the end of the transition)
const HEADER_HEIGHT = 336
// Space between the header image and the city / year chips (also the zoom transition target of the chips)
const CHIPS_GAP = 14

// City / year chips passed by the card (JSON): [{ type, slug, label }]
const parseChips = (value) => {
   try {
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
const WorkDetail = ({ picturesPathname = "works/pictures" }) => {
   // Get route params
   const params = useLocalSearchParams()
   const { id, title, excerpt, imgHeader, imgThumb, tagText } = params
   const navigation = useNavigation()

   // Zoom transition from the list (no-op when ENABLE_ZOOM_TRANSITION is false)
   const zoom = useZoomTransition(params, HEADER_HEIGHT, HEADER_HEIGHT + CHIPS_GAP)

   // Chip flight: a pressed chip flies to the subtitle of the Works list filtered on it, then the page closes
   const leave = useCallback(() => navigation.goBack(), [navigation])
   const flight = useChipFlight(leave)
   const startFlight = flight.start

   // City / year chips of the card: pressable with their filter data, plain labels otherwise ("City • Year")
   const chipData = useMemo(() => parseChips(params.chips), [params.chips])
   const chips = useMemo(
      () =>
         chipData.length > 0
            ? chipData.map((chip) => ({
                 key: chip.slug,
                 label: chip.label,
                 accessibilityLabel: `Show the works ${chip.type === "year" ? "of" : "in"} ${chip.label}`,
                 onPress: (view) => startFlight(chip, view),
              }))
            : labelsToItems(tagText),
      [chipData, tagText, startFlight],
   )
   // Same chips without press, for the zoom transition overlay
   const chipLabels = useMemo(() => chips.map(({ key, label }) => ({ key, label })), [chips])

   // Get content
   const { data, isLoading, isError, refetch } = useAPI(...workDetailRequest(id))
   const post = data?.posts?.[0]
   const onShare = post?.url ? () => shareLink(title, post.url, "Share this work") : undefined

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
