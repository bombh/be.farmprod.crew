import { ScrollView } from "react-native"
import { useRouter } from "expo-router"

import ScreenTitle from "@/src/components/app/ScreenTitle"
import TourCard from "@/src/components/TourCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import { SafeAreaView } from "react-native-safe-area-context"

export default function Screen() {
   const router = useRouter()

   // const showTour = (tour) => {
   //    router.navigate({
   //       pathname: `tours/detail`,
   //       params: { tour: tour },
   //    })
   // }

   return (
      <>
         <HeaderDrawer />

         <ScrollView className="flex-1 px-5 bg-white">
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
