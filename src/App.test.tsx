import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'
import { studySetLookup, studyItems } from './data/studyContent'
import { buildAttemptSummary, createQuizSession } from './lib/quizEngine'

describe('App', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    window.location.hash = '#/'
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
  })

  it('shows the five canonical study entry points and starts the combined quiz', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(screen.getByRole('heading', { name: /chapters 15-16 quiz/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /chapter 17 quiz/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /chapter 15 homework/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /chapter 16 homework/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /chapter 17 homework/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /start quiz 15-16/i }))

    expect(screen.getByText(/item 1 of 40/i)).toBeInTheDocument()

    const choiceGroup = screen.getByRole('radiogroup')
    const choices = within(choiceGroup).getAllByRole('button')
    await user.click(choices[0])
    await user.click(screen.getByRole('button', { name: /submit answer/i }))

    expect(
      screen.getByText(/choice matched the keyed answer|choice did not match the keyed answer/i),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next item/i }))

    expect(screen.getByText(/item 2 of 40/i)).toBeInTheDocument()
    expect(screen.queryByText(/^formula$/i)).not.toBeInTheDocument()
  })

  it('opens the study library and surfaces the cleaned quiz buckets', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /open study library/i }))

    expect(screen.getByRole('heading', { name: /study source library/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /quiz set map/i })).toBeInTheDocument()
    expect(screen.getAllByText(/chapters 15-16 quiz/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/chapter 17 quiz/i).length).toBeGreaterThan(0)
  })

  it('shows formula cards in results review after submission', () => {
    const set = studySetLookup.quiz_15_16
    const subset = studyItems.filter((item) => set.itemIds.slice(0, 2).includes(item.id))
    const session = createQuizSession({
      items: subset,
      usedSignatures: [],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: false,
    })

    session.responses[subset[0].id] = { kind: 'choice', value: subset[0].answerSpec.kind === 'choice' ? subset[0].answerSpec.correctChoiceId : '' }
    session.responses[subset[1].id] = { kind: 'choice', value: subset[1].answerSpec.kind === 'choice' ? subset[1].answerSpec.correctChoiceId : '' }
    session.completedAt = new Date().toISOString()
    const summary = buildAttemptSummary(session, subset)

    window.localStorage.setItem(
      'ac-study-lab-state',
      JSON.stringify({
        version: 2,
        settings: {
          shuffleChoices: true,
          theme: 'light',
        },
        activeSession: null,
        attempts: [{ session, summary }],
        usedSignatures: [session.signature],
      }),
    )
    window.location.hash = '#/results'

    render(<App />)

    expect(screen.getAllByText(/^formula$/i)[0]).toBeInTheDocument()
  })
})
