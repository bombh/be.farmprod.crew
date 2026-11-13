/**
 * queryClient.test.ts
 *
 * Jest unit tests (jest-expo preset) of src/lib/queryClient.ts, the piece every data hook goes through.
 * - toLegacyResult: loading, success, failed fetch, cached data winning over a failed refresh, and "offline with
 *   nothing cached" becoming an OfflineError.
 * - queryClient retry policy: never retry 4xx responses, at most 2 retries otherwise.
 * AsyncStorage and NetInfo are native modules, so they are replaced by their official Jest mocks.
 * Run with `npm test` (watch mode) or `npx jest --ci`.
 */

/* global describe, it, expect, jest */
import { AxiosError } from "axios" // Error type exposed by the legacy result (see types/react-query.d.ts)
import { OfflineError, queryClient, toLegacyResult } from "@/src/lib/queryClient" // Code under test

// Native modules loaded by queryClient.ts: official Jest mocks
jest.mock("@react-native-async-storage/async-storage", () =>
   jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)
jest.mock("@react-native-community/netinfo", () =>
   jest.requireActual("@react-native-community/netinfo/jest/netinfo-mock.js"),
)

// The fields of a query result read by toLegacyResult
type QueryFields = Parameters<typeof toLegacyResult<string, null>>[0]
// Fetch states of a query
type FetchStatus = QueryFields["fetchStatus"]

// Builds the query result under test: loading by default (no data, no error, fetching)
const query = (over: Partial<QueryFields> = {}): QueryFields => ({
   data: undefined,
   error: null,
   isError: false,
   fetchStatus: "fetching" as FetchStatus,
   refetch: jest.fn() as unknown as QueryFields["refetch"],
   ...over,
})

// A failed request, as axios reports it
const httpError = (status: number) =>
   new AxiosError("Request failed", "ERR_BAD_RESPONSE", undefined, undefined, {
      status,
      statusText: "",
      data: null,
      headers: {},
      config: { headers: {} } as never,
   })

// Adapter of every data hook
describe("toLegacyResult", () => {
   it("is loading while nothing can be shown yet", () => {
      const result = toLegacyResult(query(), null)
      expect(result).toMatchObject({ data: null, isLoading: true, isError: false, error: null })
   })

   it("gives the data once loaded", () => {
      const result = toLegacyResult(query({ data: "hello", fetchStatus: "idle" }), null)
      expect(result).toMatchObject({ data: "hello", isLoading: false, isError: false, error: null })
   })

   it("exposes the error of a failed fetch with nothing cached", () => {
      const error = httpError(500)
      const result = toLegacyResult(query({ error, isError: true, fetchStatus: "idle" }), null)
      expect(result).toMatchObject({ data: null, isLoading: false, isError: true, error })
   })

   it("lets cached data win over a failed refresh", () => {
      const result = toLegacyResult(
         query({ data: "cached", error: httpError(500), isError: true, fetchStatus: "idle" }),
         null,
      )
      expect(result).toMatchObject({ data: "cached", isLoading: false, isError: false, error: null })
   })

   it("keeps showing cached data while a refresh is in progress", () => {
      const result = toLegacyResult(query({ data: "cached", fetchStatus: "fetching" }), null)
      expect(result).toMatchObject({ data: "cached", isLoading: false, isError: false })
   })

   it("gives an OfflineError when offline with nothing cached", () => {
      const result = toLegacyResult(query({ fetchStatus: "paused" }), null)
      expect(result.isError).toBe(true)
      expect(result.isLoading).toBe(false)
      expect(result.error).toBeInstanceOf(OfflineError)
      expect(result.error).toMatchObject({ isOffline: true })
   })

   it("shows cached data without any error when offline", () => {
      const result = toLegacyResult(query({ data: "cached", fetchStatus: "paused" }), null)
      expect(result).toMatchObject({ data: "cached", isLoading: false, isError: false, error: null })
   })

   it("uses the empty value until the data is there", () => {
      expect(toLegacyResult(query(), []).data).toEqual([])
   })

   it("passes refetch through, for the Try again button", () => {
      const refetch = jest.fn() as unknown as QueryFields["refetch"]
      expect(toLegacyResult(query({ refetch }), null).refetch).toBe(refetch)
   })
})

// Retry policy of the shared client
describe("queryClient retry policy", () => {
   const retry = queryClient.getDefaultOptions().queries?.retry
   if (typeof retry !== "function") throw new Error("retry should be a function")

   it("never retries client errors (4xx)", () => {
      expect(retry(0, httpError(404))).toBe(false)
      expect(retry(0, httpError(401))).toBe(false)
   })

   it("retries server errors and network errors, at most twice", () => {
      expect(retry(0, httpError(500))).toBe(true)
      expect(retry(1, httpError(503))).toBe(true)
      expect(retry(2, httpError(500))).toBe(false)
      expect(retry(0, new AxiosError("Network Error", "ERR_NETWORK"))).toBe(true)
   })
})
