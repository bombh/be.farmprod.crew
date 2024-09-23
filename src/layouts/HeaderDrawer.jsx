import { Image, Pressable, View } from "react-native"
import { Stack, useNavigation } from "expo-router"
import colors from "tailwindcss/colors"
import { MaterialIcons } from "@expo/vector-icons"

const logo = require("@/assets/images/logo_128.png")

export default function HeaderDrawer() {
   const navigation = useNavigation()

   return (
      <Stack.Screen
         options={{
            headerShown: true,
            headerTitle: "",
            headerShadowVisible: false,
            animation: "slide_from_right",
            headerRight: () => (
               <View className="flex items-center justify-center w-10 h-10 rounded-full">
                  <Image source={logo} className="w-7 h-7 mt-1" />
               </View>
            ),
            headerLeft: () => (
               <Pressable
                  className="flex items-center justify-center active:bg-black/20 w-10 h-10 rounded-full"
                  onPress={() => {
                     navigation.openDrawer()
                  }}
               >
                  <MaterialIcons
                     name="menu"
                     size={24}
                     color={colors.black}
                     className="m-0"
                  />
               </Pressable>
            ),
         }}
      />
   )
}
