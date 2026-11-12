/**
 * TagChips.tsx
 *
 * Row of city / year chips of a work: used by the Works card (components/WorkCard.tsx), the work detail page
 * (screens/WorkDetail.tsx) and the zoom transition overlay (hooks/useZoomTransition.tsx). One layout for the three,
 * so the chips line up at both ends of the transition.
 *
 * Props: `items`: [{ key, label, accessibilityLabel?, onPress? }] (without onPress the chips are plain labels).
 * onPress receives the pressed chip view, so it can be measured (chip flight from the detail page, see
 * hooks/useChipFlight.tsx). The forwarded ref is the row container (`collapsable={false}` so it stays a real native
 * view and can be measured on Android). `labelsToItems` builds plain label items from the "City • Year" text passed
 * to the detail page as a route param.
 */
import { forwardRef, useRef } from "react" // Forwarded ref; map of chip refs
import { View } from "react-native" // Row container
import type { HostInstance } from "react-native" // Native view ref type
import Chip from "@/src/components/app/Chip" // Single pill

// One chip of the row
export interface TagChipItem {
   // Unique key (also used to store the chip view ref)
   key: string
   // Text of the chip
   label: string
   // Screen reader label
   accessibilityLabel?: string
   // Makes the chip pressable; receives the chip view to measure it
   onPress?: (view: HostInstance | null) => void
}

// Chips laid out from their labels only ("City • Year" text passed to the detail page)
// Splits a "City • Year" string into plain (non pressable) chip items; empty parts are dropped
export const labelsToItems = (text?: string | null): TagChipItem[] =>
   String(text ?? "")
      .split(" • ")
      .filter(Boolean)
      .map((label) => ({ key: label, label }))

// Row of chips; the ref is the row view
const TagChips = forwardRef<HostInstance, { items: TagChipItem[] }>(({ items }, ref) => {
   // Native view of each chip by key (given to onPress for measuring)
   const chipRefs = useRef<Record<string, HostInstance | null>>({})

   return (
      <View
         ref={ref}
         collapsable={false}
         className="flex-row flex-wrap justify-center gap-2 pb-1"
      >
         {items.map((item) => (
            <Chip
               key={item.key}
               ref={(view) => {
                  chipRefs.current[item.key] = view
               }}
               label={item.label}
               accessibilityLabel={item.accessibilityLabel}
               onPress={item.onPress ? () => item.onPress!(chipRefs.current[item.key]) : undefined}
            />
         ))}
      </View>
   )
})

TagChips.displayName = "TagChips"

export default TagChips
