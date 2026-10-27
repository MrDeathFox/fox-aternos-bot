/**
 * Adult role gate for Discord !start.
 *
 * Configure with ADULT_ROLE_ID (snowflake) and/or ADULT_ROLE_NAME (case-insensitive).
 * If neither is set, the gate is disabled (open) — set one in production.
 */

/**
 * @param {import('discord.js').GuildMember | null | undefined} member
 * @param {{ roleId?: string | null, roleName?: string | null }} gate
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function checkAdultRole(member, gate = {}) {
  const roleId = (gate.roleId || '').trim();
  const roleName = (gate.roleName || '').trim();

  if (!roleId && !roleName) {
    return { ok: true };
  }

  if (!member) {
    return {
      ok: false,
      reason: 'Adult role required; could not resolve your guild membership.',
    };
  }

  if (roleId && member.roles.cache.has(roleId)) {
    return { ok: true };
  }

  if (roleName) {
    const want = roleName.toLowerCase();
    const hit = member.roles.cache.some((r) => r.name.toLowerCase() === want);
    if (hit) return { ok: true };
  }

  const label = roleName || roleId;
  return {
    ok: false,
    reason: `You need the adult role (${label}) to run !start.`,
  };
}

/**
 * Build gate config from process env.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function adultGateFromEnv(env = process.env) {
  return {
    roleId: env.ADULT_ROLE_ID || null,
    roleName: env.ADULT_ROLE_NAME || null,
  };
}
