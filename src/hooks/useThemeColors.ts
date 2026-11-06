/**
 * useThemeColors.js
 * Palette for the places where a color must be passed as a value (icons, ActivityIndicator,
 * inline/animated styles, bottom sheet...). Everything else uses NativeWind `dark:` classes.
 * Keep in sync with the classes used in the app (light → dark):
 *   background white → neutral-950, surface white → neutral-900, inverse black → neutral-800,
 *   text black → white, secondary/muted neutral-500 → neutral-400 (neutral-500 on neutral-950 is only 4.2:1),
 *   border neutral-300 → neutral-800, action button black → white.
 */
import { useColorScheme } from "nativewind"
import colors from "tailwindcss/colors"

export const palette = {
   light: {
      background: colors.white,
      surface: colors.white,
      inverse: colors.black,
      text: colors.black,
      textSecondary: colors.neutral[500],
      textMuted: colors.neutral[500],
      border: colors.neutral[300],
      placeholder: colors.neutral[400],
      emptyIcon: colors.neutral[300],
      spinner: colors.neutral[500],
      actionBackground: colors.black,
      actionIcon: colors.white,
      imageBackground: colors.neutral[200],
   },
   dark: {
      background: colors.neutral[950],
      surface: colors.neutral[900],
      inverse: colors.neutral[800],
      text: colors.white,
      textSecondary: colors.neutral[400],
      textMuted: colors.neutral[400],
      border: colors.neutral[800],
      placeholder: colors.neutral[500],
      emptyIcon: colors.neutral[700],
      spinner: colors.neutral[400],
      actionBackground: colors.white,
      actionIcon: colors.neutral[950],
      imageBackground: colors.neutral[800],
   },
}

export default function useThemeColors() {
   const { colorScheme } = useColorScheme()
   const isDark = colorScheme === "dark"
   return { isDark, ...(isDark ? palette.dark : palette.light) }
}
