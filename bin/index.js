#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');

// CLI 버전 정보
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// CLI 도구 이름
const CLI_NAME = 'create-expo-spark';

// npm 패키지 네이밍 규칙 검증
function isValidPackageName(name) {
  // npm 패키지 이름 규칙
  const validNameRegex = /^[a-z0-9](?:[a-z0-9-_.]*[a-z0-9])?$/;
  
  // 기본 검사
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Package name is required' };
  }
  
  // 길이 검사
  if (name.length > 214) {
    return { valid: false, error: 'Package name cannot be longer than 214 characters' };
  }
  
  // 소문자 검사
  if (name !== name.toLowerCase()) {
    return { valid: false, error: 'Package name must be lowercase' };
  }
  
  // 시작 문자 검사
  if (name.startsWith('.') || name.startsWith('_')) {
    return { valid: false, error: 'Package name cannot start with . or _' };
  }
  
  // 정규식 검사
  if (!validNameRegex.test(name)) {
    return { valid: false, error: 'Package name contains invalid characters' };
  }
  
  // 예약어 검사
  const reservedNames = [
    'node_modules', 'favicon.ico', 'test', 'tests', 'spec', 'specs',
    'src', 'lib', 'main', 'index', 'package', 'npm', 'node'
  ];
  
  if (reservedNames.includes(name)) {
    return { valid: false, error: `"${name}" is a reserved name` };
  }
  
  // 모든 검사 통과
  return { valid: true };
}

// 디렉토리 존재 여부 확인
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

// 인터랙티브 프롬프트로 프로젝트 이름 입력받기
async function promptForProjectName() {
  console.log(chalk.blue('\n🚀 Welcome to create-expo-spark!\n'));
  
  const questions = [
    {
      type: 'input',
      name: 'projectName',
      message: 'What is your project name?',
      validate: (input) => {
        if (!input.trim()) {
          return 'Project name is required';
        }
        
        const validation = isValidPackageName(input.trim());
        if (!validation.valid) {
          return validation.error;
        }
        
        // 디렉토리 존재 여부 확인
        const targetPath = path.resolve(process.cwd(), input.trim());
        if (directoryExists(targetPath)) {
          return `Directory "${input.trim()}" already exists`;
        }
        
        return true;
      },
      filter: (input) => input.trim()
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: (answers) => `Create project "${answers.projectName}"?`,
      default: true
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  if (!answers.confirm) {
    console.log(chalk.yellow('\n❌ Project creation cancelled'));
    process.exit(0);
  }
  
  return answers.projectName;
}

// 프로젝트 생성 함수
async function createProject(projectName, options = {}) {
  // 프로젝트 이름 검증
  const validation = isValidPackageName(projectName);
  if (!validation.valid) {
    console.error(chalk.red(`❌ Invalid project name: ${validation.error}`));
    console.log(chalk.yellow('\nProject name should:'));
    console.log('  • Be lowercase');
    console.log('  • Contain only letters, numbers, hyphens, dots, and underscores');
    console.log('  • Not start with . or _');
    console.log('  • Be shorter than 214 characters');
    console.log('  • Not be a reserved name');
    process.exit(1);
  }
  
  // 디렉토리 존재 여부 확인 (force 옵션 고려)
  const targetPath = path.resolve(process.cwd(), projectName);
  if (directoryExists(targetPath)) {
    if (!options.force) {
      console.error(chalk.red(`❌ Directory "${projectName}" already exists`));
      console.log(chalk.yellow('Please choose a different project name or remove the existing directory.'));
      console.log(chalk.gray('Tip: Use --force flag to overwrite existing directory'));
      process.exit(1);
    } else {
      console.log(chalk.yellow(`⚠️  Directory "${projectName}" exists but --force flag is set`));
      console.log(chalk.blue('📂 Will overwrite existing directory...\n'));
    }
  }
  
  // 프로젝트 생성 시작
  console.log(chalk.green(`\n🚀 Creating new Expo project: ${chalk.bold(projectName)}\n`));
  
  // TODO: 실제 프로젝트 생성 로직은 다음 작업에서 구현
  console.log(chalk.blue('📋 Project details:'));
  console.log(`   Name: ${projectName}`);
  console.log(`   Path: ${targetPath}`);
  console.log(`   Template: Expo with auth + state management + dark mode\n`);
  
  if (options.install === false) {
    console.log(chalk.blue('📦 Dependency installation will be skipped (--no-install flag)\n'));
  }
  
  console.log(chalk.yellow('⏳ Project creation logic will be implemented in the next tasks...'));
  console.log(chalk.green('✅ CLI argument parsing complete!'));
}

// 메인 함수
async function main() {
  // Commander 설정
  const program = new Command();
  
  program
    .name(CLI_NAME)
    .description('CLI tool to create Expo projects with pre-configured authentication, state management, and dark mode support')
    .version(VERSION, '-v, --version', 'Show version number')
    .argument('[project-name]', 'Name of the project to create')
    .option('-f, --force', 'Force creation even if directory exists')
    .option('--no-install', 'Skip dependency installation')
    .helpOption('-h, --help', 'Show help message')
    .action(async (projectName, options) => {
      try {
        let finalProjectName = projectName;
        
        // 프로젝트 이름이 없으면 인터랙티브 프롬프트
        if (!finalProjectName) {
          finalProjectName = await promptForProjectName();
        }
        
        // 프로젝트 생성
        await createProject(finalProjectName, options);
        
      } catch (error) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        process.exit(1);
      }
    });
  
  // Help 텍스트 커스터마이징
  program.addHelpText('after', `
Examples:
  $ npx ${CLI_NAME} my-awesome-app
  $ npx ${CLI_NAME} my-app --force
  $ npx ${CLI_NAME} my-app --no-install
  $ npx ${CLI_NAME}  # Interactive mode
  
For more information, visit: https://github.com/qkrwoghd04/expo-spark
`);
  
  // 인자 파싱 및 실행
  await program.parseAsync(process.argv);
}

// 에러 처리
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ An unexpected error occurred:'), error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ An unexpected error occurred:'), error.message);
  process.exit(1);
});

// SIGINT 처리 (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!'));
  process.exit(0);
});

// CLI 실행
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red('❌ Failed to start CLI:'), error.message);
    process.exit(1);
  });
} 