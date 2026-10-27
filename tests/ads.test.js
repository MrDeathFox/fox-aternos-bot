import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { completeRewardedAdOrFail, AdFlowError } from '../lib/ads.js';

function makePage({ dialogVisible = false, buttonVisible = false, statusAfter = null } = {}) {
  let clicks = 0;
  let dialogOpen = dialogVisible;

  const dialog = {
    isVisible: async () => dialogOpen,
    locator: () => ({
      first: () => ({
        isVisible: async () => buttonVisible,
        click: async () => {
          clicks += 1;
          // Simulate ad finishing after click
          dialogOpen = false;
        },
      }),
    }),
  };

  return {
    clicks: () => clicks,
    locator: () => ({ first: () => dialog }),
    evaluate: async () => statusAfter,
  };
}

describe('completeRewardedAdOrFail', () => {
  it('no-ops when dialog absent', async () => {
    const page = makePage({ dialogVisible: false });
    const r = await completeRewardedAdOrFail(page, { timeoutMs: 1000 });
    assert.equal(r.watched, false);
  });

  it('clicks watch and waits for dialog close', async () => {
    const page = makePage({ dialogVisible: true, buttonVisible: true });
    const r = await completeRewardedAdOrFail(page, { timeoutMs: 15_000 });
    assert.equal(r.watched, true);
    assert.equal(page.clicks(), 1);
  });

  it('fails closed when dialog has no button', async () => {
    const page = makePage({ dialogVisible: true, buttonVisible: false });
    await assert.rejects(
      () => completeRewardedAdOrFail(page, { timeoutMs: 1000 }),
      (err) => err instanceof AdFlowError
    );
  });
});
