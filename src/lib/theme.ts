/**
 * theme.ts
 *
 * Theme preference ("light" | "dark"): applied with NativeWind `colorScheme.set()` (which also overrides the native
 * appearance: Apple Maps, alerts and keyboards follow it) and persisted with AsyncStorage under "farmprod-theme".
 * Until the user picks a theme, the app follows the OS setting (NativeWind "system").
 *
 * Used by: app/_layout.tsx calls `loadThemePreference()` at startup, before hiding the splash screen, so the saved
 * theme is in place on the first frame; layouts/AppDrawer.tsx calls `setThemePreference()` from the light / dark
 * toggle of the drawer. Components read the resulting scheme through hooks/useThemeColors.ts.
 * Storage errors are swallowed: the theme then just is not persisted.
 */

import AsyncStorage from "@react-native-async-storage/async-storage" // Persistent key-value storage of the choice
import { colorScheme } from "nativewind" // NativeWind API to force the color scheme

// The two themes a user can force
export type ThemePreference = "light" | "dark"

// AsyncStorage key of the saved choice
export const THEME_STORAGE_KEY = "farmprod-theme"
// All valid values, used to validate what is read from storage / given by callers
export const THEME_OPTIONS: readonly ThemePreference[] = ["light", "dark"]

// Type guard: true for "light" or "dark" (rejects the former "system" value and garbage)
const isValid = (value: unknown): value is ThemePreference => THEME_OPTIONS.includes(value as ThemePreference)

// Forces the NativeWind (and native) color scheme; errors ignored
const apply = (value: ThemePreference) => {
   try {
      colorScheme.set(value)
   } catch {}
}

// Restore the user's choice (called at startup, before hiding the splash screen)
// No saved choice (or the former "system" value): keep following the OS
export const loadThemePreference = async (): Promise<ThemePreference | null> => {
   try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      if (isValid(saved)) {
         apply(saved)
         return saved
      }
   } catch {}
   return null
}

// Applies a theme and saves it. `value` is validated: invalid values are ignored; the save is fire-and-forget
export const setThemePreference = (value: unknown) => {
   if (!isValid(value)) return
   apply(value)
   AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {})
}
