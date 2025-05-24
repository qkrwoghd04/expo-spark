const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

// 구현한 유틸리티들 import
const {
  detectAvailablePackageManagers,
  detectPackageManager,
  validatePackageJson,
  validateInstallEnvironment,
  PACKAGE_MANAGERS
} = require('./bin/installUtils');

const { ProgressIndicator, Spinner } = require('./bin/progressUtils');

console.log(chalk.blue('🧪 Testing create-expo-spark install utilities...\n'));

async function testPackageManagerDetection() {
  console.log(chalk.yellow('1. Testing Package Manager Detection'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    // 사용 가능한 패키지 매니저 감지
    const availableManagers = await detectAvailablePackageManagers();
    
    console.log(chalk.green(`✅ Found ${availableManagers.length} package manager(s):`));
    availableManagers.forEach(manager => {
      console.log(`   • ${manager.name} (priority: ${manager.priority})`);
    });
    
    if (availableManagers.length === 0) {
      console.log(chalk.red('❌ No package managers found!'));
      return false;
    }
    
    // 현재 프로젝트에서 패키지 매니저 선택
    const detection = await detectPackageManager(process.cwd());
    
    if (detection.success) {
      console.log(chalk.green(`✅ Selected package manager: ${detection.selectedManager.name}`));
    } else {
      console.log(chalk.red(`❌ ${detection.error}`));
    }
    
    return detection.success;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function testPackageJsonValidation() {
  console.log(chalk.yellow('\n2. Testing package.json Validation'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    const packageInfo = await validatePackageJson(process.cwd());
    
    console.log(chalk.green('✅ package.json validation successful:'));
    console.log(`   • Name: ${packageInfo.name}`);
    console.log(`   • Version: ${packageInfo.version}`);
    console.log(`   • Dependencies: ${packageInfo.dependencyCount}`);
    
    // 주요 의존성들 표시
    const deps = Object.keys(packageInfo.dependencies);
    if (deps.length > 0) {
      console.log(`   • Key dependencies: ${deps.slice(0, 5).join(', ')}${deps.length > 5 ? '...' : ''}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function testEnvironmentValidation() {
  console.log(chalk.yellow('\n3. Testing Environment Validation'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    const availableManagers = await detectAvailablePackageManagers();
    if (availableManagers.length === 0) {
      console.log(chalk.yellow('⚠️  No package managers available for environment test'));
      return true;
    }
    
    const validation = await validateInstallEnvironment(availableManagers[0], process.cwd());
    
    if (validation.isValid) {
      console.log(chalk.green('✅ Environment validation passed'));
    } else {
      console.log(chalk.red('❌ Environment validation failed:'));
      validation.issues.forEach(issue => {
        console.log(chalk.red(`   • ${issue}`));
      });
    }
    
    if (validation.warnings.length > 0) {
      console.log(chalk.yellow('⚠️  Warnings:'));
      validation.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }
    
    return validation.canProceed;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function testProgressIndicator() {
  console.log(chalk.yellow('\n4. Testing Progress Indicator'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    const progress = new ProgressIndicator({
      total: 100,
      prefix: chalk.blue('📦 Test Progress '),
      showTime: true,
      showPercentage: true
    });
    
    console.log('Running progress indicator demo...');
    
    for (let i = 0; i <= 100; i += 10) {
      progress.update(i, `Step ${i}/100`);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(chalk.green('✅ Progress indicator test completed'));
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function testSpinner() {
  console.log(chalk.yellow('\n5. Testing Spinner'));
  console.log(chalk.gray('━'.repeat(50)));
  
  try {
    const spinner = new Spinner('Testing spinner...');
    
    spinner.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.succeed('Spinner test completed!');
    
    return true;
    
  } catch (error) {
    console.log(chalk.red(`❌ Error: ${error.message}`));
    return false;
  }
}

async function testPackageManagerConstants() {
  console.log(chalk.yellow('\n6. Testing Package Manager Constants'));
  console.log(chalk.gray('━'.repeat(50)));
  
  console.log(chalk.green('✅ Package manager configurations:'));
  Object.entries(PACKAGE_MANAGERS).forEach(([key, config]) => {
    console.log(`   • ${config.name}:`);
    console.log(`     - Install command: ${config.installCommand}`);
    console.log(`     - Check command: ${config.checkCommand}`);
    console.log(`     - Lock file: ${config.lockFile}`);
    console.log(`     - Priority: ${config.priority}`);
  });
  
  return true;
}

async function runAllTests() {
  console.log(chalk.blue.bold('🚀 Starting Install Utilities Test Suite\n'));
  
  const tests = [
    { name: 'Package Manager Detection', fn: testPackageManagerDetection },
    { name: 'package.json Validation', fn: testPackageJsonValidation },
    { name: 'Environment Validation', fn: testEnvironmentValidation },
    { name: 'Progress Indicator', fn: testProgressIndicator },
    { name: 'Spinner', fn: testSpinner },
    { name: 'Package Manager Constants', fn: testPackageManagerConstants }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(chalk.red(`❌ ${test.name} failed: ${error.message}`));
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // 결과 요약
  console.log(chalk.blue.bold('\n📊 Test Results Summary'));
  console.log(chalk.gray('━'.repeat(50)));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const color = result.passed ? chalk.green : chalk.red;
    console.log(color(`${icon} ${result.name}`));
    if (result.error) {
      console.log(chalk.gray(`   Error: ${result.error}`));
    }
  });
  
  console.log(chalk.blue(`\n🎯 Results: ${passed}/${total} tests passed`));
  
  if (passed === total) {
    console.log(chalk.green.bold('🎉 All tests passed! Install utilities are working correctly.'));
  } else {
    console.log(chalk.yellow.bold('⚠️  Some tests failed. Please check the implementation.'));
  }
  
  return passed === total;
}

// 테스트 실행
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(chalk.red(`\n💥 Test suite failed: ${error.message}`));
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testPackageManagerDetection,
  testPackageJsonValidation,
  testEnvironmentValidation,
  testProgressIndicator,
  testSpinner
}; 