import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import { useRouter } from "expo-router"
import useAPI from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import ArtistCard from "@/src/components/ArtistCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import Loading from "@/src/components/app/Loading"

export default function Screen() {
   const router = useRouter()

   const { data, isLoading, error } = useAPI("GET", "authors", "limit=100")

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-3 bg-white">
            {isLoading ? (
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
            )}
         </View>
      </>
   )
}
