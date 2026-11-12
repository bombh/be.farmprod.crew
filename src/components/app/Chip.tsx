/**
 * Chip.tsx
 *
 * Rounded "pill" label used by the filter rows and the work cards: the year / city chips of a work (see TagChips.tsx),
 * the Works list filter, and the zoom transition overlay.
 *
 * Two modes, depending on `onPress`:
 * - with onPress: a Pressable (role "button", accessibilityState.selected, 70% opacity while pressed);
 * - without onPress: a plain View, so a parent Pressable (the whole work card) keeps receiving the touches.
 * The ref is forwarded to the root (View or Pressable) so callers can measure it (chip flight, zoom transition).
 *
 * Styling: NativeWind classes for the container (selected = inverted colors in light and dark). The text color is
 * passed as a style VALUE computed from useThemeColors because the `dark:` variant on a dynamic className did not
 * apply to the selected chip.
 *
 * Props: label (text), icon (optional FontAwesome6 solid icon name shown before the label), selected (inverted look),
 * onPress, accessibilityLabel (defaults to label), className (extra classes, e.g. margins).
 */

import { forwardRef } from "react" // Lets the parent get the root view ref
import type { ComponentProps } from "react" // Used to derive the icon name type
import { Pressable, Text, View } from "react-native" // Pressable chip, plain View chip, label text
import type { HostInstance } from "react-native" // Type of the forwarded native ref
import FontAwesome6 from "@react-native-vector-icons/fontawesome6" // Optional icon before the label
import colors from "tailwindcss/colors" // Tailwind palette for the unselected text color
import useThemeColors from "@/src/hooks/useThemeColors" // Dark / light text color and selected-chip icon color

// Props of the chip
interface ChipProps {
   // Text of the chip
   label: string
   // Name of a solid FontAwesome6 icon displayed before the label
   icon?: Extract<ComponentProps<typeof FontAwesome6>, { iconStyle: "solid" }>["name"]
   // Inverted (filled) look, exposed to screen readers
   selected?: boolean
   // Makes the chip pressable; omit for a plain label
   onPress?: () => void
   // Screen reader label, defaults to `label`
   accessibilityLabel?: string
   // Extra NativeWind classes merged on the root
   className?: string
}

// Pill used by the filter rows and the work cards.
// Without onPress it is a plain (non pressable) label, so a parent Pressable keeps receiving the touches.
// icon: optional FontAwesome6 name shown before the label
// Forwards its ref to the root view
const Chip = forwardRef<HostInstance, ChipProps>(
   ({ label, icon, selected = false, onPress, accessibilityLabel, className = "" }, ref) => {
      // Text color as a value: the dark: variant on a dynamic className did not apply to the selected chip
      // Theme colors (isDark, actionIcon...)
      const theme = useThemeColors()
      // Selected: inverse of the action background; otherwise a grey that fits the theme
      const textColor = selected ? theme.actionIcon : theme.isDark ? colors.neutral[300] : colors.neutral[700]

      // Container classes: pill with border; selected = black (white in dark), else white (neutral-950 in dark)
      const chipClassName = `flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${
         selected
            ? "bg-black border-black dark:bg-white dark:border-white"
            : "bg-white border-neutral-300 dark:bg-neutral-950 dark:border-neutral-800"
      } ${className}`

      // Content shared by the pressable and the plain versions: optional icon + label (maxFontSizeMultiplier caps font
      // scaling)
      const text = (
         <>
            {!!icon && (
               <FontAwesome6
                  name={icon}
                  iconStyle="solid"
                  size={12}
                  color={textColor}
               />
            )}
            <Text
               className="text-sm"
               style={{ color: textColor }}
               maxFontSizeMultiplier={1.4}
            >
               {label}
            </Text>
         </>
      )

      // Plain label: a View, not pressable
      if (!onPress)
         return (
            <View
               ref={ref}
               className={chipClassName}
            >
               {text}
            </View>
         )

      return (
         <Pressable
            ref={ref}
            className={`${chipClassName} active:opacity-70`}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ selected }}
         >
            {text}
         </Pressable>
      )
   },
)

// Name shown in React DevTools (forwardRef components are anonymous otherwise)
Chip.displayName = "Chip"

export default Chip
