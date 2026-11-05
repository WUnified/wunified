import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import type { HomeDashboardNotification } from '../homeDashboardMockData';
import { styles as dashboardStyles } from './HomeDashboardSections.styles';
import { styles } from './HomeNotificationsModal.styles';

interface HomeNotificationsModalProps {
  notifications: HomeDashboardNotification[];
  visible: boolean;
  onClose: () => void;
}

export function HomeNotificationsModal({
  notifications,
  visible,
  onClose,
}: HomeNotificationsModalProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <Pressable
              accessibilityLabel="Close notifications"
              accessibilityRole="button"
              onPress={onClose}
            >
              <Text style={styles.closeLabel}>Done</Text>
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.notificationListContent}
            style={styles.notificationList}
          >
            {notifications.length ? (
              notifications.map((notification) => (
                <View key={notification.id} style={styles.notification}>
                  <View style={styles.notificationCopy}>
                    <Text style={dashboardStyles.notificationTitle}>{notification.title}</Text>
                    <Text style={dashboardStyles.notificationDetail}>{notification.detail}</Text>
                    <Text style={styles.time}>{notification.timeLabel}</Text>
                  </View>
                  {notification.unread ? <View style={dashboardStyles.unreadDot} /> : null}
                </View>
              ))
            ) : (
              <Text style={dashboardStyles.emptyMessage}>You’re all caught up.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
