import { describe, expect, it } from 'vitest'

import { createDefaultSolverFormState, solverGoalLookup } from '../data/solverGoals'
import { solveGoal } from './solverEngine'
import { buildSolverPresentation } from './solverPresentation'

describe('solver presentation', () => {
  it('converts the raw susceptance result into requested siemens and preserves the conversion trail', () => {
    const goal = solverGoalLookup.capacitive_susceptance
    const formState = createDefaultSolverFormState(goal.id)

    formState.frequency = {
      kind: 'measurement',
      value: '1000',
      unitId: 'hertz',
    }
    formState.capacitance = {
      kind: 'measurement',
      value: '100',
      unitId: 'microfarad',
    }

    const result = solveGoal(goal, formState)
    const { presentation } = buildSolverPresentation({
      goal,
      result,
      requestedOutputUnitId: 'siemens',
      roundingMode: '2dp',
    })

    expect(presentation.rawComputed).toBe('628.318531 mS')
    expect(presentation.finalExact).toBe('0.628318531 S')
    expect(presentation.finalRounded).toBe('0.63 S')
    expect(presentation.conversionSteps).toContain('Convert mS → S: divide by 1000')
    expect(presentation.warnings).toContain('Unit conversion applied.')
  })

  it('falls back to the supported quiz unit and warns when the requested unit is inconsistent', () => {
    const goal = solverGoalLookup.capacitive_susceptance
    const formState = createDefaultSolverFormState(goal.id)

    formState.frequency = {
      kind: 'measurement',
      value: '1000',
      unitId: 'hertz',
    }
    formState.capacitance = {
      kind: 'measurement',
      value: '100',
      unitId: 'microfarad',
    }

    const result = solveGoal(goal, formState)
    const { presentation, choiceMatch } = buildSolverPresentation({
      goal,
      result,
      requestedOutputUnitId: 'ohm',
      roundingMode: '2dp',
      answerChoicesText: 'A) 0.63 S\nB) 1.59 S',
    })

    expect(presentation.effectiveOutputUnitId).toBe('siemens')
    expect(presentation.finalRounded).toBe('0.63 S')
    expect(presentation.warnings).toContain('Warning: susceptance is typically expressed in S, not Ω.')
    expect(choiceMatch.bestMatch?.label).toBe('A')
  })
})
