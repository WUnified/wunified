import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textDim,
    paddingVertical: 24,
    textAlign: 'center',
    // The list is inverted, so the empty state must be flipped back upright.
    transform: [{ scaleY: -1 }],
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
    gap: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  messages: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  sendError: {
    ...Typography.caption,
    color: Colors.danger,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});
