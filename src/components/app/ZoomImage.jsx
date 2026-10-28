/**
 * ZoomImage.jsx
 * Absolutely positioned image animated by useZoomTransition (Works list -> Work detail).
 * The cached thumbnail is used as placeholder to avoid a flash while the large image loads.
 * The title strip grows from the card size to the header size with the transition progress.
 */
import { Image } from "expo-image"
import Animated from "react-native-reanimated"
import useThemeColors from "@/src/hooks/useThemeColors"
import { AnimatedTitleStrip } from "@/src/components/app/TitleStrip"

const ZoomImage = ({ style, uri, thumbUri, title, progress }) => {
   const theme = useThemeColors()

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
