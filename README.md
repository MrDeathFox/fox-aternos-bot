
# Aternos Discord Bot

[![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?logo=discord&logoColor=white)](https://discord.com)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Puppeteer](https://img.shields.io/badge/Powered%20by-Puppeteer-40c4ff?logo=puppeteer&logoColor=black)](https://pptr.dev/)

A headless Discord bot that automates starting and monitoring an Aternos Minecraft server using Puppeteer and a Discord webhook.

## Features

- Start your Aternos server with `!start` in Discord
- Automatically clicks through login, ads, and dialogs
- Posts server status (IP, player count, version, etc.) via a webhook embed
- Updates the message when the server goes offline(sorta will create a new message on next server start will fix in later update)

## Requirements

- Node.js 18 or higher
- A Discord bot token
- A Webhook URL for your server status channel
- Google Chrome installed (or Chromium path configured)
- A VPS or spare computer
## Setup

1. **Clone the repository**

```bash
git clone https://github.com/MrDeathFox/fox-aternos-bot.git
cd fox-aternos-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Update your `.env`:

```
DISCORD_TOKEN=your-bot-token
ATERNOS_USER=your-aternos-username
ATERNOS_PASS=your-aternos-password
WEBHOOK_ID=your-webhook-id
WEBHOOK_TOKEN=your-webhook-token
```

4. **Login manually once**

Run:

```bash
node manual-login.js
```

This will open a browser window. Log into Aternos. Your session will be saved.

5. **Start the bot**

```bash
node bot.js
```

Now in Discord, use:

```
!start
```

## Notes

- The bot uses a persistent Puppeteer profile (`./puppeteer-profile`) to save sessions.
- Make sure your Aternos account only has **one server** or adapt the selector logic.
- The webhook must already exist in your Discord channel and match the `WEBHOOK_ID` and `WEBHOOK_TOKEN`.

## License

MIT License — feel free to use and modify. Please credit the original author.

## 🤝 MaintainerAdd commentMore actions

Made with ❤️ by [@MrDeathFox](https://github.com/MrDeathFox)

Pull requests welcome. If you'd like to add server queue support or auto-refresh ads, feel free to contribute!

## Discord Community
[Obsidian Link](https://discord.gg/mKMm5a5CCK)

## Reddit Community
[r/MinecraftServerPromo](https://www.reddit.com/r/MinecraftServerPromo/)
