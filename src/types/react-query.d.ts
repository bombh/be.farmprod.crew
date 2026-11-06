import type { AxiosError } from "axios"

// Every query of the app is an axios request (useAPI, useFetch): its errors are AxiosError
declare module "@tanstack/react-query" {
   interface Register {
      defaultError: AxiosError
   }
}
