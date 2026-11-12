/**
 * ZoomImage.tsx
 *
 * Absolutely positioned image animated by useZoomTransition (Works list -> Work detail): the "flying" overlay that
 * grows from the card image to the header image (and back). Rendered by screens/WorkDetail.tsx with the overlay style
 * returned by the hook. The cached thumbnail (the w300 image already shown in the list) is used as placeholder to
 * avoid a flash while the large image loads. The title strip grows from the card size to the header size with the
 * transition progress (components/app/TitleStrip.tsx). It ignores touches (pointerEvents none).
 *
 * Props: style (animated position / size from the hook), uri (large image), thumbUri (placeholder), title (strip text,
 * strip hidden without it), progress (shared value 0 card -> 1 header, strip hidden without it).
 */

import { Image } from "expo-image" // Optimized image with placeholder and fade
import Animated from "react-native-reanimated" // Animated container (receives the animated style)
import type { SharedValue } from "react-native-reanimated" // Type of the progress prop
import type { ComponentProps } from "react" // Type of the style prop
import useThemeColors from "@/src/hooks/useThemeColors" // Background color behind the image while loading
import { AnimatedTitleStrip } from "@/src/components/app/TitleStrip" // Title strip growing with the transition

// Props of the overlay
interface ZoomImageProps {
   // Animated style (absolute position and size) from useZoomTransition
   style?: ComponentProps<typeof Animated.View>["style"]
   // Large image of the work
   uri?: string
   // Small image already in cache, shown as placeholder
   thumbUri?: string
   // Work title shown on the strip
   title?: string
   // Zoom progress 0 (card) -> 1 (header)
   progress?: SharedValue<number>
}

// See header
const ZoomImage = ({ style, uri, thumbUri, title, progress }: ZoomImageProps) => {
   // Theme colors (imageBackground)
   const theme = useThemeColors()

   // Clipped container; transition=200 is the fade-in of the large image over the placeholder
   return (
      <Animated.View
         pointerEvents="none"
         style={[{ overflow: "hidden", backgroundColor: theme.imageBackground }, style]}
      >
         <Image
            source={{ uri }}
            placeholder={thumbUri ? { uri: thumbUri } : undefined}
            placeholderContentFit="cover"
            contentFit="cover"
            transition={200}
            className="w-full h-full"
            accessible={false}
         />
         {!!title && !!progress && (
            <AnimatedTitleStrip
               title={title}
               progress={progress}
            />
         )}
      </Animated.View>
   )
}

export default ZoomImage
