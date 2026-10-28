/**
 * TagChips.jsx
 * Row of city / year chips of a work: Works card, work detail page and the zoom transition overlay.
 * One layout for the three, so the chips line up at both ends of the transition.
 * items: [{ key, label, accessibilityLabel?, onPress? }] (without onPress the chips are plain labels)
 * onPress receives the pressed chip view, so it can be measured (chip flight from the detail page)
 */
import { forwardRef, useRef } from "react"
import { View } from "react-native"
import Chip from "@/src/components/app/Chip"

// Chips laid out from their labels only ("City • Year" text passed to the detail page)
export const labelsToItems = (text) =>
   String(text ?? "")
      .split(" • ")
      .filter(Boolean)
      .map((label) => ({ key: label, label }))

const TagChips = forwardRef(({ items }, ref) => {
   const chipRefs = useRef({})

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
               onPress={item.onPress ? () => item.onPress(chipRefs.current[item.key]) : undefined}
            />
         ))}
      </View>
   )
})

TagChips.displayName = "TagChips"

export default TagChips
