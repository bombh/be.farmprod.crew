import { BackHandler, View } from "react-native"
import { FlashList } from "@shopify/flash-list"

import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import WorkCard from "@/src/components/WorkCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"
import { MotiView, AnimatePresence } from "moti"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react"

// const onEndReached = () => {
//    console.log("Reached end of list")
// }

export default function Screen() {
   const { data, isLoading, isError, refetch } = useAPI("GET", "posts", "limit=100&include=tags")

   // Avoids the back button from closing the app
   useFocusEffect(
      useCallback(() => {
         const onBackPress = () => {
            //console.log("Closing...")
            // Alert.alert(
            //    "Exit App",
            //    "Are you sure you want to exit the app?",
            //    [
            //       { text: "Cancel", style: "cancel" },
            //       { text: "OK", onPress: () => BackHandler.exitApp() },
            //    ],
            //    { cancelable: false }
            // )
            return true
         }

         BackHandler.addEventListener("hardwareBackPress", onBackPress)

         // Remove event listener on cleanup
         return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress)
      }, [])
   )

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-5 bg-white">
            <AnimatePresence exitBeforeEnter>
               {(isLoading || isError) && (
                  <Loading
                     key="loadingWorks"
                     label="Loading Works"
                     isError={isError}
                     refetch={refetch}
                  />
               )}

               {!isLoading && !isError && (
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
