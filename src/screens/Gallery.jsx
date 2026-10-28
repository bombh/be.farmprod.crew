import { useLocalSearchParams, useNavigation } from "expo-router"
import { useRef } from "react"
import { StyleSheet, View } from "react-native"
import AwesomeGallery from "react-native-awesome-gallery"
import { Image } from "expo-image"

// Render Image
const renderItem = ({ item, setImageDimensions }) => {
   return (
      <Image
         source={item}
         style={StyleSheet.absoluteFillObject}
         contentFit="contain"
         accessibilityLabel="Image"
         onLoad={(e) => {
            const { width, height } = e.source
            setImageDimensions({ width, height })
         }}
      />
   )
}

const Gallery = () => {
   const { index, images } = useLocalSearchParams()

   const gallery = useRef(null)
   const { goBack } = useNavigation()

   // Images are passed as a comma-separated string (or an array) through navigation params
   const data = Array.isArray(images) ? images : (images ?? "").split(",").filter(Boolean)

   return (
      <View className="bg-black flex-1">
         <AwesomeGallery
            ref={gallery}
            data={data}
            keyExtractor={(item) => item}
            renderItem={renderItem}
            initialIndex={Number(index) || 0}
            numToRender={3}
            doubleTapInterval={150}
            onSwipeToClose={goBack}
            onScaleEnd={(scale) => {
               if (scale < 0.7) {
                  goBack()
               }
            }}
            disableTransitionOnScaledImage
            hideAdjacentImagesOnScaledImage
            loop
         />
      </View>
   )
}

export default Gallery
