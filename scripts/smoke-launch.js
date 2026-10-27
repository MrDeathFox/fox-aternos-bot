/**
 * Local smoke: launch Camoufox, open about:blank, close.
 * Does not touch Aternos. Safe for CI/fixture hosts with browser fetched.
 */
import { Camoufox } from 'camoufox';

const headless = process.env.CAMOUFOX_HEADLESS === '0' ? false : true;

const browserOrContext = await Camoufox({
  headless,
  humanize: true,
  block_images: false,
});

try {
  const page =
    typeof browserOrContext.newPage === 'function'
      ? await browserOrContext.newPage()
      : await (await browserOrContext.newContext()).newPage();
  await page.goto('about:blank');
  console.log('camofox-aternos smoke OK');
} finally {
  await browserOrContext.close();
}
