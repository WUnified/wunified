import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

export const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 21,
    marginBottom: 16,
  },
  fieldLabel: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
  },
  optionalLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  descriptionInput: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  fieldError: {
    color: Colors.danger,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 5,
  },
  categoryChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChoice: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChoiceSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChoiceLabel: {
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  categoryChoiceLabelSelected: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semiBold,
  },
  serverError: {
    color: Colors.danger,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 14,
  },
  actions: {
    gap: 8,
    marginTop: 20,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 46,
  },
  submitLabel: {
    color: Colors.onPrimary,
    fontFamily: Fonts.heading,
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  cancelLabel: {
    color: Colors.textDim,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.75,
  },
});
