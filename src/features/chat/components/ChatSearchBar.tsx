import { Image, StyleSheet, TextInput, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

const searchIcon = require('../../../../assets/search-icon.png') as ImageSourcePropType;

type ChatSearchBarProps = {
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
};

export function ChatSearchBar({
  onChangeText,
  placeholder = 'Search chats',
  value,
}: ChatSearchBarProps) {
  return (
    <View style={styles.container}>
      <Image importantForAccessibility="no" source={searchIcon} style={styles.icon} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Matches the Marketplace and Community search fields.
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    paddingHorizontal: 13,
  },
  icon: {
    height: 20,
    width: 20,
  },
  input: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    minWidth: 0,
    padding: 0,
  },
});
