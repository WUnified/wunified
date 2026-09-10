# Quickstart

Get WUnified running on your machine in a few minutes.

## Prerequisites

- **Node.js 20+** and **npm** (bundled with Node).
- One way to view the app:
  - **Expo Go** on a physical phone (iOS App Store / Google Play), or
  - **iOS Simulator** (Xcode, macOS only), or
  - **Android Emulator** (Android Studio).
- Git.

You do **not** need Supabase credentials yet — the app currently runs entirely on mock
data (`src/constants/mockData.ts`).

## Setup

```bash
git clone <repo-url>
cd wunified
npm install
```

## Run

```bash
npm start          # Expo dev server + QR code for Expo Go
npm run ios        # open in the iOS Simulator
npm run android    # open in the Android Emulator
npm run web        # open in a browser
```

With `npm start` running, press `i` / `a` / `w` in the terminal to launch a target, or
scan the QR code with Expo Go.

## Type-check

```bash
npx tsc --noEmit
```

## What you're looking at

- **`App.tsx`** wires providers and hands off to **`src/navigation/AppNavigator.tsx`**,
  which defines the bottom-tab navigator.
- Each tab is a screen in **`src/screens/`**, composed from reusable UI in
  **`src/components/`**, styled with tokens from **`src/constants/colors.ts`**, and
  filled with placeholder content from **`src/constants/mockData.ts`**.
- Backend integration (Supabase Auth + Postgres) is planned but not wired: `src/lib/`
  holds the placeholder boundaries where it will live.

## Next

- Adding a screen → [how-to-add-a-screen.md](how-to-add-a-screen.md)
- Adding a component → [how-to-add-a-component.md](how-to-add-a-component.md)
- The bigger picture → [../architecture.md](../architecture.md)
