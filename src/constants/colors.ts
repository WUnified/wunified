/**
 * App-wide color tokens. Screens and components reference these instead of
 * hard-coding hex. Values match the existing auth screens (dark theme).
 */
export const Colors = {
  background: '#08122B',
  surface: '#12234C',
  border: '#1E336C',
  primary: '#FFC82C',
  onPrimary: '#07122A',
  text: '#FFFFFF',
  textDim: '#8F9EBA',
  textMuted: '#8F9EBA',
  danger: '#F87171',
} as const;

export const backgroundGradient = ['#0F1C38', '#08122B', '#050D1F'] as const;
