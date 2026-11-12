/**
 * features.ts
 *
 * Feature flags of the app: compile-time booleans to switch a feature on or off by editing this file.
 * Re-exported by constants/index.ts. Currently one flag:
 * - ENABLE_ZOOM_TRANSITION: the "zoom" shared-element-like transition between a work card in the Works list and the
 *   Work detail screen (hooks/useZoomTransition.tsx, used by app/(drawer)/works/index.tsx, WorkCard and WorkDetail).
 *   When false, the default stack transition of expo-router is used instead.
 */

// Feature flags
// Set to false to restore the default stack transition between Works list and Work detail
export const ENABLE_ZOOM_TRANSITION = true
