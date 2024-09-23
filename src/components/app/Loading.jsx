import { View, ActivityIndicator, Image, Text } from "react-native"
import colors from "tailwindcss/colors"
import { MotiView } from "moti"
import { animations } from "@/src/constants"

const logo = require("@/assets/images/logo_128.png")

const anim = animations.loadingLogo()

const Loading = ({ label, hideLogo }) => {
   return (
      <View className="flex-1 items-center justify-center px-5 pb-32">
         {!hideLogo && (
            <>
               <MotiView {...anim}>
                  <Image
                     source={logo}
                     className=""
                  />
               </MotiView>
               <View className="h-16" />
            </>
         )}
         <ActivityIndicator
            className=""
            size="large"
            color={colors.neutral[500]}
         />
         <Text className="mt-2 text-neutral-500">{label ? label : "Loading"}</Text>
      </View>
   )
}

export default Loading
