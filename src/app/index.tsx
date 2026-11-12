/**
 * index.tsx (src/app, "/" route)
 *
 * Entry route of the app: immediately redirects to "/works" (the Works list, first section of the drawer).
 */

import { Redirect } from "expo-router" // Declarative redirect of expo-router

export default function index() {
   return <Redirect href="/works" />
}
