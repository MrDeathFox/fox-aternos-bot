/**
 * One-shot headed Camoufox session for CAPTCHA / first login.
 * Saves Playwright storage-state under STORAGE_STATE_DIR (default ./data).
 */
import dotenv from 'dotenv';
import { Camoufox } from 'camoufox';
import path from 'node:path';
import fs from 'node:fs/promises';
import { saveStorageState } from '../lib/storage.js';

dotenv.config();

const userDataDir = path.resolve(process.env.CAMOUFOX_PROFILE_DIR || './camoufox-profile');
const stateDir = path.resolve(process.env.STORAGE_STATE_DIR || './data');
const waitMs = Number(process.env.MANUAL_LOGIN_MS || 5 * 60 * 1000);

await fs.mkdir(userDataDir, { recursive: true });
await fs.mkdir(stateDir, { recursive: true });

const context = await Camoufox({
  headless: false,
  humanize: true,
  block_images: false,
  persistent_context: true,
  user_data_dir: userDataDir,
});

const page = await context.newPage();
await page.goto('https://aternos.org/go/', { waitUntil: 'domcontentloaded' });

console.log('Camoufox opened. Log in manually and solve any CAPTCHA.');
console.log(`Waiting ${Math.round(waitMs / 1000)}s, then saving storage-state…`);

await new Promise((r) => setTimeout(r, waitMs));

const saved = await saveStorageState({ stateDir, context });
console.log(saved.saved ? `Saved ${saved.path}` : 'storage-state not saved', saved);
await context.close();
