import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { toLegacyResult } from "@/src/lib/queryClient"
import type { TourPlaces } from "@/src/types/map"

const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/"

const headers = {
   "Content-Type": "application/json",
}

const EMPTY_DATA = {}

/**
 * Generic JSON fetch (tour map data), cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is {} until loaded).
 * T: shape of the JSON (the tour places by default)
 */
const useFetch = <T = TourPlaces>(endpoint: string) => {
   const url = `${baseUrl}${endpoint}`

   const result = useQuery({
      queryKey: ["fetch", url],
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

   return toLegacyResult<T, Partial<T>>(result, EMPTY_DATA)
}

export default useFetch
