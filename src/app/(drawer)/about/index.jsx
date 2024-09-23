import { View, ScrollView } from "react-native"
import { Image } from "expo-image"

import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import RenderHtml from "@/src/components/app/RenderHtml"
import Loading from "@/src/components/app/Loading"

const placeholder = require("@/assets/images/placeholder.png")

export default function Screen() {
   const { data, isLoading, error } = useAPI("GET", "pages/slug/about", "")

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 bg-white">
            {isLoading ? (
               <Loading />
            ) : (
               data.pages && (
                  <ScrollView>
                     <ScreenTitle title="About" />
                     <Image
                        source={{
                           uri: "https://www.farmprod.be/content/images/size/w600/2021/07/bandeFP-1.jpg",
                        }}
                        className="w-full h-36"
                        placeholder={placeholder}
                        placeholderContentFit="cover"
                        transition={500}
                     />

                     <View className="py-5">
                        <RenderHtml
                           html={data.pages[0].html}
                           email="farmprod@gmail.com"
                           textAlign="justify"
                        />
                     </View>
                  </ScrollView>
               )
            )}
         </View>
      </>
   )
}
