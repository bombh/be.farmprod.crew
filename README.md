# Farm Prod Crew

Mobile app for the **Farm Prod** street art collective: browse the collective's works and artists, follow street art
tours on interactive maps, and discover the 20-year anniversary book and exhibition.

Content (works, artists, pages) comes from the collective's headless **Ghost CMS**; tour map data comes from
`map.farmprod.be`.

## Stack

- [Expo](https://expo.dev) SDK 54, React 19.1, React Native 0.81
- [expo-router](https://docs.expo.dev/router/introduction/) v6 (file-based routing, drawer navigation via React Navigation v7)
- [NativeWind](https://www.nativewind.dev/) v4 (Tailwind CSS via `className`)
- axios, @shopify/flash-list, expo-image, moti, react-native-reanimated v4, react-native-maps, @gorhom/bottom-sheet,
  react-native-awesome-gallery

## Setup

```bash
npm install
```

`.npmrc` sets `legacy-peer-deps=true` (needed for `react-native-awesome-gallery`).

Create a `.env` file at the project root with the Ghost Content API settings:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-ghost-site/ghost/api/content/
EXPO_PUBLIC_API_KEY=your-ghost-content-api-key
```

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm start`       | Start the Expo dev server (clears cache) |
| `npm run ios`     | Start and open on the iOS simulator      |
| `npm run android` | Start and open on the Android emulator   |
| `npm run web`     | Start and open in the browser            |
| `npm run lint`    | Run the Expo linter                      |
| `npm test`        | Run Jest in watch mode                   |

## Project structure

```
src/
  app/              Routes (expo-router); (drawer)/ holds works, artists, tours, 20years, about
  components/       Feature cards (WorkCard, ArtistCard, TourCard)
    app/            Shared UI (Loading, RenderHtml, ScreenTitle)
    map/            Map, MapMarker, MapModal
  constants/        Shared Moti animation configs
  data/             Static data (map style)
  hooks/            useAPI (Ghost CMS), useFetch (tour data), useTransitionEnd
  layouts/          Navigation layouts (AppDrawer, HeaderDrawer, HeaderBack, StackNoHeader)
  screens/          Reusable screens (Gallery)
  utils/html.js     Ghost HTML parsing helpers
assets/             Fonts and images
```

## Builds (EAS)

Build profiles are defined in `eas.json`:

| Profile       | Use                                        |
| ------------- | ------------------------------------------ |
| `development` | Development client, internal distribution  |
| `preview`     | Internal distribution for testing          |
| `production`  | Store build, build number auto-incremented |

```bash
eas build --profile preview --platform ios
```
