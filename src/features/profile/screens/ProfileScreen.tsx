import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { useSignOut } from '../../auth';

export function ProfileScreen() {
  const signOut = useSignOut();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile</Text>
      <Pressable
        onPress={signOut}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    gap: 20,
    justifyContent: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonLabel: {
    color: Colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
