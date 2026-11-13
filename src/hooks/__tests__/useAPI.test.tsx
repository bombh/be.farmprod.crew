/**
 * useAPI.test.tsx
 *
 * Jest tests (jest-expo preset, react-test-renderer, no testing-library) of src/hooks/useAPI.ts, the Ghost CMS data
 * hooks. axios is mocked, so no request leaves the test; the hooks run inside a real TanStack QueryClient.
 * Cases covered:
 * - the request: URL built from base + endpoint + API key (+ optional query), HTTP method, abort signal;
 * - the API key never appears in the query key (so it is never written to the persisted cache);
 * - useAPI result: loading, then data; error state when the request fails;
 * - useInfiniteAPI pagination: page=1 first, then the page given by `meta.pagination.next`, stop on a null `next`,
 *   `page=` appended to an existing query;
 * - prefetchAPI: fills the same cache entry as useAPI, and swallows errors.
 * The env vars are read when useAPI.ts is loaded, so they are set first and the module is imported afterwards.
 * Run with `npm test` (watch mode) or `npx jest --ci`.
 */

/* global describe, it, expect, jest, beforeAll, afterAll, beforeEach, afterEach */
import type { ReactNode } from "react"
import { create } from "react-test-renderer" // Renders the probe component to a test tree
import type { ReactTestRenderer } from "react-test-renderer" // Type of the test renderer
import { QueryClient, QueryClientProvider } from "@tanstack/react-query" // Client given to the hooks under test
import axios, { AxiosError } from "axios" // Mocked below; AxiosError builds a failed request
import type { GhostMeta } from "@/src/types/ghost" // Pagination info of a Ghost page

// Mocked: no real request
jest.mock("axios")
// Native modules loaded by lib/queryClient.ts: official Jest mocks
jest.mock("@react-native-async-storage/async-storage", () =>
   jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
)
jest.mock("@react-native-community/netinfo", () =>
   jest.requireActual("@react-native-community/netinfo/jest/netinfo-mock.js"),
)

// Fake CMS settings: the API key must never leak in the query keys
const BASE_URL = "https://cms.test/ghost/api/content"
const API_KEY = "secret-api-key"

// Types of the modules loaded after the env vars are set
type UseAPIModule = typeof import("@/src/hooks/useAPI")
type QueryClientModule = typeof import("@/src/lib/queryClient")

// Filled in beforeAll
let useAPIModule!: UseAPIModule
let queryClientModule!: QueryClientModule

// Mocked axios.request
const request = jest.mocked(axios.request)

// Ghost page of results (only the fields the hook reads matter; the rest of `meta` is filled with plausible values)
interface Page {
   posts: { id: string }[]
   meta?: GhostMeta
}

// Builds a Ghost page of 1 post out of 2; `next` is the number of the following page, null on the last one
const page = (n: number, next: number | null): Page => ({
   posts: [{ id: `post-${n}` }],
   meta: { pagination: { page: n, limit: 1, pages: 2, total: 2, next, prev: n > 1 ? n - 1 : null } },
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

// Lets pending promises and react-query timers run
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

// Keeps flushing until `condition` is true (react-query notifies React through timers, so no act() here: see beforeAll)
const waitUntil = async (condition: () => boolean) => {
   for (let i = 0; i < 50 && !condition(); i++) await flush()
   expect(condition()).toBe(true)
}

// Fresh client per test: no retry (errors show up at once), nothing kept alive by garbage-collection timers
let client!: QueryClient

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })

// Trees mounted by the current test, unmounted afterwards
let mounted: ReactTestRenderer[] = []

// Mounts `hook` in a probe component and returns its latest result
const renderHook = async <T,>(hook: () => T) => {
   const current: { value: T | undefined } = { value: undefined }
   const Probe = (): ReactNode => {
      current.value = hook()
      return null
   }
   mounted.push(
      create(
         <QueryClientProvider client={client}>
            <Probe />
         </QueryClientProvider>,
      ),
   )
   // React renders on its own schedule outside act(): wait for the first render
   await waitUntil(() => current.value !== undefined)
   return current as { value: T }
}

