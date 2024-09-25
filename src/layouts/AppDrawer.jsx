import { Drawer } from "expo-router/drawer"
import { FontAwesome6 } from "@expo/vector-icons"
import colors from "tailwindcss/colors"
import { styled } from "nativewind"
import { View, Text, Image, Pressable } from "react-native"
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer"
import * as Linking from "expo-linking"

const logo = require("@/assets/images/logo_drawer.png")

// Drawer content
const AppDrawerContent = (props) => {
   const Icons = styled(FontAwesome6)

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
         <View className="mb-4 flex-row space-x-12 justify-center">
            {/* TODO: open links in App */}
            <Pressable
               onPress={() => {
                  Linking.openURL("https://www.facebook.com/FarmProd/")
               }}
            >
               <Icons
                  name="facebook"
                  size={24}
                  color={colors.neutral[400]}
                  className=""
               />
            </Pressable>

            <Pressable
               onPress={() => {
                  Linking.openURL("https://www.instagram.com/farmprod/")
               }}
            >
               <Icons
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
   const Icons = styled(FontAwesome6)

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
               marginLeft: -30,
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
                  <Icons
                     name="spray-can"
                     size={24}
                     color={color}
                     className="absolute right-3"
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
                  <Icons
                     name="people-group"
                     size={24}
                     color={color}
                     className="absolute right-3"
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
                  <Icons
                     name="person-walking-arrow-right"
                     size={24}
                     color={color}
                     className="absolute right-3"
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
                  <Icons
                     // book-open-reader
                     name="cake-candles"
                     size={24}
                     color={color}
                     className="absolute right-4"
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
                  <Icons
                     name="circle-info"
                     size={24}
                     color={color}
                     className="absolute right-4"
                  />
               ),
            }}
         />
      </Drawer>
   )
}
