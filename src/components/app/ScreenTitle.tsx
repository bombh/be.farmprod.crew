/**
 * ScreenTitle.tsx
 *
 * Big centered screen title (light weight, text-6xl) displayed at the top of the list screens (Artists, Tours...),
 * under the navigation header. Marked as an accessibility "header" and with font scaling capped at 1.4x so layouts
 * keep working with large system fonts. Colors follow the theme through NativeWind `dark:` classes.
 *
 * Prop: title = the text to display.
 */

import { View, Text } from "react-native" // Container and text
import React from "react" // Imported for JSX (the automatic JSX runtime does not require it)

// title: text shown
const ScreenTitle = ({ title }: { title: string }) => {
   return (
      <View className="mt-0 mb-2">
         <Text
            className="text-black dark:text-white text-center font-light text-6xl p-2 pt-0"
            accessibilityRole="header"
            maxFontSizeMultiplier={1.4}
         >
            {title}
         </Text>
      </View>
   )
}

export default ScreenTitle
