import { Pressable, ScrollView, Text, View } from 'react-native';

import type {
  HomeDashboardEvent,
  HomeDashboardNotification,
  HomeOrganizationActivity,
} from '../homeDashboardMockData';
import { styles } from './HomeDashboardSections.styles';
import { HomeNotificationsModal } from './HomeNotificationsModal';

interface HomeDashboardSectionsProps {
  notifications: HomeDashboardNotification[];
  events: HomeDashboardEvent[];
  organizationActivity: HomeOrganizationActivity[];
  notificationsVisible: boolean;
  onOpenNotifications: () => void;
  onCloseNotifications: () => void;
}

export function HomeDashboardSections({
  notifications,
  events,
  organizationActivity,
  notificationsVisible,
  onOpenNotifications,
  onCloseNotifications,
}: HomeDashboardSectionsProps) {
  const featuredNotification = notifications[0];

  return (
    <>
      <View style={styles.section}>
        <SectionHeading title="Notifications" action="View all" onPress={onOpenNotifications} />
        {featuredNotification ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open notification center"
            onPress={onOpenNotifications}
            style={({ pressed }) => [styles.notificationCard, pressed && styles.pressed]}
          >
            <View style={styles.notificationIcon}>
              <Text style={styles.notificationIconText}>!</Text>
            </View>
            <View style={styles.notificationCopy}>
              <Text style={styles.notificationTitle}>{featuredNotification.title}</Text>
              <Text numberOfLines={2} style={styles.notificationDetail}>
                {featuredNotification.detail}
              </Text>
            </View>
            {featuredNotification.unread ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        ) : (
          <Text style={styles.emptyMessage}>You’re all caught up.</Text>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Upcoming events" />
        {events.length ? (
          <ScrollView
            contentContainerStyle={styles.horizontalCards}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventDate}>
                  <Text style={styles.eventDateLabel}>{event.dateLabel}</Text>
                </View>
                <Text numberOfLines={2} style={styles.eventTitle}>
                  {event.title}
                </Text>
                <Text style={styles.eventTime}>{event.timeLabel}</Text>
                <Text numberOfLines={1} style={styles.eventLocation}>
                  {event.location}
                </Text>
                <Text style={styles.eventAttendees}>{event.attendeeLabel}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyMessage}>No upcoming events to show.</Text>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Organization activity" />
        <View style={styles.activityList}>
          {organizationActivity.length ? (
            organizationActivity.map((item) => (
              <View key={item.id} style={styles.activityRow}>
                <View style={styles.organizationAvatar}>
                  <Text style={styles.organizationInitials}>{item.initials}</Text>
                </View>
                <View style={styles.activityCopy}>
                  <Text style={styles.organizationName}>{item.organization}</Text>
                  <Text style={styles.activityDescription}>{item.activity}</Text>
                </View>
                <Text style={styles.activityTime}>{item.timeLabel}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMessage}>No organization updates yet.</Text>
          )}
        </View>
      </View>

      <HomeNotificationsModal
        notifications={notifications}
        onClose={onCloseNotifications}
        visible={notificationsVisible}
      />
    </>
  );
}

function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? (
        <Pressable accessibilityRole="button" onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
