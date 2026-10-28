import { forwardRef } from "react"
import { Pressable, Text, View } from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import colors from "tailwindcss/colors"
import useThemeColors from "@/src/hooks/useThemeColors"

// Pill used by the filter rows and the work cards.
// Without onPress it is a plain (non pressable) label, so a parent Pressable keeps receiving the touches.
// icon: optional FontAwesome6 name shown before the label
const Chip = forwardRef(({ label, icon, selected = false, onPress, accessibilityLabel, className = "" }, ref) => {
   // Text color as a value: the dark: variant on a dynamic className did not apply to the selected chip
   const theme = useThemeColors()
   const textColor = selected ? theme.actionIcon : theme.isDark ? colors.neutral[300] : colors.neutral[700]

   const chipClassName = `flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${
      selected
         ? "bg-black border-black dark:bg-white dark:border-white"
         : "bg-white border-neutral-300 dark:bg-neutral-950 dark:border-neutral-800"
   } ${className}`

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
})

Chip.displayName = "Chip"

export default Chip
