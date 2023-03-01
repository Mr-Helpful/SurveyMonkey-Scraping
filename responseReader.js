import * as fs from 'fs/promises'
/**
 * @typedef {import('puppeteer').Page} Page
 * @typedef {import('puppeteer').Browser} Browser
 * @typedef {import('puppeteer').ElementHandle} ElementHandle
 */

const url = 'your-own-url-here'

const responseOffset = 0

/** @param {Browser} browser */
export async function responseReader(browser) {
  let page = (await browser.pages())[0]
  console.log(`Navigating to ${url}...`)
  await page.goto(url, { timeout: 0 })

  await page.waitForSelector('sm-login-page', { timeout: 0 })
  console.log('login page reached!')

  await page.waitForNavigation({ timeout: 0 })

  console.log(
    await page.waitForSelector('.analyze-main-column.tabbed-nav', {
      timeout: 0
    })
  )

  // navigate through all the results to preload them, this gives us a better
  // chance to load a result in time
  for (let i = 0; i < 45; i++) {
    const backArrow = await page.$(
      '.wds-button.wds-button--util.wds-button--arrow-left'
    )
    await backArrow.click()
    await page.waitForTimeout(200)
  }

  const responses = []
  try {
    for (let i = 1; i <= 45; i++) {
      console.log(`Processing response ${i}`)
      await switchResponse(page, i)
      const questions = await page.$$('.response-question-container')
      responses.push(await readQuestions(questions))
    }
  } catch (e) {
    console.error('failed due to:', e)
  }
  console.log(responses)

  const keys = Object.keys(responses[0])
  const header = `Response #,${keys.join(',')}`
  const body = responses
    .map(
      (response, i) =>
        `${i + 1 + responseOffset},${keys.map(k => response[k]).join(',')}`
    )
    .join('\n')

  await fs.writeFile('./output.csv', `${header}\n${body}`)
  console.log('done!')
}

/**
 * @param {Page} page
 * @param {number} i
 */
const switchResponse = async (page, i) => {
  const container = await page.waitForSelector('.respondent-nav.sm-float-l')
  const dropArrow = await container.waitForSelector(
    '.respondent-goto-menu-btn.sm-float-l.wds-button.wds-button--util.wds-button--arrow-down'
  )

  if ((await container.$('.goto-number-text.sm-input')) === null) {
    console.log('dropdown not open, opening now')
    await dropArrow.click()
    await page.waitForTimeout(100)
  }

  try {
    const dropInput = await container.$('.goto-number-text.sm-input')
    await dropInput.evaluate((el, x) => (el.value = x), i)

    const dropBtn = await container.$('.goto-btn.wds-button.wds-button--sm')
    await dropBtn.click()
  } catch (e) {
    console.log(`Already on response ${i}, closing menu`)
    await dropArrow.click()
  }

  await page.waitForTimeout(1000)
  await page.waitForSelector('.response-question-container')
}

/** @param {Page} page */
const deleteResponse = async page => {
  const delElem = await page.$(
    '.delete-btn.wds-button.wds-button--util-light.wds-button--sm'
  )
  await delElem.click()

  // a small safety wait as clicking this button too quickly seems to
  // have a bad habit of breaking things
  await page.waitForTimeout(100)
  const confirm = await page.$(
    '.wds-button.wds-button--warning.wds-button--sm.delete-btn'
  )
  await confirm.click()

  // wait for modal to close
  await page.waitForFunction(
    () =>
      !document.querySelector(
        '.delete-respondent-dialog-view.analyze-warning-dialog-view.dialog.dialog-a.open'
      )
  )

  await page.waitForTimeout(1000)
  await page.waitForSelector('.response-question-container')
  await switchResponse(page, 1)
}

/** @param {ElementHandle[]} questions */
const readQuestions = async questions => {
  const response = {}
  for (let question of questions) {
    const elemNo = await question.$('.question-title')
    const quesNo = await elemNo.evaluate(e => e.innerText)

    const elemBody = await question.$('.response-question-content')
    const quesBody = await elemBody.evaluate(e => e.innerText)

    response[quesNo] = `"${quesBody.replace(/[^\w\s]| /g, '')}"`
  }
  return response
}
