# Quickstart

Get WUnified running on your machine in a few minutes.

## Prerequisites

- **Node.js 20+** and **npm** (bundled with Node).
- One way to view the app:
  - **Expo Go** on a physical phone (iOS App Store / Google Play), or
  - **iOS Simulator** (Xcode, macOS only), or
  - **Android Emulator** (Android Studio).
- Git.

You **do** need Supabase credentials to get past the login screen — set
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (see `src/lib/env.ts`).
Without them the app shows a "Supabase setup needed" screen. Past login, the feature tabs
are still placeholders.

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

- Routing is file-based (**Expo Router**). **`app/_layout.tsx`** mounts providers and the
  auth gate; **`app/(auth)/`** holds login/signup; **`app/(tabs)/`** holds the four
  signed-in tabs. Route files are thin — they render a screen from a feature module.
- Each tab's screen lives in **`src/features/<feature>/screens/`**, composed from reusable
  UI in **`src/components/`** and styled with tokens from **`src/constants/colors.ts`**.
- **`src/features/auth/`** has the working Supabase Auth flow (`SessionProvider`,
  `useSession`, `useSignOut`, login/signup screens).
- Supabase Auth is wired; data queries (Postgres + RLS) are not — `src/lib/db/` is the
  boundary stub where they'll live.

## Next

- Adding a screen → [how-to-add-a-screen.md](how-to-add-a-screen.md)
- Adding a component → [how-to-add-a-component.md](how-to-add-a-component.md)
- The bigger picture → [../architecture.md](../architecture.md)
