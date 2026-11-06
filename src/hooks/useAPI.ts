import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import type { Method } from "axios"

import { queryClient, toLegacyResult } from "@/src/lib/queryClient"
import type { GhostMeta } from "@/src/types/ghost"

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const key = process.env.EXPO_PUBLIC_API_KEY

const headers = {
   "Content-Type": "application/json",
}

const EMPTY_DATA: never[] = []

const buildUrl = (endpoint: string, query?: string) => `${baseUrl}${endpoint}/?key=${key}${query ? `&${query}` : ""}`

const request = async <T>({ method, url, signal }: { method: Method; url: string; signal: AbortSignal }) => {
   const result = await axios.request<T>({ method, url, headers, signal })
   return result.data
}

// Query keys do not contain the API key, so the persisted cache never stores it
export const apiQueryKey = (method: Method, endpoint: string, query?: string) => ["api", method, endpoint, query || ""]

/**
 * Ghost Content API request, cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is [] until loaded).
 * T: shape of the response (GhostPostsResponse, GhostAuthorsResponse...)
 */
const useAPI = <T = unknown>(method: Method, endpoint: string, query?: string) => {
   const result = useQuery({
      queryKey: apiQueryKey(method, endpoint, query),
      queryFn: ({ signal }) => request<T>({ method, url: buildUrl(endpoint, query), signal }),
   })

   return toLegacyResult(result, EMPTY_DATA)
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
   const result = useInfiniteQuery({
      queryKey: [...apiQueryKey("GET", endpoint, query), "infinite"],
      queryFn: ({ pageParam, signal }) =>
         request<TPage>({
            method: "GET",
            url: buildUrl(endpoint, `${query ? `${query}&` : ""}page=${pageParam}`),
            signal,
         }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage?.meta?.pagination?.next ?? undefined,
   })

   return {
      ...toLegacyResult(result, undefined),
      hasNextPage: result.hasNextPage,
      fetchNextPage: result.fetchNextPage,
      isFetchingNextPage: result.isFetchingNextPage,
      isFetchNextPageError: result.isFetchNextPageError,
   }
}

/**
 * Starts a useAPI request ahead of time (e.g. on press, before the screen that uses it is shown).
 * Same cache entry as useAPI(method, endpoint, query); skipped while the cached data is fresh.
 */
export const prefetchAPI = (method: Method, endpoint: string, query?: string) =>
   queryClient
      .prefetchQuery({
         queryKey: apiQueryKey(method, endpoint, query),
         queryFn: ({ signal }) => request({ method, url: buildUrl(endpoint, query), signal }),
      })
      .catch(() => {})

export default useAPI
