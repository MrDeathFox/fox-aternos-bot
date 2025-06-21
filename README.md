# Aternos Discord Server Control Bot

![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey)

A Discord bot that automates starting your Aternos Minecraft server, posts server status updates via webhook embeds, and handles common Aternos web dialogs automatically.

---

## Features

- ✅ Starts your Aternos server via Puppeteer automation  
- 🔒 Handles login and Google vignette popup automatically  
- 📺 Detects and interacts with advertisement dialogs  
- 🖼️ Posts a rich embed with server IP, status, player count, and version in a specified webhook channel  
- 🔁 Updates the server status embed live until the server goes offline  
- ✉️ Sends a “starting server” message as a reply in the command channel (not via webhook)

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/aternos-discord-bot.git
cd aternos-discord-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure `.env`

Copy `.env.example` and fill in your credentials:

```bash
cp .env.example .env
```

#### Required variables:

| Variable        | Description                             |
|----------------|-----------------------------------------|
| `DISCORD_TOKEN` | Discord bot token                       |
| `ATERNOS_USER`  | Aternos account username/email          |
| `ATERNOS_PASS`  | Aternos account password                |
| `WEBHOOK_ID`    | Webhook ID for server status channel    |
| `WEBHOOK_TOKEN` | Webhook token for server status channel |

> 📌 You can find `WEBHOOK_ID` and `WEBHOOK_TOKEN` by creating a webhook in your Discord channel and copying the URL:  
> Format: `https://discord.com/api/webhooks/{WEBHOOK_ID}/{WEBHOOK_TOKEN}`

### 4. Run manual login once

You must run this script **once** to store login cookies:

```bash
node manual-login.js
```

This opens a Chrome window. Log into Aternos manually. The session will be saved.

### 5. Start the bot

```bash
node bot.js
```

---

## Usage

Type the following command in any Discord channel the bot can see:

```
!start
```

- The bot replies in that channel with a “Starting server” message.  
- A rich embed is posted in your status webhook channel.  
- The embed is updated every few seconds until the server shuts down.

---

## Requirements

- Node.js 18+  
- Google Chrome (or Chromium) installed at:  
  `C:\Program Files\Google\Chrome\Application\chrome.exe`  
- Modify the `executablePath` in `bot.js` if using a different OS/path

---

## Notes

- Puppeteer runs in non-headless mode to avoid detection by Aternos  
- Handles:
  - Notification dialogs
  - Advertisement start dialogs
  - Google vignette popups  
- Automatically edits the embed message with updated info

---

## Example `.env`

```env
DISCORD_TOKEN=your-bot-token
ATERNOS_USER=your-email-or-username
ATERNOS_PASS=your-password
WEBHOOK_ID=your-webhook-id
WEBHOOK_TOKEN=your-webhook-token
```

---

## License

MIT License

---

## Support

Feel free to open an issue or pull request if you'd like to help improve the project.
