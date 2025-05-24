#Expo 기반 프로젝트 템플릿 생성 CLI 패키지 기획서

## 1. 프로젝트 목적

새로운 Expo 프로젝트를 시작할 때마다 반복적으로 수행하는 설정 작업과 공통 기능 구현을 자동화하기 위한 CLI 패키지를 제작한다. 이 도구는 npx create-expo-spark 명령어로 실행되며, 인증 로직, 상태 관리 및 다크 모드 지원 등이 미리 구성된 Expo 프로젝트 보일러플레이트를 생성해준다. 이를 통해 개발자는 초기 설정 시간을 절약하고 일관된 프로젝트 구조와 코딩 규칙을 유지함으로써 개발 생산성과 품질을 향상시키는 것이 목표이다. 또한 이 템플릿은 팀 내에서 공통으로 사용하는 아키텍처를 표준화하여 프로젝트 간 일관성을 높이고, 베스트 프랙티스를 손쉽게 적용할 수 있게 해준다.

## 2. 핵심 기능
이 CLI가 생성하는 Expo 템플릿 프로젝트에는 다음과 같은 핵심 기능 및 구성이 포함된다:

- 로그인 및 메인 탭 구조: 기본 로그인 화면을 제공하며 로그인 성공 시 메인 화면으로 전환되는 네비게이션 흐름을 갖춘다. 메인 화면은 expo Tabs의 Stack을 활용한 하단 탭 네비게이션 구조로 구성되어 있으며, 예시로 "Home" 탭과 "Settings" 탭 두 개를 포함한다. 로그인 상태에 따라 적절히 화면이 전환되도록 네비게이터가 설정된다 (로그인 전에는 로그인 화면, 로그인 후에는 탭 화면). 실제 인증 연동은 없지만, 데모용 더미 계정이나 버튼 클릭으로 로그인 상태를 만들어내는 흐름을 구현하고, 추후 실제 백엔드 연동이 쉽게 가능하도록 구조를 잡는다.

- 인증 토큰 관리 (Expo SecureStore): 로그인한 사용자의 인증 토큰 등을 안전하게 저장하기 위해 Expo에서 제공하는 SecureStore 모듈을 활용한다. SecureStore는 기기 로컬에 키-값 쌍을 암호화하여 안전하게 저장할 수 있는 기능을 제공하며, 민감한 정보를 평문으로 두지 않도록 해준다. 템플릿에서는 사용자가 로그인하면 JWT 등의 토큰을 SecureStore에 저장하고, 앱 시작 시 SecureStore에 저장된 토큰을 불러와 자동 로그인 처리하는 로직을 포함한다. 또한 로그아웃 시 SecureStore에 저장된 토큰을 제거하여 보안을 유지한다. 이를 통해 앱 재실행 시에도 로그인 상태를 유지(persist)하거나 필요한 경우 토큰을 갱신(refresh)할 수 있는 기반을 제공한다.

- 상태 관리 (Zustand): 전역 상태 관리를 위해 가볍고 사용이 간편한 Zustand 라이브러리를 사용한다. Zustand는 Redux 등에 비해 보일러플레이트 코드가 거의 없고 훅 기반의 간단한 API를 제공하여 React Native 앱에서도 효율적인 상태 관리 솔루션을 제공한다. 템플릿에서는 authStore 예제를 포함하여, 사용자 **인증 상태(예: 토큰, 로그인 여부)**를 저장하고 업데이트하는 용도로 Zustand 스토어를 구성한다. 이로써 컴포넌트 어디에서나 편리하게 인증 상태를 읽거나 변경할 수 있으며, Redux 대비 코드량을 줄여 개발 난이도를 낮춘다.

-다크 모드 지원: 라이트/다크 모드 테마를 모두 지원하여, 시스템 설정이나 사용자 선택에 따라 앱의 스타일 테마가 바뀌도록 구현한다. Expo 프로젝트의 설정 파일(app.json)에서 userInterfaceStyle을 "automatic"으로 지정하여 시스템 테마를 자동으로 따르도록 설정하고, React Native의 Appearance API 혹은 useColorScheme 훅을 사용해 현재 모드를 감지한다. 이를 토대로 전역적인 스타일 테마(예: 색상 팔레트, 배경색, 텍스트색)를 Light/Dark 두 가지 버전으로 제공한다. 예를 들어 useColorScheme() 훅의 반환값이 'dark'인 경우 다크 테마용 스타일을 적용하고, 'light'인 경우 라이트 테마를 적용한다. 필요에 따라 Settings 화면 등에서 사용자가 수동으로 테마를 전환하는 옵션도 추가할 수 있으며, 테마 선택 상태 역시 Zustand 등을 통해 전역 관리될 수 있다. 기본값은 시스템 설정을 따르도록 구현하여 사용자 경험을 존중한다.

