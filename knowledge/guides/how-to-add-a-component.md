# How to add a component

Components in `src/components/` are **reusable, presentational** UI. They render props
and raise callbacks. They do not fetch data, read navigation state, or hold app state.

## Steps

### 1. Create the file

`src/components/<Name>.tsx`, `PascalCase` filename and component name, named or default
export (match the neighbours — the existing components default-export).

```tsx
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../constants/colors';

type Props = {
  title: string;
  meta: string;
  onPress?: () => void;
};

export function ListingCard({ title, meta }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
});
```

### 2. Type the props

- A component takes primitives / small view-model props, not raw DB rows. Feature screens
  map data (e.g. `Tables<'marketplace_listings'>` from `src/types/database.ts`) into these
  props before passing them in.
- If a prop type is only used by this component, declare it in the file. If two+ files
  need it, put it in the owning feature's `types.ts`.
- No `any`. No implicit `any` on props.

### 3. Keep it presentational

- Inputs are props; outputs are callbacks (`onPress`, `onChange`).
- No router hooks, no data fetching, no feature-hook calls — the screen passes those in.
- Colors and spacing come from `src/constants/colors.ts`; no hard-coded hex.

### 4. Comment the why

Only comment non-obvious decisions (a layout workaround, a platform quirk). Don't
narrate JSX.

## Checklist

- [ ] `src/components/<Name>.tsx`, `PascalCase`.
- [ ] Props typed; shared shapes come from `src/types/`.
- [ ] No data fetching, navigation, or global state.
- [ ] Colors from `src/constants/colors.ts`.
- [ ] `npx tsc --noEmit` passes.
