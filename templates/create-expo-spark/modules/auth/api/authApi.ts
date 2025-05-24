import apiInstance from '@/api/apiInstance';

const LOG_TAG = '[LOG][authApi]';

// 요청 타입 정의
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

// 응답 타입 정의
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
}

export interface SignInResponse extends AuthTokenResponse {
  user: UserResponse;
}

export interface SignUpResponse {
  isSuccess: boolean;
  message?: string;
}

// 환경별 설정
const IS_DEVELOPMENT = __DEV__;
const MOCK_DELAY = 1000;

// Mock 데이터 생성 유틸리티
const createMockUser = (email: string, name?: string): UserResponse => ({
  id: `user_${Date.now()}`,
  email,
  name: name || email.split('@')[0] || 'Unknown User',
});

const createMockTokens = (): AuthTokenResponse => ({
  accessToken: `mock_access_${Date.now()}`,
  refreshToken: `mock_refresh_${Date.now()}`,
});

// API 클래스
export class AuthApi {
  /**
   * 로그인 API 호출
   */
  async signIn(data: SignInRequest): Promise<SignInResponse> {
    console.log(`${LOG_TAG}[signIn] 요청:`, { email: data.email });

    if (IS_DEVELOPMENT) {
      // Development 환경에서는 mock 응답 사용
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

      const mockUser = createMockUser(data.email);
      const mockTokens = createMockTokens();

      console.log(`${LOG_TAG}[signIn] Mock 응답:`, mockUser);

      return {
        ...mockTokens,
        user: mockUser,
      };
    }

    try {
      const response = await apiInstance.post<SignInResponse>(
        '/auth/signin',
        data,
      );
      console.log(`${LOG_TAG}[signIn] 성공`);
      return response.data;
    } catch (error) {
      console.error(`${LOG_TAG}[signIn] 실패:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 회원가입 API 호출
   */
  async signUp(data: SignUpRequest): Promise<SignUpResponse> {
    console.log(`${LOG_TAG}[signUp] 요청:`, {
      email: data.email,
      name: data.name,
    });

    if (IS_DEVELOPMENT) {
      // Development 환경에서는 mock 응답 사용
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

      console.log(`${LOG_TAG}[signUp] Mock 응답: 성공`);

      return {
        isSuccess: true,
        message: '회원가입이 완료되었습니다.',
      };
    }

    try {
      const response = await apiInstance.post<SignUpResponse>(
        '/auth/signup',
        data,
      );
      console.log(`${LOG_TAG}[signUp] 성공`);
      return response.data;
    } catch (error) {
      console.error(`${LOG_TAG}[signUp] 실패:`, error);
      throw this.handleApiError(error);
    }
  }

  /**
   * API 에러 처리 유틸리티
   */
  private handleApiError(error: any): Error {
    if (error.response) {
      // 서버에서 응답한 에러
      const status = error.response.status;
      const message =
        error.response.data?.message || '서버 오류가 발생했습니다.';

      switch (status) {
        case 401:
          return new Error(
            '인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
          );
        case 403:
          return new Error('접근 권한이 없습니다.');
        case 409:
          return new Error('이미 존재하는 이메일입니다.');
        case 429:
          return new Error(
            '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
          );
        case 500:
          return new Error('서버 내부 오류가 발생했습니다.');
        default:
          return new Error(message);
      }
    } else if (error.request) {
      // 네트워크 에러
      return new Error('네트워크 연결을 확인해주세요.');
    } else {
      // 기타 에러
      return new Error('알 수 없는 오류가 발생했습니다.');
    }
  }
}

// 싱글톤 인스턴스 생성
export const authApi = new AuthApi();
