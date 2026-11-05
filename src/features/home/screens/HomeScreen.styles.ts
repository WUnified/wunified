import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 58,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  wordmark: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  headerSpacer: {
    width: 50,
  },
  feedContent: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stateContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 260,
    paddingHorizontal: 24,
  },
  stateTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  stateMessage: {
    ...Typography.body,
    color: Colors.textDim,
    marginTop: 8,
    textAlign: 'center',
  },
  actionText: {
    ...Typography.bodyStrong,
    color: Colors.primary,
    marginTop: 12,
  },
  feedError: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  feedErrorText: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  loadingMore: {
    marginVertical: 20,
  },
});
