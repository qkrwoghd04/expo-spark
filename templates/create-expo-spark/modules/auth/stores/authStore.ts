import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  authApi,
  type SignInRequest,
  type SignUpRequest,
} from '../api/authApi';
import {
  saveTokens,
  clearTokens,
  getTokens,
  setItem,
  getItem,
  removeItem,
} from '@/services/tokenService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: SignInRequest) => Promise<void>;
  logout: () => Promise<void>;
  signUp: (userData: SignUpRequest) => Promise<void>;
  initialize: () => Promise<void>;
  clearError: () => void;
  resetAuth: () => Promise<void>;
}

const persistStorage = {
  getItem: (key: string) => getItem(key),
  setItem: (key: string, value: string) => setItem(key, value),
  removeItem: (key: string) => removeItem(key),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: SignInRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.signIn(credentials);
          const { user, accessToken, refreshToken } = response;

          const tokenSaved = await saveTokens(accessToken, refreshToken);
          if (!tokenSaved) {
            throw new Error('토큰 저장에 실패했습니다.');
          }

          set({
            user: user as User,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '로그인에 실패했습니다.';
          set({
            user: null,
            isAuthenticated: false,
            error: errorMessage,
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });

        try {
          await clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (userData: SignUpRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.signUp(userData);

          if (!response.isSuccess) {
            throw new Error(response.message || '회원가입에 실패했습니다.');
          }

          await get().login({
            email: userData.email,
            password: userData.password,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '회원가입에 실패했습니다.';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      initialize: async () => {
        try {
          const { accessToken } = await getTokens();
          const persistedUser = get().user;

          if (accessToken && persistedUser) {
            set({
              isAuthenticated: true,
              error: null,
            });
          } else {
            await get().resetAuth();
          }
        } catch (error) {
          console.error('Auth 초기화 오류:', error);
          await get().resetAuth();
        }
      },

      clearError: () => {
        set({ error: null });
      },

      resetAuth: async () => {
        await clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },
    }),
    {
      name: 'authStorage',
      storage: createJSONStorage(() => persistStorage),
      partialize: ({ user }) => ({ user }),
      onRehydrateStorage: () => (state) => {
        if (__DEV__) console.log('[AuthStore] persist 복원 완료');
      },
    },
  ),
);
