import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';

export function MarketplaceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Marketplace</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
});
