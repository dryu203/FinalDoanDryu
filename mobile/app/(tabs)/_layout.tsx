import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, theme } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.brandOrange,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.brandNavy,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Trang chủ',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Results',
          tabBarLabel: 'Kết quả',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
          headerTitle: 'Kết quả học tập',
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: 'Deadlines',
          tabBarLabel: 'Deadline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          headerTitle: 'Deadline',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
          headerTitle: 'Chat',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Thông tin cá nhân',
        }}
      />
    </Tabs>
  );
}

