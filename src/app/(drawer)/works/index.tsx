/**
 * index.tsx (src/app/(drawer)/works, route "/works", the home screen: "/" redirects here)
 *
 * Works list screen: the street art works of the collective (Ghost posts) in a FlashList of WorkCard
 * (components/WorkCard.tsx), with infinite scrolling and a year / city filter.
 *
 * Data: `useInfiniteAPI("posts", "limit=15&include=tags&fields=...")` loads pages of 15 posts without html (light
 * payload, small persisted cache). Pages are flattened into `posts`; `visiblePosts` = posts filtered by the active
 * filter's tag slug (utils/works.ts). `onEndReached` loads the next page; with a filter active, more pages are loaded
 * automatically until at least MIN_FILTERED_RESULTS works match. A footer shows the next-page spinner or a Try again
 * link, and an empty state when no loaded work matches. LoadingGate handles the first load / error / offline state.
 *
 * Filtering: pressing a chip on a card (`onTagPress`) starts a "cascade": the cards fade out downward and the list
 * scrolls to the top (step 1), the filter is applied (step 2) and the filtered cards rise in (step 3, remounted with
 * the "rise" entry animation: `entryRun`). The header then shows the filter label as a marker-font subtitle and an
 * "All" chip that plays the reverse cascade (`showAllWorks`: cards and subtitle fade out, filter cleared). The menu
 * (useMenuReset) clears the filter instantly and scrolls to the top.
 * Entry animations: the first 4 cards slide in ("slide") on first display, then `entry` is switched off after
 * ENTRY_ANIMATION_MS or on the first scroll so recycled cards never replay it.
 * Chip flight (lib/chipFlight.ts): a chip pressed on the work detail page asks this screen for a filter
 * (`onWorksFilterRequest`); the real subtitle is hidden (`subtitleOpacity`), the list is filtered, and once laid out
 * from the top the subtitle position is reported back (`reportSubtitleRect`) so the chip can fly onto it.
 * Android back button is swallowed on this screen (it would close the app).
 */

// Layout, footer spinner, Android back handling
import { ActivityIndicator, BackHandler, Pressable, Text, View } from "react-native"
import type { LayoutChangeEvent } from "react-native" // Layout event type of the subtitle
import { FlashList } from "@shopify/flash-list" // Performant list (used instead of FlatList)
import type { FlashListRef } from "@shopify/flash-list" // Type of the list ref (scrollToOffset)
import FontAwesome6 from "@react-native-vector-icons/fontawesome6" // Empty state icon

import { useInfiniteAPI } from "@/src/hooks/useAPI" // Paginated Ghost posts
import ScreenTitle from "@/src/components/app/ScreenTitle" // Big title, list header
import WorkCard from "@/src/components/WorkCard" // One work card
import HeaderDrawer from "@/src/layouts/HeaderDrawer" // Menu button + logo header
import LoadingGate from "@/src/components/app/LoadingGate" // Loading / error / content gate
import MotionView from "@/src/components/app/MotionView" // Entry animation of the header elements
import { filterWorks } from "@/src/utils/works" // Filters posts by tag slug
import type { EntryAnimation } from "@/src/constants/animations" // Config type of the header animations
import type { WorkTagChip } from "@/src/utils/works" // Filter shape { type, slug, label }
import type { GhostPost, GhostPostsResponse } from "@/src/types/ghost" // Post and response types
import { useFocusEffect } from "expo-router" // Runs the back handler only while this screen is focused
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react" // React state and effects
import type { ComponentRef } from "react" // Type of the subtitle Text ref
import useThemeColors from "@/src/hooks/useThemeColors" // Spinner and empty icon colors
import Chip from "@/src/components/app/Chip" // "All" button
// Clears the filter and scrolls to top when the menu item is pressed
import useMenuReset from "@/src/hooks/useMenuReset"
// Reanimated: animated views, easing, animated styles, shared values, timing
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { scheduleOnRN } from "react-native-worklets" // Calls JS functions from animation callbacks
// Link with the chip flight of the detail page
import { onWorksFilterRequest, reportSubtitleRect, subtitleOpacity } from "@/src/lib/chipFlight"

