#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CLI 버전 정보
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// CLI 도구 이름
const CLI_NAME = 'create-expo-spark';

// 도움말 메시지
function showHelp() {
  console.log(`
${CLI_NAME} v${VERSION}

Usage:
  npx ${CLI_NAME} [project-name]
  ${CLI_NAME} [project-name]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Examples:
  npx ${CLI_NAME} my-awesome-app
  ${CLI_NAME} my-app

Description:
  Creates a new Expo project with pre-configured authentication,
  state management, and dark mode support using best practices.
  `);
}

// 버전 정보 표시
function showVersion() {
  console.log(`${CLI_NAME} v${VERSION}`);
}

// 메인 함수
function main() {
  const args = process.argv.slice(2);
  
  // 도움말 요청 처리
  if (args.includes('-h') || args.includes('--help')) {
    showHelp();
    return;
  }
  
  // 버전 정보 요청 처리
  if (args.includes('-v') || args.includes('--version')) {
    showVersion();
    return;
  }
  
  // 프로젝트 이름 가져오기
  let projectName = args[0];
  
  // 프로젝트 이름이 없으면 사용자에게 입력 요청
  if (!projectName) {
    console.log('Please provide a project name:');
    console.log(`Usage: npx ${CLI_NAME} [project-name]`);
    process.exit(1);
  }
  
  // 기본 환영 메시지
  console.log(`\n🚀 Creating new Expo project: ${projectName}\n`);
  
  // TODO: 실제 프로젝트 생성 로직은 다음 작업에서 구현
  console.log('Project creation logic will be implemented in the next tasks...');
  console.log('✅ CLI structure setup complete!');
}

// 에러 처리
process.on('uncaughtException', (error) => {
  console.error('❌ An unexpected error occurred:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ An unexpected error occurred:', error.message);
  process.exit(1);
});

// CLI 실행
if (require.main === module) {
  main();
} 