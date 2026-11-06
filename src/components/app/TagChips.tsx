/**
 * TagChips.jsx
 * Row of city / year chips of a work: Works card, work detail page and the zoom transition overlay.
 * One layout for the three, so the chips line up at both ends of the transition.
 * items: [{ key, label, accessibilityLabel?, onPress? }] (without onPress the chips are plain labels)
 * onPress receives the pressed chip view, so it can be measured (chip flight from the detail page)
 */
import { forwardRef, useRef } from "react"
import { View } from "react-native"
import type { HostInstance } from "react-native"
import Chip from "@/src/components/app/Chip"

export interface TagChipItem {
   key: string
   label: string
   accessibilityLabel?: string
   onPress?: (view: HostInstance | null) => void
}

// Chips laid out from their labels only ("City • Year" text passed to the detail page)
export const labelsToItems = (text?: string | null): TagChipItem[] =>
   String(text ?? "")
      .split(" • ")
      .filter(Boolean)
      .map((label) => ({ key: label, label }))

const TagChips = forwardRef<HostInstance, { items: TagChipItem[] }>(({ items }, ref) => {
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
