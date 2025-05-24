const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// 플레이스홀더 정의
const PLACEHOLDERS = {
  PROJECT_NAME: '{{PROJECT_NAME}}',
  PROJECT_SLUG: '{{PROJECT_SLUG}}',
  PROJECT_SCHEME: '{{PROJECT_SCHEME}}',
  PROJECT_DESCRIPTION: '{{PROJECT_DESCRIPTION}}'
};

// 바이너리 파일 확장자 목록
const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.mp4', '.mov', '.avi', '.mp3', '.wav',
  '.zip', '.tar', '.gz', '.rar',
  '.ttf', '.otf', '.woff', '.woff2',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx'
];

// 텍스트 파일 확장자 목록 (플레이스홀더 치환 대상)
const TEXT_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt',
  '.html', '.css', '.scss', '.less', '.xml', '.yml', '.yaml',
  '.gitignore', '.env', '.env.example'
];

/**
 * 파일이 바이너리인지 확인
 */
function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}

/**
 * 파일이 텍스트 파일인지 확인
 */
function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);
  
  const specialTextFiles = ['.gitignore', '.env', '.env.example', 'README', 'LICENSE'];
  
  return TEXT_EXTENSIONS.includes(ext) || 
         specialTextFiles.some(special => basename.startsWith(special));
}

/**
 * 프로젝트 이름으로부터 다양한 형태의 이름 생성
 */
function generateProjectVariables(projectName) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const scheme = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const description = `A React Native app created with create-expo-spark`;
  
  return {
    name: projectName,
    slug: slug,
    scheme: scheme,
    description: description
  };
}

/**
 * 텍스트 파일의 플레이스홀더를 실제 값으로 치환
 */
function replacePlaceholders(content, variables) {
  let result = content;
  
  result = result.replace(/create-expo-spark/g, variables.name);
  result = result.replace(/createexpospark/g, variables.scheme);
  
  Object.entries(PLACEHOLDERS).forEach(([key, placeholder]) => {
    const value = variables[key.toLowerCase().replace('project_', '')];
    if (value) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
  });
  
  return result;
}

/**
 * 디렉토리를 재귀적으로 스캔하여 모든 파일 목록 반환
 */
async function scanDirectory(dirPath, basePath = dirPath) {
  const files = [];
  const items = await fs.readdir(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(basePath, fullPath);
    const stat = await fs.stat(fullPath);
    
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        const subFiles = await scanDirectory(fullPath, basePath);
        files.push(...subFiles);
      }
    } else {
      files.push({
        fullPath,
        relativePath,
        isDirectory: false,
        isBinary: isBinaryFile(fullPath),
        isText: isTextFile(fullPath),
        size: stat.size
      });
    }
  }
  
  return files;
}

/**
 * 템플릿 파일들을 분석하여 플레이스홀더 정보 반환
 */
async function analyzeTemplate(templatePath) {
  console.log(chalk.blue('📋 Analyzing template files...'));
  
  const files = await scanDirectory(templatePath);
  
  const analysis = {
    totalFiles: files.length,
    binaryFiles: files.filter(f => f.isBinary).length,
    textFiles: files.filter(f => f.isText).length,
    otherFiles: files.filter(f => !f.isBinary && !f.isText).length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    placeholders: Object.values(PLACEHOLDERS),
    files: files
  };
  
  console.log(chalk.green(`✅ Template analysis complete:`));
  console.log(`   Total files: ${analysis.totalFiles}`);
  console.log(`   Binary files: ${analysis.binaryFiles}`);
  console.log(`   Text files: ${analysis.textFiles}`);
  console.log(`   Other files: ${analysis.otherFiles}`);
  console.log(`   Total size: ${(analysis.totalSize / 1024).toFixed(2)} KB\n`);
  
  return analysis;
}

/**
 * 템플릿 소스 경로 해결
 */
