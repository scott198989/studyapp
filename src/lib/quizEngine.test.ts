import { describe, expect, it } from 'vitest'

import type { StudyItem } from '../types/study'
import { buildAttemptSummary, createQuizSession, getDisplayedChoices } from './quizEngine'

const mockItems: StudyItem[] = [
  {
    id: 'item_1',
    setId: 'quiz_15_16',
    kind: 'true_false',
    sourceLabel: 'Question 1',
    sourceNumbers: [1],
    prompt: 'Statement one.',
    choices: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    answerSpec: {
      kind: 'choice',
      correctChoiceId: 'true',
    },
    rationale: 'Because it is true.',
    tags: ['concept'],
    sourceRefs: [{ filename: 'mock-1.png', screenshotQuestionNumber: 1, role: 'primary' }],
    formulaSupport: {
      kind: 'no_formula',
      reason: 'Concept-only item.',
    },
  },
  {
    id: 'item_2',
    setId: 'quiz_15_16',
    kind: 'multiple_choice',
    sourceLabel: 'Question 2',
    sourceNumbers: [2],
    prompt: 'Pick the correct choice.',
    choices: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
    ],
    answerSpec: {
      kind: 'choice',
      correctChoiceId: 'b',
    },
    rationale: 'Choice B is keyed.',
    tags: ['concept'],
    sourceRefs: [{ filename: 'mock-2.png', screenshotQuestionNumber: 2, role: 'primary' }],
    formulaSupport: {
      kind: 'no_formula',
      reason: 'Concept-only item.',
    },
  },
  {
    id: 'item_3',
    setId: 'quiz_15_16',
    kind: 'manual_check',
    sourceLabel: 'Question 3',
    sourceNumbers: [3],
    prompt: 'Draw the diagram.',
    answerSpec: {
      kind: 'manual-check',
      checklist: ['Check the drawing.'],
    },
    rationale: 'Manual item.',
    tags: ['diagram'],
    sourceRefs: [{ filename: 'mock-3.png', screenshotQuestionNumber: 3, role: 'primary' }],
    formulaSupport: {
      kind: 'no_formula',
      reason: 'Manual drawing task.',
    },
  },
]

describe('quizEngine', () => {
  it('uses every item exactly once in a full-set session', () => {
    const session = createQuizSession({
      items: mockItems,
      usedSignatures: [],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: true,
    })

    expect(session.itemIds).toHaveLength(mockItems.length)
    expect(new Set(session.itemIds).size).toBe(mockItems.length)
    expect(Object.keys(session.choiceOrderByItem)).toHaveLength(mockItems.length)
    expect(session.submittedItemIds).toEqual([])
  })

  it('avoids previously used signatures', () => {
    const subset = mockItems.slice(0, 2)
    const firstSession = createQuizSession({
      items: subset,
      usedSignatures: [],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: true,
    })
    const secondSession = createQuizSession({
      items: subset,
      usedSignatures: [firstSession.signature],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: true,
    })

    expect(secondSession.signature).not.toBe(firstSession.signature)
  })

  it('builds attempt summaries with graded and manual counts', () => {
    const session = createQuizSession({
      items: mockItems,
      usedSignatures: [],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: false,
    })

    session.responses.item_1 = { kind: 'choice', value: 'true' }
    session.responses.item_2 = { kind: 'choice', value: 'a' }
    session.responses.item_3 = { kind: 'manual', completed: true, notes: 'Done' }

    const summary = buildAttemptSummary(session, mockItems)

    expect(summary.score).toBe(1)
    expect(summary.percent).toBe(50)
    expect(summary.manualCompleted).toBe(1)
    expect(summary.missedIds).toEqual(['item_2'])
  })

  it('returns displayed choices in the stored order', () => {
    const subset = mockItems.slice(1, 2)
    const session = createQuizSession({
      items: subset,
      usedSignatures: [],
      setId: 'quiz_15_16',
      mode: 'full',
      shuffleChoices: false,
    })

    const displayedChoices = getDisplayedChoices(subset[0], session)

    expect(displayedChoices.map((choice) => choice.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
