const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');

// 구현한 유틸리티들 import
const {
  detectPackageManager,
  runInstallWithProgress,
  validatePackageJson
} = require('./bin/installUtils');

async function createTestProject() {
  const testDir = path.join(os.tmpdir(), 'expo-spark-test-' + Date.now());
  
  console.log(chalk.blue(`📁 Creating test project in: ${testDir}`));
  
  await fs.ensureDir(testDir);
  
  // 간단한 package.json 생성
  const packageJson = {
    name: 'expo-spark-test',
    version: '1.0.0',
    description: 'Test project for expo-spark install utilities',
    main: 'index.js',
    dependencies: {
      "chalk": "^4.1.2",
      "lodash": "^4.17.21"
    },
    devDependencies: {
      "typescript": "^5.0.0"
    }
  };
  
  await fs.writeJson(path.join(testDir, 'package.json'), packageJson, { spaces: 2 });
  
  // 간단한 index.js 생성
  const indexJs = `console.log('Hello from test project!');`;
  await fs.writeFile(path.join(testDir, 'index.js'), indexJs);
  
  console.log(chalk.green('✅ Test project created'));
  return testDir;
}

async function testInstallProcess() {
  let testDir;
  
  try {
    console.log(chalk.blue.bold('🚀 Testing Actual Installation Process\n'));
    
    // 1. 테스트 프로젝트 생성
    testDir = await createTestProject();
    
    // 2. 패키지 매니저 감지
    console.log(chalk.yellow('\n📦 Detecting package manager...'));
    const detection = await detectPackageManager(testDir);
    
    if (!detection.success) {
      throw new Error(`Package manager detection failed: ${detection.error}`);
    }
    
    console.log(chalk.green(`✅ Using ${detection.selectedManager.name}`));
    
    // 3. package.json 검증
    console.log(chalk.yellow('\n📋 Validating package.json...'));
    const packageInfo = await validatePackageJson(testDir);
    console.log(chalk.green(`✅ Found ${packageInfo.dependencyCount} dependencies`));
    
    // 4. 실제 설치 실행 (사용자 승인 요청)
    console.log(chalk.yellow('\n🔄 About to run actual npm install...'));
    console.log(chalk.gray(`This will install dependencies in: ${testDir}`));
    
    // 사용자에게 확인 요청
    const { default: inquirer } = await import('inquirer');
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Proceed with actual installation test?',
      default: true
    }]);
    
    if (!proceed) {
      console.log(chalk.yellow('⏭️  Skipping actual installation test'));
      return true;
    }
    
    // 5. 실제 설치 프로세스 실행
    console.log(chalk.blue('\n🚀 Starting installation...'));
    
    const result = await runInstallWithProgress(
      detection.selectedManager,
      testDir,
      {
        verbose: true,
        timeout: 120000 // 2분 타임아웃
      }
    );
    
    if (result.success) {
      console.log(chalk.green('\n✅ Installation completed successfully!'));
      
      // 6. 설치 검증
      console.log(chalk.yellow('\n🔍 Verifying installation...'));
      
      const nodeModulesPath = path.join(testDir, 'node_modules');
      const exists = await fs.pathExists(nodeModulesPath);
      
      if (exists) {
        const packages = await fs.readdir(nodeModulesPath);
        const installedCount = packages.filter(p => !p.startsWith('.')).length;
        console.log(chalk.green(`✅ Found ${installedCount} installed packages`));
        
        // 주요 패키지 확인
        const testPackages = ['chalk', 'lodash', 'typescript'];
        for (const pkg of testPackages) {
          const pkgPath = path.join(nodeModulesPath, pkg);
          const pkgExists = await fs.pathExists(pkgPath);
          const status = pkgExists ? '✅' : '❌';
          console.log(`${status} ${pkg}: ${pkgExists ? 'installed' : 'missing'}`);
        }
      } else {
        console.log(chalk.red('❌ node_modules directory not found'));
        return false;
      }
      
      return true;
    } else {
      console.log(chalk.red('\n❌ Installation failed'));
      console.log(chalk.gray(`Exit code: ${result.exitCode}`));
      if (result.stderr) {
        console.log(chalk.red(`Error: ${result.stderr}`));
      }
      return false;
    }
    
  } catch (error) {
    console.log(chalk.red(`\n💥 Test failed: ${error.message}`));
    if (error.stack) {
      console.log(chalk.gray(error.stack));
    }
    return false;
  } finally {
    // 정리
    if (testDir) {
      try {
        console.log(chalk.gray(`\n🧹 Cleaning up test directory: ${testDir}`));
        await fs.remove(testDir);
        console.log(chalk.green('✅ Cleanup completed'));
      } catch (cleanupError) {
        console.log(chalk.yellow(`⚠️  Cleanup warning: ${cleanupError.message}`));
      }
    }
  }
}

// 메인 실행
if (require.main === module) {
  testInstallProcess()
    .then(success => {
      if (success) {
        console.log(chalk.green.bold('\n🎉 Installation process test completed successfully!'));
        process.exit(0);
      } else {
        console.log(chalk.red.bold('\n💥 Installation process test failed!'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red(`\n💥 Test suite failed: ${error.message}`));
      process.exit(1);
    });
}

module.exports = { testInstallProcess, createTestProject }; 