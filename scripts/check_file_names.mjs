import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();

const pascalCase = /^[A-Z][A-Za-z0-9]*$/;
const snakeCase = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

const ignoredDirectories = new Set(['.git', '.yarn', 'dist', 'node_modules', 'public']);
const snakeCaseDirectories = new Set([
  'server',
  'scripts',
  'src/helpers',
  'src/hooks',
  'src/lib',
  'src/types',
  'tests',
]);

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(entryPath));
    else if (entry.isFile()) files.push(entryPath);
  }

  return files;
}

function relativePath(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function directoryRule(relativeFilePath) {
  for (const directory of snakeCaseDirectories) {
    if (relativeFilePath.startsWith(`${directory}/`)) return 'snake';
  }

  return null;
}

function fileNameWithoutTypeSuffix(fileName) {
  return fileName
    .replace(/\.module\.scss$/, '')
    .replace(/\.types?\.(?:ts|tsx)$/, '')
    .replace(/\.d\.ts$/, '')
    .replace(/\.(?:integration\.)?(?:test|spec)\.[cm]?[jt]sx?$/, '')
    .replace(/\.[cm]?[jt]sx?$/, '')
    .replace(/\.json$/, '')
    .replace(/\.scss$/, '');
}

function isAllowedRootFile(relativeFilePath) {
  return /^(?:README|LICENSE|NOTICE|Dockerfile|CONTRIBUTING|GOVERNANCE|PRODUCT|SECURITY|TRADEMARKS)(?:\.|$)/.test(relativeFilePath)
    || /^(?:vite|tsconfig|package|yarn|index|server)(?:\.|$)/.test(relativeFilePath)
    || relativeFilePath.startsWith('.');
}

function expectedCase(relativeFilePath) {
  if (isAllowedRootFile(relativeFilePath)) return null;

  const fileName = path.posix.basename(relativeFilePath);
  if (fileName === 'index.ts' || fileName === 'index.tsx') return null;

  const isComponentArea = /^(?:src\/components|src\/pages)\//.test(relativeFilePath);
  const isComponentFile = isComponentArea
    && (fileName.endsWith('.tsx') || fileName.endsWith('.module.scss') || fileName.endsWith('.types.ts'));
  const rule = isComponentFile ? 'pascal' : (relativeFilePath.startsWith('src/components/') ? 'snake' : directoryRule(relativeFilePath));
  if (!rule) return null;

  return { rule, baseName: fileNameWithoutTypeSuffix(fileName) };
}

const violations = [];

for (const filePath of walk(root)) {
  const relativeFilePath = relativePath(filePath);
  const result = expectedCase(relativeFilePath);
  if (!result) continue;

  const valid = result.rule === 'pascal' ? pascalCase.test(result.baseName) : snakeCase.test(result.baseName);
  if (!valid) violations.push(`${relativeFilePath}: expected ${result.rule}Case filename`);
}

if (violations.length > 0) {
  console.error('Filename convention violations:');
  for (const violation of violations.sort()) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log('Filename conventions passed.');
}