-코드 품질 도구 (Prettier 및 ESLint 설정): 코드 스타일의 일관성과 품질 유지를 위해 Prettier와 ESLint 설정 파일을 템플릿에 포함한다. 기본적인 .prettierrc 및 .eslintrc 구성과 규칙을 제공하여 바로 사용자가 코드 포매터와 린터를 적용할 수 있도록 한다. 예를 들어 세미콜론 사용 여부나 인용부호 스타일, 들여쓰기 등의 규칙을 사전 정의해두고, ESLint는 React Native/Expo 프로젝트에 맞는 권장 설정과 플러그인(예: eslint-plugin-react, eslint-plugin-react-native)을 적용한다. 이로써 팀원 모두가 일관된 코드 포맷을 사용하게 되어 가독성과 유지보수성이 높아진다. 또한 프로젝트 생성 시 바로 린팅/포매팅 커맨드를 사용할 수 있도록 npm 스크립트도 제공한다.

```bash
npx expo lint
```

```js
/* eslint-env node */
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(
  __dirname
);

module.exports = config;
```

```bash
npx expo install prettier eslint-config-prettier eslint-plugin-prettier --dev
```
```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*'],
  },
]);

```

- 사용자 경험 향상을 위해 공통 로딩 및 에러 처리 UI 패턴을 포함한다. 앱 로드 시나 로그인 시 화면에 로딩 인디케이터를 표시하는 LoadingIndicator.tsx 컴포넌트를 제공하고, SecureStore로부터 토큰을 가져오는 등 비동기 작업 동안 화면이 비어 보이지 않도록 한다. 네트워크 요청 실패나 인증 오류와 같은 일반적인 오류 상황에 대비하여 간단한 에러 메시지 표시 컴포넌트나 Alert 사용 예제를 포함한다. 또한 Expo Router의 ErrorBoundary 컴포넌트를 이용해 전역적인 에러 경계를 설정하여 예기치 않은 오류 발생 시 사용자에게 오류 메시지와 함께 재시도 옵션을 제공하고 앱 크래시를 방지한다. 이를 통해 개발자는 로딩 및 에러 처리를 손쉽게 관리할 수 있다.

## 3. CLI 패키지 디텍토리 구조

``` bash
EXPO-SPARK/
├── .cursor                      # Cursor 설정 파일
├── .roo                         # 프로젝트 관리 도구 설정 파일
├── scripts                      # 자동화 스크립트
├── tasks                        # Task Master 관련 작업 정의
├── .env                         # 환경 변수 관리 파일
├── .windsurfrules               # 코드 규칙 및 스타일 가이드 정의 파일
├── .taskmasterconfig            # Task Master 설정 파일
├── bin/
│   └── index.js                 # CLI 실행 파일 (프로젝트 생성 스크립트)
├── templates/
│   └── create-expo-spark/       # Expo 템플릿 프로젝트 디렉토리
│       ├── app                  # Expo 프로젝트 메인 디렉토리
│       ├── app.json             # Expo 앱 설정 파일
│       ├── package.json         # 의존성 관리 및 프로젝트 정보 파일
│       └── ... 기타 Expo 프로젝트 파일들 ...
└── package.json                 # npm 패키지 메타정보 (bin 속성에 CLI 경로 지정)

```

## 4. 생성되는 Expo 프로젝트 구조
CLI를 통해 생성된 Expo 프로젝트 (create-expo-spark 템플릿을 기반으로 함)는 다음과 같은 구조를 갖게 된다 (예시로 프로젝트 이름이 "create-expo-spark"인 경우):

```bash
create-expo-spark/  
├── app/                           # 앱의 메인 라우팅 및 화면 구성
│   ├── (tabs)/                    # 하단 탭 화면 그룹
│   │   ├── index.tsx              # 메인 탭의 홈 화면
│   │   ├── settings.tsx           # 설정 화면
│   │   └── _layout.tsx            # 탭 화면 레이아웃 구성
│   ├── auth/                      # 인증 관련 화면 그룹
│   │   └── login.tsx              # 로그인 화면
│   ├── index.tsx                  # 앱의 진입점
│   └── _layout.tsx                # 전체 앱 레이아웃
├── components/                    # 공용 UI 컴포넌트 (LoadingIndicator.tsx)
├── assets/                        # 공용 이미지 리소스 (png, jpg 등)
├── hooks/                         # 공용 커스텀 훅
├── utils/                         # 공용 유틸리티 함수
├── constants/                     # 앱 내 사용되는 상수
├── stores/                        # 전역 상태 관리(Zustand)
├── modules/                       # 모듈별 구분된 로직 및 컴포넌트
│   ├── auth/                      # 인증 모듈 (Login 관련)
│   │   ├── components/            # 인증 관련 UI 컴포넌트
│   │   ├── hooks/                 # 인증 관련 훅
│   │   ├── utils/                 # 인증 관련 유틸리티
│   │   ├── stores/                # 인증 상태 관리
│   │   └── index.ts               # 인증 모듈 진입점
│   └── (tabs)/                    # 탭 화면 관련 모듈
│       ├── components/            # 탭 화면 관련 컴포넌트
│       ├── utils/                 # 탭 화면 관련 유틸리티
│       └── ...                    # 추가적인 탭 관련 로직
├── eslint.config.js               # ESLint 설정 파일
├── eas.json                       # Expo Application Services(EAS) 구성 파일
├── package.json                   # 프로젝트 메타 정보 및 의존성 관리
├── tsconfig.json                  # TypeScript 구성 파일
└── app.json                       # Expo 프로젝트 설정
```

