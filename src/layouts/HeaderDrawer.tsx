/**
 * HeaderDrawer.tsx
 *
 * Header of the list screens (Works, Artists, Tours, 20 years, About): a component that renders nothing itself and
 * configures its screen through `<Stack.Screen options>` (header shown, custom `header`, slide_from_right animation).
 * The header is a 56 px bar under the safe area, on the theme background: a round menu GlassButton on the left
 * (opens the drawer with `navigation.openDrawer()`, after a short delay so the press animation is visible) and the
 * Farm Prod logo on the right (the dark-theme variant in dark mode). The screens that use it render `<HeaderDrawer />`
 * as their first child. Detail screens use layouts/HeaderBack.tsx instead.
 */

import { Image, View } from "react-native" // Layout and logo
// Stack.Screen sets the header options; navigation reaches the drawer
import { Stack, useNavigation } from "expo-router"
import type { DrawerNavigationProp } from "expo-router/drawer" // Navigation type with openDrawer()
import MaterialIcons from "@react-native-vector-icons/material-icons" // Menu icon
import { useSafeAreaInsets } from "react-native-safe-area-context" // Top inset (notch / status bar)
import useThemeColors from "@/src/hooks/useThemeColors" // Header background, icon and logo variant
import GlassButton from "@/src/components/app/GlassButton" // Round menu button with press feedback

// Lets the press animation show before the drawer/back navigation covers the button
// Delay (ms) before the navigation action
const NAV_ACTION_DELAY = 120

// Generic param list: routes are not typed in this app
type ParamList = Record<string, object | undefined>

// Logo for light theme
const logo = require("@/assets/images/logo_128.png")
// Logo for dark theme
const logoDark = require("@/assets/images/logo_drawer.png")

// Takes no props
export default function HeaderDrawer() {
   // Navigation of the screen, whose parent drawer is opened by the button
   const navigation = useNavigation<DrawerNavigationProp<ParamList>>()
   // Safe area insets (top padding)
   const insets = useSafeAreaInsets()
   // Theme colors
   const theme = useThemeColors()

   // Screen options: custom header (see header comment)
   return (
      <Stack.Screen
         options={{
            headerShown: true,
            header: () => (
               <View style={{ paddingTop: insets.top, backgroundColor: theme.background }}>
                  <View
                     style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: 56,
                        paddingHorizontal: 16,
                     }}
                  >
                     <GlassButton
                        className="flex items-center justify-center w-10 h-10 rounded-full"
                        onPress={() => navigation.openDrawer()}
                        actionDelay={NAV_ACTION_DELAY}
                        accessibilityRole="button"
                        accessibilityLabel="Open menu"
                     >
                        <MaterialIcons
                           name="menu"
                           size={24}
                           color={theme.text}
                        />
                     </GlassButton>
                     <Image
                        source={theme.isDark ? logoDark : logo}
                        style={{ width: 40, height: 40 }}
                        accessible={false}
                     />
                  </View>
               </View>
            ),
            animation: "slide_from_right",
         }}
      />
   )
}
