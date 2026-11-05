import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { styles } from './CommunityEventCard.styles';
import { Colors } from '../../../constants/colors';
import type { CommunityEvent } from '../events.types';

interface CommunityEventCardProps {
  event: CommunityEvent;
  isSavingRsvp: boolean;
  onRsvpPress: () => void;
}

function formatEventDate(startTime: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(startTime));
}

export function CommunityEventCard({ event, isSavingRsvp, onRsvpPress }: CommunityEventCardProps) {
  const isRsvped = event.rsvpStatus !== null;
  const rsvpLabel =
    event.rsvpStatus === 'going' ? 'Going' : event.rsvpStatus === 'maybe' ? 'Maybe' : 'RSVP';

  return (
    <View style={styles.card}>
      <Text style={styles.date}>{formatEventDate(event.startTime)}</Text>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.location}>{event.location}</Text>
      <Text style={styles.description}>{event.description}</Text>
      <View style={styles.footer}>
        <Text style={styles.attendance}>
          {event.rsvpStatus === 'going'
            ? "You're going"
            : event.rsvpStatus === 'maybe'
              ? 'You might go'
              : 'Open to everyone'}
        </Text>
        <Pressable
          accessibilityLabel={`${isRsvped ? 'Cancel RSVP' : 'RSVP'} for ${event.title}`}
          accessibilityRole="button"
          accessibilityState={{ selected: isRsvped, disabled: isSavingRsvp }}
          disabled={isSavingRsvp}
          onPress={onRsvpPress}
          style={({ pressed }) => [
            styles.rsvpButton,
            isRsvped && styles.rsvpedButton,
            pressed && !isSavingRsvp && styles.pressed,
          ]}
        >
          {isSavingRsvp ? (
            <ActivityIndicator accessibilityLabel="Saving RSVP" color={Colors.primary} />
          ) : (
            <Text style={[styles.rsvpButtonText, isRsvped && styles.rsvpedButtonText]}>
              {rsvpLabel}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
