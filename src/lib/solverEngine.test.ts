import { describe, expect, it } from 'vitest'

import { createDefaultSolverFormState, solverGoalLookup } from '../data/solverGoals'
import { solveGoal } from './solverEngine'

describe('solverEngine extended goals', () => {
  it('solves source current from voltage and impedance phasors', () => {
    const goal = solverGoalLookup.source_current_from_voltage_impedance
    const formState = createDefaultSolverFormState(goal.id)

    formState.voltageMagnitude = { kind: 'measurement', value: '10', unitId: 'volt' }
    formState.voltageAngle = { kind: 'measurement', value: '30', unitId: 'degrees' }
    formState.impedanceMagnitude = { kind: 'measurement', value: '2', unitId: 'ohm' }
    formState.impedanceAngle = { kind: 'measurement', value: '20', unitId: 'degrees' }

    const result = solveGoal(goal, formState)

    expect(result.computation.kind).toBe('polar')
    if (result.computation.kind === 'polar') {
      expect(result.computation.magnitudeBase).toBeCloseTo(5, 6)
    }
  })

  it('solves average power from voltage, current, and power factor', () => {
    const goal = solverGoalLookup.average_power_from_voltage_current_pf
    const formState = createDefaultSolverFormState(goal.id)

    formState.voltage = { kind: 'measurement', value: '120', unitId: 'volt' }
    formState.current = { kind: 'measurement', value: '2', unitId: 'amp' }
    formState.powerFactor = { kind: 'measurement', value: '0.8', unitId: 'unitless' }

    const result = solveGoal(goal, formState)

    expect(result.computation.kind).toBe('scalar')
    if (result.computation.kind === 'scalar') {
      expect(result.computation.baseValue).toBeCloseTo(192, 6)
    }
  })
})
