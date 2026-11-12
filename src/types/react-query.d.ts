/**
 * react-query.d.ts
 *
 * Module augmentation for TanStack Query: declares the default error type of every query / mutation of the app.
 * No runtime effect (types only). Every query goes through axios (hooks/useAPI.ts and hooks/useFetch.ts), so
 * `error` in `useQuery()` results is typed as `AxiosError` instead of the generic `Error`, which lets components read
 * `error.response?.status` or `error.code` without casts.
 */

import type { AxiosError } from "axios" // Error class of the axios requests, used as the default error type

// Every query of the app is an axios request (useAPI, useFetch): its errors are AxiosError
declare module "@tanstack/react-query" {
   interface Register {
      // Type of `error` returned by useQuery / useMutation
      defaultError: AxiosError
   }
}