function resolveTemplatePath(packageRoot) {
  const templatePath = path.join(packageRoot, 'templates', 'create-expo-spark');
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template directory not found: ${templatePath}`);
  }
  
  return templatePath;
}

/**
 * 대상 프로젝트 경로 해결 및 검증
 */
async function resolveDestinationPath(projectName, targetDir = process.cwd(), force = false) {
  const destinationPath = path.resolve(targetDir, projectName);
  
  const exists = await fs.pathExists(destinationPath);
  
  if (exists && !force) {
    throw new Error(
      `Directory "${projectName}" already exists. Use --force to overwrite.`
    );
  }
  
  const parentDir = path.dirname(destinationPath);
  if (!await fs.pathExists(parentDir)) {
    throw new Error(`Parent directory does not exist: ${parentDir}`);
  }
  
  try {
    await fs.access(parentDir, fs.constants.W_OK);
  } catch (error) {
    throw new Error(`No write permission for directory: ${parentDir}`);
  }
  
  return {
    destinationPath,
    exists,
    parentDir,
    projectName
  };
}

/**
 * 패키지 루트 디렉토리 찾기
 */
function findPackageRoot() {
  let currentDir = __dirname;
  
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = require(packageJsonPath);
        if (packageJson.name === 'create-expo-spark') {
          return currentDir;
        }
      } catch (error) {
        // 계속 찾기
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  const globalNodeModules = path.join(process.env.NODE_PATH || '', 'create-expo-spark');
  if (fs.existsSync(globalNodeModules)) {
    return globalNodeModules;
  }
  
  throw new Error('Could not find create-expo-spark package root directory');
}

/**
 * 파일 경로 매핑 생성
 */
function createFileMapping(files, sourcePath, destinationPath) {
  return files.map(file => ({
    ...file,
    sourcePath: file.fullPath,
    destinationPath: path.join(destinationPath, file.relativePath),
    destinationDir: path.dirname(path.join(destinationPath, file.relativePath))
  }));
}

/**
 * 단일 바이너리 파일 복사
 */
async function copyBinaryFile(sourcePath, destinationPath) {
  await fs.ensureDir(path.dirname(destinationPath));
  
  await fs.copy(sourcePath, destinationPath, {
    preserveTimestamps: true,
    overwrite: true
  });
}

/**
 * 단일 텍스트 파일 복사
 */
async function copyTextFile(sourcePath, destinationPath) {
  await fs.ensureDir(path.dirname(destinationPath));
  
  await fs.copy(sourcePath, destinationPath, {
    preserveTimestamps: true,
    overwrite: true
  });
}

/**
 * 파일 타입에 따라 적절한 복사 방법 선택
 */
async function copyFileByType(fileInfo, options = {}) {
  const { sourcePath, destinationPath, isBinary } = fileInfo;
  
  try {
    if (isBinary) {
      await copyBinaryFile(sourcePath, destinationPath);
    } else {
      await copyTextFile(sourcePath, destinationPath);
    }
  } catch (error) {
    throw new Error(`Failed to copy file ${sourcePath} to ${destinationPath}: ${error.message}`);
  }
}

/**
 * 여러 파일을 병렬로 복사
 */
async function copyFiles(fileMappings, options = {}, progressCallback = null) {
  const { concurrency = 5 } = options;
  const results = [];
  let completed = 0;
  
  const chunks = [];
  for (let i = 0; i < fileMappings.length; i += concurrency) {
    chunks.push(fileMappings.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (fileMapping) => {
      try {
        await copyFileByType(fileMapping, options);
        completed++;
        
        if (progressCallback) {
          progressCallback({
            completed,
            total: fileMappings.length,
            current: fileMapping,
            percentage: Math.round((completed / fileMappings.length) * 100)
          });
        }
        
        return { success: true, file: fileMapping };
      } catch (error) {
        completed++;
        
        if (progressCallback) {
          progressCallback({
            completed,
            total: fileMappings.length,
            current: fileMapping,
            percentage: Math.round((completed / fileMappings.length) * 100),
            error: error.message
          });
        }
        
        return { success: false, file: fileMapping, error: error.message };
      }
    });
    
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * 디렉토리 구조 미리 생성
 */
async function ensureDirectories(fileMappings) {
  const directories = new Set();
  
  fileMappings.forEach(mapping => {
    directories.add(mapping.destinationDir);
  });
  
  const dirPromises = Array.from(directories).map(dir => fs.ensureDir(dir));
  await Promise.all(dirPromises);
}

/**
 * 파일 복사 검증
 */
async function validateCopiedFiles(fileMappings) {
  const validation = {
    totalFiles: fileMappings.length,
    successfulCopies: 0,
    failedCopies: 0,
    missingFiles: [],
    sizeMismatches: []
  };
  
  for (const mapping of fileMappings) {
    try {
      const sourceStats = await fs.stat(mapping.sourcePath);
      const destStats = await fs.stat(mapping.destinationPath);
      
      if (sourceStats.size === destStats.size) {
        validation.successfulCopies++;
      } else {
        validation.sizeMismatches.push({
          file: mapping.relativePath,
          sourceSize: sourceStats.size,
          destSize: destStats.size
        });
        validation.failedCopies++;
      }
    } catch (error) {
      validation.missingFiles.push({
        file: mapping.relativePath,
        error: error.message
      });
      validation.failedCopies++;
    }
  }
  
  return validation;
}

module.exports = {  
    PLACEHOLDERS,  
    BINARY_EXTENSIONS,  
    TEXT_EXTENSIONS,  
    isBinaryFile,  
    isTextFile,  
    generateProjectVariables,  
    replacePlaceholders,  
    scanDirectory,  
    analyzeTemplate,  
    resolveTemplatePath,  
    resolveDestinationPath,  
    findPackageRoot,  
    createFileMapping,  
    copyBinaryFile,  
    copyTextFile,  
    copyFileByType,  
    copyFiles,  
    ensureDirectories,  
    validateCopiedFiles
}; 


