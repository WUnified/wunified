import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from './CommunityScreen.styles';
import { IconButton } from '../../../components/IconButton';
import { Colors, backgroundGradient } from '../../../constants/colors';
import type { CreateEventInput } from '../../../lib/db';
import { useSession } from '../../auth';
import { CommunityEventCard } from '../components/CommunityEventCard';
import { CommunityEventFiltersModal } from '../components/CommunityEventFiltersModal';
import { CommunityEventsCalendar } from '../components/CommunityEventsCalendar';
import { CreateCommunityEventForm } from '../components/CreateCommunityEventForm';
import { DEFAULT_EVENT_FILTERS, filterCommunityEvents } from '../eventFilters';
import type { CommunityEventFilters } from '../eventFilters';
import { useCommunityEvents, useCreateCommunityEvent } from '../events.hooks';

type EventTab = 'discover' | 'my-events';

const TABS: { id: EventTab; label: string }[] = [
  { id: 'discover', label: 'Discover' },
  { id: 'my-events', label: 'My Events' },
];

export function CommunityScreen() {
  const { session } = useSession();
  const { events, loading, loaded, error, reload, updateRsvp, savingEventIds, rsvpError } =
    useCommunityEvents(session?.user.id ?? null);
  const {
    saving: isCreatingEvent,
    error: createEventError,
    submit: submitEvent,
    clearError: clearCreateEventError,
  } = useCreateCommunityEvent(reload);
  const [activeTab, setActiveTab] = useState<EventTab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [eventFilters, setEventFilters] = useState(DEFAULT_EVENT_FILTERS);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const myEvents = useMemo(() => events.filter((event) => event.rsvpStatus !== null), [events]);
  const filteredEvents = useMemo(
    () => filterCommunityEvents(events, eventFilters),
    [events, eventFilters],
  );
  const filteredMyEvents = useMemo(
    () => filterCommunityEvents(myEvents, eventFilters),
    [myEvents, eventFilters],
  );
  const tabEvents = useMemo(
    () =>
      (activeTab === 'my-events' ? filteredMyEvents : filteredEvents)
        .filter((event) =>
          `${event.title} ${event.description} ${event.location}`
            .toLowerCase()
            .includes(normalizedQuery),
        )
        .sort((first, second) => first.startTime.localeCompare(second.startTime)),
    [activeTab, filteredEvents, filteredMyEvents, normalizedQuery],
  );
  function openCreateEventForm() {
    clearCreateEventError();
    setIsCreateEventOpen(true);
  }

  function closeCreateEventForm() {
    if (!isCreatingEvent) setIsCreateEventOpen(false);
  }

  async function handleCreateEvent(input: CreateEventInput) {
    const wasCreated = await submitEvent(input);
    if (wasCreated) {
      setActiveTab('discover');
      Alert.alert('Event created', 'Your event has been added to Discover.');
    }
    return wasCreated;
  }

  return (
    <LinearGradient colors={backgroundGradient} style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl onRefresh={reload} refreshing={loading} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <IconButton
                accessibilityLabel="Create event"
                buttonStyle={styles.addButton}
                iconSource={require('../../../../assets/community/add.png') as ImageSourcePropType}
                iconStyle={styles.addIcon}
                onPress={openCreateEventForm}
              />
              <View style={styles.searchField}>
                <Image
                  accessible={false}
                  accessibilityIgnoresInvertColors
                  source={require('../../../../assets/community/search.png') as ImageSourcePropType}
                  style={styles.searchIcon}
                />
                <TextInput
                  accessibilityLabel="Search events"
                  onChangeText={setSearchQuery}
                  placeholder="Search events..."
                  placeholderTextColor={Colors.textDim}
                  returnKeyType="search"
                  style={styles.searchInput}
                  value={searchQuery}
                />
              </View>
              <IconButton
                accessibilityLabel={
                  eventFilters.location || eventFilters.date !== 'all'
                    ? 'Filter events, filters applied'
                    : 'Filter events'
                }
                buttonStyle={styles.filterButton}
                iconSource={
                  require('../../../../assets/community/filter.png') as ImageSourcePropType
                }
                iconStyle={styles.filterIcon}
                onPress={() => setIsFilterOpen(true)}
              />
            </View>
            <View accessibilityRole="tablist" style={styles.tabsRow}>
              {TABS.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <Pressable
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={({ pressed }) => [
                      styles.tabButton,
                      isSelected && styles.selectedTab,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.tabLabel, isSelected && styles.selectedTabLabel]}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.calendarSection}>
            <CommunityEventsCalendar
              events={activeTab === 'my-events' ? filteredMyEvents : filteredEvents}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          </View>

          <View style={styles.agendaHeader}>
            <Text accessibilityRole="header" style={styles.agendaTitle}>
              All events
            </Text>
          </View>

          <View style={styles.eventsList}>
            {rsvpError ? (
              <Text accessibilityRole="alert" style={styles.errorText}>
                {rsvpError}
              </Text>
            ) : null}
            {error ? (
              <View style={styles.stateContainer}>
                <Text accessibilityRole="alert" style={styles.errorText}>
                  Unable to load events: {error}
                </Text>
                <Pressable accessibilityRole="button" onPress={reload} style={styles.stateAction}>
                  <Text style={styles.stateActionLabel}>Try again</Text>
                </Pressable>
              </View>
            ) : loading && !loaded ? (
              <View accessibilityLabel="Loading events" style={styles.loadingState}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : tabEvents.length > 0 ? (
              tabEvents.map((event) => (
                <CommunityEventCard
                  event={event}
                  isSavingRsvp={savingEventIds.includes(event.id)}
                  key={event.id}
                  onRsvpPress={() => updateRsvp(event.id, event.rsvpStatus === null)}
                />
              ))
            ) : activeTab === 'my-events' && !normalizedQuery ? (
              <View style={styles.stateContainer}>
                <Text style={styles.emptyState}>
                  You haven&apos;t RSVP&apos;d to any events yet.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setActiveTab('discover')}
                  style={styles.stateAction}
                >
                  <Text style={styles.stateActionLabel}>Explore events</Text>
                </Pressable>
              </View>
            ) : (
              <Text style={styles.emptyState}>
                {normalizedQuery
                  ? `No events match “${searchQuery.trim()}”.`
                  : 'No events are available yet.'}
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      {isFilterOpen ? (
        <CommunityEventFiltersModal
          filters={eventFilters}
          onApply={(nextFilters: CommunityEventFilters) => {
            setEventFilters(nextFilters);
            setIsFilterOpen(false);
          }}
          onClear={() => {
            setEventFilters(DEFAULT_EVENT_FILTERS);
            setIsFilterOpen(false);
          }}
          onClose={() => setIsFilterOpen(false)}
          visible
        />
      ) : null}
      <Modal
        animationType="slide"
        onRequestClose={closeCreateEventForm}
        transparent
        visible={isCreateEventOpen}
      >
        <View style={styles.createModalBackdrop}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.createModalSheet}>
            {isCreateEventOpen ? (
              <CreateCommunityEventForm
                error={createEventError}
                onCancel={closeCreateEventForm}
                onSubmit={handleCreateEvent}
                saving={isCreatingEvent}
              />
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </LinearGradient>
  );
}