// Flag read by React to warn about updates made outside act()
const reactEnv = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
let previousActEnv: boolean | undefined

beforeAll(() => {
   // react-query notifies React from its own timers, outside act(): the tests wait with waitUntil instead
   previousActEnv = reactEnv.IS_REACT_ACT_ENVIRONMENT
   reactEnv.IS_REACT_ACT_ENVIRONMENT = false
   process.env.EXPO_PUBLIC_API_BASE_URL = BASE_URL
   process.env.EXPO_PUBLIC_API_KEY = API_KEY
   // Loaded here, after the env vars are set (a static import would be hoisted above them)
   useAPIModule = jest.requireActual<UseAPIModule>("@/src/hooks/useAPI")
   queryClientModule = jest.requireActual<QueryClientModule>("@/src/lib/queryClient")
})

beforeEach(() => {
   client = makeClient()
   request.mockReset()
})

afterAll(() => {
   reactEnv.IS_REACT_ACT_ENVIRONMENT = previousActEnv
})

afterEach(() => {
   mounted.forEach((tree) => tree.unmount())
   mounted = []
   client.clear()
   queryClientModule.queryClient.clear() // shared client used by prefetchAPI
})

// Single request
describe("useAPI", () => {
   it("calls the Ghost URL with the method, the key and the abort signal", async () => {
      request.mockResolvedValue({ data: { posts: [] } })
      await renderHook(() => useAPIModule.default("GET", "/posts"))
      await waitUntil(() => request.mock.calls.length > 0)

      expect(request).toHaveBeenCalledTimes(1)
      expect(request.mock.calls[0][0]).toMatchObject({
         method: "GET",
         url: `${BASE_URL}/posts/?key=${API_KEY}`,
         headers: { "Content-Type": "application/json" },
      })
      expect(request.mock.calls[0][0]?.signal).toBeInstanceOf(AbortSignal)
   })

   it("appends the extra query after the key", async () => {
      request.mockResolvedValue({ data: { authors: [] } })
      await renderHook(() => useAPIModule.default("GET", "/authors", "fields=name,slug&include=count.posts"))
      await waitUntil(() => request.mock.calls.length > 0)

      expect(request.mock.calls[0][0]?.url).toBe(
         `${BASE_URL}/authors/?key=${API_KEY}&fields=name,slug&include=count.posts`,
      )
   })

   it("is loading first, then gives the data", async () => {
      request.mockResolvedValue({ data: { posts: [{ id: "1" }] } })
      const result = await renderHook(() => useAPIModule.default<{ posts: { id: string }[] }>("GET", "/posts"))

      expect(result.value).toMatchObject({ data: undefined, isLoading: true, isError: false })
      await waitUntil(() => result.value.data !== undefined)
      expect(result.value).toMatchObject({
         data: { posts: [{ id: "1" }] },
         isLoading: false,
         isError: false,
         error: null,
      })
   })

   it("reports the error when the request fails and nothing is cached", async () => {
      const error = httpError(500)
      request.mockRejectedValue(error)
      const result = await renderHook(() => useAPIModule.default("GET", "/posts"))

      await waitUntil(() => result.value.isError)
      expect(result.value).toMatchObject({ data: undefined, isLoading: false, isError: true, error })
   })

   it("never puts the API key in the cache", async () => {
      request.mockResolvedValue({ data: { posts: [] } })
      await renderHook(() => useAPIModule.default("GET", "/posts", "limit=5"))
      await waitUntil(() => client.getQueryCache().getAll()[0]?.state.status === "success")

      const keys = client
         .getQueryCache()
         .getAll()
         .map((q) => q.queryKey)
      expect(keys).toEqual([["api", "GET", "/posts", "limit=5"]])
      expect(JSON.stringify(keys)).not.toContain(API_KEY)
   })
})

