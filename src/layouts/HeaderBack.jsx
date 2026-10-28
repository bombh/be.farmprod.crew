import { Image, View } from "react-native"
import { useNavigation, Stack } from "expo-router"
import colors from "tailwindcss/colors"
import { MaterialIcons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import useThemeColors from "@/src/hooks/useThemeColors"
import GlassButton from "@/src/components/app/GlassButton"

// Lets the press animation show before the drawer/back navigation covers the button
const NAV_ACTION_DELAY = 120

const logo = require("@/assets/images/logo_128.png")

// Back button + logo badge (with safe-area padding), usable as a navigation header or inside a screen
// onBack: optional custom back action (e.g. reverse zoom transition), defaults to navigation.goBack()
// hideLogo: no badge on the right (when there is no onShare button)
// onShare: when set, a Share button (same style as the back button) replaces the logo badge
export function BackBar({ onBack, onShare, shareLabel = "Share", hideLogo, style }) {
   const navigation = useNavigation()
   const insets = useSafeAreaInsets()
   const { isDark } = useThemeColors()

   return (
      <View
         pointerEvents="box-none"
         className="absolute top-0 left-0 right-0 z-10"
         style={[{ paddingTop: insets.top }, style]}
      >
         <View
            pointerEvents="box-none"
            className="flex-row justify-between items-center h-14 px-4"
         >
            <GlassButton
               className="flex items-center justify-center bg-white/60 dark:bg-black/50 w-10 h-10 rounded-full"
               onPress={() => (onBack ? onBack() : navigation.goBack())}
               actionDelay={NAV_ACTION_DELAY}
               accessibilityRole="button"
               accessibilityLabel="Go back"
            >
               <MaterialIcons
                  name="arrow-back-ios-new"
                  size={22}
                  color={isDark ? colors.white : colors.black}
               />
            </GlassButton>
            {onShare ? (
               <GlassButton
                  className="flex items-center justify-center bg-white/60 dark:bg-black/50 w-10 h-10 rounded-full"
                  onPress={onShare}
                  accessibilityRole="button"
                  accessibilityLabel={shareLabel}
               >
                  <MaterialIcons
                     name="share"
                     size={22}
                     color={isDark ? colors.white : colors.black}
                  />
               </GlassButton>
            ) : (
               !hideLogo && (
                  <View className="flex items-center justify-center bg-white w-10 h-10 rounded-full opacity-60">
                     <Image
                        source={logo}
                        className="w-7 h-7 mt-1"
                        accessible={false}
                     />
                  </View>
               )
            )}
         </View>
      </View>
   )
}

// Native stack header (transparent) using BackBar
export default function HeaderBack({ onBack, onShare, shareLabel, hideLogo }) {
   return (
      <Stack.Screen
         options={{
            headerShown: true,
            headerTransparent: true,
            animation: "slide_from_right",
            header: () => (
               <BackBar
                  onBack={onBack}
                  onShare={onShare}
                  shareLabel={shareLabel}
                  hideLogo={hideLogo}
               />
            ),
         }}
      />
   )
}
