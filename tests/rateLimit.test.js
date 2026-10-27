import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { StartRateLimiter, formatRetry } from '../lib/rateLimit.js';

describe('StartRateLimiter', () => {
  it('allows first acquire and blocks second within cooldown', () => {
    let now = 1_000_000;
    const lim = new StartRateLimiter({
      cooldownMs: 60_000,
      now: () => now,
    });

    const a = lim.tryAcquire('u1', 'g1');
    assert.equal(a.allowed, true);

    const b = lim.tryAcquire('u1', 'g1');
    assert.equal(b.allowed, false);
    assert.ok(b.retryAfterMs > 0 && b.retryAfterMs <= 60_000);

    now += 60_001;
    const c = lim.tryAcquire('u1', 'g1');
    assert.equal(c.allowed, true);
  });

  it('isolates users and guilds', () => {
    const lim = new StartRateLimiter({ cooldownMs: 10_000, now: () => 0 });
    assert.equal(lim.tryAcquire('u1', 'g1').allowed, true);
    assert.equal(lim.tryAcquire('u2', 'g1').allowed, true);
    assert.equal(lim.tryAcquire('u1', 'g2').allowed, true);
    assert.equal(lim.tryAcquire('u1', 'g1').allowed, false);
  });
});

describe('formatRetry', () => {
  it('formats seconds and minutes', () => {
    assert.equal(formatRetry(1500), '2s');
    assert.equal(formatRetry(90_000), '2m');
  });
});
