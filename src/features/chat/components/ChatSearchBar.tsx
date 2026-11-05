import { Image, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const searchIcon = require('../../../../assets/search-icon.png') as ImageSourcePropType;

type ChatSearchBarProps = {
  onChangeText: (value: string) => void;
  value: string;
};

export function ChatSearchBar({ onChangeText, value }: ChatSearchBarProps) {
  return (
    <View style={styles.container}>
      <Image importantForAccessibility="no" source={searchIcon} style={styles.icon} />
      <TextInput
        accessibilityLabel="Search chats"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder="Search chats"
        placeholderTextColor={Colors.textDim}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  icon: {
    height: 24,
    width: 24,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    paddingVertical: 12,
  },
});
