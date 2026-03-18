import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  beforeEach(() => {
    cleanup()
    window.localStorage.clear()
    window.location.hash = '#/'
    document.documentElement.dataset.theme = 'light'
    document.documentElement.style.colorScheme = 'light'
  })

  it('starts a quiz and advances to the next question', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /start full quiz/i }))

    expect(screen.getByText(/Run 1 of 40/i)).toBeInTheDocument()

    const choiceGroup = screen.getByRole('radiogroup')
    const choices = within(choiceGroup).getAllByRole('button')
    await user.click(choices[0])
    await user.click(screen.getByRole('button', { name: /next question/i }))

    expect(screen.getByText(/Run 2 of 40/i)).toBeInTheDocument()
  })

  it('toggles dark mode and persists it to the document root', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(screen.getByRole('button', { name: /switch to dark mode/i }))

    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('ac-study-lab-state')).toContain('"theme":"dark"')
  })

  it('solves a quiz problem with unit conversion and highlights the closest answer choice', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: /open quiz solver/i }))

    await user.type(screen.getByRole('spinbutton', { name: /^signal frequency$/i }), '1000')
    await user.type(screen.getByRole('spinbutton', { name: /^capacitance$/i }), '100')
    await user.type(
      screen.getByLabelText(/multiple-choice answers/i),
      'A) 0.63 S\nB) 10^4 S\nC) 10^-4 S\nD) 1.59 S',
    )

    await user.click(screen.getByRole('button', { name: /solve problem/i }))

    expect(screen.getByText(/final quiz answer/i)).toBeInTheDocument()
    const finalAnswerCard = screen.getByTestId('final-quiz-answer')
    expect(within(finalAnswerCard).getByText('0.628318531 S')).toBeInTheDocument()
    expect(within(finalAnswerCard).getByText('0.63 S')).toBeInTheDocument()
    expect(screen.getByText(/computed: 628.318531 mS/i)).toBeInTheDocument()
    expect(screen.getByText(/closest matching answer choice:/i)).toBeInTheDocument()
    expect(screen.getAllByText(/A — 0.63 S/i)[0]).toBeInTheDocument()
  })
})
