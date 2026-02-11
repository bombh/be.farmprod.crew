import { Drawer } from "expo-router/drawer"
import { FontAwesome6 } from "@expo/vector-icons"
import colors from "tailwindcss/colors"
import { cssInterop } from "nativewind"
import { View, Text, Image, Pressable } from "react-native"
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer"
import * as Linking from "expo-linking"

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
   } catch (error) {}
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
            >
               <FontAwesome6
                  name="facebook"
                  size={24}
                  color={colors.neutral[400]}
                  className=""
               />
            </Pressable>

            <Pressable
               onPress={() => {
                  openWebOrApp("https://www.instagram.com/farmprod/,", "instagram://user?username=farmprod")
               }}
            >
               <FontAwesome6
                  name="instagram"
                  size={24}
                  color={colors.neutral[400]}
                  className=""
               />
            </Pressable>
         </View>

         <View className="mb-12">
            <Text className="text-neutral-500 text-center text-xs">Follow us on social networks</Text>
         </View>
      </>
   )
}

export default function AppDrawer() {
   return (
      <Drawer
         drawerContent={(props) => <AppDrawerContent {...props} />}
         screenOptions={{
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