## 5. CLI 동작 흐름 설명

create-expo-spark CLI 명령어가 실행되면, 아래와 같은 흐름으로 새로운 Expo 프로젝트 템플릿을 생성한다:

1. 프로젝트 이름 입력 받기: 사용자가 CLI 명령 실행 시 프로젝트 이름을 인자로 제공하지 않은 경우(npx create-expo-spark만 입력), 터미널 상에서 프로젝트 이름을 입력하도록 프롬프트를 표시한다. 사용자가 이름을 입력하면 해당 이름으로 프로젝트가 생성된다. 만약 명령어에 바로 이름을 포함한 경우(npx create-expo-spark my-app), 별도 질문 없이 "my-app"이라는 이름으로 프로젝트를 생성한다. 프로젝트 이름은 추후 앱 디렉토리 이름 뿐만 아니라 Expo 설정(app.json의 name/slug 등)과 package.json의 "name" 필드에도 반영된다.

2. 템플릿 프로젝트 복사: CLI는 패키지에 내장된 templates/create-expo-spark 폴더 내용을 바탕으로 새 디렉토리에 프로젝트 파일을 복사한다. 예를 들어 프로젝트 이름이 "my-app"이라면 현재 경로에 my-app 폴더를 생성하고 그 안에 템플릿의 파일구조가 복제된다. 이 과정에서 .gitignore와 같은 숨김 파일도 누락되지 않고 복사되도록 처리한다. 또한 템플릿에는 플레이스홀더로 지정된 프로젝트 이름(예: "appName" 등)을 실제 입력 받은 이름으로 치환하는 작업도 수행한다. 이를 통해 app.json의 "name" 및 "slug" 필드, README 파일 등에 템플릿 공통 이름 대신 사용자가 정한 프로젝트명이 반영된다.

3. 의존성 설치: 템플릿 파일 복사가 완료되면, 새로운 프로젝트 디렉토리 내에서 npm 패키지 의존성 설치를 자동으로 수행한다. Node.js의 child_process를 이용하여 npm install을 실행함으로써, package.json에 명시된 모든 라이브러리(예: Expo SDK, Zustand, i18next, jest 등)가 설치된다. 설치 진행 상황은 콘솔에 출력되며 수십초 정도 소요될 수 있다. CLI는 설치 완료 여부를 확인하여, 오류 발생 시 사용자에게 재시도 안내를 하거나 로그를 출력하고, 성공 시 다음 단계로 진행한다. (참고로, 만약 네트워크 문제 등으로 설치에 실패한 경우를 대비하여, CLI는 실패를 감지하면 "프로젝트 생성은 완료되었으나 의존성 설치에 실패했다"는 메시지를 표시하고 수동 설치 방법(cd 프로젝트폴더 && npm install)을 안내할 수도 있다.)

4. 마무리 및 안내 메시지 출력: 모든 과정이 끝나면 사용자에게 성공 메시지를 출력한다. 여기에는 프로젝트가 생성된 디렉토리 경로와 다음 단계 안내가 포함된다. 예를 들어, "Success! Created 'my-app' project. Next, run 'cd my-app' and 'npm start' (or 'expo start') to launch the development server." 등의 문구를 보여준다.

위 흐름은 사용자의 개입을 최소화하고, 원클릭(One Command)으로 완벽하게 설정된 프로젝트 환경을 제공하는 데 집중되어 있다. 특히 프로젝트 이름 입력 이외의 추가 설정을 묻지 않으므로, 표준 설정으로 즉시 개발을 시작하고자 하는 개발자에게 편리하다. (향후 확장으로 필요한 설정을 물어보는 기능은 추가 가능하나, 기본 시나리오에서는 질문을 줄여 빠르게 프로젝트를 준비시키는 것을 우선시한다.)