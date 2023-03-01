import { startBrowser } from './browser.js'
import { responseReader } from './responseReader.js'

/**
 * @param {import('puppeteer').Browser} browserInstance
 */
async function scrapeAll(browserInstance) {
  try {
    const browser = await browserInstance
    await responseReader(browser)
    // await browser.close()
  } catch (err) {
    console.log('Could not resolve the browser instance => ', err)
  }
}

// Pass the browser instance to the scraper controller
scrapeAll(startBrowser())
