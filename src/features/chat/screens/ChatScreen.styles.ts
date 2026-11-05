import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  channels: {
    gap: 12,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
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
  inbox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
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
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
    paddingVertical: 11,
    textAlign: 'center',
  },
});
