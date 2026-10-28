import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"

import { queryClient, toLegacyResult } from "@/src/lib/queryClient"

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
const key = process.env.EXPO_PUBLIC_API_KEY

const headers = {
   "Content-Type": "application/json",
}

const EMPTY_DATA = []

const buildUrl = (endpoint, query) => `${baseUrl}${endpoint}/?key=${key}${query ? `&${query}` : ""}`

const request = async ({ method, url, signal }) => {
   const result = await axios.request({ method, url, headers, signal })
   return result.data
}

// Query keys do not contain the API key, so the persisted cache never stores it
export const apiQueryKey = (method, endpoint, query) => ["api", method, endpoint, query || ""]

/**
 * Ghost Content API request, cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is [] until loaded).
 */
const useAPI = (method, endpoint, query) => {
   const result = useQuery({
      queryKey: apiQueryKey(method, endpoint, query),
      queryFn: ({ signal }) => request({ method, url: buildUrl(endpoint, query), signal }),
   })

   return toLegacyResult(result, EMPTY_DATA)
}

/**
 * Paginated Ghost Content API request (posts, authors...).
 * Ghost returns meta.pagination { page, pages, next }.
 * `query` must not contain `page=` (added automatically).
 */
export const useInfiniteAPI = (endpoint, query) => {
   const result = useInfiniteQuery({
      queryKey: [...apiQueryKey("GET", endpoint, query), "infinite"],
      queryFn: ({ pageParam, signal }) =>
         request({
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
export const prefetchAPI = (method, endpoint, query) =>
   queryClient
      .prefetchQuery({
         queryKey: apiQueryKey(method, endpoint, query),
         queryFn: ({ signal }) => request({ method, url: buildUrl(endpoint, query), signal }),
      })
      .catch(() => {})

export default useAPI
