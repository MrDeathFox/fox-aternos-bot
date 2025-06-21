// Updated bot.js for Aternos Discord bot with vignette handling and improved server status polling
const { Client, GatewayIntentBits } = require('discord.js');
const puppeteer = require('puppeteer-core');
require('dotenv').config();

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startAternosServer(message) {
  let browser;
  let statusMessage;
  try {
    statusMessage = await message.reply('⏳ Connecting to Aternos and starting the server...');

    browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: './puppeteer-profile',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', req => {
      if (["image", "stylesheet", "font"].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto('https://aternos.org/go/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Handle login or redirect
    const alreadyLoggedIn = await page.$('a[href="/servers/"]');
    if (alreadyLoggedIn) {
      await alreadyLoggedIn.click();
    } else {
      const loginFrame = page.frames().find(f => f.url().includes('aternos'));
      if (!loginFrame) throw new Error('Login frame not found');

      await loginFrame.waitForSelector('input#user', { timeout: 5000 });
      await loginFrame.type('input#user', process.env.ATERNOS_USER, { delay: 50 });
      await loginFrame.type('input#password', process.env.ATERNOS_PASS, { delay: 50 });
      await loginFrame.click('button[type="submit"]');
      try {
        await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 });
      } catch {
        console.log('⚠️ Login navigation timeout, continuing.');
      }
    }

    await page.goto('https://aternos.org/servers/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const serverSelector = 'div.server-body';
    await page.waitForSelector(serverSelector, { timeout: 15000 });
    await page.click(serverSelector);

    await page.waitForSelector('#start', { timeout: 20000 });

    await handleGoogleVignette(page);
    await clickStartButton(page);
    await handleDialogs(page);
    await handleAdStartPopup(page);

    await delay(15000);

    const info = await getServerInfo(page);
    await statusMessage.edit(`✅ Server started!
**Status:** ${info.status}
**IP:** \`${info.ip}\`
**Players:** ${info.players}
**Version:** ${info.version}`);
  } catch (err) {
    console.error('Error starting Aternos server:', err);
    if (statusMessage) await statusMessage.edit('❌ Failed to start Aternos server. Check logs for details.');
  } finally {
    if (browser) await browser.close();
  }
}

async function handleGoogleVignette(page) {
  try {
    const frame = page.frames().find(f => f.url().includes('google_vignette'));
    if (frame) {
      await page.evaluate(() => {
        const el = document.querySelector('#google_vignette');
        if (el) el.remove();
      });
      console.log('🛑 Dismissed #google_vignette');
    }
  } catch (e) {
    console.log('No vignette to dismiss.');
  }
}

async function clickStartButton(page) {
  const startButton = await page.$('#start');
  if (startButton) {
    await startButton.click();
    console.log('✅ Clicked start button.');
  } else {
    throw new Error('❌ Start button not found.');
  }
}

async function handleDialogs(page) {
  try {
    const dialogSelector = 'dialog.alert.alert-danger';
    const isDialog = await page.$(dialogSelector);
    if (isDialog) {
      await page.click('dialog.alert.alert-danger button.btn.btn-danger');
      console.log('🛑 Dismissed alert-danger dialog');
    }
  } catch (e) {
    console.log('No alert-danger dialog found.');
  }
}

async function handleAdStartPopup(page) {
  try {
    const adDialog = await page.$('dialog.alert.alert-success');
    if (adDialog) {
      const startBtn = await page.$('dialog.alert.alert-success button.btn-success');
      if (startBtn) {
        await startBtn.click();
        console.log('📺 Started advertisement server dialog');
      }
    }
  } catch (e) {
    console.log('No advertisement dialog found.');
  }
}

async function getServerInfo(page) {
  const maxAttempts = 30; // ~60 seconds (30 * 2s)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const statusText = await page.evaluate(() => {
        if (document.querySelector('div.status.online')) return 'Online';
        if (document.querySelector('div.status.offline')) return 'Offline';
        if (document.querySelector('div.status.loading')) return 'Loading';
        if (document.querySelector('div.status.preparing')) return 'Preparing';
        if (document.querySelector('div.status.queue')) return 'In Queue';
        return 'Unknown';
      });

      const ip = await page.$eval('span#ip', el => el.textContent.trim()).catch(() => 'N/A');
      const players = await page.$eval('div.live-status-box-value.js-players', el => el.textContent.trim()).catch(() => 'N/A');
      const version = await page.$eval('span#version', el => el.textContent.trim()).catch(() => 'N/A');

      if (statusText === 'Online' || statusText === 'Offline') {
        return { status: statusText, ip, players, version };
      }

      console.log(`🔄 Waiting for server to finish starting... (Attempt ${attempt + 1})`);
      await delay(2000);
    } catch (err) {
      console.log('⚠️ Error while checking server info:', err);
    }
  }

  return { status: 'Timeout', ip: 'N/A', players: 'N/A', version: 'N/A' };
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.content.trim().toLowerCase() === '!start') {
    await startAternosServer(message);
  }
});

client.login(process.env.DISCORD_TOKEN);
