# How to add a screen

A "screen" is a top-level destination in the tab navigator. Screens compose components,
own screen-level state, and (later) call feature hooks for data. They do not contain
reusable UI — that goes in `src/components/`.

## Steps

### 1. Create the screen file

`src/screens/<Name>Screen.tsx`, `PascalCase`, default-exported function component.

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export default function SavedListingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Saved Listings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.off_white },
  title: { fontSize: 22, fontWeight: '700', color: Colors.black },
});
```

### 2. Register it in the navigator

In `src/navigation/AppNavigator.tsx`, add an entry to the `tabs` array (import the
screen, pick active/inactive Ionicons names). The navigator maps over that array, so no
other change is needed.

If a screen needs a route param type, add it to the `TabParamList` those screens share.

### 3. Build the UI from existing pieces

- **Colors:** always from `src/constants/colors.ts` — no hard-coded hex in screens.
- **Shared UI:** reuse `src/components/` (`AppHeader`, `SearchBar`, `EventCard`, …). If
  you need a new reusable piece, see [how-to-add-a-component.md](how-to-add-a-component.md).
- **Data:** for now, pull placeholder content from `src/constants/mockData.ts`. When
  Supabase lands, screens will call a feature hook (`src/features/<feature>/hooks.ts`)
  instead — keep data-shaping out of the screen so that swap is easy.

### 4. Keep it focused

If the screen file grows past ~200 lines or handles multiple concerns, extract sections
into components. A screen should read like an outline of the page.

## Checklist

- [ ] `src/screens/<Name>Screen.tsx` created, default export, `PascalCase`.
- [ ] Registered in `src/navigation/AppNavigator.tsx`.
- [ ] Colors come from `src/constants/colors.ts`.
- [ ] Reusable UI lives in `src/components/`, not inline.
- [ ] `npx tsc --noEmit` passes.
