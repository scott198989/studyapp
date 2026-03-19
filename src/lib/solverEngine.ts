import type {
  RectangularComputation,
  ScalarComputation,
  SolverComputationResult,
  SolverFieldDefinition,
  SolverFormState,
  SolverGoalDefinition,
  SolverUnitDimension,
  SolverUnitId,
} from '../types/solver'
import { convertFromBase, convertToBase, formatScalarValue } from './solverUnits'

const baseUnitByDimension: Record<SolverUnitDimension, SolverUnitId> = {
  resistance: 'ohm',
  conductance: 'siemens',
  angle: 'radians',
  frequency: 'hertz',
  inductance: 'henry',
  capacitance: 'farad',
  voltage: 'volt',
  current: 'amp',
  power: 'watt',
  unitless: 'unitless',
}

function buildFieldLookup(goal: SolverGoalDefinition) {
  return Object.fromEntries(goal.fields.map((field) => [field.id, field])) as Record<string, SolverFieldDefinition>
}

function formatBaseQuantity(value: number, dimension: SolverUnitDimension) {
  return formatScalarValue(value, baseUnitByDimension[dimension], 'exact')
}

function formatAngleRadians(radians: number) {
  return formatScalarValue(convertFromBase(radians, 'degrees'), 'degrees', 'exact')
}

function readMeasurement(
  formState: SolverFormState,
  fieldId: string,
  fieldLookup: Record<string, SolverFieldDefinition>,
) {
  const field = fieldLookup[fieldId]

  if (!field || field.kind !== 'measurement') {
    throw new Error(`Missing measurement field: ${fieldId}`)
  }

  const input = formState[fieldId]
  if (!input || input.kind !== 'measurement') {
    throw new Error(`${field.label} is required.`)
  }

  if (!input.value.trim()) {
    throw new Error(`${field.label} is required.`)
  }

  const value = Number(input.value)
  if (!Number.isFinite(value)) {
    throw new Error(`${field.label} must be a valid number.`)
  }

  if (!field.allowNegative && value <= 0) {
    throw new Error(`${field.label} must be greater than 0.`)
  }

  return {
    field,
    value,
    unitId: input.unitId,
    baseValue: convertToBase(value, input.unitId),
  }
}

function readSelect(
  formState: SolverFormState,
  fieldId: string,
  fieldLookup: Record<string, SolverFieldDefinition>,
) {
  const field = fieldLookup[fieldId]

  if (!field || field.kind !== 'select') {
    throw new Error(`Missing select field: ${fieldId}`)
  }

  const input = formState[fieldId]
  if (!input || input.kind !== 'select' || !input.value) {
    throw new Error(`${field.label} is required.`)
  }

  return {
    field,
    value: input.value,
  }
}

function buildScalarResult(
  goal: SolverGoalDefinition,
  baseValue: number,
  dimension: SolverUnitDimension,
  substitutionDetails: string[],
  notes: string[] = [],
): SolverComputationResult {
  const computation: ScalarComputation = {
    kind: 'scalar',
    baseValue,
    dimension,
  }

  return {
    goalId: goal.id,
    computation,
    formulaPath: goal.formulaPath,
    substitutionDetails,
    notes,
  }
}

function buildRectangularResult(
  goal: SolverGoalDefinition,
  realBase: number,
  imaginaryBase: number,
  dimension: SolverUnitDimension,
  substitutionDetails: string[],
  notes: string[] = [],
): SolverComputationResult {
  const computation: RectangularComputation = {
    kind: 'rectangular',
    realBase,
    imaginaryBase,
    dimension,
  }

  return {
    goalId: goal.id,
    computation,
    formulaPath: goal.formulaPath,
    substitutionDetails,
    notes,
  }
}

function complexFromPolar(magnitude: number, angleRadians: number) {
  return {
    real: magnitude * Math.cos(angleRadians),
    imaginary: magnitude * Math.sin(angleRadians),
  }
}

