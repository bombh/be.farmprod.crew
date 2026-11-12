/**
 * chipFlight.ts
 *
 * Tiny module-level "event bus" (no React, no context) linking the Work detail page and the Works list for the chip
 * flight: a city / year chip pressed on the detail page flies to the subtitle of the filtered Works list.
 *
 * Who talks to whom:
 * - The Works screen (app/(drawer)/works/index.tsx) listens for filter requests (onWorksFilterRequest) and, once the
 *   filtered list is laid out at the top, reports the position of its subtitle (reportSubtitleRect).
 * - The detail page (hooks/useChipFlight.tsx, used by screens/WorkDetail.tsx) asks for a filter
 *   (requestWorksFilter) and gets back the subtitle rect, to animate the chip towards it.
 * - subtitleOpacity (a Reanimated shared value) hides the real subtitle while the flying chip takes its place.
 *
 * Flow: requestWorksFilter(chip) -> listener applies the filter -> Works renders and calls reportSubtitleRect(rect)
 * -> the promise resolves with the rect. If nobody answers within SUBTITLE_TIMEOUT (or no list is mounted) it resolves
 * with null and the detail page simply closes without the flight.
 *
 * Gotcha: only one listener and one waiter exist at a time (module variables): a new request replaces the old waiter.
 */
// makeMutable = shared value created outside a component (module level)
import { makeMutable } from "react-native-reanimated"

import type { WorkTagChip } from "@/src/utils/works" // Chip shape: { type: "year" | "city", slug, label }

// Fields below are in px, relative to the window
// Position of the subtitle (window coordinates)
export interface SubtitleRect {
   // Left edge
   x: number
   // Top edge
   y: number
   // Width of the subtitle
   width: number
   // Height of the subtitle
   height: number
}

// Called by requestWorksFilter with the chip to apply as filter
type FilterListener = (chip: WorkTagChip) => void
// Called by reportSubtitleRect with the measured rect (or null)
type SubtitleWaiter = (rect: SubtitleRect | null) => void

// Without an answer in time, the detail page closes without the flight
const SUBTITLE_TIMEOUT = 500

// Current listener (the mounted Works screen), null when none
let filterListener: FilterListener | null = null
// Resolver of the request waiting for the subtitle position, null when none
let subtitleWaiter: SubtitleWaiter | null = null

// Opacity (0 or 1) of the real subtitle on the Works screen; the detail page sets it to 0 during the flight
export const subtitleOpacity = makeMutable(1)

// Registers the Works screen as listener. Returns an unsubscribe function (for useEffect cleanup)
export const onWorksFilterRequest = (listener: FilterListener) => {
   filterListener = listener
   return () => {
      if (filterListener === listener) filterListener = null
   }
}

// chip: { type: "year" | "city", slug, label }. Resolves with the subtitle rect in window coordinates (or null)
export const requestWorksFilter = (chip: WorkTagChip) =>
   new Promise<SubtitleRect | null>((resolve) => {
      // No Works screen mounted: nothing to fly to
      if (!filterListener) return resolve(null)
      // Safety net: give up if the list never reports its subtitle
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

// Called by the Works screen once the subtitle is measured; resolves the pending request (no-op if none)
export const reportSubtitleRect = (rect: SubtitleRect | null) => subtitleWaiter?.(rect)
