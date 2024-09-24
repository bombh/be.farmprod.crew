import { View, Text } from "react-native"
import React from "react"

const ScreenTitle = ({ title }) => {
   return (
      <View className="mt-0 mb-2">
         <Text className="text-black text-center font-extralight text-6xl p-2 pt-0">{title}</Text>
      </View>
   )
}

export default ScreenTitle
