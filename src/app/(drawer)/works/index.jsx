import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"

import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import WorkCard from "@/src/components/WorkCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"

// const onEndReached = () => {
//    console.log("Reached end of list")
// }

export default function Screen() {
   const { data, isLoading, error } = useAPI("GET", "posts", "limit=100&include=tags")

   return (
      <>
         <HeaderDrawer />
         <View className="flex-1 px-5 bg-white">
            {isLoading ? (
               <Loading label="Loading Works" />
            ) : (
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
                  //onEndReached={onEndReached}
                  // initialNumToRender={5}
                  // maxToRenderPerBatch={5}
                  // scrollEventThrottle={16}
               />
            )}
         </View>
      </>
   )
}
