# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Native mobile app built with **Expo SDK 51** and **expo-router** for the Farm Prod street art collective. Showcases works, artists, tours (interactive maps), and a 20-year anniversary section. Content is managed via a headless **Ghost CMS** API.

## Commands

```bash
npm start          # Start Expo dev server (clears cache)
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run web        # Run on web
npm run lint       # Expo linter
npm test           # Jest in watch mode (jest-expo preset, minimal test coverage)
```

EAS Build: configured via `eas.json` with development, preview, and production profiles.

## Architecture

### Routing (expo-router, file-based)

All routes live in `src/app/`. The root `index.jsx` redirects to `/works`. A `(drawer)` route group wraps all screens in drawer navigation:

- `(drawer)/works/` — list, detail, pictures (image gallery)
- `(drawer)/artists/` — grid of artist cards
- `(drawer)/tours/` — list + detail with interactive maps
- `(drawer)/20years/` — anniversary content + gallery
- `(drawer)/about/` — about page

### Data Fetching

Two custom hooks in `src/hooks/`:

- **`useAPI`** — fetches from Ghost CMS (`/ghost/api/content/`). Takes HTTP method, endpoint, and optional query params. Ghost posts = works, authors = artists, pages = static content.
- **`useFetch`** — generic fetch for external JSON (tour map data from `map.farmprod.be`).

Both return `{ data, isLoading, error, isError, refetch }`.

API credentials are in `.env` as `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_KEY`.

### Styling

**NativeWind v2** (Tailwind CSS for React Native) with config in `tailwind.config.js`. Custom font: `PermanentMarker-Regular`. Babel plugin configured in `babel.config.js`.

### Key Libraries

- **@shopify/flash-list** — performant list rendering (used instead of FlatList)
- **expo-image** — optimized images with placeholders and size transforms (`/size/w300/`, `/size/w600/`)
- **moti** — declarative animations (entry animations on list items, elastic easing)
- **react-native-maps** — interactive tour maps with custom markers
- **@gorhom/bottom-sheet** — modal sheets on map detail views
- **react-native-awesome-gallery** — zoomable image galleries

### Component Organization

- `src/components/app/` — shared UI (Loading, RenderHtml, ScreenTitle)
- `src/components/map/` — Map, MapMarker, MapModal
- `src/components/` — feature cards (WorkCard, ArtistCard, TourCard)
- `src/layouts/` — navigation layouts (AppDrawer, HeaderDrawer, HeaderBack)
- `src/screens/` — reusable screen components (Gallery)
- `src/utils/html.js` — HTML parsing/cleaning for Ghost CMS content (extracts images, strips unwanted tags)
- `src/constants/animations.js` — shared Moti animation configs

### Patterns

- No global state management — local state + props + navigation params
- `useTransitionEnd` hook delays heavy renders (maps) until screen transitions complete
- Console statements are stripped in production via `babel-plugin-transform-remove-console`
- Portrait-only orientation
- Custom deep link scheme: `farmprod://`

## Code Style

- 3-space indentation
- No semicolons
- Prettier with `printWidth: 120`, single attribute per line
- JSX files (not TSX despite TypeScript being configured)
- Path alias: `@/*` maps to project root
