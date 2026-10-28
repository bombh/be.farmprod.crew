import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import ArtistCard from "@/src/components/ArtistCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import LoadingGate from "@/src/components/app/LoadingGate"
import { useRef } from "react"
import useMenuReset from "@/src/hooks/useMenuReset"

export default function Screen() {
   const { data, isLoading, isError, refetch } = useAPI("GET", "authors", "limit=15")
   const listRef = useRef(null)
   useMenuReset(listRef)

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-3 bg-white dark:bg-neutral-950">
            <LoadingGate
               isLoading={isLoading}
               isError={isError}
               label="Loading Artists"
               refetch={refetch}
            >
               {() => (
                  <View className="flex-1">
                     <FlashList
                        ref={listRef}
                        data={data.authors}
                        renderItem={({ item, index }) => (
                           <ArtistCard
                              {...item}
                              index={index}
                           />
                        )}
                        keyExtractor={(item) => item.id}
                        ListHeaderComponent={<ScreenTitle title="Artists" />}
                        scrollEventThrottle={16}
                     />
                  </View>
               )}
            </LoadingGate>
         </View>
      </>
   )
}
