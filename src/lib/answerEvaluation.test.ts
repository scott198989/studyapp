import { describe, expect, it } from 'vitest'

import type { StudyItem } from '../types/study'
import { evaluateStudyItemResponse } from './answerEvaluation'

const baseMeta = {
  setId: 'hw_15' as const,
  sourceLabel: 'Problem',
  sourceNumbers: [],
  rationale: 'Test rationale.',
  tags: ['test'],
  sourceRefs: [{ filename: 'mock', role: 'primary' as const }],
  formulaSupport: { kind: 'no_formula' as const, reason: 'Test item.' },
}

describe('answer evaluation', () => {
  it('accepts scalar answers with equivalent units', () => {
    const item: StudyItem = {
      ...baseMeta,
      id: 'scalar',
      kind: 'numeric',
      prompt: 'Enter the current.',
      inputLabel: 'Current',
      answerSpec: {
        kind: 'scalar',
        value: 5,
        unitId: 'milliamp',
      },
    }

    const result = evaluateStudyItemResponse(item, {
      kind: 'text',
      value: '0.005 A',
    })

    expect(result.isCorrect).toBe(true)
  })

  it('accepts polar answers with normalized angle units', () => {
    const item: StudyItem = {
      ...baseMeta,
      id: 'polar',
      kind: 'numeric',
      prompt: 'Enter the phasor.',
      inputLabel: 'Phasor',
      answerSpec: {
        kind: 'polar',
        magnitude: 10,
        unitId: 'volt',
        angle: 90,
        angleUnitId: 'degrees',
      },
    }

    const result = evaluateStudyItemResponse(item, {
      kind: 'text',
      value: '10 V ∠ 1.5708 rad',
    })

    expect(result.isCorrect).toBe(true)
  })

  it('accepts rectangular answers with matching components', () => {
    const item: StudyItem = {
      ...baseMeta,
      id: 'rect',
      kind: 'numeric',
      prompt: 'Enter the rectangular voltage.',
      inputLabel: 'Voltage',
      answerSpec: {
        kind: 'rectangular',
        real: 8.66,
        imaginary: 5,
        unitId: 'volt',
      },
    }

    const result = evaluateStudyItemResponse(item, {
      kind: 'text',
      value: '8.660 V + j5.000 V',
    })

    expect(result.isCorrect).toBe(true)
  })

  it('tracks manual-check completion without auto-grading it as a missed item', () => {
    const item: StudyItem = {
      ...baseMeta,
      id: 'manual',
      kind: 'manual_check',
      prompt: 'Sketch the waveform.',
      answerSpec: {
        kind: 'manual-check',
        checklist: ['Sketch it.'],
      },
    }

    const result = evaluateStudyItemResponse(item, {
      kind: 'manual',
      completed: true,
      notes: 'Done',
    })

    expect(result.isGradable).toBe(false)
    expect(result.status).toBe('manual_complete')
  })
})
