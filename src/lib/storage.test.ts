import { describe, expect, it } from 'vitest'

import { loadAppState } from './storage'

describe('storage migration', () => {
  it('migrates version 1 state by preserving settings and resetting incompatible session data', () => {
    window.localStorage.setItem(
      'ac-study-lab-state',
      JSON.stringify({
        version: 1,
        settings: {
          shuffleChoices: false,
          theme: 'dark',
        },
        activeSession: null,
        attempts: [],
        usedSignatures: ['old-signature'],
      }),
    )

    const state = loadAppState()

    expect(state.version).toBe(2)
    expect(state.settings.shuffleChoices).toBe(false)
    expect(state.settings.theme).toBe('dark')
    expect(state.activeSession).toBeNull()
    expect(state.attempts).toEqual([])
    expect(state.usedSignatures).toEqual([])
  })

  it('keeps existing version 2 sessions even when they predate instant grading metadata', () => {
    window.localStorage.setItem(
      'ac-study-lab-state',
      JSON.stringify({
        version: 2,
        settings: {
          shuffleChoices: true,
          theme: 'light',
        },
        activeSession: {
          sessionId: 'session-1',
          setId: 'quiz_15_16',
          mode: 'full',
          itemIds: ['item_1'],
          choiceOrderByItem: {
            item_1: ['true', 'false'],
          },
          responses: {
            item_1: {
              kind: 'choice',
              value: 'true',
            },
          },
          flaggedIds: [],
          currentIndex: 0,
          startedAt: '2026-03-19T00:00:00.000Z',
          signature: 'sig-1',
        },
        attempts: [],
        usedSignatures: ['sig-1'],
      }),
    )

    const state = loadAppState()

    expect(state.version).toBe(2)
    expect(state.activeSession?.sessionId).toBe('session-1')
    expect(state.activeSession?.submittedItemIds).toBeUndefined()
  })
})
