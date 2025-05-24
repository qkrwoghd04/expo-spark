import React, { type PropsWithChildren } from 'react';
import { useAuthStore } from '@/modules/auth/stores/authStore';

/**
 * 인증 관련 정보와 액션을 제공하는 훅
 */
export function useSession() {
  const { user, isAuthenticated, isLoading, error, login, logout, clearError } =
    useAuthStore();

  return {
    // 상태
    session: isAuthenticated ? user : null,
    isLoading,
    error,

    // 액션 (간소화된 인터페이스)
    signIn: async (email: string, password: string) => {
      try {
        await login({ email, password });
      } catch (error) {
        // 에러는 store에서 이미 설정되므로 여기서는 다시 던지기만
        throw error;
      }
    },
    signOut: logout,
    clearError,
  };
}

/**
 * 세션 컨텍스트 프로바이더
 * 현재는 Zustand로 상태를 관리하므로 단순히 children을 렌더링
 */
export function SessionProvider({ children }: PropsWithChildren) {
  return <>{children}</>;
}
