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
    height: 60,
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  logoViewport: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 132,
  },
  logoImage: {
    height: 132,
    position: 'absolute',
    top: -44,
    width: 132,
  },
  notificationButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 50,
  },
  notificationIcon: {
    height: 24,
    width: 24,
  },
  notificationBadge: {
    backgroundColor: Colors.primary,
    borderColor: Colors.background,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    height: 9,
    position: 'absolute',
    right: 15,
    top: 10,
    width: 9,
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
  feedHeading: {
    borderTopColor: Colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    paddingTop: 16,
  },
  feedTitle: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  feedSubtitle: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