function complexAdd(
  left: { real: number; imaginary: number },
  right: { real: number; imaginary: number },
) {
  return {
    real: left.real + right.real,
    imaginary: left.imaginary + right.imaginary,
  }
}

function complexMultiply(
  left: { real: number; imaginary: number },
  right: { real: number; imaginary: number },
) {
  return {
    real: left.real * right.real - left.imaginary * right.imaginary,
    imaginary: left.real * right.imaginary + left.imaginary * right.real,
  }
}

function complexDivide(
  numerator: { real: number; imaginary: number },
  denominator: { real: number; imaginary: number },
) {
  const scale = denominator.real ** 2 + denominator.imaginary ** 2
  return {
    real:
      (numerator.real * denominator.real + numerator.imaginary * denominator.imaginary) /
      scale,
    imaginary:
      (numerator.imaginary * denominator.real - numerator.real * denominator.imaginary) /
      scale,
  }
}

export function solveGoal(goal: SolverGoalDefinition, formState: SolverFormState): SolverComputationResult {
  const fieldLookup = buildFieldLookup(goal)

  switch (goal.id) {
    case 'capacitive_susceptance': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const capacitance = readMeasurement(formState, 'capacitance', fieldLookup)
      const susceptance = 2 * Math.PI * frequency.baseValue * capacitance.baseValue

      return buildScalarResult(
        goal,
        susceptance,
        'conductance',
        [
          `${frequency.field.shortLabel} = ${formatScalarValue(frequency.value, frequency.unitId, 'exact')} = ${formatBaseQuantity(frequency.baseValue, 'frequency')}`,
          `${capacitance.field.shortLabel} = ${formatScalarValue(capacitance.value, capacitance.unitId, 'exact')} = ${formatBaseQuantity(capacitance.baseValue, 'capacitance')}`,
          `B_C = 2πfC = ${formatBaseQuantity(susceptance, 'conductance')}`,
        ],
        ['Frequency is accepted in Hz-based units and converted to angular frequency internally.'],
      )
    }
    case 'inductive_reactance': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const inductance = readMeasurement(formState, 'inductance', fieldLookup)
      const reactance = 2 * Math.PI * frequency.baseValue * inductance.baseValue

      return buildScalarResult(goal, reactance, 'resistance', [
        `${frequency.field.shortLabel} = ${formatScalarValue(frequency.value, frequency.unitId, 'exact')}`,
        `${inductance.field.shortLabel} = ${formatScalarValue(inductance.value, inductance.unitId, 'exact')} = ${formatBaseQuantity(inductance.baseValue, 'inductance')}`,
        `X_L = 2πfL = ${formatBaseQuantity(reactance, 'resistance')}`,
      ])
    }
    case 'capacitive_reactance': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const capacitance = readMeasurement(formState, 'capacitance', fieldLookup)
      const reactance = 1 / (2 * Math.PI * frequency.baseValue * capacitance.baseValue)

      return buildScalarResult(goal, reactance, 'resistance', [
        `${frequency.field.shortLabel} = ${formatScalarValue(frequency.value, frequency.unitId, 'exact')}`,
        `${capacitance.field.shortLabel} = ${formatScalarValue(capacitance.value, capacitance.unitId, 'exact')} = ${formatBaseQuantity(capacitance.baseValue, 'capacitance')}`,
        `X_C = 1 / (2πfC) = ${formatBaseQuantity(reactance, 'resistance')}`,
      ])
    }
    case 'inductor_impedance_polar': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const inductance = readMeasurement(formState, 'inductance', fieldLookup)
      const reactance = 2 * Math.PI * frequency.baseValue * inductance.baseValue

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: reactance,
          angleRadians: Math.PI / 2,
          dimension: 'resistance',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `${frequency.field.shortLabel} = ${formatScalarValue(frequency.value, frequency.unitId, 'exact')}`,
          `${inductance.field.shortLabel} = ${formatScalarValue(inductance.value, inductance.unitId, 'exact')} = ${formatBaseQuantity(inductance.baseValue, 'inductance')}`,
          `X_L = ${formatBaseQuantity(reactance, 'resistance')}`,
          `Z_L = ${formatBaseQuantity(reactance, 'resistance')} ∠ 90°`,
        ],
        notes: ['Ideal inductors always contribute a +90° impedance angle.'],
      }
    }
    case 'capacitor_impedance_rectangular': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const capacitance = readMeasurement(formState, 'capacitance', fieldLookup)
      const reactance = 1 / (2 * Math.PI * frequency.baseValue * capacitance.baseValue)

      return buildRectangularResult(goal, 0, -reactance, 'resistance', [
        `${frequency.field.shortLabel} = ${formatScalarValue(frequency.value, frequency.unitId, 'exact')}`,
        `${capacitance.field.shortLabel} = ${formatScalarValue(capacitance.value, capacitance.unitId, 'exact')} = ${formatBaseQuantity(capacitance.baseValue, 'capacitance')}`,
        `X_C = ${formatBaseQuantity(reactance, 'resistance')}`,
        `Z_C = 0 - j${formatBaseQuantity(reactance, 'resistance')}`,
      ])
    }
    case 'voltage_phasor_rectangular': {
      const magnitude = readMeasurement(formState, 'magnitude', fieldLookup)
      const angle = readMeasurement(formState, 'angle', fieldLookup)
      const real = magnitude.baseValue * Math.cos(angle.baseValue)
      const imaginary = magnitude.baseValue * Math.sin(angle.baseValue)

      return buildRectangularResult(goal, real, imaginary, 'voltage', [
        `${magnitude.field.shortLabel} = ${formatScalarValue(magnitude.value, magnitude.unitId, 'exact')}`,
        `${angle.field.shortLabel} = ${formatScalarValue(angle.value, angle.unitId, 'exact')}`,
        `V_real = |V| cos θ = ${formatBaseQuantity(real, 'voltage')}`,
        `V_imag = |V| sin θ = ${formatBaseQuantity(imaginary, 'voltage')}`,
      ])
    }
    case 'series_rl_impedance_polar': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const reactance = readMeasurement(formState, 'reactance', fieldLookup)
      const magnitude = Math.hypot(resistance.baseValue, reactance.baseValue)
      const angle = Math.atan2(reactance.baseValue, resistance.baseValue)

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: magnitude,
          angleRadians: angle,
          dimension: 'resistance',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `${resistance.field.shortLabel} = ${formatScalarValue(resistance.value, resistance.unitId, 'exact')}`,
          `${reactance.field.shortLabel} = ${formatScalarValue(reactance.value, reactance.unitId, 'exact')}`,
          `|Z_T| = √(R² + X_L²) = ${formatBaseQuantity(magnitude, 'resistance')}`,
          `θ = tan⁻¹(X_L / R) = ${formatAngleRadians(angle)}`,
        ],
        notes: ['Positive impedance angle means the RL network is inductive and lagging.'],
      }
    }
    case 'coil_impedance_magnitude': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const inductance = readMeasurement(formState, 'inductance', fieldLookup)
      const reactance = 2 * Math.PI * frequency.baseValue * inductance.baseValue
      const magnitude = Math.hypot(resistance.baseValue, reactance)

      return buildScalarResult(goal, magnitude, 'resistance', [
        `${resistance.field.shortLabel} = ${formatScalarValue(resistance.value, resistance.unitId, 'exact')}`,
        `${inductance.field.shortLabel} = ${formatScalarValue(inductance.value, inductance.unitId, 'exact')} = ${formatBaseQuantity(inductance.baseValue, 'inductance')}`,
        `X_L = ${formatBaseQuantity(reactance, 'resistance')}`,
        `|Z| = √(R² + X_L²) = ${formatBaseQuantity(magnitude, 'resistance')}`,
      ])
    }
    case 'rc_series_impedance_magnitude': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const capacitance = readMeasurement(formState, 'capacitance', fieldLookup)
      const reactance = 1 / (2 * Math.PI * frequency.baseValue * capacitance.baseValue)
      const magnitude = Math.hypot(resistance.baseValue, reactance)

      return buildScalarResult(goal, magnitude, 'resistance', [
        `${resistance.field.shortLabel} = ${formatScalarValue(resistance.value, resistance.unitId, 'exact')}`,
        `${capacitance.field.shortLabel} = ${formatScalarValue(capacitance.value, capacitance.unitId, 'exact')} = ${formatBaseQuantity(capacitance.baseValue, 'capacitance')}`,
        `X_C = ${formatBaseQuantity(reactance, 'resistance')}`,
        `|Z| = √(R² + X_C²) = ${formatBaseQuantity(magnitude, 'resistance')}`,
      ])
    }
    case 'net_series_reactance': {
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const inductance = readMeasurement(formState, 'inductance', fieldLookup)
      const capacitance = readMeasurement(formState, 'capacitance', fieldLookup)
      const inductiveReactance = 2 * Math.PI * frequency.baseValue * inductance.baseValue
      const capacitiveReactance = 1 / (2 * Math.PI * frequency.baseValue * capacitance.baseValue)
      const netReactance = inductiveReactance - capacitiveReactance

      return buildScalarResult(
        goal,
        netReactance,
        'resistance',
        [
          `X_L = ${formatBaseQuantity(inductiveReactance, 'resistance')}`,
          `X_C = ${formatBaseQuantity(capacitiveReactance, 'resistance')}`,
          `X_T = X_L - X_C = ${formatBaseQuantity(netReactance, 'resistance')}`,
        ],
        [
          netReactance >= 0
            ? 'Positive net reactance means the circuit is still inductive.'
            : 'Negative net reactance means the circuit is net capacitive.',
        ],
      )
    }
    case 'power_factor_from_angle': {
      const angle = readMeasurement(formState, 'angle', fieldLookup)
      const behavior = readSelect(formState, 'behavior', fieldLookup)
      const powerFactor = Math.abs(Math.cos(angle.baseValue))

      return buildScalarResult(
        goal,
        powerFactor,
        'unitless',
        [
          `${angle.field.shortLabel} = ${formatScalarValue(angle.value, angle.unitId, 'exact')}`,
          `PF = cos θ = ${formatBaseQuantity(powerFactor, 'unitless')}`,
        ],
        [`This power factor should be reported as ${behavior.value}.`],
      )
    }
    case 'rectangular_impedance_from_power_voltage_pf': {
      const power = readMeasurement(formState, 'power', fieldLookup)
      const voltage = readMeasurement(formState, 'voltage', fieldLookup)
      const powerFactor = readMeasurement(formState, 'powerFactor', fieldLookup)
      const behavior = readSelect(formState, 'behavior', fieldLookup)

      if (powerFactor.baseValue <= 0 || powerFactor.baseValue > 1) {
        throw new Error('Power factor must be greater than 0 and no more than 1.')
      }

      const current = power.baseValue / (voltage.baseValue * powerFactor.baseValue)
      const impedanceMagnitude = voltage.baseValue / current
      const angle = Math.acos(powerFactor.baseValue) * (behavior.value === 'leading' ? -1 : 1)
      const real = impedanceMagnitude * Math.cos(angle)
      const imaginary = impedanceMagnitude * Math.sin(angle)

      return buildRectangularResult(
        goal,
        real,
        imaginary,
        'resistance',
        [
          `I = P / (V × PF) = ${formatBaseQuantity(current, 'current')}`,
          `|Z| = V / I = ${formatBaseQuantity(impedanceMagnitude, 'resistance')}`,
          `θ = cos⁻¹(PF) = ${formatAngleRadians(angle)}`,
          `Z = ${formatBaseQuantity(real, 'resistance')} ${imaginary >= 0 ? '+' : '-'} j${formatBaseQuantity(Math.abs(imaginary), 'resistance')}`,
        ],
        [`${behavior.value === 'leading' ? 'Leading' : 'Lagging'} power factor sets the sign of the reactive term.`],
      )
    }
    case 'rectangular_impedance_from_phasors': {
      const voltageMagnitude = readMeasurement(formState, 'voltageMagnitude', fieldLookup)
      const voltageAngle = readMeasurement(formState, 'voltageAngle', fieldLookup)
      const currentMagnitude = readMeasurement(formState, 'currentMagnitude', fieldLookup)
      const currentAngle = readMeasurement(formState, 'currentAngle', fieldLookup)
      const impedanceMagnitude = voltageMagnitude.baseValue / currentMagnitude.baseValue
      const impedanceAngle = voltageAngle.baseValue - currentAngle.baseValue
      const real = impedanceMagnitude * Math.cos(impedanceAngle)
      const imaginary = impedanceMagnitude * Math.sin(impedanceAngle)

      return buildRectangularResult(goal, real, imaginary, 'resistance', [
        `|Z| = |V| / |I| = ${formatBaseQuantity(impedanceMagnitude, 'resistance')}`,
        `θ_Z = θ_V - θ_I = ${formatAngleRadians(impedanceAngle)}`,
        `R = |Z| cos θ_Z = ${formatBaseQuantity(real, 'resistance')}`,
        `X = |Z| sin θ_Z = ${formatBaseQuantity(imaginary, 'resistance')}`,
      ])
    }
    case 'equivalent_parallel_resistance_from_series_rl': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const reactance = readMeasurement(formState, 'reactance', fieldLookup)
      const equivalentResistance =
        (resistance.baseValue ** 2 + reactance.baseValue ** 2) / resistance.baseValue

      return buildScalarResult(goal, equivalentResistance, 'resistance', [
        `R_P = (R² + X_L²) / R = ${formatBaseQuantity(equivalentResistance, 'resistance')}`,
      ])
    }
    case 'equivalent_parallel_inductive_reactance_from_series_rl': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const reactance = readMeasurement(formState, 'reactance', fieldLookup)
      const equivalentReactance =
        (resistance.baseValue ** 2 + reactance.baseValue ** 2) / reactance.baseValue

      return buildScalarResult(goal, equivalentReactance, 'resistance', [
        `X_P = (R² + X_L²) / X_L = ${formatBaseQuantity(equivalentReactance, 'resistance')}`,
      ])
    }
    case 'parallel_resistor_and_coil_impedance': {
      const shuntResistance = readMeasurement(formState, 'shuntResistance', fieldLookup)
      const coilResistance = readMeasurement(formState, 'coilResistance', fieldLookup)
      const frequency = readMeasurement(formState, 'frequency', fieldLookup)
      const inductance = readMeasurement(formState, 'inductance', fieldLookup)
      const reactance = 2 * Math.PI * frequency.baseValue * inductance.baseValue
      const denominator = coilResistance.baseValue ** 2 + reactance ** 2
      const conductance = 1 / shuntResistance.baseValue + coilResistance.baseValue / denominator
      const susceptance = -reactance / denominator
      const magnitude = 1 / Math.hypot(conductance, susceptance)

      return buildScalarResult(
        goal,
        magnitude,
        'resistance',
        [
          `X_L = ${formatBaseQuantity(reactance, 'resistance')}`,
          `G_total = ${formatBaseQuantity(conductance, 'conductance')}`,
          `B_total = ${formatBaseQuantity(susceptance, 'conductance')}`,
          `|Z_total| = 1 / |Y_total| = ${formatBaseQuantity(magnitude, 'resistance')}`,
        ],
        ['The sign of branch susceptance is negative because the coil branch is inductive.'],
      )
    }
    case 'series_rlc_impedance_polar': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const inductiveReactance = readMeasurement(formState, 'inductiveReactance', fieldLookup)
      const capacitiveReactance = readMeasurement(formState, 'capacitiveReactance', fieldLookup)
      const netReactance = inductiveReactance.baseValue - capacitiveReactance.baseValue
      const magnitude = Math.hypot(resistance.baseValue, netReactance)
      const angle = Math.atan2(netReactance, resistance.baseValue)

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: magnitude,
          angleRadians: angle,
          dimension: 'resistance',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `X_T = X_L - X_C = ${formatBaseQuantity(netReactance, 'resistance')}`,
          `|Z_T| = √(R² + X_T²) = ${formatBaseQuantity(magnitude, 'resistance')}`,
          `θ = tan⁻¹(X_T / R) = ${formatAngleRadians(angle)}`,
        ],
        notes: [
          netReactance >= 0
            ? 'Positive angle means the series RLC network is inductive.'
            : 'Negative angle means the series RLC network is capacitive.',
        ],
      }
    }
    case 'series_rlc_impedance_rectangular': {
      const resistance = readMeasurement(formState, 'resistance', fieldLookup)
      const inductiveReactance = readMeasurement(formState, 'inductiveReactance', fieldLookup)
      const capacitiveReactance = readMeasurement(formState, 'capacitiveReactance', fieldLookup)
      const netReactance = inductiveReactance.baseValue - capacitiveReactance.baseValue

      return buildRectangularResult(
        goal,
        resistance.baseValue,
        netReactance,
        'resistance',
        [
          `X_T = X_L - X_C = ${formatBaseQuantity(netReactance, 'resistance')}`,
          `Z_T = ${formatBaseQuantity(resistance.baseValue, 'resistance')} ${netReactance >= 0 ? '+' : '-'} j${formatBaseQuantity(Math.abs(netReactance), 'resistance')}`,
        ],
        [
          netReactance >= 0
            ? 'Positive imaginary impedance means the network is inductive.'
            : 'Negative imaginary impedance means the network is capacitive.',
        ],
      )
    }
    case 'source_current_from_voltage_impedance': {
      const voltageMagnitude = readMeasurement(formState, 'voltageMagnitude', fieldLookup)
      const voltageAngle = readMeasurement(formState, 'voltageAngle', fieldLookup)
      const impedanceMagnitude = readMeasurement(formState, 'impedanceMagnitude', fieldLookup)
      const impedanceAngle = readMeasurement(formState, 'impedanceAngle', fieldLookup)
      const currentMagnitude = voltageMagnitude.baseValue / impedanceMagnitude.baseValue
      const currentAngle = voltageAngle.baseValue - impedanceAngle.baseValue

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: currentMagnitude,
          angleRadians: currentAngle,
          dimension: 'current',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `|I| = |E| / |Z| = ${formatBaseQuantity(currentMagnitude, 'current')}`,
          `θ_I = θ_E - θ_Z = ${formatAngleRadians(currentAngle)}`,
        ],
        notes: ['Use this same phasor division pattern for source current or any branch current where V and Z are known.'],
      }
    }
    case 'current_divider_two_branch': {
      const sourceCurrentMagnitude = readMeasurement(formState, 'sourceCurrentMagnitude', fieldLookup)
      const sourceCurrentAngle = readMeasurement(formState, 'sourceCurrentAngle', fieldLookup)
      const targetImpedanceMagnitude = readMeasurement(formState, 'targetImpedanceMagnitude', fieldLookup)
      const targetImpedanceAngle = readMeasurement(formState, 'targetImpedanceAngle', fieldLookup)
      const otherImpedanceMagnitude = readMeasurement(formState, 'otherImpedanceMagnitude', fieldLookup)
      const otherImpedanceAngle = readMeasurement(formState, 'otherImpedanceAngle', fieldLookup)

      const sourceCurrent = complexFromPolar(sourceCurrentMagnitude.baseValue, sourceCurrentAngle.baseValue)
      const targetImpedance = complexFromPolar(targetImpedanceMagnitude.baseValue, targetImpedanceAngle.baseValue)
      const otherImpedance = complexFromPolar(otherImpedanceMagnitude.baseValue, otherImpedanceAngle.baseValue)
      const currentRatio = complexDivide(otherImpedance, complexAdd(targetImpedance, otherImpedance))
      const branchCurrent = complexMultiply(sourceCurrent, currentRatio)
      const magnitude = Math.hypot(branchCurrent.real, branchCurrent.imaginary)
      const angle = Math.atan2(branchCurrent.imaginary, branchCurrent.real)

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: magnitude,
          angleRadians: angle,
          dimension: 'current',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `Current-divider factor = Z_other / (Z_target + Z_other)`,
          `|I_target| = ${formatBaseQuantity(magnitude, 'current')}`,
          `θ_target = ${formatAngleRadians(angle)}`,
        ],
        notes: ['In the current divider rule, the opposite branch impedance appears in the numerator.'],
      }
    }
    case 'voltage_divider_impedance': {
      const sourceVoltageMagnitude = readMeasurement(formState, 'sourceVoltageMagnitude', fieldLookup)
      const sourceVoltageAngle = readMeasurement(formState, 'sourceVoltageAngle', fieldLookup)
      const targetImpedanceMagnitude = readMeasurement(formState, 'targetImpedanceMagnitude', fieldLookup)
      const targetImpedanceAngle = readMeasurement(formState, 'targetImpedanceAngle', fieldLookup)
      const totalImpedanceMagnitude = readMeasurement(formState, 'totalImpedanceMagnitude', fieldLookup)
      const totalImpedanceAngle = readMeasurement(formState, 'totalImpedanceAngle', fieldLookup)

      const sourceVoltage = complexFromPolar(sourceVoltageMagnitude.baseValue, sourceVoltageAngle.baseValue)
      const targetImpedance = complexFromPolar(targetImpedanceMagnitude.baseValue, targetImpedanceAngle.baseValue)
      const totalImpedance = complexFromPolar(totalImpedanceMagnitude.baseValue, totalImpedanceAngle.baseValue)
      const dividerRatio = complexDivide(targetImpedance, totalImpedance)
      const targetVoltage = complexMultiply(sourceVoltage, dividerRatio)
      const magnitude = Math.hypot(targetVoltage.real, targetVoltage.imaginary)
      const angle = Math.atan2(targetVoltage.imaginary, targetVoltage.real)

      return {
        goalId: goal.id,
        computation: {
          kind: 'polar',
          magnitudeBase: magnitude,
          angleRadians: angle,
          dimension: 'voltage',
        },
        formulaPath: goal.formulaPath,
        substitutionDetails: [
          `Divider ratio = Z_x / Z_T`,
          `|V_x| = ${formatBaseQuantity(magnitude, 'voltage')}`,
          `θ_x = ${formatAngleRadians(angle)}`,
        ],
        notes: ['This goal works with full impedance phasors rather than only real-valued resistances.'],
      }
    }
    case 'average_power_from_voltage_current_pf': {
      const voltage = readMeasurement(formState, 'voltage', fieldLookup)
      const current = readMeasurement(formState, 'current', fieldLookup)
      const powerFactor = readMeasurement(formState, 'powerFactor', fieldLookup)

      if (powerFactor.baseValue <= 0 || powerFactor.baseValue > 1) {
        throw new Error('Power factor must be greater than 0 and no more than 1.')
      }

      const power = voltage.baseValue * current.baseValue * powerFactor.baseValue

      return buildScalarResult(goal, power, 'power', [
        `${voltage.field.shortLabel} = ${formatScalarValue(voltage.value, voltage.unitId, 'exact')}`,
        `${current.field.shortLabel} = ${formatScalarValue(current.value, current.unitId, 'exact')}`,
        `${powerFactor.field.shortLabel} = ${formatScalarValue(powerFactor.value, powerFactor.unitId, 'exact')}`,
        `P = VI × PF = ${formatBaseQuantity(power, 'power')}`,
      ])
    }
    default:
      throw new Error(`Unsupported solver goal: ${goal.id}`)
  }
}
