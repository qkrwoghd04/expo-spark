import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SessionProvider, useSession } from '@/ctx';
import { SplashScreenController } from '@/splash';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Entypo } from '@expo/vector-icons';
import { useAuthStore } from '@/modules/auth/stores/authStore';

SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

export default function Root() {
  const [appIsReady, setAppIsReady] = useState(false);
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await Font.loadAsync(Entypo.font);

        // Initialize auth store
        await initialize();

        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initialize]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SessionProvider>
        <SplashScreenController />
        <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session } = useSession();

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen
          name="sign-in"
          options={{
            headerShown: false,
            presentation: 'modal',
            title: 'Sign In',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
