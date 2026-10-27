/**
 * Timing jitter helpers. Camoufox humanize=True covers cursor paths;
 * these cover waits and typing cadence so actions are not metronomic.
 */

/**
 * @param {number} minMs
 * @param {number} maxMs
 * @returns {number}
 */
export function jitterMs(minMs, maxMs) {
  const lo = Math.min(minMs, maxMs);
  const hi = Math.max(minMs, maxMs);
  return Math.floor(lo + Math.random() * (hi - lo + 1));
}

/**
 * @param {number} minMs
 * @param {number} maxMs
 * @returns {Promise<void>}
 */
export function sleepJitter(minMs, maxMs) {
  const ms = jitterMs(minMs, maxMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Per-keystroke delay range for page.type / keyboard.type.
 * @returns {{ delay: number }}
 */
export function typeOptions() {
  return { delay: jitterMs(40, 120) };
}
