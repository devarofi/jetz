import puppeteer, { Keyboard } from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('https://www.google.com/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Type into search box
  await page.type('input.gLFyf', 'compose');

  // Wait and click on first result
  const searchResultSelector = 'input.gLFyf';
  await page.waitForSelector(searchResultSelector);
  await page.keyboard.down('Enter');

  // Locate the full title with a unique string
  const textSelector = await page.waitForSelector('.LC20lb.MBeuO.DKV0Md');
  const fullTitle = await textSelector.evaluate(el => el.textContent);

  // Print the full title
  console.log('The title of this blog post is "%s".', fullTitle);

  await browser.close();
})();