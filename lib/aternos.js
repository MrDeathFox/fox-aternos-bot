import fs from 'node:fs/promises';
import path from 'node:path';
import { Camoufox } from 'camoufox';
import { completeRewardedAdOrFail, dismissDangerConfirm, AdFlowError } from './ads.js';
import { sleepJitter, typeOptions } from './human.js';
import { loadStorageStatePath, saveStorageState } from './storage.js';

/**
 * Launch Camoufox with humanized cursor and optional persistent profile /
 * Playwright storageState. Never kills Chrome/Firefox processes globally.
 *
 * @param {{
 *   headless?: boolean | 'virtual',
 *   userDataDir?: string,
 *   stateDir?: string,
 *   os?: string,
 * }} [opts]
 */
export async function launchCamoufoxSession(opts = {}) {
  const headless =
    opts.headless ??
    (process.env.CAMOUFOX_HEADLESS === '0'
      ? false
      : process.env.CAMOUFOX_HEADLESS === 'virtual'
        ? 'virtual'
        : true);
  const userDataDir = opts.userDataDir || process.env.CAMOUFOX_PROFILE_DIR || './camoufox-profile';
  const stateDir = opts.stateDir || process.env.STORAGE_STATE_DIR || './data';
  const os = opts.os || process.env.CAMOUFOX_OS || undefined;

  await fs.mkdir(path.resolve(userDataDir), { recursive: true });
  await fs.mkdir(path.resolve(stateDir), { recursive: true });

  const storageState = await loadStorageStatePath(stateDir);

  /** @type {Record<string, unknown>} */
  const launch = {
    headless,
    humanize: true,
    // Ads must load — do not block_images
    block_images: false,
    persistent_context: true,
    user_data_dir: path.resolve(userDataDir),
  };
  if (os) launch.os = os;
  if (storageState) launch.storageState = storageState;

  const context = await Camoufox(launch);
  const page = await context.newPage();
  return { context, page, stateDir, userDataDir };
}

/**
 * @param {import('playwright-core').Page} page
 * @param {{ user?: string, pass?: string }} creds
 */
async function ensureLoggedIn(page, creds) {
  await page.goto('https://aternos.org/go/', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await sleepJitter(800, 1800);

  const serversLink = page.locator('a[href="/servers/"]').first();
  if (await serversLink.isVisible().catch(() => false)) {
    await serversLink.click({ delay: 40 });
    await sleepJitter(500, 1200);
    return { loggedIn: true, usedPassword: false };
  }

  if (!creds.user || !creds.pass) {
    throw new Error(
      'Not logged in and ATERNOS_USER/ATERNOS_PASS unset. Run `npm run manual-login` once.'
    );
  }

  // Prefer main-frame inputs; fall back to any frame that has them.
  let userInput = page.locator('input#user').first();
  if (!(await userInput.isVisible().catch(() => false))) {
    for (const frame of page.frames()) {
      const loc = frame.locator('input#user').first();
      if (await loc.isVisible().catch(() => false)) {
        userInput = loc;
        const passInput = frame.locator('input#password').first();
        const submit = frame.locator('button[type="submit"]').first();
        await userInput.click({ delay: 30 });
        await userInput.fill('');
        await userInput.pressSequentially(creds.user, typeOptions());
        await sleepJitter(200, 600);
        await passInput.click({ delay: 30 });
        await passInput.fill('');
        await passInput.pressSequentially(creds.pass, typeOptions());
        await sleepJitter(300, 800);
        await submit.click({ delay: 40 });
        await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});
        return { loggedIn: true, usedPassword: true };
      }
    }
    throw new Error('Login form not found on Aternos go page.');
  }

  const passInput = page.locator('input#password').first();
  const submit = page.locator('button[type="submit"]').first();
  await userInput.click({ delay: 30 });
  await userInput.fill('');
  await userInput.pressSequentially(creds.user, typeOptions());
  await sleepJitter(200, 600);
  await passInput.click({ delay: 30 });
  await passInput.fill('');
  await passInput.pressSequentially(creds.pass, typeOptions());
  await sleepJitter(300, 800);
  await submit.click({ delay: 40 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});
  return { loggedIn: true, usedPassword: true };
}

/**
 * @param {import('playwright-core').Page} page
 */
export async function readServerInfo(page) {
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusText = await page
      .evaluate(() => {
        if (document.querySelector('div.status.online')) return 'Online';
        if (document.querySelector('div.status.offline')) return 'Offline';
        if (document.querySelector('div.status.loading')) return 'Loading';
        if (document.querySelector('div.status.preparing')) return 'Preparing';
        if (document.querySelector('div.status.queue')) return 'In Queue';
        return 'Unknown';
      })
      .catch(() => 'Unknown');

    const ip = await page
      .locator('span#ip')
      .first()
      .textContent()
      .then((t) => (t || 'N/A').trim())
      .catch(() => 'N/A');
    const players = await page
      .locator('div.live-status-box-value.js-players')
      .first()
      .textContent()
      .then((t) => (t || 'N/A').trim())
      .catch(() => 'N/A');
    const version = await page
      .locator('span#version')
      .first()
      .textContent()
      .then((t) => (t || 'N/A').trim())
      .catch(() => 'N/A');

    if (statusText === 'Online' || statusText === 'Offline') {
      return { status: statusText, ip, players, version };
    }

    console.log(`Waiting for server… (${attempt + 1}/${maxAttempts}) status=${statusText}`);
    await sleepJitter(1800, 2600);
  }
  return { status: 'Timeout', ip: 'N/A', players: 'N/A', version: 'N/A' };
}

/**
 * Start the first listed Aternos server using Camoufox.
 * Closes only the browser we launched — no OS-wide process murder.
 *
 * @param {{
 *   user?: string,
 *   pass?: string,
 *   headless?: boolean | 'virtual',
 *   userDataDir?: string,
 *   stateDir?: string,
 *   onProgress?: (msg: string) => void | Promise<void>,
 * }} [opts]
 */
export async function startAternosServer(opts = {}) {
  const onProgress = opts.onProgress || (() => {});
  let context;
  try {
    await onProgress('Launching Camoufox…');
    const session = await launchCamoufoxSession(opts);
    context = session.context;
    const { page, stateDir } = session;

    await onProgress('Opening Aternos…');
    await ensureLoggedIn(page, {
      user: opts.user ?? process.env.ATERNOS_USER,
      pass: opts.pass ?? process.env.ATERNOS_PASS,
    });

    await page.goto('https://aternos.org/servers/', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await sleepJitter(700, 1500);

    const serverBody = page.locator('div.server-body').first();
    await serverBody.waitFor({ state: 'visible', timeout: 15_000 });
    await serverBody.click({ delay: 40 });
    await sleepJitter(800, 1600);

    await page.locator('#start').waitFor({ state: 'visible', timeout: 20_000 });
    await sleepJitter(400, 1000);
    await page.locator('#start').click({ delay: 50 });
    console.log('Clicked #start');

    await dismissDangerConfirm(page);
    await onProgress('Waiting for advertisement flow (no skip)…');
    await completeRewardedAdOrFail(page, {
      timeoutMs: Number(process.env.AD_WAIT_MS || 180_000),
    });

    await sleepJitter(2000, 4000);
    const info = await readServerInfo(page);

    await saveStorageState({ stateDir, context });
    return info;
  } catch (err) {
    if (err instanceof AdFlowError) throw err;
    throw err;
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
  }
}
