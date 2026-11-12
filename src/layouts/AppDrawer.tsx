/**
 * AppDrawer.tsx
 *
 * The side drawer menu of the app (expo-router/drawer, `drawerType: "slide"`), used as the layout of the `(drawer)`
 * route group (src/app/(drawer)/_layout.tsx re-exports it). It wraps the five sections: Works, Artists, Tours,
 * 20 years, About, each with a FontAwesome6 icon on the right of its label.
 *
 * Contents:
 * - AppDrawerContent: the custom drawer body: the Farm Prod logo, the list of menu items (DrawerItemList), two
 *   round social buttons (Facebook, Instagram: open the native app when installed, else the website, see
 *   `openWebOrApp`) and the ThemeSwitch.
 * - ThemeSwitch: a Light / Dark segmented control (radio group). The selected value is the current NativeWind color
 *   scheme (so it is preselected with the OS theme until the user picks one); pressing calls setThemePreference
 *   (lib/theme.ts), which applies and persists the choice.
 * - AppDrawer (default export): configures the Drawer. The drawer swipe gesture is only enabled on list screens
 *   (route segments length <= 2, e.g. ["(drawer)", "works"]) so the iOS swipe-back works on detail screens.
 *   The drawer is always dark (neutral-900), 220 px wide; headers are hidden because each screen draws its own
 *   (layouts/HeaderDrawer.tsx or HeaderBack.tsx).
 *
 * Gotchas: FontAwesome6 needs `cssInterop` (done at the top of this file) to accept `className`; with the New
 * Architecture icons need `iconStyle="solid"` / "brand" (the default is regular). Pressing an item of the menu also
 * triggers hooks/useMenuReset.ts on the target screen (scroll to top + reset).
 */

// Drawer navigator and the pieces of its custom content
import { Drawer, DrawerContentScrollView, DrawerItemList } from "expo-router/drawer"
import type { DrawerContentComponentProps } from "expo-router/drawer" // Props received by the custom drawer content
import FontAwesome6 from "@react-native-vector-icons/fontawesome6" // Menu, theme and social icons
import colors from "tailwindcss/colors" // Tailwind color constants for style values
// cssInterop: lets FontAwesome6 take className; useColorScheme: current theme
import { cssInterop, useColorScheme } from "nativewind"
import { View, Text, Image, Pressable } from "react-native" // Drawer layout elements
import { useSegments } from "expo-router" // Current route segments, to know if a list or a detail screen is shown
import * as Linking from "expo-linking" // canOpenURL / openURL for the social links
import { setThemePreference } from "@/src/lib/theme" // Applies and persists the chosen theme

// Maps `className` to the icon `style`
cssInterop(FontAwesome6, {
   className: {
      target: "style",
   },
})

// Logo at the top of the drawer
const logo = require("@/assets/images/logo_drawer.png")

// webUrl: website fallback; appUrl: deep link of the native app
// Open web or app
const openWebOrApp = async (webUrl: string, appUrl: string) => {
   try {
      const supported = await Linking.canOpenURL(appUrl)
      if (supported) {
         await Linking.openURL(appUrl)
      } else {
         await Linking.openURL(webUrl)
      }
   } catch {}
}

// Theme setting: Light / Dark (persisted, see src/lib/theme.ts)
// Preselected with the OS theme until the user picks one
// Options of the theme switch
const THEMES = [
   { value: "light", label: "Light", icon: "sun" },
   { value: "dark", label: "Dark", icon: "moon" },
] as const

// Light / Dark segmented control
const ThemeSwitch = () => {
   // Active color scheme: the selected segment follows it
   const { colorScheme } = useColorScheme()

   return (
      <View
         className="mx-5 mb-6 flex-row rounded-full bg-neutral-800 p-1"
         accessibilityRole="radiogroup"
         accessibilityLabel="Appearance"
      >
         {THEMES.map((theme) => {
            // True for the segment matching the active scheme
            const selected = colorScheme === theme.value
            return (
               <Pressable
                  key={theme.value}
                  className={`flex-1 items-center rounded-full py-1.5 active:opacity-70 ${selected ? "bg-neutral-600" : ""}`}
                  onPress={() => setThemePreference(theme.value)}
                  accessibilityRole="radio"
                  accessibilityLabel={`${theme.label} appearance`}
                  accessibilityState={{ checked: selected }}
               >
                  <FontAwesome6
                     name={theme.icon}
                     size={14}
                     color={selected ? colors.white : colors.neutral[400]}
                  />
                  <Text
                     className={`mt-0.5 text-[10px] ${selected ? "text-white" : "text-neutral-400"}`}
                     maxFontSizeMultiplier={1.4}
                  >
                     {theme.label}
                  </Text>
               </Pressable>
            )
         })}
      </View>
   )
}

