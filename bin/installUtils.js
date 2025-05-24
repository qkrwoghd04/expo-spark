const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { InstallProgressTracker } = require('./progressUtils');

// 지원되는 패키지 매니저 정의
const PACKAGE_MANAGERS = {
  npm: {
    name: 'npm',
    installCommand: 'install',
    checkCommand: 'npm --version',
    lockFile: 'package-lock.json',
    priority: 1
  },
  yarn: {
    name: 'yarn',
    installCommand: 'install',
    checkCommand: 'yarn --version',
    lockFile: 'yarn.lock',
    priority: 2
  },
  pnpm: {
    name: 'pnpm',
    installCommand: 'install',
    checkCommand: 'pnpm --version',
    lockFile: 'pnpm-lock.yaml',
    priority: 3
  }
};

/**
 * 시스템에서 사용 가능한 패키지 매니저 확인
 */
async function detectAvailablePackageManagers() {
  const available = [];
  
  for (const [key, manager] of Object.entries(PACKAGE_MANAGERS)) {
    try {
      await new Promise((resolve, reject) => {
        exec(manager.checkCommand, { timeout: 5000 }, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout.trim());
          }
        });
      });
      
      available.push({
        ...manager,
        key: key
      });
    } catch (error) {
      // 패키지 매니저가 설치되지 않음
    }
  }
  
  return available.sort((a, b) => a.priority - b.priority);
}

/**
 * 프로젝트에 적합한 패키지 매니저 선택
 */
async function selectPackageManager(projectPath, availableManagers) {
  if (availableManagers.length === 0) {
    return null;
  }
  
  // 락 파일 기준으로 선택
  for (const manager of availableManagers) {
    const lockFilePath = path.join(projectPath, manager.lockFile);
    if (await fs.pathExists(lockFilePath)) {
      return manager;
    }
  }
  
  return availableManagers[0];
}

/**
 * 패키지 매니저 감지 및 선택
 */
async function detectPackageManager(projectPath) {
  console.log(chalk.blue('🔍 Detecting package managers...'));
  
  const availableManagers = await detectAvailablePackageManagers();
  
  if (availableManagers.length === 0) {
    return {
      success: false,
      error: 'No package manager found. Please install npm, yarn, or pnpm.',
      availableManagers: [],
      selectedManager: null
    };
  }
  
  const selectedManager = await selectPackageManager(projectPath, availableManagers);
  
  console.log(chalk.green(`✅ Found ${availableManagers.length} package manager(s):`));
  availableManagers.forEach(manager => {
    const isSelected = manager.key === selectedManager.key;
    const marker = isSelected ? '👉' : '  ';
    console.log(`${marker} ${manager.name} ${isSelected ? '(selected)' : ''}`);
  });
  
  return {
    success: true,
    availableManagers,
    selectedManager,
    error: null
  };
}

/**
 * 의존성 설치 프로세스 실행
 */
async function runInstallProcess(manager, projectPath, options = {}) {
  const {
    timeout = 300000,
    env = process.env,
    stdio = 'pipe'
  } = options;

  return new Promise((resolve, reject) => {
    const args = [manager.installCommand];
    
    if (options.silent) {
      if (manager.name === 'npm') args.push('--silent');
      else if (manager.name === 'yarn') args.push('--silent');
      else if (manager.name === 'pnpm') args.push('--reporter=silent');
    }
    
    const childProcess = spawn(manager.name, args, {
      cwd: projectPath,
      env: env,
      stdio: stdio,
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let isTimedOut = false;

    const timeoutHandle = setTimeout(() => {
      isTimedOut = true;
      childProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
      }, 5000);
    }, timeout);

    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        
        if (options.onProgress) {
          options.onProgress({
            type: 'stdout',
            data: chunk,
            accumulated: stdout
          });
        }
      });
    }

    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        
        if (options.onError) {
          options.onError({
            type: 'stderr',
            data: chunk,
            accumulated: stderr
          });
        }
      });
    }

    childProcess.on('close', (code) => {
      clearTimeout(timeoutHandle);
      
      if (isTimedOut) {
        reject(new Error(`Installation timed out after ${timeout / 1000} seconds`));
        return;
      }

      const result = {
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: code === 0,
        manager: manager.name,
        command: `${manager.name} ${args.join(' ')}`
      };

      if (code === 0) {
        resolve(result);
      } else {
        const error = new Error(`Installation failed with exit code ${code}`);
        error.result = result;
        reject(error);
      }
    });

    childProcess.on('error', (error) => {
      clearTimeout(timeoutHandle);
      
      const enhancedError = new Error(`Failed to start installation process: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.manager = manager.name;
      
      reject(enhancedError);
    });
  });
}

/**
 * package.json 파일 확인
 */
async function validatePackageJson(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    throw new Error('package.json not found in project directory');
  }
  
  try {
    const packageJson = await fs.readJson(packageJsonPath);
    
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    return {
      name: packageJson.name,
      version: packageJson.version,
      dependencyCount: Object.keys(dependencies).length,
      dependencies,
      scripts: packageJson.scripts || {}
    };
  } catch (error) {
    throw new Error(`Invalid package.json: ${error.message}`);
  }
}

/**
 * 설치 전 환경 확인
 */
async function validateInstallEnvironment(manager, projectPath) {
  const issues = [];
  const warnings = [];
  
  try {
    await validatePackageJson(projectPath);
  } catch (error) {
    issues.push(`Invalid package.json: ${error.message}`);
  }
  
  try {
    const { promisify } = require('util');
    const dns = require('dns');
    const lookup = promisify(dns.lookup);
    await lookup('registry.npmjs.org');
  } catch (error) {
    warnings.push('Network connectivity check failed - installation may fail');
  }
  
  try {
    await fs.access(projectPath, fs.constants.W_OK);
  } catch (error) {
    issues.push(`No write permission for project directory: ${projectPath}`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    canProceed: issues.length === 0
  };
}

/**
 * 설치 진행률과 함께 프로세스 실행
 */
async function runInstallWithProgress(manager, projectPath, options = {}) {
  const packageInfo = await validatePackageJson(projectPath);
  const totalPackages = packageInfo.dependencyCount;
  
  const tracker = new InstallProgressTracker({
    packageManager: manager.name,
    totalPackages,
    verbose: options.verbose
  });
  
  console.log(chalk.blue(`\n🚀 Starting installation with ${manager.name}...`));
  console.log(chalk.gray(`   Dependencies to install: ${totalPackages}`));
  
  try {
    const result = await runInstallProcess(manager, projectPath, {
      ...options,
      onProgress: (data) => {
        tracker.onProgress(data);
        if (options.onProgress) {
          options.onProgress(data);
        }
      },
      onError: (data) => {
        if (options.verbose) {
          console.log(chalk.red(`\n🔥 ${data.data.trim()}`));
        }
        if (options.onError) {
          options.onError(data);
        }
      }
    });
    
    tracker.complete();
    return result;
    
  } catch (error) {
    tracker.fail(error);
    throw error;
  }
}

module.exports = {
  PACKAGE_MANAGERS,
  detectAvailablePackageManagers,
  selectPackageManager,
  detectPackageManager,
  runInstallProcess,
  validatePackageJson,
  validateInstallEnvironment,
  runInstallWithProgress
}; 