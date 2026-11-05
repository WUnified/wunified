import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  date: {
    ...Typography.badge,
    color: Colors.primary,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
  location: {
    ...Typography.label,
    color: Colors.textDim,
  },
  description: {
    ...Typography.body,
    color: Colors.text,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  attendance: {
    ...Typography.caption,
    color: Colors.textDim,
    flex: 1,
    paddingRight: 12,
  },
  rsvpButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 88,
    paddingHorizontal: 16,
  },
  rsvpButtonText: {
    ...Typography.label,
    color: Colors.onPrimary,
  },
  rsvpedButton: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  rsvpedButtonText: {
    color: Colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});
