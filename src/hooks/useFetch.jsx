import { useQuery } from "@tanstack/react-query"
import axios from "axios"

import { toLegacyResult } from "@/src/lib/queryClient"

const baseUrl = "https://map.farmprod.be/street-art-map-olln/public/"

const headers = {
   "Content-Type": "application/json",
}

const EMPTY_DATA = {}

/**
 * Generic JSON fetch (tour map data), cached + persisted through TanStack Query.
 * Returns { data, isLoading, error, isError, refetch } (data is {} until loaded).
 */
const useFetch = (endpoint) => {
   const url = `${baseUrl}${endpoint}`

   const result = useQuery({
      queryKey: ["fetch", url],
      queryFn: async ({ signal }) => {
         const response = await axios.request({
            method: "GET",
            url,
            headers,
            signal,
         })
         return response.data
      },
   })

   return toLegacyResult(result, EMPTY_DATA)
}

export default useFetch
