import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  emptyBody: {
    ...Typography.body,
    color: Colors.textDim,
    textAlign: 'center',
  },
  emptyTitle: {
    ...Typography.sectionTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  list: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
  },
  retryLabel: {
    ...Typography.button,
    color: Colors.onPrimary,
  },
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  state: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
});
