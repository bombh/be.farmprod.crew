/**
 * TitleStrip.jsx
 * Work title in Permanent Marker on a translucent black strip, laid over the bottom of an image.
 * - TitleStrip: static, "card" size (Works cards) or "header" size (work detail header)
 * - AnimatedTitleStrip: used by the zoom overlay, goes from the card size (progress 0) to the header size (progress 1)
 * The sizes are defined once here so the strip matches at both ends of the zoom transition.
 */
import { StyleSheet, Text, View } from "react-native"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"

// In px (NativeWind rem = 14): card = p-2 / text-base, header = px-4 py-3 / text-2xl
const SIZES = {
   card: { strip: { paddingVertical: 7, paddingHorizontal: 7 }, text: { fontSize: 14, lineHeight: 21 } },
   header: { strip: { paddingVertical: 10.5, paddingHorizontal: 14 }, text: { fontSize: 21, lineHeight: 28 } },
}

const stripHeight = (size) => SIZES[size].strip.paddingVertical * 2 + SIZES[size].text.lineHeight
const CARD_HEIGHT = stripHeight("card")
const HEADER_HEIGHT = stripHeight("header")
const CARD_SCALE = SIZES.card.text.fontSize / SIZES.header.text.fontSize

const STRIP_CLASS = "absolute bottom-0 w-full bg-black/70"

const styles = StyleSheet.create({
   text: { color: "#ffffff", fontFamily: "PermanentMarker-Regular", textAlign: "center" },
})

export const TitleStrip = ({ title, size = "card", isHeader = false }) => (
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
export const AnimatedTitleStrip = ({ title, progress }) => {
   const backgroundStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: interpolate(progress.value, [0, 1], [CARD_HEIGHT / HEADER_HEIGHT, 1]) }],
   }))

   const textStyle = useAnimatedStyle(() => ({
      transform: [
         // Keeps the text centered in the shrinking strip, which is anchored to the bottom
         { translateY: interpolate(progress.value, [0, 1], [(HEADER_HEIGHT - CARD_HEIGHT) / 2, 0]) },
         { scale: interpolate(progress.value, [0, 1], [CARD_SCALE, 1]) },
      ],
   }))

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
