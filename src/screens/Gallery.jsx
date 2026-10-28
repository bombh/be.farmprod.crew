import { useLocalSearchParams, useNavigation } from "expo-router"
import { useCallback } from "react"
import { View } from "react-native"
import { GestureViewer } from "react-native-gesture-image-viewer"
import { Image } from "expo-image"

// Space between two images while swiping
const PAGE_SPACING = 30

const Gallery = () => {
   const { index, images } = useLocalSearchParams()
   const { goBack } = useNavigation()

   // Images are passed as a comma-separated string (or an array) through navigation params
   const data = Array.isArray(images) ? images : (images ?? "").split(",").filter(Boolean)

   // Render Image: its natural size sets the zoom bounds
   const renderItem = useCallback(
      (item, _index, { setItemDimensions }) => (
         <Image
            source={item}
            className="w-full h-full"
            contentFit="contain"
            accessibilityLabel="Image"
            onLoad={(e) => {
               const { width, height } = e.source
               setItemDimensions({ width, height })
            }}
         />
      ),
      [],
   )

   return (
      <View className="bg-black flex-1">
         <GestureViewer
            data={data}
            initialIndex={Number(index) || 0}
            renderItem={renderItem}
            onDismiss={goBack}
            pageSpacing={PAGE_SPACING}
            enableLoop
         />
      </View>
   )
}

export default Gallery
