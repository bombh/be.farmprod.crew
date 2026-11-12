/**
 * TitleStrip.tsx
 *
 * Work title in Permanent Marker (font-marker) on a translucent black strip, laid over the bottom of an image.
 * - TitleStrip: static, "card" size (Works cards) or "header" size (work detail header)
 * - AnimatedTitleStrip: used by the zoom overlay (components/app/ZoomImage.tsx), goes from the card size (progress 0)
 *   to the header size (progress 1)
 * The sizes are defined once here so the strip matches at both ends of the zoom transition.
 *
 * AnimatedTitleStrip is laid out at the header size and shrunk to the card size with transforms only (scaleY of the
 * background anchored at the bottom, translateY + scale of the text), because animating the Text fontSize or the strip
 * padding aborted the app.
 */

import { StyleSheet, Text, View } from "react-native" // Static strip and text
// Reanimated: animated text / view, progress mapping, animated style
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import type { SharedValue } from "react-native-reanimated" // Type of the zoom progress

// In px (NativeWind rem = 14): card = p-2 / text-base, header = px-4 py-3 / text-2xl
// Strip padding and text size per size variant
const SIZES = {
   card: { strip: { paddingVertical: 7, paddingHorizontal: 7 }, text: { fontSize: 14, lineHeight: 21 } },
   header: { strip: { paddingVertical: 10.5, paddingHorizontal: 14 }, text: { fontSize: 21, lineHeight: 28 } },
}

// "card" | "header"
type TitleStripSize = keyof typeof SIZES

// Total strip height of a size: 2 x vertical padding + line height
const stripHeight = (size: TitleStripSize) => SIZES[size].strip.paddingVertical * 2 + SIZES[size].text.lineHeight
// Strip height at card size
const CARD_HEIGHT = stripHeight("card")
// Strip height at header size
const HEADER_HEIGHT = stripHeight("header")
// Text scale of the card size relative to the header size (14 / 21)
const CARD_SCALE = SIZES.card.text.fontSize / SIZES.header.text.fontSize

// Strip container: pinned to the bottom, full width, 70% black
const STRIP_CLASS = "absolute bottom-0 w-full bg-black/70"

// Text style of the animated strip (white, marker font, centered)
const styles = StyleSheet.create({
   text: { color: "#ffffff", fontFamily: "PermanentMarker-Regular", textAlign: "center" },
})

// title: text; size: "card" (default) or "header"; isHeader: exposes the text as an accessibility header
export const TitleStrip = ({
   title,
   size = "card",
   isHeader = false,
}: {
   title?: string
   size?: TitleStripSize
   isHeader?: boolean
}) => (
   <View
      className={STRIP_CLASS}
      style={SIZES[size].strip}
   >
      <Text
         numberOfLines={1}
         maxFontSizeMultiplier={1.4}
         accessibilityRole={isHeader ? "header" : undefined}
         className="text-white font-marker text-center"
         style={SIZES[size].text}
      >
         {title}
      </Text>
   </View>
)

// Laid out at the header size, shrunk to the card size with transforms only
// (animating the Text fontSize / the strip padding aborted the app)
// title: text; progress: shared value 0 (card size) -> 1 (header size)
export const AnimatedTitleStrip = ({ title, progress }: { title?: string; progress: SharedValue<number> }) => {
   // Background shrinks vertically (scaleY) toward the bottom edge at card size
   const backgroundStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: interpolate(progress.get(), [0, 1], [CARD_HEIGHT / HEADER_HEIGHT, 1]) }],
   }))

   // Text scaled down and moved so it stays centered in the shrunk strip
   const textStyle = useAnimatedStyle(() => ({
      transform: [
         // Keeps the text centered in the shrinking strip, which is anchored to the bottom
         { translateY: interpolate(progress.get(), [0, 1], [(HEADER_HEIGHT - CARD_HEIGHT) / 2, 0]) },
         { scale: interpolate(progress.get(), [0, 1], [CARD_SCALE, 1]) },
      ],
   }))

   // Header-size box (no touches); background and text are animated children
   return (
      <View
         pointerEvents="none"
         className="absolute bottom-0 w-full justify-center"
         style={{ height: HEADER_HEIGHT, paddingHorizontal: SIZES.header.strip.paddingHorizontal }}
      >
         <Animated.View
            className="absolute inset-0 bg-black/70"
            style={[{ transformOrigin: "50% 100%" }, backgroundStyle]}
         />
         <Animated.Text
            numberOfLines={1}
            maxFontSizeMultiplier={1.4}
            style={[styles.text, SIZES.header.text, textStyle]}
         >
            {title}
         </Animated.Text>
      </View>
   )
}
