import * as SplashScreen from 'expo-splash-screen';
import { useSession } from '@/ctx/useSession';

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hideAsync();
  }

  return null;
}
