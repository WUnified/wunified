import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/colors';
import { Fonts } from '../../../constants/typography';

export const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 24,
  },
  avatar: {
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
  },
  // Shows a neutral circle while a remote avatar loads or if the URL fails.
  avatarImage: {
    backgroundColor: Colors.border,
  },
  avatarInitial: {
    color: Colors.onPrimary,
    fontFamily: Fonts.heading,
    fontSize: 32,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeLabel: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: Colors.onPrimary,
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    flex: 1,
    gap: 20,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  detailChip: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailGlyph: {
    color: Colors.onPrimary,
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  detailLabel: {
    color: Colors.textDim,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 52,
  },
  detailRowSeparator: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  detailsCard: {
    marginTop: 16,
    padding: 20,
  },
  detailValue: {
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    flexShrink: 1,
    fontSize: 15,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  emptyPostsBody: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyPostsCard: {
    alignItems: 'center',
    marginTop: 12,
    padding: 32,
  },
  emptyPostsTitle: {
    color: Colors.textDim,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  errorText: {
    color: Colors.danger,
    fontFamily: Fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
  fieldLabel: {
    color: Colors.textDim,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  formCard: {
    gap: 12,
    marginTop: 16,
    padding: 20,
  },
  formHeading: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
  headerCard: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
  },
  heading: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  mutedText: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
  name: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
  },
  secondaryButtonLabel: {
    color: Colors.textDim,
    fontFamily: Fonts.semiBold,
    fontSize: 16,
  },
  sectionHeading: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 18,
    marginTop: 24,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    color: Colors.text,
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
  statLabel: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  username: {
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
});
