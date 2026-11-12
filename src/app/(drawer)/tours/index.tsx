/**
 * index.tsx (src/app/(drawer)/tours, route "/tours")
 *
 * Tours list screen: the "Tours" title and one TourCard per tour, in a plain ScrollView (the list is short and
 * hard-coded, nothing is fetched here): Louvain-la-Neuve (`id` "lln") and Ottignies ("ottignies") with their image on
 * map.farmprod.be, and "Brussels (Soon)", a card without id (disabled). The `id` is the name of the tour JSON
 * (`places.<id>.json`) loaded by tours/detail.tsx. `useMenuReset` scrolls back to the top when the drawer item is
 * pressed.
 */

import { ScrollView } from "react-native" // Scrollable page
import { useRef } from "react" // Ref of the scroll view

import ScreenTitle from "@/src/components/app/ScreenTitle" // Big title
import TourCard from "@/src/components/TourCard" // One tour card
import HeaderDrawer from "@/src/layouts/HeaderDrawer" // Menu button + logo header
import useMenuReset from "@/src/hooks/useMenuReset" // Scroll to top when the menu item is pressed

// Screen of the route
export default function Screen() {
   // Scroll view ref, for the menu reset
   const scrollRef = useRef(null)
   // Pressing the menu item scrolls back to the top
   useMenuReset(scrollRef)

   return (
      <>
         <HeaderDrawer />

         <ScrollView
            ref={scrollRef}
            className="flex-1 px-5 bg-white dark:bg-neutral-950"
         >
            <ScreenTitle title="Tours" />

            <TourCard
               index={0}
               id="lln"
               title="Louvain-la-Neuve"
               img="https://map.farmprod.be/street-art-map-olln/public/img/art/lln_fp_4.jpg"
            />

            <TourCard
               index={1}
               id="ottignies"
               title="Ottignies"
               img="https://map.farmprod.be/street-art-map-olln/public/img/art/ott_fp_5.jpg"
            />

            <TourCard
               title="Brussels (Soon)"
               index={2}
            />
         </ScrollView>
      </>
   )
}
