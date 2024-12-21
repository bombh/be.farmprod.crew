import { View, ActivityIndicator, Image, Text } from "react-native"
import colors from "tailwindcss/colors"
import { MotiView } from "moti"
import { animations } from "@/src/constants"

const logo = require("@/assets/images/logo_128.png")

const anim = animations.loadingLogo()
//{...anim}

const Loading = ({ label, hideLogo }) => {
   return (
      <MotiView
         className="flex-1 items-center justify-center px-5 pb-32"
         from={{
            opacity: 0,
            translateX: -150,
         }}
         animate={{
            opacity: 1,
            translateX: 0,
         }}
         exit={{
            opacity: 0,
            translateX: 150,
         }}
         transition={{
            type: "timing",
            duration: 250,
         }}
      >
         {!hideLogo && (
            <>
               <View>
                  <Image
                     source={logo}
                     className=""
                  />
               </View>
               <View className="h-16" />
            </>
         )}
         <ActivityIndicator
            className=""
            size="large"
            color={colors.neutral[500]}
         />
         <Text className="mt-2 text-neutral-500">{label ? label : "Loading"}</Text>
      </MotiView>
   )
}

export default Loading
