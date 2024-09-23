import { View, Text } from "react-native"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"

const Screen = () => {
   return (
      <>
         <HeaderDrawer />
         <View className="flex-1 items-center justify-center bg-white">
            <Loading label="Loading works" />
         </View>
      </>
   )
}

export default Screen
