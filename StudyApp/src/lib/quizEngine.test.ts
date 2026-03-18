import { describe, expect, it } from 'vitest'

import { questionBank } from '../data/questionBank'
import { buildAttemptSummary, createQuizSession, getDisplayedChoices } from './quizEngine'

describe('quizEngine', () => {
  it('uses every canonical question exactly once in a full-bank session', () => {
    const session = createQuizSession({
      questions: questionBank,
      usedSignatures: [],
      mode: 'full',
      shuffleChoices: true,
    })

    expect(session.questionIds).toHaveLength(questionBank.length)
    expect(new Set(session.questionIds).size).toBe(questionBank.length)
    expect(Object.keys(session.choiceOrderByQuestion)).toHaveLength(questionBank.length)
  })

  it('avoids previously used signatures', () => {
    const subset = questionBank.slice(0, 4)
    const firstSession = createQuizSession({
      questions: subset,
      usedSignatures: [],
      mode: 'full',
      shuffleChoices: true,
    })
    const secondSession = createQuizSession({
      questions: subset,
      usedSignatures: [firstSession.signature],
      mode: 'full',
      shuffleChoices: true,
    })

    expect(secondSession.signature).not.toBe(firstSession.signature)
  })

  it('builds attempt summaries with score and missed ids', () => {
    const subset = questionBank.slice(0, 2)
    const session = createQuizSession({
      questions: subset,
      usedSignatures: [],
      mode: 'full',
      shuffleChoices: false,
    })

    session.answers['q001'] = 'true'
    session.answers['q002'] = 'false'

    const summary = buildAttemptSummary(session, subset)

    expect(summary.score).toBe(1)
    expect(summary.percent).toBe(50)
    expect(summary.missedIds).toEqual(['q002'])
  })

  it('returns choices in the order presented to the learner', () => {
    const subset = questionBank.slice(2, 3)
    const session = createQuizSession({
      questions: subset,
      usedSignatures: [],
      mode: 'full',
      shuffleChoices: false,
    })

    const displayedChoices = getDisplayedChoices(subset[0], session)

    expect(displayedChoices.map((choice) => choice.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
