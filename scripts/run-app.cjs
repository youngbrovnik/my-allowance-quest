const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const { version } = require('../package.json');
const command = process.argv[2];
if (!['start', 'build'].includes(command)) {
  throw new Error('Supported commands: start, build');
}

let commit = 'unknown';
let modified = false;
try {
  commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  modified = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
} catch {
  // Git 메타데이터가 없는 환경에서도 버전과 빌드 시각은 표시합니다.
}
const builtAt = new Date().toISOString();
console.log(`Build info: v${version} / ${commit}${modified ? ' (modified)' : ''} / ${builtAt}`);
const result = spawnSync(process.execPath, [require.resolve('react-scripts/bin/react-scripts.js'), command, ...process.argv.slice(3)], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    REACT_APP_VERSION: version,
    REACT_APP_COMMIT: commit,
    REACT_APP_BUILD_TIME: builtAt,
    REACT_APP_BUILD_MODIFIED: String(modified),
  },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
