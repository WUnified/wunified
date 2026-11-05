import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  composer: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    maxHeight: '90%',
    overflow: 'hidden',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
  },
  composerContent: {
    gap: 14,
    padding: 20,
    paddingBottom: 32,
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
  closeLabel: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  titleInput: {
    ...Typography.body,
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    color: Colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bodyInput: {
    ...Typography.body,
    backgroundColor: Colors.subtle,
    borderRadius: Radius.md,
    color: Colors.text,
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  error: {
    ...Typography.caption,
    color: Colors.danger,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: 48,
  },
  submitLabel: {
    ...Typography.button,
    color: Colors.onPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
});
