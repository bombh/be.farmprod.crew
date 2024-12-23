import { View, ActivityIndicator, Image, Text, Pressable } from "react-native"
import colors from "tailwindcss/colors"
import { MotiView } from "moti"
import { animations } from "@/src/constants"
import { useEffect, useState } from "react"

const logo = require("@/assets/images/logo_128.png")

const anim = animations.loadingLogo()
//{...anim}

const Loading = ({ label, hideLogo, isError, refetch }) => {
   //useEffect(() => {}, [label])
   console.log("isError", isError)
   return (
      <MotiView
         //key={`load-${Math.random()}}`}
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
            opacity: 1,
            translateX: 150,
         }}
         transition={{
            type: "timing",
            duration: 250,
            // opacity: {
            //    loop: true,
            // },
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
         {isError ? (
            <Pressable onPress={refetch}>
               <Text className="mt-4">
                  Error loading data ... <Text className="text-blue-500">Try again</Text>
               </Text>
            </Pressable>
         ) : (
            <Text className="mt-4 text-neutral-500">{label ? label : "Loading"}</Text>
         )}
      </MotiView>
   )
}

export default Loading
