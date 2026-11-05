import { Redirect, Tabs } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Colors, Radius } from '../../src/constants/colors';
import { useSession } from '../../src/features/auth';

const tabIcons = {
  home: require('../../assets/home.png') as ImageSourcePropType,
  marketplace: require('../../assets/market-icon.png') as ImageSourcePropType,
  community: require('../../assets/calendar.png') as ImageSourcePropType,
  chat: require('../../assets/message-circle.png') as ImageSourcePropType,
  profile: require('../../assets/user.png') as ImageSourcePropType,
};

function renderTabIcon(source: ImageSourcePropType, focused: boolean) {
  return (
    <Image
      source={source}
      style={[styles.tabIcon, { tintColor: focused ? Colors.primary : Colors.textDim }]}
    />
  );
}

export default function TabsLayout() {
  const { session } = useSession();

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarStyle: {
          backgroundColor: Colors.glass,
          borderColor: Colors.border,
          borderRadius: Radius.full,
          borderTopWidth: StyleSheet.hairlineWidth,
          bottom: 12,
          elevation: 8,
          height: 70,
          left: 16,
          paddingBottom: 6,
          paddingTop: 6,
          position: 'absolute',
          right: 16,
          shadowColor: Colors.background,
          shadowOffset: { height: 4, width: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => renderTabIcon(tabIcons.home, focused),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ focused }) => renderTabIcon(tabIcons.marketplace, focused),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => renderTabIcon(tabIcons.community, focused),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => renderTabIcon(tabIcons.chat, focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => renderTabIcon(tabIcons.profile, focused),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    height: 22,
    width: 22,
  },
});
