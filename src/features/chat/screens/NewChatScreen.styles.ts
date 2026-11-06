import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    ...Typography.button,
    color: Colors.onPrimary,
  },
  chips: {
    gap: 8,
  },
  controls: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
  },
  footer: {
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  groupInput: {
    ...Typography.body,
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    color: Colors.text,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  hint: {
    ...Typography.body,
    color: Colors.textDim,
    paddingHorizontal: 16,
    paddingVertical: 24,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  results: {
    flex: 1,
    marginTop: 8,
  },
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.text,
  },
});
