import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { jitterMs, typeOptions } from '../lib/human.js';

describe('jitterMs', () => {
  it('stays within inclusive bounds', () => {
    for (let i = 0; i < 50; i++) {
      const v = jitterMs(10, 20);
      assert.ok(v >= 10 && v <= 20);
    }
  });

  it('handles reversed args', () => {
    const v = jitterMs(20, 10);
    assert.ok(v >= 10 && v <= 20);
  });
});

describe('typeOptions', () => {
  it('returns a delay in the typing band', () => {
    const { delay } = typeOptions();
    assert.ok(delay >= 40 && delay <= 120);
  });
});
