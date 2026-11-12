/**
 * Gallery.tsx
 *
 * Full screen, zoomable picture gallery (react-native-gesture-image-viewer): swipe between pictures (looping),
 * pinch or double-tap to zoom, swipe down to close. Reusable screen component, exposed as the routes
 * `(drawer)/works/pictures` and `(drawer)/20years/pictures` (their files just re-export it); both are declared as
 * `fullScreenModal` in their _layout.tsx.
 *
 * Route params (read with useLocalSearchParams, they travel as strings): `index` = picture to open first,
 * `images` = URIs of all pictures (an array, or a comma-separated string depending on how expo-router returned it).
 * They are set by components/app/RenderHtml.tsx (work detail, w1600 images) and app/(drawer)/20years/index.tsx.
 * Each image is an expo-image with `contentFit="contain"`; once loaded, its natural size is given to the viewer
 * (`setItemDimensions`) which uses it for the zoom bounds. `onDismiss` goes back (closes the modal).
 * Black background, 30 px between pictures while swiping.
 */

import { useLocalSearchParams, useNavigation } from "expo-router" // Route params (index, images) and goBack to close
import { useCallback } from "react" // Stable renderItem
import { View } from "react-native" // Black background container
import { GestureViewer } from "react-native-gesture-image-viewer" // Swipe / zoom / dismiss gallery component
// Info given to renderItem (setItemDimensions)
import type { GestureViewerRenderItemInfo } from "react-native-gesture-image-viewer"
import { Image } from "expo-image" // Picture display

// Space between two images while swiping
// Space between two images while swiping
const PAGE_SPACING = 30

// No props: everything comes from route params
const Gallery = () => {
   // Route params: first picture index and the list of URIs
   const { index, images } = useLocalSearchParams<{ index?: string; images?: string | string[] }>()
   // Closes the modal
   const { goBack } = useNavigation()

   // Images are passed as a comma-separated string (or an array) through navigation params
   // List of URIs
   const data = Array.isArray(images) ? images : (images ?? "").split(",").filter(Boolean)

   // Render Image: its natural size sets the zoom bounds
   // Renders one picture; reports its natural size to the viewer once loaded
   const renderItem = useCallback(
      (item: string, _index: number, { setItemDimensions }: GestureViewerRenderItemInfo) => (
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

   // Viewer starting at `index` (0 when invalid), looping, closing with a swipe down
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
