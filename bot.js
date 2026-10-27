import { Client, GatewayIntentBits, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { startAternosServer } from './lib/aternos.js';
import { AdFlowError } from './lib/ads.js';
import { StartRateLimiter, formatRetry } from './lib/rateLimit.js';
import { adultGateFromEnv, checkAdultRole } from './lib/roles.js';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('DISCORD_TOKEN is required');
  process.exit(1);
}

const cooldownMs = Number(process.env.START_COOLDOWN_MS || 5 * 60 * 1000);
const rateLimiter = new StartRateLimiter({ cooldownMs });
const adultGate = adultGateFromEnv();

if (!adultGate.roleId && !adultGate.roleName) {
  console.error(
    'Set ADULT_ROLE_ID and/or ADULT_ROLE_NAME — adult role gate is mandatory (fail closed).'
  );
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.trim().toLowerCase() !== '!start') return;

  const guildId = message.guild?.id;
  const userId = message.author.id;

  let member = message.member;
  if (!member && message.guild) {
    member = await message.guild.members.fetch(userId).catch(() => null);
  }

  const roleCheck = checkAdultRole(member, adultGate);
  if (!roleCheck.ok) {
    await message.reply(`⛔ ${roleCheck.reason}`);
    return;
  }

  const gate = rateLimiter.tryAcquire(userId, guildId);
  if (!gate.allowed) {
    await message.reply(
      `⏳ Slow down — try again in ${formatRetry(gate.retryAfterMs)}.`
    );
    return;
  }

  const statusMessage = await message.reply(
    '⏳ Starting Aternos via Camoufox (humanized; ads not skipped)…'
  );

  try {
    const info = await startAternosServer({
      onProgress: async (msg) => {
        await statusMessage.edit(`⏳ ${msg}`).catch(() => {});
      },
    });

    await statusMessage.edit(
      `✅ Server start flow finished.\n**Status:** ${info.status}\n**IP:** \`${info.ip}\`\n**Players:** ${info.players}\n**Version:** ${info.version}`
    );

    // Optional webhook mirror (same shape as upstream).
    const whId = process.env.WEBHOOK_ID;
    const whToken = process.env.WEBHOOK_TOKEN;
    if (whId && whToken) {
      try {
        const webhook = await client.fetchWebhook(whId, whToken);
        await webhook.send({
          content: `Aternos **${info.status}** — \`${info.ip}\` · players ${info.players} · ${info.version}`,
        });
      } catch (err) {
        console.warn('Webhook update failed:', err?.message || err);
      }
    }
  } catch (err) {
    console.error('start failed:', err);
    const friendly =
      err instanceof AdFlowError
        ? `❌ Ad flow failed (fail closed): ${err.message}`
        : '❌ Failed to start Aternos server. Check logs.';
    await statusMessage.edit(friendly).catch(() => {});
  }
});

client.login(token);
