# How to add a screen

A "screen" is a destination rendered by a route in `app/`. Screens compose components,
own screen-level state, and call the feature's hooks for data. They do not contain
reusable UI (that goes in `src/components/`) and route files do not contain screen logic.

Screens live with their feature: `src/features/<feature>/screens/<Name>Screen.tsx`. The
route file in `app/` is a thin wrapper.

## Steps

### 1. Create the screen component

`src/features/<feature>/screens/<Name>Screen.tsx` — `PascalCase`, **named** export,
function component.

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';

export function SavedListingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Listings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
});
```

Export it from the feature barrel (`src/features/<feature>/index.ts`):

```ts
export { SavedListingsScreen } from './screens/SavedListingsScreen';
```

### 2. Add the route

Create a route file under `app/`. For a new tab, add `app/(tabs)/<name>.tsx` and register
it in `app/(tabs)/_layout.tsx`'s `<Tabs>`. For a pushed screen, add e.g.
`app/listing/[id].tsx`. The route file just re-exports the screen:

```tsx
// app/(tabs)/saved.tsx
import { SavedListingsScreen } from '../../src/features/marketplace';

export default SavedListingsScreen;
```

```tsx
// app/(tabs)/_layout.tsx — add inside <Tabs>
<Tabs.Screen name="saved" options={{ title: 'Saved' }} />
```

Navigate to it with `expo-router`'s `router` (`router.push('/listing/42')`) or `<Link>`.

### 3. Build the UI from existing pieces

- **Colors:** always from `src/constants/colors.ts` — no hard-coded hex.
- **Shared UI:** reuse `src/components/`. New reusable piece → see
  [how-to-add-a-component.md](how-to-add-a-component.md).
- **Data:** call a hook from `src/features/<feature>/hooks.ts`; keep data-shaping out of
  the screen. The feature's `api.ts` talks to `src/lib/db/` — the screen never touches
  Supabase directly.

### 4. Keep it focused

If the screen file grows past ~200 lines or handles multiple concerns, extract sections
into components. A screen should read like an outline of the page.

## Checklist

- [ ] `src/features/<feature>/screens/<Name>Screen.tsx` created, named export, `PascalCase`.
- [ ] Exported from the feature `index.ts` barrel.
- [ ] Route file added under `app/` (and registered in `_layout.tsx` if it's a tab).
- [ ] Colors come from `src/constants/colors.ts`.
- [ ] Reusable UI lives in `src/components/`, not inline.
- [ ] `npx tsc --noEmit` passes.