// Drawer content
// props: given by the Drawer (state, navigation) and forwarded to DrawerItemList
const AppDrawerContent = (props: DrawerContentComponentProps) => {
   return (
      <>
         <DrawerContentScrollView {...props}>
            <View className="flex-row items-center justify-center pt-5 pb-6 pr-1">
               <Image
                  source={logo}
                  className="w-32 h-32"
                  accessible={false}
               />
            </View>

            <DrawerItemList {...props} />
         </DrawerContentScrollView>

         {/* Social links */}
         <View className="mb-4 flex-row gap-12 justify-center">
            <Pressable
               onPress={() => {
                  openWebOrApp("https://www.facebook.com/FarmProd/", "fb://profile/166003850137702")
               }}
               accessibilityRole="link"
               accessibilityLabel="Farm Prod on Facebook"
               hitSlop={8}
            >
               <FontAwesome6
                  name="facebook"
                  iconStyle="brand"
                  size={24}
                  color={colors.neutral[400]}
               />
            </Pressable>

            <Pressable
               onPress={() => {
                  openWebOrApp("https://www.instagram.com/farmprod/", "instagram://user?username=farmprod")
               }}
               accessibilityRole="link"
               accessibilityLabel="Farm Prod on Instagram"
               hitSlop={8}
            >
               <FontAwesome6
                  name="instagram"
                  iconStyle="brand"
                  size={24}
                  color={colors.neutral[400]}
               />
            </Pressable>
         </View>

         <View className="mb-10">
            <Text className="text-neutral-400 text-center text-xs">Follow us on social networks</Text>
         </View>

         <ThemeSwitch />
      </>
   )
}

// See header
export default function AppDrawer() {
   // Drawer swipe only on list screens ("(drawer)/works"), so the iOS swipe-back works on detail screens
   // ("(drawer)/works/detail")
   // Route segments of the current URL
   const segments: string[] = useSegments()
   // True on a section list screen, false on its detail screens
   const isListScreen = segments.length <= 2

   // One <Drawer.Screen> per section folder of src/app/(drawer): `name` is the folder name
   return (
      <Drawer
         // Custom content instead of the default item list
         drawerContent={(props) => <AppDrawerContent {...props} />}
         screenOptions={{
            // Swipe to open only on list screens
            swipeEnabled: isListScreen,
            headerShown: false,
            // The screen slides with the drawer
            drawerType: "slide",
            headerTintColor: colors.black,
            headerTitleAlign: "center",
            headerShadowVisible: false,
            drawerStyle: {
               width: 220,
               backgroundColor: colors.neutral[900],
            },
            // Label shifted left to leave room for the icon displayed on the right
            drawerLabelStyle: {
               marginLeft: -10,
               // fontFamily: "PermanentMarker-Regular",
               // fontSize: 22,
            },
            drawerActiveTintColor: colors.white,
            drawerActiveBackgroundColor: colors.neutral[700],
            drawerInactiveTintColor: colors.neutral[400],
         }}
      >
         <Drawer.Screen
            name="works"
            options={{
               drawerLabel: "Works",
               title: "",
               drawerIcon: ({ color }) => (
                  <FontAwesome6
                     name="spray-can"
                     iconStyle="solid"
                     size={24}
                     color={color}
                     className="absolute right-6"
                  />
               ),
            }}
         />

         <Drawer.Screen
            name="artists"
            options={{
               drawerLabel: "Artists",
               title: "",
               drawerIcon: ({ color }) => (
                  <FontAwesome6
                     name="people-group"
                     iconStyle="solid"
                     size={24}
                     color={color}
                     className="absolute right-6"
                  />
               ),
            }}
         />

         <Drawer.Screen
            name="tours"
            options={{
               drawerLabel: "Tours",
               title: "",
               drawerIcon: ({ color }) => (
                  <FontAwesome6
                     name="person-walking-arrow-right"
                     iconStyle="solid"
                     size={24}
                     color={color}
                     className="absolute right-6"
                  />
               ),
            }}
         />

         <Drawer.Screen
            name="20years"
            options={{
               drawerLabel: "20 years",
               title: "",
               drawerIcon: ({ color }) => (
                  <FontAwesome6
                     // book-open-reader
                     name="cake-candles"
                     iconStyle="solid"
                     size={24}
                     color={color}
                     className="absolute right-8"
                  />
               ),
            }}
         />
         <Drawer.Screen
            name="about"
            options={{
               drawerLabel: "About",
               title: "",
               drawerIcon: ({ color }) => (
                  <FontAwesome6
                     name="circle-info"
                     iconStyle="solid"
                     size={24}
                     color={color}
                     className="absolute right-8"
                  />
               ),
            }}
         />
      </Drawer>
   )
}