// Query key shared with prefetchAPI
describe("apiQueryKey", () => {
   it("is ['api', method, endpoint, query], with an empty string when there is no query", () => {
      expect(useAPIModule.apiQueryKey("GET", "/posts")).toEqual(["api", "GET", "/posts", ""])
      expect(useAPIModule.apiQueryKey("GET", "/posts", "limit=5")).toEqual(["api", "GET", "/posts", "limit=5"])
   })

   it("does not contain the API key", () => {
      expect(JSON.stringify(useAPIModule.apiQueryKey("GET", "/posts", "limit=5"))).not.toContain(API_KEY)
   })
})

// Paginated list (Works)
describe("useInfiniteAPI", () => {
   it("asks for page 1 first, with page= after the key when there is no query", async () => {
      request.mockResolvedValue({ data: page(1, null) })
      await renderHook(() => useAPIModule.useInfiniteAPI<Page>("/posts"))
      await waitUntil(() => request.mock.calls.length > 0)

      expect(request.mock.calls[0][0]?.url).toBe(`${BASE_URL}/posts/?key=${API_KEY}&page=1`)
   })

   it("adds page= after an existing query", async () => {
      request.mockResolvedValue({ data: page(1, null) })
      await renderHook(() => useAPIModule.useInfiniteAPI<Page>("/posts", "filter=tag:hash-work&limit=10"))
      await waitUntil(() => request.mock.calls.length > 0)

      expect(request.mock.calls[0][0]?.url).toBe(
         `${BASE_URL}/posts/?key=${API_KEY}&filter=tag:hash-work&limit=10&page=1`,
      )
   })

   it("follows meta.pagination.next, then stops on the last page", async () => {
      request.mockResolvedValueOnce({ data: page(1, 2) }).mockResolvedValueOnce({ data: page(2, null) })
      const result = await renderHook(() => useAPIModule.useInfiniteAPI<Page>("/posts"))

      await waitUntil(() => result.value.data !== undefined)
      expect(result.value.data?.pages).toHaveLength(1)
      expect(result.value.hasNextPage).toBe(true)

      await result.value.fetchNextPage()
      await waitUntil(() => result.value.data?.pages.length === 2)

      expect(request.mock.calls[1][0]?.url).toBe(`${BASE_URL}/posts/?key=${API_KEY}&page=2`)
      expect(result.value.data?.pages.map((p) => p.posts[0].id)).toEqual(["post-1", "post-2"])
      expect(result.value.hasNextPage).toBe(false)
   })

   it("has no next page when Ghost sends no pagination info", async () => {
      request.mockResolvedValue({ data: { posts: [] } })
      const result = await renderHook(() => useAPIModule.useInfiniteAPI<Page>("/posts"))

      await waitUntil(() => result.value.data !== undefined)
      expect(result.value.hasNextPage).toBe(false)
   })

   it("never puts the API key in the cache", async () => {
      request.mockResolvedValue({ data: page(1, null) })
      await renderHook(() => useAPIModule.useInfiniteAPI<Page>("/posts", "limit=10"))
      await waitUntil(() => client.getQueryCache().getAll()[0]?.state.status === "success")

      const keys = client
         .getQueryCache()
         .getAll()
         .map((q) => q.queryKey)
      expect(keys).toEqual([["api", "GET", "/posts", "limit=10", "infinite"]])
      expect(JSON.stringify(keys)).not.toContain(API_KEY)
   })
})

// Cache warming (WorkCard prefetches the detail on press)
describe("prefetchAPI", () => {
   it("fills the same cache entry as useAPI in the shared client", async () => {
      request.mockResolvedValue({ data: { posts: [{ id: "1" }] } })
      await useAPIModule.prefetchAPI("GET", "/posts/1", "include=tags")

      expect(request.mock.calls[0][0]?.url).toBe(`${BASE_URL}/posts/1/?key=${API_KEY}&include=tags`)
      expect(
         queryClientModule.queryClient.getQueryData(useAPIModule.apiQueryKey("GET", "/posts/1", "include=tags")),
      ).toEqual({ posts: [{ id: "1" }] })
   })

   it("ignores errors: the screen fetches and shows them itself", async () => {
      request.mockRejectedValue(httpError(500))
      await expect(useAPIModule.prefetchAPI("GET", "/posts/1")).resolves.toBeUndefined()
   })
})
