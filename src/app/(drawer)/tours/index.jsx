import { ScrollView } from "react-native"
import { useRef } from "react"

import ScreenTitle from "@/src/components/app/ScreenTitle"
import TourCard from "@/src/components/TourCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import useMenuReset from "@/src/hooks/useMenuReset"

export default function Screen() {
   const scrollRef = useRef(null)
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