// Posts per Ghost page
const PAGE_SIZE = 15
// Light list payload (no html): keeps the persisted cache small
// Ghost only returns the computed `excerpt` without `fields`; list queries use `custom_excerpt` instead
// Ghost `fields` requested by the list
const LIST_FIELDS = "id,title,slug,custom_excerpt,feature_image,url"
// With an active filter, keep loading pages until at least this many results are shown
// Pages keep loading while a filter shows fewer results
const MIN_FILTERED_RESULTS = 6
// Entry animation of the first 4 cards: 3 × 200 ms delay + 600 ms (animations.listItem), plus a margin
// (also covers the shorter "rise" animation of the chip flight)
// Time after which the entry animation of the first cards is switched off
const ENTRY_ANIMATION_MS = 1400
// Cascade filter (chip pressed on a card): the cards fade out downward, then the filtered ones rise in
// Duration of the cards fade-out (ms)
const CASCADE_EXIT_MS = 220
// Same "emphasized decelerate" curve as the other transitions
const CASCADE_EASING = Easing.bezier(0.2, 0, 0, 1)
// Subtitle and All button settling in after a cascade filter
// Entry animation config of the filter subtitle
const SUBTITLE_ENTRY: EntryAnimation = {
   from: { opacity: 0, translateY: -10, scale: 0.92 },
   animate: { opacity: 1, translateY: 0, scale: 1 },
   transition: { type: "timing", duration: 340 },
}
// "All" button (reverse cascade): the subtitle collapses and the All button slides out while the cards fade out
// Duration of the header exit of the reverse cascade (ms)
const HEADER_EXIT_MS = 260
// px the All button slides left on exit
const ALL_EXIT_OFFSET = 8
// Entry animation config of the All button
const ALL_ENTRY: EntryAnimation = {
   from: { opacity: 0, translateX: -8 },
   animate: { opacity: 1, translateX: 0 },
   transition: { type: "timing", duration: 300, delay: 60 },
}

