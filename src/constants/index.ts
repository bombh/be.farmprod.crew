/**
 * index.ts (constants)
 *
 * Barrel file of src/constants: lets the rest of the app write `import { animations, ENABLE_ZOOM_TRANSITION } from
 * "@/src/constants"` instead of importing each file. Contains no logic.
 */

import { animations } from "./animations" // Entry animation presets for list items (played by MotionView)
import { ENABLE_ZOOM_TRANSITION } from "./features" // Feature flag of the Works list -> detail zoom transition

export { animations, ENABLE_ZOOM_TRANSITION }
