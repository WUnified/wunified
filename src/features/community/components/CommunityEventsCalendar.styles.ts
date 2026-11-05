import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  monthHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthTitle: {
    ...Typography.price,
    color: Colors.text,
  },
  navigation: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  navigationButton: {
    height: 18,
    width: 18,
  },
  navigationIcon: {
    height: 18,
    width: 18,
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekday: {
    ...Typography.badge,
    color: Colors.textDim,
    textAlign: 'center',
    width: '14.2857%',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  daySlot: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: '14.2857%',
  },
  dayButton: {
    alignItems: 'center',
    borderRadius: Radius.full,
    gap: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  dayNumber: {
    ...Typography.caption,
    color: Colors.text,
    textAlign: 'center',
  },
  outsideMonth: {
    color: Colors.textDim,
  },
  selectedDayNumber: {
    ...Typography.label,
    color: Colors.onPrimary,
  },
  eventDayNumber: {
    ...Typography.label,
  },
  eventDot: {
    height: 4,
    width: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
