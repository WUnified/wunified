# How to add a component

Components in `src/components/` are **reusable, presentational** UI. They render props
and raise callbacks. They do not fetch data, read navigation state, or hold app state.

## Steps

### 1. Create the file

`src/components/<Name>.tsx`, `PascalCase` filename and component name, named or default
export (match the neighbours — the existing components default-export).

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import type { Event } from '../types';

type Props = {
  event: Event;
  onPress?: () => void;
};

export default function EventCard({ event, onPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>{event.time} · {event.location}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.black },
  meta: { fontSize: 13, color: Colors.medium_gray, marginTop: 2 },
});
```

### 2. Type the props

- Reuse shared shapes from `src/types/` (`Event`, `Listing`, `Post`).
- If a type is only used by this component, declare it in the file. If two+ files need
  it, move it to `src/types/`.
- No `any`. No implicit `any` on props.

### 3. Keep it presentational

- Inputs are props; outputs are callbacks (`onPress`, `onChange`).
- No `useNavigation`, no data calls, no `mockData` imports — the screen passes those in.
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
