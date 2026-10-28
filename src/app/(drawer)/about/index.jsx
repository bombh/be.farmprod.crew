import { View } from "react-native"

import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import RenderHtml from "@/src/components/app/RenderHtml"
import Loading from "@/src/components/app/Loading"
import { AnimatePresence } from "moti"
import { useRef } from "react"
import useMenuReset from "@/src/hooks/useMenuReset"
import { ParallaxHeader, ParallaxScrollView } from "@/src/components/app/Parallax"

const placeholder = require("@/assets/images/placeholder.png")

export default function Screen() {
   const { data, isLoading, isError, refetch } = useAPI("GET", "pages/slug/about", "")
   const scrollRef = useRef(null)
   useMenuReset(scrollRef)

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 bg-white dark:bg-neutral-950">
            <AnimatePresence exitBeforeEnter>
               {(isLoading || isError) && (
                  <Loading
                     key="loadingAbout"
                     label="Loading About"
                     isError={isError}
                     refetch={refetch}
                  />
               )}

               {!isLoading && !isError && (
                  // Parallaxe: header image zoom and parallax, bands and email button coming in on scroll
                  <ParallaxScrollView ref={scrollRef}>
                     <ScreenTitle title="About" />
                     <ParallaxHeader
                        source={{
                           uri: "https://www.farmprod.be/content/images/size/w600/2021/07/bandeFP-1.jpg",
                        }}
                        placeholder={placeholder}
                        placeholderContentFit="cover"
                        transition={500}
                        accessible={false}
                     />

                     <View className="py-5">
                        <RenderHtml
                           html={data.pages[0].html}
                           email="farmprod@gmail.com"
                           textAlign="justify"
                           reveal
                        />
                     </View>
                  </ParallaxScrollView>
               )}
            </AnimatePresence>
         </View>
      </>
   )
}
