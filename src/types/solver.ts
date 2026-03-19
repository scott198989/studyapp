export type SolverGoalId =
  | 'inductive_reactance'
  | 'capacitive_reactance'
  | 'inductor_impedance_polar'
  | 'capacitor_impedance_rectangular'
  | 'voltage_phasor_rectangular'
  | 'series_rl_impedance_polar'
  | 'coil_impedance_magnitude'
  | 'rc_series_impedance_magnitude'
  | 'net_series_reactance'
  | 'power_factor_from_angle'
  | 'rectangular_impedance_from_power_voltage_pf'
  | 'rectangular_impedance_from_phasors'
  | 'equivalent_parallel_resistance_from_series_rl'
  | 'equivalent_parallel_inductive_reactance_from_series_rl'
  | 'parallel_resistor_and_coil_impedance'
  | 'series_rlc_impedance_polar'
  | 'series_rlc_impedance_rectangular'
  | 'capacitive_susceptance'
  | 'source_current_from_voltage_impedance'
  | 'current_divider_two_branch'
  | 'voltage_divider_impedance'
  | 'average_power_from_voltage_current_pf'

export type SolverUnitDimension =
  | 'resistance'
  | 'conductance'
  | 'angle'
  | 'frequency'
  | 'inductance'
  | 'capacitance'
  | 'voltage'
  | 'current'
  | 'power'
  | 'unitless'

export type SolverUnitId =
  | 'ohm'
  | 'kiloohm'
  | 'milliohm'
  | 'siemens'
  | 'millisiemens'
  | 'microsiemens'
  | 'degrees'
  | 'radians'
  | 'hertz'
  | 'kilohertz'
  | 'megahertz'
  | 'henry'
  | 'millihenry'
  | 'microhenry'
  | 'farad'
  | 'millifarad'
  | 'microfarad'
  | 'nanofarad'
  | 'volt'
  | 'millivolt'
  | 'amp'
  | 'milliamp'
  | 'microamp'
  | 'watt'
  | 'kilowatt'
  | 'unitless'

export type SolverRoundingMode = 'exact' | '2dp' | '3dp' | 'scientific'
export type SolverOutputFormat = 'scalar' | 'polar' | 'rectangular'

export interface SolverUnitDefinition {
  id: SolverUnitId
  label: string
  symbol: string
  dimension: SolverUnitDimension
  toBaseFactor: number
}

export interface SolverFieldOption {
  value: string
  label: string
}

export interface SolverMeasurementFieldDefinition {
  kind: 'measurement'
  id: string
  label: string
  shortLabel: string
  description: string
  placeholder: string
  defaultUnitId: SolverUnitId
  unitOptions: SolverUnitId[]
  allowNegative?: boolean
  note?: string
}

export interface SolverSelectFieldDefinition {
  kind: 'select'
  id: string
  label: string
  description: string
  defaultValue: string
  options: SolverFieldOption[]
  note?: string
}

export type SolverFieldDefinition =
  | SolverMeasurementFieldDefinition
  | SolverSelectFieldDefinition

export interface SolverGoalOutputMeta {
  format: SolverOutputFormat
  quantityType: string
  canonicalUnit: SolverUnitId
  allowedAlternateUnits: SolverUnitId[]
  preferredOutputUnit: SolverUnitId
  rawDisplayUnit?: SolverUnitId
  preferredRounding: SolverRoundingMode
  allowedAngleUnits?: SolverUnitId[]
  preferredAngleUnit?: SolverUnitId
}

export interface SolverGoalDefinition {
  id: SolverGoalId
  name: string
  shortName: string
  description: string
  formulaPath: string[]
  fields: SolverFieldDefinition[]
  output: SolverGoalOutputMeta
}

export interface SolverMeasurementInputState {
  kind: 'measurement'
  value: string
  unitId: SolverUnitId
}

export interface SolverSelectInputState {
  kind: 'select'
  value: string
}

export type SolverFieldInputState = SolverMeasurementInputState | SolverSelectInputState
export type SolverFormState = Record<string, SolverFieldInputState>

export interface ScalarComputation {
  kind: 'scalar'
  baseValue: number
  dimension: SolverUnitDimension
  annotation?: string
}

export interface PolarComputation {
  kind: 'polar'
  magnitudeBase: number
  angleRadians: number
  dimension: SolverUnitDimension
}

export interface RectangularComputation {
  kind: 'rectangular'
  realBase: number
  imaginaryBase: number
  dimension: SolverUnitDimension
}

export type SolverComputation = ScalarComputation | PolarComputation | RectangularComputation

export interface SolverComputationResult {
  goalId: SolverGoalId
  computation: SolverComputation
  formulaPath: string[]
  substitutionDetails: string[]
  notes: string[]
}

export interface SolverPresentation {
  rawComputed: string
  finalExact: string
  finalRounded: string
  effectiveOutputUnitId: SolverUnitId
  effectiveAngleUnitId?: SolverUnitId
  requestedOutputUnitId: SolverUnitId
  requestedAngleUnitId?: SolverUnitId
  conversionSteps: string[]
  warnings: string[]
}

export interface ParsedAnswerChoice {
  label: string
  rawText: string
  normalizedText: string
  unitId?: SolverUnitId
  angleUnitId?: SolverUnitId
  comparable: boolean
  score: number
}

export interface AnswerChoiceMatchResult {
  parsedChoices: ParsedAnswerChoice[]
  bestMatch?: ParsedAnswerChoice
  warnings: string[]
}
