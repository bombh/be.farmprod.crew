import { Image, Text, View } from "react-native"

export default function Index() {
   return (
      <View
         style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FFF",
         }}
      >
         <Image source={require("@/assets/images/logo_128.png")} />
         <Text>FARMPROD</Text>
      </View>
   )
}
