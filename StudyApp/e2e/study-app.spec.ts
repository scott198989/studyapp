import { expect, test } from '@playwright/test'

test('can complete a full quiz and reach review results', async ({ page }) => {
  await page.goto('/#/')

  await expect(page.getByRole('button', { name: /start full quiz/i })).toBeVisible()
  await page.getByRole('button', { name: /start full quiz/i }).click()

  for (let index = 0; index < 40; index += 1) {
    const choiceGroup = page.getByRole('radiogroup')
    await choiceGroup.getByRole('button').first().click()

    if (index < 39) {
      await page.getByRole('button', { name: /next question/i }).click()
    }
  }

  await page.getByRole('button', { name: /submit quiz/i }).click()

  await expect(page.getByText(/Review complete/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /start fresh quiz/i })).toBeVisible()
})

test('shows a loud final-answer box and answer-choice match in the solver', async ({ page }) => {
  await page.goto('/#/')

  await page.getByRole('button', { name: /open quiz solver/i }).click()

  await page.getByRole('spinbutton', { name: /^signal frequency$/i }).fill('1000')
  await page.getByRole('spinbutton', { name: /^capacitance$/i }).fill('100')
  await page
    .getByLabel(/multiple-choice answers/i)
    .fill('A) 0.63 S\nB) 10^4 S\nC) 10^-4 S\nD) 1.59 S')

  await page.getByRole('button', { name: /solve problem/i }).click()

  await expect(page.getByText(/final quiz answer/i)).toBeVisible()
  await expect(page.getByTestId('final-quiz-answer')).toContainText('0.628318531 S')
  await expect(page.getByTestId('final-quiz-answer')).toContainText('0.63 S')
  await expect(page.getByText(/computed: 628.318531 mS/i)).toBeVisible()
  await expect(page.getByText(/closest matching answer choice:/i)).toBeVisible()
  await expect(page.getByText(/A — 0.63 S/i).first()).toBeVisible()
})
