/**
 * useThemeColors.ts
 *
 * Palette for the places where a color must be passed as a VALUE and not as a NativeWind class: icons, spinners
 * (ActivityIndicator), inline / animated styles, the map, the bottom sheet, HTML text color... Everything else uses
 * NativeWind `dark:` classes (className).
 *
 * Exports:
 * - `palette`: the light and dark color tables (Tailwind color constants, so values match the classes).
 * - default `useThemeColors()`: reads the current NativeWind color scheme and returns `{ isDark, ...palette[scheme] }`.
 *   Re-renders the component when the user switches theme (see lib/theme.ts and the drawer toggle).
 *
 * Keep in sync with the classes used in the app (light -> dark):
 *   background white -> neutral-950, surface white -> neutral-900, inverse black -> neutral-800,
 *   text black -> white, secondary/muted neutral-500 -> neutral-400 (neutral-500 on neutral-950 is only 4.2:1),
 *   border neutral-300 -> neutral-800, action button black -> white.
 *
 * Used by: Chip, Loading, ZoomImage, RenderHtml, Map, MapModal, HeaderBack, HeaderDrawer, works and 20 years screens.
 */

import { useColorScheme } from "nativewind" // Current scheme ("light" | "dark") from NativeWind
import colors from "tailwindcss/colors" // Tailwind color constants, the same values as the classes

// Color tables by scheme. Keys are semantic roles, values are Tailwind hex colors
export const palette = {
   // Light theme
   light: {
      // Screen background
      background: colors.white,
      // Cards, sheets and other raised surfaces
      surface: colors.white,
      // Strong contrast block (black in light, neutral-800 in dark)
      inverse: colors.black,
      // Main text and icons
      text: colors.black,
      // Secondary text
      textSecondary: colors.neutral[500],
      // Less important text (same value as secondary today)
      textMuted: colors.neutral[500],
      // Separators and outlines
      border: colors.neutral[300],
      // Placeholder / hint text and icons
      placeholder: colors.neutral[400],
      // Big icons of empty / error states
      emptyIcon: colors.neutral[300],
      // ActivityIndicator color
      spinner: colors.neutral[500],
      // Round action buttons background (inverted between themes)
      actionBackground: colors.black,
      // Icon color inside action buttons
      actionIcon: colors.white,
      // Flat color shown behind images while they load
      imageBackground: colors.neutral[200],
   },
   // Dark theme
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

// Returns { isDark, ...colors of the current theme }
export default function useThemeColors() {
   const { colorScheme } = useColorScheme()
   // True when the scheme is dark
   const isDark = colorScheme === "dark"
   return { isDark, ...(isDark ? palette.dark : palette.light) }
}
