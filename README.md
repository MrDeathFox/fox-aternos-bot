# Aternos Discord Bot

![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)
![Puppeteer](https://img.shields.io/badge/Puppeteer-Automation-blue?logo=puppeteer)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-purple?logo=discord)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A Discord bot built with Node.js and Puppeteer that automatically starts an [Aternos.org](https://aternos.org) Minecraft server and posts its status (IP, version, player count) to your Discord server.

---

## 📌 Features

* ✅ Logs in to Aternos (using saved session cookies)
* ▶️ Starts your Minecraft server and handles:

  * Google vignette ads
  * Aternos dialogs/popups (e.g., notification requests)
  * Start-advertisement confirmation
* 🧠 Auto-reports server IP, player count, version, and status
* ⭯️ Edits a single message in Discord to avoid clutter

---

## 🧰 Prerequisites

Before setting up, make sure you have the following:

* **Node.js v18 or later**: [Download here](https://nodejs.org/)
* **Google Chrome** installed (required for Puppeteer)
* A **Discord Bot Token** (from [Discord Developer Portal](https://discord.com/developers/applications))
* An **Aternos account** with a Minecraft server created

---

## ⚙️ Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/aternos-discord-bot.git
cd aternos-discord-bot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create the `.env` File

Create a `.env` file in the root folder with the following content:

```env
DISCORD_TOKEN=your-discord-bot-token
ATERNOS_USER=your-aternos-username
ATERNOS_PASS=your-aternos-password
```

> 🔐 Never share this file publicly! It contains sensitive credentials.

---

## 🔑 One-Time Manual Login (Important!)

### You **must** run `manual-login.js` **once** before using the bot.

This will log in to Aternos and store session cookies, so the bot can skip captchas and 2FA in future runs.

```bash
`node manual-login.js` or `start-manual.bat`
```

1. A Chrome window will open.
2. Log in manually with your Aternos account.
3. Wait until you’re redirected to your server dashboard.
4. Close the window.

The session will now be saved and reused every time the bot runs.

---

## 🚀 Running the Bot

After running `manual-login.js`, start the bot:

```bash
`node bot.js` or `bot-start.bat`
```

In your Discord server, type:

```
!start
```

The bot will:

* Load your Aternos server page
* Handle ads/popups
* Start the server
* Edit its message to show current status, IP, version, and player count

---

## 🛠 Chrome Path Configuration

In `bot.js`, make sure Puppeteer is pointing to your local Chrome install:

```js
executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
```

> Update this if you're using macOS or Linux.

---

## 💡 Troubleshooting

| Issue                              | Fix                                                       |
| ---------------------------------- | --------------------------------------------------------- |
| `TimeoutError: Navigation timeout` | Increase timeout or retry (internet may be slow)          |
| "CSS not loading"                  | Aternos may throttle Puppeteer. Try again later           |
| Server says "Offline" after start  | Wait a few seconds. Bot polls after clicking start        |
| Bot doesn't respond                | Make sure the bot is online, invited, and has permissions |
| Chrome not launching               | Check `executablePath` or install Chrome manually         |

---

## 🧹 Tech Stack

* [Puppeteer](https://github.com/puppeteer/puppeteer)
* [Discord.js v14](https://discord.js.org)
* Node.js + dotenv for environment config

---

## 📜 License

MIT License — feel free to use and modify. Please credit the original author.

---

## 🤝 Maintainer

Made with ❤️ by [@YourName](https://github.com/your-username)

Pull requests welcome. If you'd like to add server queue support or auto-refresh ads, feel free to contribute!
