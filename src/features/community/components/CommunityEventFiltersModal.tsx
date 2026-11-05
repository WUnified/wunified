import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './CommunityEventFiltersModal.styles';
import { Colors } from '../../../constants/colors';
import { DEFAULT_EVENT_FILTERS } from '../eventFilters';
import type { CommunityEventFilters, EventDateFilter } from '../eventFilters';

interface CommunityEventFiltersModalProps {
  visible: boolean;
  filters: CommunityEventFilters;
  onApply: (filters: CommunityEventFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

const DATE_OPTIONS: { id: EventDateFilter; label: string }[] = [
  { id: 'all', label: 'Any date' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export function CommunityEventFiltersModal({
  visible,
  filters,
  onApply,
  onClear,
  onClose,
}: CommunityEventFiltersModalProps) {
  const [draftFilters, setDraftFilters] = useState(filters);

  function chooseDate(date: EventDateFilter) {
    setDraftFilters((current) => ({ ...current, date }));
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Filter events
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeLabel}>Close</Text>
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            accessibilityLabel="Filter by location"
            autoCapitalize="words"
            onChangeText={(location) => setDraftFilters((current) => ({ ...current, location }))}
            placeholder="Any location"
            placeholderTextColor={Colors.textDim}
            style={styles.input}
            value={draftFilters.location}
          />
          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.options}>
            {DATE_OPTIONS.map((option) => {
              const isSelected = draftFilters.date === option.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={option.id}
                  onPress={() => chooseDate(option.id)}
                  style={[styles.option, isSelected && styles.optionSelected]}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setDraftFilters(DEFAULT_EVENT_FILTERS);
                onClear();
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryLabel}>Clear filters</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onApply(draftFilters)}
              style={styles.applyButton}
            >
              <Text style={styles.applyLabel}>Apply filters</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
