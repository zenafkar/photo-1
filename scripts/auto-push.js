import chokidar from 'chokidar';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Absolute path to repository root (assumes this script lives in ./scripts folder)
const REPO_ROOT = path.resolve(__dirname, '..');

// Initialize watcher, ignoring typical folders
const watcher = chokidar.watch(REPO_ROOT, {
  ignored: /(?:node_modules|\.git|\.idea|\.vscode)/,
  persistent: true,
  ignoreInitial: true,
});

let debounceTimer = null;
const DEBOUNCE_MS = 5000; // wait 5 seconds after last change before committing

function runGitCommands() {
  try {
    console.log('[auto-push] Staging changes...');
    execSync('git add .', { cwd: REPO_ROOT, stdio: 'inherit' });
    const msg = `auto: update ${new Date().toISOString()}`;
    console.log(`[auto-push] Committing: ${msg}`);
    execSync(`git commit -m "${msg}"`, { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log('[auto-push] Pushing to origin/master...');
    execSync('git push origin master', { cwd: REPO_ROOT, stdio: 'inherit' });
    console.log('[auto-push] Push completed successfully.');
  } catch (err) {
    const stdout = err.stdout?.toString() || '';
    if (stdout.includes('nothing to commit')) {
      console.log('[auto-push] No changes to commit.');
    } else {
      console.error('[auto-push] Git error:', err.message);
    }
  }
}

watcher.on('all', (event, filePath) => {
  console.log(`[auto-push] Detected ${event} on ${filePath}`);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runGitCommands, DEBOUNCE_MS);
});

process.on('SIGINT', () => {
  console.log('\n[auto-push] Shutting down watcher...');
  watcher.close();
  process.exit(0);
});

console.log('[auto-push] Watching repository for changes...');
