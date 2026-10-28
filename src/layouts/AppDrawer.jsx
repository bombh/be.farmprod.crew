import { Drawer, DrawerContentScrollView, DrawerItemList } from "expo-router/drawer"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import colors from "tailwindcss/colors"
import { cssInterop, useColorScheme } from "nativewind"
import { View, Text, Image, Pressable } from "react-native"
import { useSegments } from "expo-router"
import * as Linking from "expo-linking"
import { setThemePreference } from "@/src/lib/theme"

cssInterop(FontAwesome6, {
   className: {
      target: "style",
   },
})

const logo = require("@/assets/images/logo_drawer.png")

// Open web or app
const openWebOrApp = async (webUrl, appUrl) => {
   try {
      const supported = await Linking.canOpenURL(appUrl)
      if (supported) {
         await Linking.openURL(appUrl)
      } else {
         await Linking.openURL(webUrl)
      }
   } catch {}
}

// Theme setting: Light / Dark (persisted, see src/lib/theme.js)
// Preselected with the OS theme until the user picks one
const THEMES = [
   { value: "light", label: "Light", icon: "sun" },
   { value: "dark", label: "Dark", icon: "moon" },
]

const ThemeSwitch = () => {
   const { colorScheme } = useColorScheme()

   return (
      <View
         className="mx-5 mb-6 flex-row rounded-full bg-neutral-800 p-1"
         accessibilityRole="radiogroup"
         accessibilityLabel="Appearance"
      >
         {THEMES.map((theme) => {
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
const AppDrawerContent = (props) => {
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
                  className=""
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
                  className=""
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

export default function AppDrawer() {
   // Drawer swipe only on list screens ("(drawer)/works"), so the iOS swipe-back works on detail screens ("(drawer)/works/detail")
   const segments = useSegments()
   const isListScreen = segments.length <= 2

   return (
      <Drawer
         drawerContent={(props) => <AppDrawerContent {...props} />}
         screenOptions={{
            swipeEnabled: isListScreen,
            headerShown: false,
            drawerType: "slide",
            headerTintColor: colors.black,
            headerTitleAlign: "center",
            headerShadowVisible: false,
            drawerStyle: {
               width: 220,
               backgroundColor: colors.neutral[900],
            },
            drawerLabelStyle: {
               marginLeft: -10,
               // fontFamily: "PermanentMarker-Regular",
               // fontSize: 22,
            },
            drawerActiveTintColor: colors.white,
            drawerActiveBackgroundColor: colors.neutral[700],
            drawerInactiveTintColor: colors.neutral[400],
         }}
         initialRouteName="works"
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
