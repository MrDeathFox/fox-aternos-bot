import { sleepJitter } from './human.js';

/**
 * Rewarded / start-ad handling.
 *
 * Policy (camofox-aternos):
 * - Never strip Google vignettes from the DOM.
 * - Never abort image/stylesheet/font requests (ads need them).
 * - If a rewarded-ad / "watch to start" flow appears, wait for it like a human
 *   or fail closed with a clear error for Discord.
 */

export class AdFlowError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'AdFlowError';
  }
}

/**
 * Detect whether an Aternos success/ad dialog is visible.
 * @param {import('playwright-core').Page} page
 */
export async function findAdStartDialog(page) {
  const dialog = page.locator('dialog.alert.alert-success').first();
  if (await dialog.isVisible().catch(() => false)) return dialog;

  // Alternate Aternos copy / layout: success-styled buttons that mention ads.
  const alt = page
    .locator(
      'button.btn-success:has-text("ad"), button.btn-success:has-text("Ad"), button.btn-success:has-text("Watch")'
    )
    .first();
  if (await alt.isVisible().catch(() => false)) {
    return {
      isVisible: async () => alt.isVisible().catch(() => false),
      locator: () => ({ first: () => alt }),
    };
  }
  return null;
}

/**
 * Complete the rewarded-ad / advertisement start dialog if present.
 * Clicks the affirmative button, then waits for the dialog to clear or for
 * the server status to leave idle/offline — never removes ad iframes.
 *
 * @param {import('playwright-core').Page} page
 * @param {{ timeoutMs?: number, logger?: Console }} [opts]
 */
export async function completeRewardedAdOrFail(page, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 3 * 60 * 1000;
  const log = opts.logger ?? console;
  const deadline = Date.now() + timeoutMs;

  const dialog = await findAdStartDialog(page);
  if (!dialog) {
    log.info?.('No advertisement start dialog; continuing.');
    return { watched: false };
  }

  const startBtn = dialog.locator('button.btn-success').first();
  if (!(await startBtn.isVisible().catch(() => false))) {
    throw new AdFlowError(
      'Advertisement dialog is open but no start/watch button was found. Refusing to skip ads.'
    );
  }

  await sleepJitter(400, 1200);
  await startBtn.click({ delay: 50 });
  log.info?.('Clicked advertisement start/watch control; waiting for ad flow to finish…');

  while (Date.now() < deadline) {
    const stillOpen = await dialog.isVisible().catch(() => false);
    if (!stillOpen) {
      log.info?.('Advertisement dialog closed.');
      return { watched: true };
    }

    // Some Aternos flows leave the dialog while status moves to loading/queue/online.
    const status = await page
      .evaluate(() => {
        if (document.querySelector('div.status.online')) return 'Online';
        if (document.querySelector('div.status.loading')) return 'Loading';
        if (document.querySelector('div.status.preparing')) return 'Preparing';
        if (document.querySelector('div.status.queue')) return 'In Queue';
        return null;
      })
      .catch(() => null);

    if (status && status !== 'Offline') {
      log.info?.(`Server status advanced to ${status} during ad wait.`);
      return { watched: true, status };
    }

    await sleepJitter(1500, 2800);
  }

  throw new AdFlowError(
    'Timed out waiting for the rewarded advertisement to finish. Fail closed — no ad skip.'
  );
}

/**
 * Confirm-danger dialogs (non-ad) — e.g. "already starting".
 * Safe to dismiss; not an ad-skip path.
 *
 * @param {import('playwright-core').Page} page
 */
export async function dismissDangerConfirm(page) {
  const dialog = page.locator('dialog.alert.alert-danger').first();
  if (!(await dialog.isVisible().catch(() => false))) return false;
  const btn = dialog.locator('button.btn.btn-danger').first();
  if (await btn.isVisible().catch(() => false)) {
    await sleepJitter(300, 900);
    await btn.click({ delay: 40 });
    return true;
  }
  return false;
}
