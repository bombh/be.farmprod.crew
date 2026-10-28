import { ActivityIndicator, BackHandler, Pressable, Text, View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"

import { useInfiniteAPI } from "@/src/hooks/useAPI"
import ScreenTitle from "@/src/components/app/ScreenTitle"
import WorkCard from "@/src/components/WorkCard"
import HeaderDrawer from "@/src/layouts/HeaderDrawer"
import LoadingGate from "@/src/components/app/LoadingGate"
import MotionView from "@/src/components/app/MotionView"
import { filterWorks } from "@/src/utils/works"
import { useFocusEffect } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useThemeColors from "@/src/hooks/useThemeColors"
import Chip from "@/src/components/app/Chip"
import useMenuReset from "@/src/hooks/useMenuReset"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets"
import { onWorksFilterRequest, reportSubtitleRect, subtitleOpacity } from "@/src/lib/chipFlight"

const PAGE_SIZE = 15
// Light list payload (no html): keeps the persisted cache small
// Ghost only returns the computed `excerpt` without `fields`; list queries use `custom_excerpt` instead
const LIST_FIELDS = "id,title,slug,custom_excerpt,feature_image,url"
// With an active filter, keep loading pages until at least this many results are shown
const MIN_FILTERED_RESULTS = 6
// Entry animation of the first 4 cards: 3 × 200 ms delay + 600 ms (animations.listItem), plus a margin
// (also covers the shorter "rise" animation of the chip flight)
const ENTRY_ANIMATION_MS = 1400
// Cascade filter (chip pressed on a card): the cards fade out downward, then the filtered ones rise in
const CASCADE_EXIT_MS = 220
const CASCADE_EASING = Easing.bezier(0.2, 0, 0, 1)
// Subtitle and All button settling in after a cascade filter
const SUBTITLE_ENTRY = {
   from: { opacity: 0, translateY: -10, scale: 0.92 },
   animate: { opacity: 1, translateY: 0, scale: 1 },
   transition: { type: "timing", duration: 340 },
}
// "All" button (reverse cascade): the subtitle collapses and the All button slides out while the cards fade out
const HEADER_EXIT_MS = 260
const ALL_EXIT_OFFSET = 8
const ALL_ENTRY = {
   from: { opacity: 0, translateX: -8 },
   animate: { opacity: 1, translateX: 0 },
   transition: { type: "timing", duration: 300, delay: 60 },
}

export default function Screen() {
   const {
      data,
      isLoading,
      isError,
      refetch,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      isFetchNextPageError,
      isRefetching,
   } = useInfiniteAPI("posts", `limit=${PAGE_SIZE}&include=tags&fields=${LIST_FIELDS}`)

   // Active filter, one at a time: { type: "year" | "city", slug, label } (the chip pressed on a card)
   const [filter, setFilter] = useState(null)
   // Entry animation of the first cards: "slide" when the list first appears, "rise" after a chip flight,
   // then switched off (first scroll, filter or end of the sequence) so recycled cards never replay it
   const [entry, setEntry] = useState("slide")
   const stopEntryAnimation = useCallback(() => setEntry(null), [])
   // Incremented when an entry animation starts: the cards are remounted to replay it (see WorkCard)
   const [entryRun, setEntryRun] = useState(0)
   const theme = useThemeColors()
   const listRef = useRef(null)
   const subtitleRef = useRef(null)
   // Set by a chip flight: the subtitle rect is reported once the filtered list is shown from the top
   const isSubtitleAwaited = useRef(false)
   // Cascade filter: cards fade-out progress (0 -> 1), header entry animation, double press guard
   const cardsExit = useSharedValue(0)
   const [animateHeader, setAnimateHeader] = useState(false)
   const isCascading = useRef(false)
   // Reverse cascade ("All" button): header exit progress (0 -> 1) and subtitle height at rest
   const headerExit = useSharedValue(0)
   const subtitleHeight = useSharedValue(0)
   // Latest filter, read by onTagPress without making it (and so every memoized card) change with the filter
   const filterRef = useRef(null)
   filterRef.current = filter

   useEffect(() => {
      if (isLoading || !entry) return
      const timeout = setTimeout(stopEntryAnimation, ENTRY_ANIMATION_MS)
      return () => clearTimeout(timeout)
   }, [isLoading, entry, stopEntryAnimation])

   // Chip pressed on the detail page (open over this list): filter, with the real subtitle hidden
   // while the flying chip takes its place, and the filtered cards rising in
   useEffect(
      () =>
         onWorksFilterRequest((chip) => {
            subtitleOpacity.value = 0
            isSubtitleAwaited.current = true
            setAnimateHeader(false)
            setFilter(chip)
            setEntry("rise")
            setEntryRun((run) => run + 1)
         }),
      [],
   )

   // Subtitle: hidden during a chip flight, shrinks and collapses its height on the "All" reverse cascade
   const subtitleStyle = useAnimatedStyle(() => {
      const exit = headerExit.value
      return {
         opacity: subtitleOpacity.value * (1 - exit),
         transform: [{ scale: 1 - exit * 0.08 }],
         ...(exit > 0 && { height: subtitleHeight.value * (1 - exit), overflow: "hidden" }),
      }
   })

   const allStyle = useAnimatedStyle(() => ({
      opacity: 1 - headerExit.value,
      transform: [{ translateX: -headerExit.value * ALL_EXIT_OFFSET }],
   }))

   // Cascade, step 2 (cards faded out): apply the filter, the list is shown from the top (effect below)
   // and the filtered cards rise in (remounted with the "rise" entry animation)
   const applyCascadeFilter = useCallback((chip) => {
      setFilter(chip)
      setAnimateHeader(true)
      setEntry("rise")
      setEntryRun((run) => run + 1)
   }, [])

   // Cascade, step 1: the cards fade out downward while the list glides to the top.
   // Pressing the active filter's chip does nothing: the "All" button (or the menu) is the way back to the full list
   const onTagPress = useCallback(
      (chip) => {
         if (isCascading.current || chip.slug === filterRef.current?.slug) return
         isCascading.current = true
         listRef.current?.scrollToOffset({ offset: 0, animated: true })
         cardsExit.value = withTiming(1, { duration: CASCADE_EXIT_MS, easing: CASCADE_EASING }, (finished) => {
            if (finished) scheduleOnRN(applyCascadeFilter, chip)
         })
      },
      [cardsExit, applyCascadeFilter],
   )

   // Cascade, step 3: once the remounted cards are committed (hidden by their entry animation), show them again
   useEffect(() => {
      if (!isCascading.current) return
      isCascading.current = false
      cardsExit.value = 0
      headerExit.value = 0
   }, [entryRun, cardsExit, headerExit])

   // Reverse cascade, step 2 (cards and header faded out): full list, its first cards rising in
   const applyAllFilter = useCallback(() => {
      setFilter(null)
      setAnimateHeader(false)
      setEntry("rise")
      setEntryRun((run) => run + 1)
   }, [])

   // "All" button, reverse cascade step 1: the filtered cards fade out downward while the list glides to the top,
   // the subtitle collapses and the All button slides out
   const showAllWorks = () => {
      if (isCascading.current || !filterRef.current) return
      isCascading.current = true
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
      cardsExit.value = withTiming(1, { duration: CASCADE_EXIT_MS, easing: CASCADE_EASING })
      headerExit.value = withTiming(1, { duration: HEADER_EXIT_MS, easing: CASCADE_EASING }, (finished) => {
         if (finished) scheduleOnRN(applyAllFilter)
      })
   }

   // Menu: no animation (the screen is shown from the top, see useMenuReset)
   const clearFilter = () => setFilter(null)

   // Menu: back to the full list, from the top
   useMenuReset(listRef, clearFilter)

   // Results are shown from the top of the list (title included).
   // Scrolling once the new data is laid out: right away, a shorter list keeps the old offset
   useEffect(() => {
      let reportFrame
      const frame = requestAnimationFrame(() => {
         listRef.current?.scrollToOffset({ offset: 0, animated: false })
         if (!isSubtitleAwaited.current) return
         // Chip flight: the subtitle is at its final place once the list is laid out at the top
         reportFrame = requestAnimationFrame(() => {
            isSubtitleAwaited.current = false
            subtitleRef.current?.measureInWindow((x, y, width, height) => reportSubtitleRect({ x, y, width, height }))
         })
      })
      return () => {
         cancelAnimationFrame(frame)
         cancelAnimationFrame(reportFrame)
      }
   }, [filter])

   // Flatten the Ghost pages ({ posts, meta }) into a single list
   const posts = useMemo(() => data?.pages?.flatMap((page) => page?.posts ?? []) ?? [], [data])

   const isFiltering = filter !== null
   const visiblePosts = useMemo(() => filterWorks(posts, filter?.slug), [posts, filter])

   const canFetchMore = hasNextPage && !isFetchingNextPage && !isFetchNextPageError
   const canAutoFetch = canFetchMore && !isRefetching

   const onEndReached = useCallback(() => {
      if (canFetchMore) fetchNextPage()
   }, [canFetchMore, fetchNextPage])

   // Filters only apply to loaded works: load more pages while results are few
   useEffect(() => {
      if (isFiltering && visiblePosts.length < MIN_FILTERED_RESULTS && canAutoFetch) fetchNextPage()
   }, [isFiltering, visiblePosts.length, canAutoFetch, fetchNextPage])

   // Stable callbacks: memoized cards only re-render when their own work changes
   const renderItem = useCallback(
      ({ item, index }) => (
         <WorkCard
            {...item}
            index={index}
            onTagPress={onTagPress}
            entry={entry}
            entryRun={entryRun}
            exitProgress={cardsExit}
         />
      ),
      [onTagPress, entry, entryRun, cardsExit],
   )

   const renderFooter = () => {
      if (isFetchingNextPage) {
         return (
            <View className="py-6 items-center">
               <ActivityIndicator color={theme.spinner} />
            </View>
         )
      }
      if (isFetchNextPageError) {
         return (
            <Pressable
               className="py-6 items-center"
               onPress={() => fetchNextPage()}
               accessibilityRole="button"
               accessibilityLabel="Could not load more works. Try again"
            >
               <Text className="text-neutral-500 dark:text-neutral-400">
                  Could not load more works ... <Text className="text-blue-600 dark:text-blue-400">Try again</Text>
               </Text>
            </Pressable>
         )
      }
      return <View className="h-6" />
   }

   const renderEmpty = () => {
      if (!isFiltering || hasNextPage) return null
      return (
         <View className="py-12 items-center">
            <FontAwesome6
               name="magnifying-glass"
               iconStyle="solid"
               size={28}
               color={theme.emptyIcon}
            />
            <Text className="mt-4 text-neutral-500 dark:text-neutral-400 text-base">No works match this filter</Text>
         </View>
      )
   }

   const listHeader = (
      <View>
         {/* Title row: the All button sits at the title's height, so the list does not move when it appears */}
         <View className="relative">
            <ScreenTitle title="Works" />
            {/* Clears both filters (bottom-4: ScreenTitle bottom margin + padding), only while a filter is active */}
            {isFiltering && (
               <MotionView
                  key={animateHeader ? `all-${filter.slug}` : "all"}
                  pointerEvents="box-none"
                  className="absolute left-0 top-0 bottom-4 justify-center"
                  {...(animateHeader ? ALL_ENTRY : {})}
               >
                  <Animated.View style={allStyle}>
                     <Chip
                        label="All"
                        icon="chevron-left"
                        onPress={showAllWorks}
                        accessibilityLabel="Show all works"
                     />
                  </Animated.View>
               </MotionView>
            )}
         </View>

         {isFiltering && (
            // Hidden during a chip flight, while the flying chip takes its place
            // and settling in after a cascade filter (chip pressed on a card)
            // (the negative top margin is on this wrapper, so its height collapse never clips the text at rest)
            <Animated.View
               className="-mt-3"
               style={subtitleStyle}
               onLayout={(event) => {
                  if (headerExit.value === 0) subtitleHeight.value = event.nativeEvent.layout.height
               }}
            >
               <MotionView
                  key={animateHeader ? `subtitle-${filter.slug}` : "subtitle"}
                  {...(animateHeader ? SUBTITLE_ENTRY : {})}
               >
                  <Text
                     ref={subtitleRef}
                     className="mb-3 text-[24px] font-marker text-black dark:text-white text-center"
                     accessibilityLabel={`Filtered by ${filter.type}: ${filter.label}`}
                     maxFontSizeMultiplier={1.4}
                  >
                     {filter.label}
                  </Text>
               </MotionView>
            </Animated.View>
         )}

         <View className="h-3" />
      </View>
   )

   // Avoids the back button from closing the app
   useFocusEffect(
      useCallback(() => {
         const onBackPress = () => {
            return true
         }

         const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)
         // Clean up the event listener when the screen is unfocused
         return () => subscription.remove()
      }, []),
   )

   return (
      <>
         <HeaderDrawer />

         <View className="flex-1 px-5 bg-white dark:bg-neutral-950">
            <LoadingGate
               isLoading={isLoading}
               isError={isError}
               label="Loading Works"
               refetch={refetch}
            >
               {() => (
                  <View className="flex-1">
                     <FlashList
                        ref={listRef}
                        data={visiblePosts}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        // On by default in FlashList v2: when a filter changes the data, it shifted the offset
                        // to keep the previous card in view, and the list rendered empty after the scroll to top
                        maintainVisibleContentPosition={{ disabled: true }}
                        onEndReached={onEndReached}
                        onScrollBeginDrag={entry ? stopEntryAnimation : undefined}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={renderEmpty}
                     />
                  </View>
               )}
            </LoadingGate>
         </View>
      </>
   )
}
