/**
 * HeaderBack.tsx
 *
 * Back header for detail screens (work detail, tour detail, pictures...). Two exports:
 * - BackBar: a transparent bar pinned at the top (below the safe area): a round "Go back" GlassButton on the left and,
 *   on the right, either a round "Share" button (when `onShare` is given, e.g. the work detail) or the logo badge
 *   (unless `hideLogo`). It can be used as a navigation header or directly inside a screen (e.g. the zoom detail,
 *   where the header is part of the transparent-modal screen and fades with it).
 * - HeaderBack (default): a component that renders nothing visible and configures its screen through `<Stack.Screen
 *   options>`: header shown, transparent, slide_from_right animation, and BackBar as the custom header.
 * Back action: `onBack` when provided (e.g. the reverse zoom transition), otherwise `navigation.goBack()`. The
 * GlassButton delays the action by NAV_ACTION_DELAY so its press animation is visible before the screen changes.
 * Colors: icons follow the theme (useThemeColors); the buttons are translucent white / black.
 */

import { Image, View } from "react-native" // Layout and logo badge image
import type { StyleProp, ViewStyle } from "react-native" // Type of the style prop
import { useNavigation, Stack } from "expo-router" // goBack; Stack.Screen sets the header options
import colors from "tailwindcss/colors" // Tailwind colors for icon values
import MaterialIcons from "@react-native-vector-icons/material-icons" // Back and share icons
import { useSafeAreaInsets } from "react-native-safe-area-context" // Top inset (notch / status bar)
import useThemeColors from "@/src/hooks/useThemeColors" // Dark / light detection for icon colors
import GlassButton from "@/src/components/app/GlassButton" // Round buttons with press feedback

// Lets the press animation show before the drawer/back navigation covers the button
// Delay (ms) before the navigation action
const NAV_ACTION_DELAY = 120

// Logo of the badge
const logo = require("@/assets/images/logo_128.png")

// Back button + logo badge (with safe-area padding), usable as a navigation header or inside a screen
// onBack: optional custom back action (e.g. reverse zoom transition), defaults to navigation.goBack()
// hideLogo: no badge on the right (when there is no onShare button)
// onShare: when set, a Share button (same style as the back button) replaces the logo badge
// Props of the bar
interface BackBarProps {
   // Custom back action
   onBack?: () => void
   // Shows the share button instead of the logo
   onShare?: () => void
   // Accessibility label of the share button
   shareLabel?: string
   // Hides the logo badge when there is no share button
   hideLogo?: boolean
   // Extra style of the bar container
   style?: StyleProp<ViewStyle>
}

// See header
export function BackBar({ onBack, onShare, shareLabel = "Share", hideLogo, style }: BackBarProps) {
   // Used for the default back action
   const navigation = useNavigation()
   // Safe area insets (top padding)
   const insets = useSafeAreaInsets()
   // Icon color by theme
   const { isDark } = useThemeColors()

   // pointerEvents box-none: only the buttons receive touches, the rest passes through to the screen
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
// Props of BackBar, without style
export default function HeaderBack({ onBack, onShare, shareLabel, hideLogo }: Omit<BackBarProps, "style">) {
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
