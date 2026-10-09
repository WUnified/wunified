import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

export function CommunityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Community</Text>
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
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
});
