const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: './puppeteer-profile', // same as your bot uses
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Go to Aternos login
  await page.goto('https://aternos.org/go/');
  console.log('Browser opened. Please log in manually and solve CAPTCHA.');

  // Keep the browser open for 5 minutes to give you time
  await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

  console.log('Closing browser after manual login period.');
  await browser.close();
})();
