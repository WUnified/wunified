import type { TextStyle } from 'react-native';

/** App-wide font families. Load these before rendering screens. */
export const Fonts = {
  body: 'DMSans_400Regular',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  heading: 'Poppins_700Bold',
  headingHeavy: 'Poppins_800ExtraBold',
  listing: 'Poppins_600SemiBold',
} as const;

/** Reusable text styles, independent of text color. */
export const Typography = {
  screenTitle: {
    fontFamily: Fonts.headingHeavy,
    fontSize: 24,
    lineHeight: 32,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  button: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 24,
  },
  listingTitle: {
    fontFamily: Fonts.listing,
    fontSize: 14,
    lineHeight: 21,
  },
  price: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    lineHeight: 24,
  },
} as const satisfies Record<string, TextStyle>;
