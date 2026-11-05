import { StyleSheet } from 'react-native';

import { Colors, Radius } from '../../../constants/colors';
import { Typography } from '../../../constants/typography';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    gap: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    height: 56,
    width: 56,
  },
  addIcon: {
    height: 24,
    width: 24,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    minWidth: 0,
    paddingHorizontal: 14,
  },
  searchIcon: {
    height: 18,
    width: 18,
  },
  searchInput: {
    ...Typography.caption,
    color: Colors.text,
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  filterIcon: {
    height: 20,
    width: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectedTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabLabel: {
    ...Typography.label,
    color: Colors.text,
  },
  selectedTabLabel: {
    color: Colors.onPrimary,
  },
  calendarSection: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  agendaHeader: {
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  agendaTitle: {
    ...Typography.sectionEyebrow,
    color: Colors.textDim,
  },
  eventsList: {
    gap: 16,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  loadingState: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  emptyState: {
    ...Typography.body,
    color: Colors.textDim,
    paddingVertical: 16,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    textAlign: 'center',
  },
  stateAction: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  stateActionLabel: {
    ...Typography.label,
    color: Colors.onPrimary,
  },
  createModalBackdrop: {
    backgroundColor: Colors.glass,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  createModalSheet: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
});
