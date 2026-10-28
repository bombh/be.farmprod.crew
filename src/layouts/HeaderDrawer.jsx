import { Image, View } from "react-native"
import { Stack, useNavigation } from "expo-router"
import MaterialIcons from "@react-native-vector-icons/material-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import useThemeColors from "@/src/hooks/useThemeColors"
import GlassButton from "@/src/components/app/GlassButton"

// Lets the press animation show before the drawer/back navigation covers the button
const NAV_ACTION_DELAY = 120

const logo = require("@/assets/images/logo_128.png")
const logoDark = require("@/assets/images/logo_drawer.png")

export default function HeaderDrawer() {
   const navigation = useNavigation()
   const insets = useSafeAreaInsets()
   const theme = useThemeColors()

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
