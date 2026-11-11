# ☕ StudySpot

**Find your cozy corner to study.** StudySpot helps students find calm, comfy places to work (cafés, libraries, campuses, co-working spaces) and keeps them company while they study, with a little support animal, a focus timer, ambient sounds and breathing breaks.

## Features

### Find study spots
- **Live map and list** of nearby spots from OpenStreetMap, with emoji pins, hover-to-highlight and a recenter button
- **Search, category chips and filters**: distance, Wi-Fi, outlets, quietness, seating and overall rating
- **Any area**: uses your location, or search any city. If location is off, it falls back to a default city
- **Spot pages** with rating breakdowns, hours, amenities, directions and sharing

### Community
- **Accounts**: sign up / log in (a demo account is included)
- **Saved spots**: tap the ♥ on any card
- **Reviews**: rate Wi-Fi, outlets, quietness and seating. Reviews blend into the displayed ratings, and you can edit or delete your own
- **Add Spot**: drop a pin on a map (or use "I'm here now") to share a hidden gem
- **Profile**: your saved spots, reviews, added spots and focus stats

### Stress-less studying (the cozy dock, bottom right)
- 🐱 **Study buddy**: a cat, dog or bunny that roams the screen, naps, follows your cursor and cheers you on when you click it. Rename or hide it any time
- ⏱️ **Focus timer**: Pomodoro presets (25/5, 50/10, 15/3), progress ring, tab-title countdown, gentle chime, daily 🍅 tally
- 🎧 **Cozy sounds**: rain, café murmur, fireplace and ocean waves, generated live in the browser and mixed with your own volumes
- 🍃 **Breathing break**: a guided one-minute box-breathing exercise, also offered after each focus session
- 🌙 **Cozy night mode**: warm cocoa-and-candlelight theme with a sun/moon toggle

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) · Mapbox GL · OpenStreetMap Overpass API · Nominatim geocoding · Web Audio API · next-themes

## Getting started

```bash
npm install
echo VITE_MAPBOX_TOKEN=your_public_token > .env   # needed for the maps
npm run dev             # http://localhost:8080
```

| Script            | What it does               |
| ----------------- | -------------------------- |
| `npm run dev`     | Start the dev server       |
| `npm run build`   | Production build to `dist` |
| `npm run preview` | Preview the production build |
| `npm run lint`    | Lint the project           |

### Environment variables

| Variable            | Description |
| ------------------- | ----------- |
| `VITE_MAPBOX_TOKEN` | Public Mapbox token used for the maps, kept in a local `.env` file that is git-ignored. Get one free at [mapbox.com](https://account.mapbox.com/). Without it, everything works except the maps, which show a setup hint. |

## Data and privacy

StudySpot has no backend yet. Accounts, saved spots, reviews, added spots and preferences are stored in your browser's `localStorage`, so they stay on your device and are not shared between devices or users. Passwords are salted and hashed before saving, but this is a **demo-grade** setup, not real authentication. The storage layer (`src/lib/storage.ts`, `src/context/AppProvider.tsx`) is set up so a real backend can replace it later.

Spot data comes from [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. Ratings for OSM places start as estimates based on the type of place, and student reviews refine them. If the public Overpass servers are busy, StudySpot shows sample spots and offers a "Try again" link.

## Project structure

```
src/
  components/
    companion/   # roaming support animal (SVG pets, behaviour, settings)
    cozy/        # dock, focus timer, ambient mixer, breathing break, hero scene, theme toggle
    ui/          # shadcn/ui primitives
  context/       # app state: auth, bookmarks, reviews, community spots, preferences
  hooks/         # useFocusTimer, useAmbient, …
  lib/           # categories, storage, ratings, ambient audio engine, event bus
  pages/         # Home, LocationDetail, AddLocation, Profile, Login, Signup, NotFound
  services/      # Overpass (OSM) and geocoding clients
```
