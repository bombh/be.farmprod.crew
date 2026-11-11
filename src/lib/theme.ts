/**
 * theme.ts
 * Theme preference ("light" | "dark"), applied with NativeWind colorScheme.set()
 * (which also overrides the native appearance: Apple Maps, alerts, keyboards follow it)
 * and persisted with AsyncStorage.
 * Until the user picks a theme, the app follows the OS setting (NativeWind "system").
 */
import AsyncStorage from "@react-native-async-storage/async-storage"
import { colorScheme } from "nativewind"

export type ThemePreference = "light" | "dark"

export const THEME_STORAGE_KEY = "farmprod-theme"
export const THEME_OPTIONS: readonly ThemePreference[] = ["light", "dark"]

const isValid = (value: unknown): value is ThemePreference => THEME_OPTIONS.includes(value as ThemePreference)

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

export const setThemePreference = (value: unknown) => {
   if (!isValid(value)) return
   apply(value)
   AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {})
}
