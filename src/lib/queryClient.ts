/**
 * queryClient.ts
 *
 * Central TanStack Query (react-query) setup: the shared QueryClient, its persistence on disk, the online / focus
 * wiring for React Native, and `toLegacyResult`, the adapter used by every data hook.
 *
 * Role in the app:
 * - `queryClient` + `persistOptions` are given to <PersistQueryClientProvider> in app/_layout.tsx: query results are
 *   saved in AsyncStorage (key "farmprod-query-cache") for 7 days, so the app shows content offline and instantly on
 *   the next launch, then refreshes it in the background when stale (5 min).
 * - `onlineManager` follows NetInfo: queries pause while offline and resume on reconnect.
 * - `focusManager` follows AppState (native only): coming back to the foreground refetches stale queries.
 * - Retry policy: never retry 4xx responses, at most 2 retries otherwise.
 * - `toLegacyResult` converts a query result into `{ data, isLoading, error, isError, refetch }`, the shape returned by
 *   hooks/useAPI.ts and hooks/useFetch.ts and expected by components/app/LoadingGate.tsx. Cached data always wins
 *   over a failed refresh, and "offline with nothing cached" becomes an `OfflineError` (shown with a Try again button).
 *
 * Gotchas: gcTime must stay >= the persister maxAge or entries are garbage-collected before they can be restored;
 * bump CACHE_BUSTER to drop every persisted cache after an API shape change.
 */

// AppState: foreground/background events; Platform: skip focus handling on web
import { AppState, Platform } from "react-native"
import type { AppStateStatus } from "react-native" // "active" | "background" | "inactive"
import type { AxiosError } from "axios" // Type of the error exposed by the legacy result
// QueryClient = the cache; focusManager / onlineManager = react-query's focus and network sources
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query"
import type { UseQueryResult } from "@tanstack/react-query" // Type of a useQuery result, narrowed by QueryLike
// Saves / restores the cache in an async key-value storage
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
// Type of the options given to PersistQueryClientProvider
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client"
import AsyncStorage from "@react-native-async-storage/async-storage" // Storage backend of the persisted cache
import NetInfo from "@react-native-community/netinfo" // Network connectivity events (online / offline)

// Durations in ms
const MINUTE = 1000 * 60
const DAY = MINUTE * 60 * 24

// How long a persisted entry stays usable (also the in-memory gcTime): 7 days
export const CACHE_MAX_AGE = 7 * DAY
// Bump to invalidate every persisted cache (e.g. when the API response shape changes)
export const CACHE_BUSTER = "v1"

// Online status: driven by NetInfo (queries pause while offline and resume on reconnect)
onlineManager.setEventListener((setOnline) =>
   NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false)
   }),
)

// Focus: refetch stale queries when the app comes back to the foreground
// On web the browser handles focus itself, so only native app state is forwarded
const onAppStateChange = (status: AppStateStatus) => {
   if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active")
   }
}
AppState.addEventListener("change", onAppStateChange)

// Shared client. staleTime 5 min: data younger than that is served without refetch
export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 5 * MINUTE,
         gcTime: CACHE_MAX_AGE, // must be >= persister maxAge
         // Retry function: no retry for 4xx (error.response.status), otherwise 2 retries at most
         retry: (failureCount, error) => {
            // No point retrying client errors (404, 401...)
            const status = error?.response?.status
            if (status && status >= 400 && status < 500) return false
            return failureCount < 2
         },
      },
   },
})

// Writes the cache to AsyncStorage, at most once per second (throttleTime)
export const queryPersister = createAsyncStoragePersister({
   storage: AsyncStorage,
   key: "farmprod-query-cache",
   throttleTime: 1000,
})

// Options of PersistQueryClientProvider: persister, expiry (maxAge) and cache version (buster)
export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
   persister: queryPersister,
   maxAge: CACHE_MAX_AGE,
   buster: CACHE_BUSTER,
   dehydrateOptions: {
      // Persist only successful queries (no errors / pending fetches)
      shouldDehydrateQuery: (query) => query.state.status === "success",
   },
}

// Error used when there is no network and nothing in cache
export interface OfflineError {
   // Always true: lets the UI tell it from an AxiosError (`error.isOffline`)
   isOffline: boolean
}
// Thrown-like value (never thrown, just exposed as `error`) when offline with nothing cached
export class OfflineError extends Error {
   constructor() {
      super("No internet connection and no saved content available")
      this.name = "OfflineError"
      this.isOffline = true
   }
}

// Single shared instance (the error carries no data)
const offlineError = new OfflineError()

// What toLegacyResult reads of a useQuery / useInfiniteQuery result
// Subset of fields used, so both useQuery and useInfiniteQuery results are accepted
type QueryLike<TData> = Readonly<Pick<UseQueryResult<TData>, "data" | "error" | "isError" | "fetchStatus" | "refetch">>

// { data, isLoading, error, isError, refetch } shape of useAPI / useFetch: `data` is `emptyData` until loaded
// Fields below are the legacy contract of the data hooks
export interface LegacyResult<TData, TEmpty> {
   // Loaded data, or the `emptyData` fallback (undefined for the hooks) until available
   data: TData | TEmpty
   // True only while nothing can be shown yet (no data, no error)
   isLoading: boolean
   // Axios error, OfflineError when offline with no data, null otherwise
   error: AxiosError | OfflineError | null
   // True only when there is nothing to show
   isError: boolean
   // Re-runs the query (Try again button)
   refetch: QueryLike<TData>["refetch"]
}

/**
 * Normalizes a TanStack query result to the legacy { data, isLoading, error, isError, refetch } shape.
 * - isLoading: true only while there is nothing to show (no cached data) and a fetch is in progress
 * - isError: true only when there is nothing to show (cached data wins over a failed refresh)
 * - paused (offline) with no data => isError with an OfflineError
 */
export const toLegacyResult = <TData, TEmpty>(
   query: QueryLike<TData>,
   emptyData: TEmpty,
): LegacyResult<TData, TEmpty> => {
   // Anything in cache (even stale) counts as data
   const hasData = query.data !== undefined
   // Paused fetchStatus = the query wants to fetch but the app is offline
   const isPaused = query.fetchStatus === "paused"
   const isOfflineEmpty = !hasData && isPaused

   // Cached data wins over a failed refresh
   const isError = !hasData && (query.isError || isOfflineEmpty)
   // Offline-and-empty gives the OfflineError; with data there is no error to show
   const error = isOfflineEmpty ? offlineError : hasData ? null : query.error

   return {
      data: hasData ? query.data : emptyData,
      isLoading: !hasData && !isError,
      error,
      isError,
      refetch: query.refetch,
   }
}
