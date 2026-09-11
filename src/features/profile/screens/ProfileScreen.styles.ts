import { StyleSheet } from 'react-native';

import { Colors } from '../../../constants/colors';

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
    fontSize: 32,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '700',
  },
  detailLabel: {
    color: Colors.textDim,
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
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 'auto',
    textAlign: 'right',
  },
  emptyPostsBody: {
    color: Colors.textMuted,
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
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 15,
    textAlign: 'center',
  },
  fieldLabel: {
    color: Colors.textDim,
    fontSize: 14,
    fontWeight: '600',
  },
  formCard: {
    gap: 12,
    marginTop: 16,
    padding: 20,
  },
  formHeading: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  headerCard: {
    alignItems: 'center',
    marginTop: 16,
    padding: 24,
  },
  heading: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: Colors.text,
    fontSize: 16,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  mutedText: {
    color: Colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  name: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeading: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statCount: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
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
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },
});
