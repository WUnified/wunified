import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

export function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Chat</Text>
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
