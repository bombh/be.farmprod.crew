import { MotiView } from "moti"
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
         <MotiView
            style={{ alignItems: "center" }}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 5000 }}
         >
            <Image source={require("@/assets/images/logo_128.png")} />
            <Text>FARMPROD</Text>
         </MotiView>
      </View>
   )
}
