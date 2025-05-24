const chalk = require('chalk');

/**
 * 진행률 표시기 클래스
 */
class ProgressIndicator {
  constructor(options = {}) {
    this.total = options.total || 100;
    this.current = 0;
    this.startTime = Date.now();
    this.lastUpdate = 0;
    this.width = options.width || 40;
    this.showPercentage = options.showPercentage !== false;
    this.showTime = options.showTime !== false;
    this.showSpeed = options.showSpeed !== false;
    this.prefix = options.prefix || '';
    this.suffix = options.suffix || '';
    this.isComplete = false;
  }

  update(current, message = '') {
    this.current = Math.min(current, this.total);
    this.lastUpdate = Date.now();
    
    if (this.current >= this.total) {
      this.isComplete = true;
    }
    
    this.render(message);
  }

  increment(amount = 1, message = '') {
    this.update(this.current + amount, message);
  }

  render(message = '') {
    const percentage = Math.round((this.current / this.total) * 100);
    const filled = Math.round((this.current / this.total) * this.width);
    const empty = this.width - filled;
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    
    let output = `${this.prefix}[${bar}]`;
    
    if (this.showPercentage) {
      output += ` ${percentage}%`;
    }
    
    if (this.showTime) {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000);
      output += ` ${elapsed}s`;
    }
    
    if (this.showSpeed && this.current > 0) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const speed = Math.round(this.current / elapsed);
      output += ` (${speed}/s)`;
    }
    
    if (message) {
      output += ` ${message}`;
    }
    
    output += this.suffix;
    
    // 터미널에 출력 (같은 줄에 덮어쓰기)
    process.stdout.write(`\r${output}`);
    
    if (this.isComplete) {
      process.stdout.write('\n');
    }
  }

  complete(message = 'Complete!') {
    this.current = this.total;
    this.isComplete = true;
    this.render(message);
  }

  fail(message = 'Failed!') {
    this.isComplete = true;
    process.stdout.write(`\r${this.prefix}❌ ${message}\n`);
  }
}

/**
 * 설치 진행률 추적기
 */
class InstallProgressTracker {
  constructor(options = {}) {
    this.packageManager = options.packageManager;
    this.totalPackages = options.totalPackages || 0;
    this.installedPackages = 0;
    this.currentPackage = '';
    this.startTime = Date.now();
    this.progressBar = new ProgressIndicator({
      total: 100,
      prefix: chalk.blue('📦 Installing dependencies '),
      showTime: true,
      showPercentage: true
    });
    this.isVerbose = options.verbose || false;
  }

  onProgress(data) {
    const { type, data: chunk, accumulated } = data;
    
    if (type === 'stdout') {
      this.parseInstallOutput(chunk, accumulated);
    }
    
    // 진행률 업데이트
    this.updateProgress();
  }

  parseInstallOutput(chunk, accumulated) {
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;
      
      // npm 패턴 감지
      if (this.packageManager === 'npm') {
        if (trimmedLine.includes('added') && trimmedLine.includes('packages')) {
          const match = trimmedLine.match(/added (\d+) packages/);
          if (match) {
            this.installedPackages = parseInt(match[1]);
          }
        }
        
        if (trimmedLine.startsWith('npm WARN') || trimmedLine.startsWith('npm notice')) {
          if (this.isVerbose) {
            console.log(chalk.yellow(`\n⚠️  ${trimmedLine}`));
          }
        }
      }
      
      // yarn 패턴 감지
      else if (this.packageManager === 'yarn') {
        if (trimmedLine.includes('Installing') || trimmedLine.includes('Resolving')) {
          const match = trimmedLine.match(/\[(\d+)\/(\d+)\]/);
          if (match) {
            this.installedPackages = parseInt(match[1]);
            this.totalPackages = parseInt(match[2]);
          }
        }
        
        if (trimmedLine.includes('warning')) {
          if (this.isVerbose) {
            console.log(chalk.yellow(`\n⚠️  ${trimmedLine}`));
          }
        }
      }
      
      // pnpm 패턴 감지
      else if (this.packageManager === 'pnpm') {
        if (trimmedLine.includes('Progress:')) {
          const match = trimmedLine.match(/(\d+)\/(\d+)/);
          if (match) {
            this.installedPackages = parseInt(match[1]);
            this.totalPackages = parseInt(match[2]);
          }
        }
      }
      
      // 현재 설치 중인 패키지 감지
      if (trimmedLine.includes('installing') || trimmedLine.includes('Installing')) {
        const packageMatch = trimmedLine.match(/(?:installing|Installing)\s+([^\s@]+)/i);
        if (packageMatch) {
          this.currentPackage = packageMatch[1];
        }
      }
    }
  }

  updateProgress() {
    let percentage = 0;
    let message = '';
    
    if (this.totalPackages > 0) {
      percentage = Math.round((this.installedPackages / this.totalPackages) * 100);
      message = `${this.installedPackages}/${this.totalPackages} packages`;
    } else {
      // 총 패키지 수를 모르는 경우 시간 기반 추정
      const elapsed = Date.now() - this.startTime;
      const estimatedTotal = 60000; // 1분 추정
      percentage = Math.min(Math.round((elapsed / estimatedTotal) * 100), 95);
      message = 'Installing...';
    }
    
    if (this.currentPackage) {
      message += ` (${this.currentPackage})`;
    }
    
    this.progressBar.update(percentage, message);
  }

  complete() {
    this.progressBar.complete(chalk.green('✅ Dependencies installed successfully!'));
  }

  fail(error) {
    this.progressBar.fail(chalk.red(`❌ Installation failed: ${error.message}`));
  }
}

/**
 * 스피너 유틸리티
 */
class Spinner {
  constructor(message = 'Loading...', frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']) {
    this.message = message;
    this.frames = frames;
    this.current = 0;
    this.interval = null;
    this.isSpinning = false;
  }

  start() {
    if (this.isSpinning) return;
    
    this.isSpinning = true;
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.current]} ${this.message}`);
      this.current = (this.current + 1) % this.frames.length;
    }, 100);
  }

  stop(finalMessage = '') {
    if (!this.isSpinning) return;
    
    this.isSpinning = false;
    clearInterval(this.interval);
    
    if (finalMessage) {
      process.stdout.write(`\r${finalMessage}\n`);
    } else {
      process.stdout.write('\r');
    }
  }

  succeed(message) {
    this.stop(chalk.green(`✅ ${message}`));
  }

  fail(message) {
    this.stop(chalk.red(`❌ ${message}`));
  }

  warn(message) {
    this.stop(chalk.yellow(`⚠️  ${message}`));
  }

  info(message) {
    this.stop(chalk.blue(`ℹ️  ${message}`));
  }
}

module.exports = {
  ProgressIndicator,
  InstallProgressTracker,
  Spinner
}; 