/**
 * index.tsx (src/app/(drawer)/artists, route "/artists")
 *
 * Artists screen: loads the Ghost authors (`authors?limit=15`, useAPI) and lists them in a FlashList of ArtistCard
 * (components/ArtistCard.tsx) under the "Artists" title (list header). Structure: HeaderDrawer + LoadingGate (loading /
 * error / offline handling) + FlashList. `useMenuReset` scrolls back to the top when the drawer item is pressed.
 */

import { View } from "react-native" // Containers
import { FlashList } from "@shopify/flash-list" // Performant list (used instead of FlatList)
import useAPI from "@/src/hooks/useAPI" // Loads the authors
import type { GhostAuthorsResponse } from "@/src/types/ghost" // Shape of the response
import ScreenTitle from "@/src/components/app/ScreenTitle" // Big title, list header
import ArtistCard from "@/src/components/ArtistCard" // One artist tile
import HeaderDrawer from "@/src/layouts/HeaderDrawer" // Menu button + logo header
import LoadingGate from "@/src/components/app/LoadingGate" // Loading / error / content gate
import { useRef } from "react" // Ref of the list
import useMenuReset from "@/src/hooks/useMenuReset" // Scroll to top when the menu item is pressed

// Screen of the route
export default function Screen() {
   // Ghost authors, limited to 15
   const { data, isLoading, isError, refetch } = useAPI<GhostAuthorsResponse>("GET", "authors", "limit=15")
   // List ref, for the menu reset
   const listRef = useRef(null)
   // Pressing the menu item scrolls back to the top
   useMenuReset(listRef)

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-3 bg-white dark:bg-neutral-950">
            <LoadingGate
               data={data}
               isLoading={isLoading}
               isError={isError}
               label="Loading Artists"
               refetch={refetch}
            >
               {(data) => (
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
