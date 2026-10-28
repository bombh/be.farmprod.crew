import { AppState, Platform } from "react-native"
import { QueryClient, focusManager, onlineManager } from "@tanstack/react-query"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"

const MINUTE = 1000 * 60
const DAY = MINUTE * 60 * 24

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
const onAppStateChange = (status) => {
   if (Platform.OS !== "web") {
      focusManager.setFocused(status === "active")
   }
}
AppState.addEventListener("change", onAppStateChange)

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         staleTime: 5 * MINUTE,
         gcTime: CACHE_MAX_AGE, // must be >= persister maxAge
         retry: (failureCount, error) => {
            // No point retrying client errors (404, 401...)
            const status = error?.response?.status
            if (status && status >= 400 && status < 500) return false
            return failureCount < 2
         },
      },
   },
})

export const queryPersister = createAsyncStoragePersister({
   storage: AsyncStorage,
   key: "farmprod-query-cache",
   throttleTime: 1000,
})

export const persistOptions = {
   persister: queryPersister,
   maxAge: CACHE_MAX_AGE,
   buster: CACHE_BUSTER,
   dehydrateOptions: {
      // Persist only successful queries (no errors / pending fetches)
      shouldDehydrateQuery: (query) => query.state.status === "success",
   },
}

// Error used when there is no network and nothing in cache
export class OfflineError extends Error {
   constructor() {
      super("No internet connection and no saved content available")
      this.name = "OfflineError"
      this.isOffline = true
   }
}

const offlineError = new OfflineError()

/**
 * Normalizes a TanStack query result to the legacy { data, isLoading, error, isError, refetch } shape.
 * - isLoading: true only while there is nothing to show (no cached data) and a fetch is in progress
 * - isError: true only when there is nothing to show (cached data wins over a failed refresh)
 * - paused (offline) with no data => isError with an OfflineError
 */
export const toLegacyResult = (query, emptyData) => {
   const hasData = query.data !== undefined
   const isPaused = query.fetchStatus === "paused"
   const isOfflineEmpty = !hasData && isPaused

   const isError = !hasData && (query.isError || isOfflineEmpty)
   const error = isOfflineEmpty ? offlineError : hasData ? null : query.error

   return {
      data: hasData ? query.data : emptyData,
      isLoading: !hasData && !isError,
      error,
      isError,
      refetch: query.refetch,
   }
}
