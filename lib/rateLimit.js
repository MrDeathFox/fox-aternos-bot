/**
 * In-memory start cooldown. Keyed by Discord user id (and optional guild id).
 */

export class StartRateLimiter {
  /**
   * @param {{ cooldownMs?: number, now?: () => number }} [opts]
   */
  constructor(opts = {}) {
    this.cooldownMs = Number(opts.cooldownMs ?? 5 * 60 * 1000);
    this.now = opts.now ?? (() => Date.now());
    /** @type {Map<string, number>} */
    this._last = new Map();
  }

  /**
   * @param {string} userId
   * @param {string} [guildId]
   */
  key(userId, guildId = 'dm') {
    return `${guildId}:${userId}`;
  }

  /**
   * @param {string} userId
   * @param {string} [guildId]
   * @returns {{ allowed: true } | { allowed: false, retryAfterMs: number }}
   */
  check(userId, guildId) {
    const k = this.key(userId, guildId);
    const last = this._last.get(k);
    const t = this.now();
    if (last != null && t - last < this.cooldownMs) {
      return { allowed: false, retryAfterMs: this.cooldownMs - (t - last) };
    }
    return { allowed: true };
  }

  /**
   * @param {string} userId
   * @param {string} [guildId]
   */
  mark(userId, guildId) {
    this._last.set(this.key(userId, guildId), this.now());
  }

  /**
   * Atomically check and mark if allowed.
   * @param {string} userId
   * @param {string} [guildId]
   */
  tryAcquire(userId, guildId) {
    const result = this.check(userId, guildId);
    if (result.allowed) this.mark(userId, guildId);
    return result;
  }

  clear() {
    this._last.clear();
  }
}

/**
 * @param {number} ms
 */
export function formatRetry(ms) {
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.ceil(sec / 60);
  return `${min}m`;
}
