/**
 * App-wide color tokens. Screens and components reference these instead of
 * hard-coding hex. Values match the existing auth screens (dark theme).
 */
export const Colors = {
  background: '#08122B',
  surface: '#12234C',
  subtle: '#1E336C',
  // Translucent fill for the floating tab bar; paired with a blur in the design.
  glass: 'rgba(18, 35, 76, 0.85)',
  border: '#1E336C',
  primary: '#FFC82C',
  onPrimary: '#07122A',
  text: '#FFFFFF',
  textDim: '#8F9EBA',
  textMuted: '#8F9EBA',
  danger: '#F87171',
} as const;

/** Corner radii shared across cards, inputs, and pills. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const backgroundGradient = ['#0F1C38', '#08122B', '#050D1F'] as const;
