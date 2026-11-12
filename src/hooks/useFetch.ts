/**
 * useFetch.ts
 *
 * Generic JSON fetch hook for the external tour map data hosted on map.farmprod.be
 * (`https://map.farmprod.be/street-art-map-olln/public/<endpoint>`, e.g. "app/data/places.<tour>.json").
 * Built on TanStack Query + axios, so results are cached and persisted on disk (see lib/queryClient.ts): a tour opened
 * once still shows offline.
 *
 * Used by app/(drawer)/tours/detail.tsx to load the places of a tour (typed as TourPlaces by default).
 * Returns the legacy shape `{ data, isLoading, error, isError, refetch }`; `data` is undefined until loaded. The query
 * key is `["fetch", url]`: it refetches when `endpoint` changes, and the request is aborted when cancelled.
 */

import { useQuery } from "@tanstack/react-query" // Cached query
import axios from "axios" // HTTP client

import { toLegacyResult } from "@/src/lib/queryClient" // Result adapter to the legacy shape
import type { TourPlaces } from "@/src/types/map" // Default response type

// Root of the published tour data
const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/"

// Sent with every request
const headers = {
   "Content-Type": "application/json",
}

/**
 * Generic JSON fetch (tour map data), cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is undefined until loaded).
 * T: shape of the JSON (the tour places by default)
 */
// `endpoint` is the path under baseUrl
const useFetch = <T = TourPlaces>(endpoint: string) => {
   // Full URL, also part of the query key
   const url = `${baseUrl}${endpoint}`

   // Cached query keyed by URL
   const result = useQuery({
      queryKey: ["fetch", url],
      // Downloads the JSON; `signal` aborts the request when the query is cancelled
      queryFn: async ({ signal }) => {
         const response = await axios.request<T>({
            method: "GET",
            url,
            headers,
            signal,
         })
         return response.data
      },
   })

   return toLegacyResult(result, undefined)
}

export default useFetch
