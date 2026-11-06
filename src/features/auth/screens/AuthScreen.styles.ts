import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const authScreenStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  form: {
    alignSelf: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: 16,
    maxWidth: 440,
    padding: 24,
    width: '100%',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 4,
  },
  logoWindow: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
    maxWidth: 260,
    overflow: 'hidden',
    width: '100%',
  },
  logoImage: {
    height: 260,
    position: 'absolute',
    top: -94,
    width: '100%',
  },
  title: {
    ...Typography.screenTitle,
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.subtle,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    color: Colors.text,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textDim,
  },
  message: {
    ...Typography.caption,
    color: Colors.danger,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    ...Typography.button,
    color: Colors.onPrimary,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    ...Typography.bodyStrong,
    color: Colors.text,
    textAlign: 'center',
  },
});
