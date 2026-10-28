/**
 * theme.js
 * Theme preference ("light" | "dark"), applied with NativeWind colorScheme.set()
 * (which also overrides the native appearance: Apple Maps, alerts, keyboards follow it)
 * and persisted with AsyncStorage.
 * Until the user picks a theme, the app follows the OS setting (NativeWind "system").
 */
import AsyncStorage from "@react-native-async-storage/async-storage"
import { colorScheme } from "nativewind"

export const THEME_STORAGE_KEY = "farmprod-theme"
export const THEME_OPTIONS = ["light", "dark"]

const isValid = (value) => THEME_OPTIONS.includes(value)

const apply = (value) => {
   try {
      colorScheme.set(value)
   } catch {}
}

// Restore the user's choice (called at startup, before hiding the splash screen)
// No saved choice (or the former "system" value): keep following the OS
export const loadThemePreference = async () => {
   try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY)
      if (isValid(saved)) {
         apply(saved)
         return saved
      }
   } catch {}
   return null
}

export const setThemePreference = (value) => {
   if (!isValid(value)) return
   apply(value)
   AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {})
}
