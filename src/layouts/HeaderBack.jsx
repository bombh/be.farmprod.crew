import { Image, Pressable, View } from "react-native"
import { useNavigation, Stack } from "expo-router"
import colors from "tailwindcss/colors"
import { MaterialIcons } from "@expo/vector-icons"

const logo = require("@/assets/images/logo_128.png")

export default function HeaderBack() {
   const navigation = useNavigation()

   return (
      <Stack.Screen
         options={{
            headerShown: true,
            headerTransparent: true,
            headerTitle: "",
            headerShadowVisible: false,
            animation: "slide_from_right",
            headerRight: () => (
               <View className="flex items-center justify-center bg-white w-10 h-10 rounded-full opacity-60">
                  <Image source={logo} className="w-7 h-7 mt-1" />
               </View>
            ),
            headerLeft: () => (
               <Pressable
                  className="flex items-center justify-center bg-white/60 w-10 h-10 rounded-full active:bg-white/80"
                  onPress={() => {
                     navigation.goBack()
                  }}
               >
                  <MaterialIcons
                     name="arrow-back-ios-new"
                     size={22}
                     color={colors.black}
                  />
               </Pressable>
            ),
         }}
      />
   )
}
