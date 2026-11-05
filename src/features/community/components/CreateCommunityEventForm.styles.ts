import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  content: {
    gap: 12,
    padding: 20,
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.text,
    marginBottom: 4,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 6,
  },
  optionalLabel: {
    ...Typography.caption,
    color: Colors.textDim,
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
    paddingVertical: 10,
  },
  descriptionInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
    minWidth: 0,
  },
  fieldError: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
  },
  serverError: {
    ...Typography.body,
    color: Colors.danger,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: 46,
  },
  submitLabel: {
    ...Typography.button,
    color: Colors.onPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  cancelLabel: {
    ...Typography.label,
    color: Colors.textDim,
  },
  pressed: {
    opacity: 0.8,
  },
});
