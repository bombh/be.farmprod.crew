/**
 * index.tsx (src/app/(drawer)/about, route "/about")
 *
 * About screen: loads the Ghost page "about" (`pages/slug/about`, useAPI) and displays it with the parallax motion
 * of components/app/Parallax.tsx: the "About" title, a header image that zooms out on arrival and moves slower than the
 * content, then the page HTML via RenderHtml (justified text; headings are black bands that slide in when scrolled
 * into view; a round email button pops in at the end, opening a mailto to farmprod@gmail.com).
 * Structure: HeaderDrawer (menu button + logo) + LoadingGate (loading / error / offline handling, content mounted when
 * the data is there) + ParallaxScrollView. `useMenuReset` scrolls back to the top when the drawer item is pressed.
 */

import { View } from "react-native" // Containers

import useAPI from "@/src/hooks/useAPI" // Loads the Ghost page
import type { GhostPagesResponse } from "@/src/types/ghost" // Shape of the response
import ScreenTitle from "@/src/components/app/ScreenTitle" // Big title
import HeaderDrawer from "@/src/layouts/HeaderDrawer" // Menu button + logo header
import RenderHtml from "@/src/components/app/RenderHtml" // Renders the page HTML
import LoadingGate from "@/src/components/app/LoadingGate" // Loading / error / content gate
import { useRef } from "react" // Ref of the scroll view
import useMenuReset from "@/src/hooks/useMenuReset" // Scroll to top when the menu item is pressed
// Parallax scroll view and header image
import { ParallaxHeader, ParallaxScrollView } from "@/src/components/app/Parallax"

// Local image shown while the header image loads
const placeholder = require("@/assets/images/placeholder.png")

// Screen of the route
export default function Screen() {
   // Ghost page "about"
   const { data, isLoading, isError, refetch } = useAPI<GhostPagesResponse>("GET", "pages/slug/about", "")
   // Scroll view ref, for the menu reset
   const scrollRef = useRef(null)
   // Pressing the menu item scrolls back to the top
   useMenuReset(scrollRef)

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 bg-white dark:bg-neutral-950">
            <LoadingGate
               data={data}
               isLoading={isLoading}
               isError={isError}
               label="Loading About"
               refetch={refetch}
            >
               {(data) => (
                  // Parallaxe: header image zoom and parallax, bands and email button coming in on scroll
                  <ParallaxScrollView ref={scrollRef}>
                     <ScreenTitle title="About" />
                     <ParallaxHeader
                        source={{
                           uri: "https://www.farmprod.be/content/images/size/w600/2021/07/bandeFP-1.jpg",
                        }}
                        placeholder={placeholder}
                        placeholderContentFit="cover"
                        transition={500}
                        accessible={false}
                     />

                     <View className="py-5">
                        <RenderHtml
                           html={data.pages[0].html}
                           email="farmprod@gmail.com"
                           textAlign="justify"
                           reveal
                        />
                     </View>
                  </ParallaxScrollView>
               )}
            </LoadingGate>
         </View>
      </>
   )
}
