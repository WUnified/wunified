import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: Colors.glass,
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
  },
  closeButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  closeLabel: {
    ...Typography.label,
    color: Colors.textDim,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.text,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  optionLabelSelected: {
    color: Colors.onPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  secondaryLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 46,
  },
  applyLabel: {
    ...Typography.label,
    color: Colors.onPrimary,
  },
});
