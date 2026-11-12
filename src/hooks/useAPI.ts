/**
 * useAPI.ts
 *
 * Data hooks for the Ghost CMS Content API:
 * `${EXPO_PUBLIC_API_BASE_URL}<endpoint>/?key=<EXPO_PUBLIC_API_KEY>&<query>`, built on TanStack Query + axios. Ghost
 * posts = works, authors = artists, pages = static content.
 *
 * Exports:
 * - default `useAPI<T>(method, endpoint, query?)`: one request. Used by the artists grid, About, 20 years and
 *   WorkDetail screens.
 * - `useInfiniteAPI<TPage>(endpoint, query?)`: paginated list (Works list). Pages are loaded one after the other using
 *   Ghost's `meta.pagination.next`; also exposes hasNextPage / fetchNextPage / isFetchingNextPage / isRefetching.
 * - `prefetchAPI(method, endpoint, query?)`: warms the cache ahead of time (WorkCard prefetches the detail on press).
 *   Same query key as useAPI, so the detail screen opens with its data already there.
 * - `apiQueryKey`: the query key builder, `["api", method, endpoint, query]`. The API key is NOT in the key, so the
 *   persisted cache (AsyncStorage, see lib/queryClient.ts) never stores it.
 *
 * All hooks return the legacy shape `{ data, isLoading, error, isError, refetch }` (via toLegacyResult): `data` is
 * undefined until loaded. Requests are aborted automatically (AbortSignal given by react-query) when the query is
 * cancelled / unmounted, and refetched when the inputs change (they are part of the key).
 */

// useQuery = single request, useInfiniteQuery = paginated request
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios" // HTTP client
import type { Method } from "axios" // HTTP method union ("GET", "POST"...)

// Shared client (for prefetch) and the result adapter
import { queryClient, toLegacyResult } from "@/src/lib/queryClient"
import type { GhostMeta } from "@/src/types/ghost" // Pagination info of a Ghost page of results

// Ghost API root, from .env (EXPO_PUBLIC_ vars are inlined at build time)
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
// Ghost Content API key, from .env
const key = process.env.EXPO_PUBLIC_API_KEY

// Sent with every request
const headers = {
   "Content-Type": "application/json",
}

// Full URL: base + endpoint + key, then the optional extra query string (fields=..., filter=...)
const buildUrl = (endpoint: string, query?: string) => `${baseUrl}${endpoint}/?key=${key}${query ? `&${query}` : ""}`

// Runs the HTTP call and returns the JSON body; `signal` lets react-query abort it
const request = async <T>({ method, url, signal }: { method: Method; url: string; signal: AbortSignal }) => {
   const result = await axios.request<T>({ method, url, headers, signal })
   return result.data
}

// Query keys do not contain the API key, so the persisted cache never stores it
export const apiQueryKey = (method: Method, endpoint: string, query?: string) => ["api", method, endpoint, query || ""]

/**
 * Ghost Content API request, cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is undefined until loaded).
 * T: shape of the response (GhostPostsResponse, GhostAuthorsResponse...)
 */
const useAPI = <T = unknown>(method: Method, endpoint: string, query?: string) => {
   // Cached query: refetched when method / endpoint / query change
   const result = useQuery({
      queryKey: apiQueryKey(method, endpoint, query),
      queryFn: ({ signal }) => request<T>({ method, url: buildUrl(endpoint, query), signal }),
   })

   return toLegacyResult(result, undefined)
}

/**
 * Paginated Ghost Content API request (posts, authors...).
 * Ghost returns meta.pagination { page, pages, next }.
 * `query` must not contain `page=` (added automatically).
 */
export const useInfiniteAPI = <TPage extends { meta?: GhostMeta } = { meta?: GhostMeta }>(
   endpoint: string,
   query?: string,
) => {
   // Pages accumulate in result.data.pages; the "infinite" key suffix keeps this cache apart from useAPI
   const result = useInfiniteQuery({
      queryKey: [...apiQueryKey("GET", endpoint, query), "infinite"],
      queryFn: ({ pageParam, signal }) =>
         request<TPage>({
            method: "GET",
            url: buildUrl(endpoint, `${query ? `${query}&` : ""}page=${pageParam}`),
            signal,
         }),
      // First page number to request (Ghost pages start at 1)
      initialPageParam: 1,
      // Next page number given by Ghost (meta.pagination.next); undefined on the last page = no more pages
      getNextPageParam: (lastPage) => lastPage?.meta?.pagination?.next ?? undefined,
   })

   return {
      ...toLegacyResult(result, undefined),
      hasNextPage: result.hasNextPage,
      fetchNextPage: result.fetchNextPage,
      isFetchingNextPage: result.isFetchingNextPage,
      isFetchNextPageError: result.isFetchNextPageError,
      isRefetching: result.isRefetching,
   }
}

/**
 * Starts a useAPI request ahead of time (e.g. on press, before the screen that uses it is shown).
 * Same cache entry as useAPI(method, endpoint, query); skipped while the cached data is fresh.
 */
// Fire-and-forget: errors are ignored (the screen will fetch and show them itself)
export const prefetchAPI = (method: Method, endpoint: string, query?: string) =>
   queryClient
      .prefetchQuery({
         queryKey: apiQueryKey(method, endpoint, query),
         queryFn: ({ signal }) => request({ method, url: buildUrl(endpoint, query), signal }),
      })
      .catch(() => {})

export default useAPI
