import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"

import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import WorkCard from "@/src/components/WorkCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"
import { MotiView, AnimatePresence } from "moti"

// const onEndReached = () => {
//    console.log("Reached end of list")
// }

export default function Screen() {
   const { data, isLoading, error } = useAPI("GET", "posts", "limit=100&include=tags")

   return (
      <>
         <HeaderDrawer />
         <View className="flex-1 px-5 bg-white">
            <AnimatePresence exitBeforeEnter>
               {isLoading && (
                  <Loading
                     key="loading"
                     label="Loading Works"
                  />
               )}
               {!isLoading && (
                  <MotiView
                     key="dataList"
                     className="flex-1"
                  >
                     <FlashList
                        data={data.posts}
                        renderItem={({ item, index }) => (
                           <WorkCard
                              {...item}
                              index={index}
                           />
                        )}
                        keyExtractor={(item) => item.id}
                        estimatedItemSize={268}
                        onEndReachedThreshold={0.5}
                        ListHeaderComponent={<ScreenTitle title="Works" />}
                     />
                  </MotiView>
               )}
            </AnimatePresence>
         </View>
      </>
   )
}
