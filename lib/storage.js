import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Playwright storage-state helpers so Aternos login survives restarts
 * without pasting the password on every !start.
 */

/**
 * @param {string} stateDir
 */
export function storageStatePath(stateDir) {
  return path.resolve(stateDir, 'storage-state.json');
}

/**
 * @param {string} stateDir
 * @returns {Promise<string | undefined>} path if usable, else undefined
 */
export async function loadStorageStatePath(stateDir) {
  if (!stateDir) return undefined;
  const p = storageStatePath(stateDir);
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return undefined;
    if (!Array.isArray(parsed.cookies)) return undefined;
    return p;
  } catch (err) {
    if (err && err.code === 'ENOENT') return undefined;
    console.warn('storage-state unreadable, ignoring:', err?.message || err);
    return undefined;
  }
}

/**
 * @param {{ stateDir: string, context: import('playwright-core').BrowserContext }} opts
 */
export async function saveStorageState({ stateDir, context }) {
  if (!stateDir || !context) {
    return { saved: false, reason: 'disabled' };
  }
  const dir = path.resolve(stateDir);
  const p = storageStatePath(dir);
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  try {
    await fs.mkdir(dir, { recursive: true });
    await context.storageState({ path: tmp });
    await fs.rename(tmp, p);
    return { saved: true, path: p };
  } catch (err) {
    await fs.unlink(tmp).catch(() => {});
    console.warn('failed to save storage-state:', err?.message || err);
    return { saved: false, reason: 'error', error: err };
  }
}
