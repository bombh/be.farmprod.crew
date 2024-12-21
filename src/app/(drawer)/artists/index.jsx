import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import { useRouter } from "expo-router"
import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import ArtistCard from "@/src/components/ArtistCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"
import { AnimatePresence, MotiView } from "moti"

export default function Screen() {
   const router = useRouter()

   const { data, isLoading, error } = useAPI("GET", "authors", "limit=15")

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-3 bg-white">
            <AnimatePresence exitBeforeEnter>
               {isLoading && (
                  <Loading
                     key="loading"
                     label="Loading Artists"
                  />
               )}

               {!isLoading && (
                  <MotiView
                     key="dataList"
                     className="flex-1"
                  >
                     <FlashList
                        data={data.authors}
                        renderItem={({ item, index }) => (
                           <ArtistCard
                              {...item}
                              index={index}
                           />
                        )}
                        keyExtractor={(item) => item.id}
                        estimatedItemSize={225}
                        //initialNumToRender={5}
                        ListHeaderComponent={<ScreenTitle title="Artists" />}
                        scrollEventThrottle={16}
                     />
                  </MotiView>
               )}
            </AnimatePresence>

            {/* {isLoading || 1 === 1 ? (
               <Loading label="Loading Artists" />
            ) : (
               <FlashList
                  data={data.authors}
                  renderItem={({ item, index }) => (
                     <ArtistCard
                        {...item}
                        index={index}
                     />
                  )}
                  keyExtractor={(item) => item.id}
                  estimatedItemSize={225}
                  //initialNumToRender={5}
                  ListHeaderComponent={<ScreenTitle title="Artists" />}
                  scrollEventThrottle={16}
               />
            )} */}
         </View>
      </>
   )
}
