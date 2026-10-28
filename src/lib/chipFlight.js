/**
 * chipFlight.js
 * Link between the work detail page and the Works list for the chip flight
 * (a city / year chip pressed on the detail page flies to the subtitle of the filtered Works list).
 *
 * - The Works screen listens for filter requests (onWorksFilterRequest).
 * - The detail page asks for a filter (requestWorksFilter) and gets back the subtitle rect,
 *   reported by Works once the filtered list is laid out at the top (reportSubtitleRect).
 * - subtitleOpacity hides the real subtitle while the flying chip takes its place.
 */
import { makeMutable } from "react-native-reanimated"

// Without an answer in time, the detail page closes without the flight
const SUBTITLE_TIMEOUT = 500

let filterListener = null
let subtitleWaiter = null

export const subtitleOpacity = makeMutable(1)

export const onWorksFilterRequest = (listener) => {
   filterListener = listener
   return () => {
      if (filterListener === listener) filterListener = null
   }
}

// chip: { type: "year" | "city", slug, label }. Resolves with the subtitle rect in window coordinates (or null)
export const requestWorksFilter = (chip) =>
   new Promise((resolve) => {
      if (!filterListener) return resolve(null)
      const timeout = setTimeout(() => {
         subtitleWaiter = null
         resolve(null)
      }, SUBTITLE_TIMEOUT)
      subtitleWaiter = (rect) => {
         clearTimeout(timeout)
         subtitleWaiter = null
         resolve(rect)
      }
      filterListener(chip)
   })

export const reportSubtitleRect = (rect) => subtitleWaiter?.(rect)
