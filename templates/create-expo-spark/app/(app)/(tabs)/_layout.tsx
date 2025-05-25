import { Tabs } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import LottieView from 'lottie-react-native';

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDark ? '#000' : '#fff',
        },
        headerStyle: {
          backgroundColor: isDark ? '#000' : '#fff',
        },
        headerTintColor: isDark ? '#fff' : '#000',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <LottieView
              source={require('@/assets/lottie/home.json')}
              autoPlay
              loop={focused}
              style={{ width: size, height: size }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarIcon: ({ size, focused }) => (
            <LottieView
              source={require('@/assets/lottie/profile.json')}
              autoPlay
              loop={focused}
              style={{ width: size, height: size }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
