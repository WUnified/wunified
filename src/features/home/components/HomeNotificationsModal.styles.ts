import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
    maxHeight: '90%',
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  closeLabel: {
    ...Typography.bodyStrong,
    color: Colors.primary,
  },
  notification: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    flexDirection: 'row',
    padding: 12,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  notificationListContent: {
    gap: 12,
  },
  time: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 5,
  },
});
