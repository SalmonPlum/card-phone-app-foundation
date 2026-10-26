import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
async function discover(directory) {
  const entries = await readdir(new URL(directory, new URL('../', import.meta.url)), { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = `${directory}/${entry.name}`;
    return entry.isDirectory() ? discover(path) : path.endsWith('.node.test.ts') ? [path] : [];
  }));
  return nested.flat();
}
const files = (await discover('src')).sort();
if (files.length === 0) throw new Error('No Node tests discovered');
const result = spawnSync(process.execPath, ['--experimental-strip-types', '--test', '--experimental-test-isolation=none', ...files], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
