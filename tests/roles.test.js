import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdultRole, adultGateFromEnv } from '../lib/roles.js';

function memberWithRoles(roles) {
  return {
    roles: {
      cache: {
        has: (id) => roles.some((r) => r.id === id),
        some: (fn) => roles.some(fn),
      },
    },
  };
}

describe('checkAdultRole', () => {
  it('passes when gate unset', () => {
    assert.equal(checkAdultRole(null, {}).ok, true);
  });

  it('fails without member when gate set', () => {
    const r = checkAdultRole(null, { roleId: '1' });
    assert.equal(r.ok, false);
  });

  it('passes on role id match', () => {
    const m = memberWithRoles([{ id: '99', name: 'Adult' }]);
    assert.equal(checkAdultRole(m, { roleId: '99' }).ok, true);
  });

  it('passes on role name match (case-insensitive)', () => {
    const m = memberWithRoles([{ id: '1', name: 'Adult' }]);
    assert.equal(checkAdultRole(m, { roleName: 'adult' }).ok, true);
  });

  it('fails when neither matches', () => {
    const m = memberWithRoles([{ id: '1', name: 'Kid' }]);
    assert.equal(checkAdultRole(m, { roleId: '99', roleName: 'Adult' }).ok, false);
  });
});

describe('adultGateFromEnv', () => {
  it('reads env', () => {
    const g = adultGateFromEnv({ ADULT_ROLE_ID: '1', ADULT_ROLE_NAME: 'Adult' });
    assert.equal(g.roleId, '1');
    assert.equal(g.roleName, 'Adult');
  });
});
