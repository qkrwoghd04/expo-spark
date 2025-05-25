import { Text } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/ctx/useSession';

export default function AppLayout() {
  const { session, isLoading } = useSession();

  // 스플래시 스크린을 계속 표시하거나, 여기처럼 로딩 화면을 렌더링할 수 있습니다.
  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  // 사용자들이 (auth) 그룹에 접근하여 다시 로그인할 수 있도록,
  // (app) 그룹의 레이아웃 안에서만 인증이 필요합니다.
  if (!session) {
    // 페이지가 Node 환경에서 렌더링될 때 사용자를 리디렉션합니다.
    return <Redirect href="/sign-in" />;
  }

  // 이 레이아웃은 루트 레이아웃이 아니므로 나중에 렌더링될 수 있습니다.
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
