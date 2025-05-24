import axios from 'axios';
import { getTokens, saveTokens } from '@/services/tokenService';
import { useAuthStore } from '@/modules/auth/stores/authStore';

const BASE_URL = 'http://api.expo.kr/';
const LOG_TAG = '[apiInstance]';

// 토큰 갱신용 별도 클라이언트 (인터셉터 없음)
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// 메인 API 클라이언트
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// 토큰 갱신 진행 중인지 추적
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error: any, token?: string) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// 요청 인터셉터: accessToken이 있으면 헤더에 추가
api.interceptors.request.use(
  async (config) => {
    try {
      const { accessToken } = await getTokens();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      if (__DEV__) console.error(`${LOG_TAG}[request] 토큰 조회 실패:`, error);
    }
    return config;
  },
  (error) => {
    if (__DEV__) console.error(`${LOG_TAG}[request] 인터셉터 오류:`, error);
    return Promise.reject(error);
  },
);

// 응답 인터셉터: 401 에러 시 토큰 갱신 처리
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // 401이 아니거나 이미 재시도한 요청이면 그대로 에러 반환
    if (response?.status !== 401 || (config as any)._retry) {
      return Promise.reject(error);
    }

    // 특정 API 경로는 토큰 갱신 시도하지 않음
    if (config.url?.includes('/api/notification/fcm/register')) {
      if (__DEV__) {
        console.log(
          `${LOG_TAG}[response] FCM 등록 중 토큰 오류, 로그인 프로세스 유지`,
        );
      }
      return Promise.reject(new Error('Push notification registration failed'));
    }

    // 이미 토큰 갱신 중이면 대기열에 추가
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        // 토큰 갱신 완료 후 원래 요청 재시도
        (config as any)._retry = true;
        return api(config);
      });
    }

    // 토큰 갱신 시작
    isRefreshing = true;
    (config as any)._retry = true;

    try {
      const { refreshToken } = await getTokens();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const { data } = await refreshClient.post('/api/auth/refresh', {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        data.result;

      await saveTokens(newAccessToken, newRefreshToken);

      config.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(undefined, newAccessToken);

      if (__DEV__) console.log(`${LOG_TAG}[response] 토큰 갱신 성공`);

      // 원래 요청 재시도
      return api(config);
    } catch (refreshError) {
      if (__DEV__)
        console.error(`${LOG_TAG}[response] 토큰 갱신 실패:`, refreshError);

      // 대기 중인 요청들에 실패 알림
      processQueue(refreshError, undefined);

      // 인증 상태 초기화 - authStoreActions 대신 직접 호출
      useAuthStore.getState().resetAuth();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
