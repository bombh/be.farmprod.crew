import { View, Text } from "react-native"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"

const Screen = () => {
   return (
      <>
         <HeaderDrawer />
         <View className="flex-1 items-center justify-center">
            <Text className="text-xl">Artists</Text>
         </View>
      </>
   )
}

export default Screen