// Screen of the route
export default function Screen() {
   // Paginated query: data.pages, hasNextPage, fetchNextPage... (legacy result shape + pagination fields)
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
   } = useInfiniteAPI<GhostPostsResponse>("posts", `limit=${PAGE_SIZE}&include=tags&fields=${LIST_FIELDS}`)

   // Active filter, one at a time: { type: "year" | "city", slug, label } (the chip pressed on a card)
   // Active filter
   const [filter, setFilter] = useState<WorkTagChip | null>(null)
   // Entry animation of the first cards: "slide" when the list first appears, "rise" after a chip flight,
   // then switched off (first scroll, filter or end of the sequence) so recycled cards never replay it
   // Entry animation kind
   const [entry, setEntry] = useState<"slide" | "rise" | null>("slide")
   // Switches the entry animation off
   const stopEntryAnimation = useCallback(() => setEntry(null), [])
   // Incremented when an entry animation starts: the cards are remounted to replay it (see WorkCard)
   // Remount counter for the cards
   const [entryRun, setEntryRun] = useState(0)
   // Theme colors
   const theme = useThemeColors()
   // List ref: scrolls to the top
   const listRef = useRef<FlashListRef<GhostPost>>(null)
   // Subtitle text, measured for the chip flight
   const subtitleRef = useRef<ComponentRef<typeof Text>>(null)
   // Set by a chip flight: the subtitle rect is reported once the filtered list is shown from the top
   // Set by a chip flight
   const isSubtitleAwaited = useRef(false)
   // Cascade filter: cards fade-out progress (0 -> 1), header entry animation, double press guard
   // Cards exit progress 0 -> 1, passed to every card
   const cardsExit = useSharedValue(0)
   // True when the header elements should play their entry animation (after a cascade)
   const [animateHeader, setAnimateHeader] = useState(false)
   // True while a cascade is running (ignores presses)
   const isCascading = useRef(false)
   // Reverse cascade ("All" button): header exit progress (0 -> 1) and subtitle height at rest
   // Header exit progress 0 -> 1
   const headerExit = useSharedValue(0)
   // Height of the subtitle at rest (for the collapse)
   const subtitleHeight = useSharedValue(0)
   // Latest filter, read by onTagPress without making it (and so every memoized card) change with the filter
   // Latest filter
   const filterRef = useRef<WorkTagChip | null>(null)
   // Keeps filterRef up to date
   useLayoutEffect(() => {
      filterRef.current = filter
   }, [filter])

   // Switches the entry animation off after ENTRY_ANIMATION_MS, once the list is loaded
   useEffect(() => {
      if (isLoading || !entry) return
      const timeout = setTimeout(stopEntryAnimation, ENTRY_ANIMATION_MS)
      // Header menu + the list in a LoadingGate (only isLoading / isError are used, no data prop)
      return () => clearTimeout(timeout)
   }, [isLoading, entry, stopEntryAnimation])

   // Chip pressed on the detail page (open over this list): filter, with the real subtitle hidden
   // while the flying chip takes its place, and the filtered cards rising in
   useEffect(
      () =>
         onWorksFilterRequest((chip) => {
            subtitleOpacity.set(0)
            isSubtitleAwaited.current = true
            setAnimateHeader(false)
            setFilter(chip)
            setEntry("rise")
            setEntryRun((run) => run + 1)
         }),
      [],
   )

   // Subtitle: hidden during a chip flight, shrinks and collapses its height on the "All" reverse cascade
   // Subtitle: opacity (chip flight x exit), slight scale and height collapse on exit
   const subtitleStyle = useAnimatedStyle(() => {
      const exit = headerExit.get()
      return {
         opacity: subtitleOpacity.get() * (1 - exit),
         transform: [{ scale: 1 - exit * 0.08 }],
         ...(exit > 0 && { height: subtitleHeight.get() * (1 - exit), overflow: "hidden" }),
      }
   })

   // All button: fades and slides left on exit
   const allStyle = useAnimatedStyle(() => ({
      opacity: 1 - headerExit.get(),
      transform: [{ translateX: -headerExit.get() * ALL_EXIT_OFFSET }],
   }))

   // Cascade, step 2 (cards faded out): apply the filter, the list is shown from the top (effect below)
   // and the filtered cards rise in (remounted with the "rise" entry animation)
   // Applies the filter chosen by a chip press (JS thread)
   const applyCascadeFilter = useCallback((chip: WorkTagChip) => {
      setFilter(chip)
      setAnimateHeader(true)
      setEntry("rise")
      setEntryRun((run) => run + 1)
   }, [])

   // Cascade, step 1: the cards fade out downward while the list glides to the top.
   // Pressing the active filter's chip does nothing: the "All" button (or the menu) is the way back to the full list
   // Stable: starts the cascade, ignoring presses during a cascade and on the active filter
   const onTagPress = useCallback(
      (chip: WorkTagChip) => {
         if (isCascading.current || chip.slug === filterRef.current?.slug) return
         isCascading.current = true
         listRef.current?.scrollToOffset({ offset: 0, animated: true })
         cardsExit.set(
            withTiming(1, { duration: CASCADE_EXIT_MS, easing: CASCADE_EASING }, (finished) => {
               if (finished) scheduleOnRN(applyCascadeFilter, chip)
            }),
         )
      },
      [cardsExit, applyCascadeFilter],
   )

   // Cascade, step 3: once the remounted cards are committed (hidden by their entry animation), show them again
   useEffect(() => {
      if (!isCascading.current) return
      isCascading.current = false
      cardsExit.set(0)
      headerExit.set(0)
   }, [entryRun, cardsExit, headerExit])

   // Reverse cascade, step 2 (cards and header faded out): full list, its first cards rising in
   // Clears the filter (JS thread)
   const applyAllFilter = useCallback(() => {
      setFilter(null)
      setAnimateHeader(false)
      setEntry("rise")
      setEntryRun((run) => run + 1)
   }, [])

   // "All" button, reverse cascade step 1: the filtered cards fade out downward while the list glides to the top,
   // the subtitle collapses and the All button slides out
   // Starts the reverse cascade
   const showAllWorks = () => {
      if (isCascading.current || !filterRef.current) return
      isCascading.current = true
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
      cardsExit.set(withTiming(1, { duration: CASCADE_EXIT_MS, easing: CASCADE_EASING }))
      headerExit.set(
         withTiming(1, { duration: HEADER_EXIT_MS, easing: CASCADE_EASING }, (finished) => {
            if (finished) scheduleOnRN(applyAllFilter)
         }),
      )
   }

   // Menu: no animation (the screen is shown from the top, see useMenuReset)
   // Instant reset used by the menu
   const clearFilter = () => setFilter(null)

   // Menu: back to the full list, from the top
   // Menu press: scroll to the top and clear the filter
   useMenuReset(listRef, clearFilter)

   // Results are shown from the top of the list (title included).
   // Scrolling once the new data is laid out: right away, a shorter list keeps the old offset
   useEffect(() => {
      let reportFrame: number | undefined
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
   // Every loaded post
   const posts = useMemo(() => data?.pages?.flatMap((page) => page?.posts ?? []) ?? [], [data])

   // A filter is active
   const isFiltering = filter !== null
   // Posts matching the filter (all without filter)
   const visiblePosts = useMemo(() => filterWorks(posts, filter?.slug), [posts, filter])

   // A next page exists and nothing blocks loading it
   const canFetchMore = hasNextPage && !isFetchingNextPage && !isFetchNextPageError
   // Also not refreshing: allowed to load pages automatically
   const canAutoFetch = canFetchMore && !isRefetching

   // Loads the next page near the end of the list
   const onEndReached = useCallback(() => {
      if (canFetchMore) fetchNextPage()
   }, [canFetchMore, fetchNextPage])

   // Filters only apply to loaded works: load more pages while results are few
   useEffect(() => {
      if (isFiltering && visiblePosts.length < MIN_FILTERED_RESULTS && canAutoFetch) fetchNextPage()
   }, [isFiltering, visiblePosts.length, canAutoFetch, fetchNextPage])

   // Stable callbacks: memoized cards only re-render when their own work changes
   // One card of the list
   const renderItem = useCallback(
      ({ item, index }: { item: GhostPost; index: number }) => (
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

   // Footer: spinner, error with Try again, or spacing
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

   // Empty state of an active filter with no match
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

   // Header: title row (with the All button) and the filter subtitle
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
               onLayout={(event: LayoutChangeEvent) => {
                  if (headerExit.get() === 0) subtitleHeight.set(event.nativeEvent.layout.height)
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
