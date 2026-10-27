# camofox-aternos

Stealth-oriented fork of [MrDeathFox/fox-aternos-bot](https://github.com/MrDeathFox/fox-aternos-bot): a Discord `!start` bot that drives the Aternos panel with **Camoufox** (Firefox fingerprint via Playwright) instead of stock Puppeteer + Chrome.

**Credit:** original project by **MrDeathFox** (`fox-aternos-bot`). This tree renames the product to **camofox-aternos** and changes the browser stack / policy.

---

## Honest warning (read this)

Aternos [Terms of Service](https://aternos.gmbh/en/aternos/terms) **§5.2(e)** prohibits *automatically accessing the website or automating actions on the website*. Discord bots that click Start on the panel violate that rule. Staff have confirmed the same on the community board and Reddit: panel automation (including Discord start bots) is banned; in-game Discord bridges like DiscordSRV are fine.

**Stealth is not a ToS waiver and is not ban-proof.** Camoufox + humanized cursor may reduce naive bot fingerprints; Aternos can still detect, suspend, or delete accounts. Use at your own risk.

### Legal / supported alternative

If you need Discord start/stop without panel scraping, use **[exaroton](https://exaroton.com/)** (same company, paid on-demand) with the [official Discord bot](https://support.exaroton.com/hc/en-us/articles/360019687777-Using-the-exaroton-Discord-bot) and/or the [public API](https://developers.exaroton.com/).

---

## What changed vs upstream

| Area | fox-aternos-bot | camofox-aternos |
|------|-----------------|-----------------|
| Browser | Puppeteer + Chrome profile | Camoufox + `playwright-core`, `humanize: true` |
| Ads | Vignette DOM removal; request abort for images/CSS/fonts | **No ad skip** — watch rewarded flow or fail closed |
| Cleanup | README documented `taskkill` Chrome | **Never** kills unrelated browser processes |
| Discord | Open `!start` | Rate limit + optional adult role gate |
| Session | Chrome userDataDir | Persistent profile + Playwright `storage-state.json` |

---

## Requirements

- Node.js **≥ 22.15**
- Camoufox browser build (`npm run fetch-browser`)
- Discord bot with Message Content intent
- Aternos account (manual login once recommended)

## Setup

```bash
cp .env.example .env
# fill DISCORD_TOKEN; optional ATERNOS_*; ADULT_ROLE_*; WEBHOOK_*
npm install
npm run fetch-browser
npm run manual-login   # headed Camoufox; solve CAPTCHA; saves ./data/storage-state.json
npm start              # then !start in Discord
```

### Docker Compose (local only)

```bash
cp .env.example .env   # fill secrets
docker compose up --build
```

Volumes keep `camoufox-profile` + storage-state under the `camofox-data` volume. This is for local/dev — not estate production deploy.

## Configuration

See `.env.example`. Highlights:

- `ADULT_ROLE_ID` and/or `ADULT_ROLE_NAME` — **required**; bot refuses to start without a gate
- Discord Developer Portal: enable **Message Content** and **Server Members** intents
- `START_COOLDOWN_MS` — per-user-per-guild cooldown (default 5 minutes)
- `STORAGE_STATE_DIR` — Playwright storage state (prefer over password every run)
- `AD_WAIT_MS` — max wait for rewarded ad completion before fail-closed
- `CAMOUFOX_HEADLESS` — unset/`1` = headless; `0` = headed; `virtual` = Xvfb virtual display

## Tests

```bash
npm test
```

Unit coverage for rate limiter, adult role gate, human jitter, and ad fail-closed helpers. Camoufox smoke: `CAMOUFOX_HEADLESS=1 node scripts/smoke-launch.js` (does not hit Aternos).

## Auth expiry

After Discord token rotate or Aternos session expiry: update `.env` / re-run `npm run manual-login`. There is no refresh-token loop for Aternos panel cookies — storage-state is the long-lived credential until the site invalidates it.

## License

MIT — see `LICENSE`. Upstream concept and early code: MrDeathFox.
