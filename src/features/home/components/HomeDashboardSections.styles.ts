import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Fonts, Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  section: {
    marginBottom: 22,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  sectionAction: {
    ...Typography.caption,
    color: Colors.primary,
  },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    padding: 14,
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    height: 38,
    justifyContent: 'center',
    marginRight: 12,
    width: 38,
  },
  notificationIconText: {
    color: Colors.primary,
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  notificationDetail: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 2,
  },
  unreadDot: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 8,
    marginLeft: 8,
    width: 8,
  },
  horizontalCards: {
    gap: 10,
    paddingRight: 4,
  },
  eventCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    minHeight: 168,
    padding: 14,
    width: 208,
  },
  eventDate: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.sm,
    marginBottom: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  eventDateLabel: {
    ...Typography.badge,
    color: Colors.primary,
  },
  eventTitle: {
    ...Typography.cardTitle,
    color: Colors.text,
    minHeight: 44,
  },
  eventTime: {
    ...Typography.caption,
    color: Colors.text,
    marginTop: 6,
  },
  eventLocation: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 3,
  },
  eventAttendees: {
    ...Typography.badge,
    color: Colors.primary,
    marginTop: 10,
  },
  activityList: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  activityRow: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 70,
    paddingVertical: 10,
  },
  organizationAvatar: {
    alignItems: 'center',
    backgroundColor: Colors.subtle,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    marginRight: 11,
    width: 42,
  },
  organizationInitials: {
    ...Typography.badge,
    color: Colors.primary,
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
  },
  organizationName: {
    ...Typography.bodyStrong,
    color: Colors.text,
  },
  activityDescription: {
    ...Typography.caption,
    color: Colors.textDim,
    marginTop: 2,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textDim,
    marginLeft: 8,
  },
  emptyMessage: {
    ...Typography.caption,
    color: Colors.textDim,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.82,
  },
});
