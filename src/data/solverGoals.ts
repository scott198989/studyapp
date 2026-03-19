import type {
  SolverFieldDefinition,
  SolverFieldInputState,
  SolverFormState,
  SolverGoalDefinition,
  SolverGoalId,
  SolverMeasurementFieldDefinition,
  SolverSelectFieldDefinition,
  SolverUnitId,
} from '../types/solver'

function measurementField(
  id: string,
  label: string,
  shortLabel: string,
  description: string,
  placeholder: string,
  defaultUnitId: SolverUnitId,
  unitOptions: SolverUnitId[],
  options: Pick<SolverMeasurementFieldDefinition, 'allowNegative' | 'note'> = {},
): SolverMeasurementFieldDefinition {
  return {
    kind: 'measurement',
    id,
    label,
    shortLabel,
    description,
    placeholder,
    defaultUnitId,
    unitOptions,
    ...options,
  }
}

function selectField(
  id: string,
  label: string,
  description: string,
  defaultValue: string,
  options: SolverSelectFieldDefinition['options'],
  note?: string,
): SolverSelectFieldDefinition {
  return {
    kind: 'select',
    id,
    label,
    description,
    defaultValue,
    options,
    note,
  }
}

const resistanceUnits: SolverUnitId[] = ['ohm', 'kiloohm', 'milliohm']
const angleUnits: SolverUnitId[] = ['degrees', 'radians']
const frequencyUnits: SolverUnitId[] = ['hertz', 'kilohertz', 'megahertz']
const inductanceUnits: SolverUnitId[] = ['henry', 'millihenry', 'microhenry']
const capacitanceUnits: SolverUnitId[] = ['farad', 'millifarad', 'microfarad', 'nanofarad']
const voltageUnits: SolverUnitId[] = ['volt', 'millivolt']
const currentUnits: SolverUnitId[] = ['amp', 'milliamp', 'microamp']
const powerUnits: SolverUnitId[] = ['watt', 'kilowatt']

export const solverGoals: SolverGoalDefinition[] = [
  {
    id: 'capacitive_susceptance',
    name: 'Capacitive susceptance from frequency and capacitance',
    shortName: 'Capacitive susceptance',
    description:
      'Compute capacitor susceptance in base SI units, then present the answer in the exact unit the quiz expects.',
    formulaPath: ['B_C = 2πfC'],
    fields: [
      measurementField(
        'frequency',
        'Signal frequency',
        'f',
        'Enter the signal frequency used by the problem.',
        '1000',
        'hertz',
        frequencyUnits,
        {
          note: 'Use hertz, kilohertz, or megahertz. Angular frequency is derived internally.',
        },
      ),
      measurementField(
        'capacitance',
        'Capacitance',
        'C',
        'Enter the capacitor value from the problem statement.',
        '100',
        'microfarad',
        capacitanceUnits,
      ),
    ],
    output: {
      format: 'scalar',
      quantityType: 'susceptance',
      canonicalUnit: 'siemens',
      allowedAlternateUnits: ['millisiemens', 'microsiemens'],
      preferredOutputUnit: 'siemens',
      rawDisplayUnit: 'millisiemens',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'inductive_reactance',
    name: 'Inductive reactance from frequency and inductance',
    shortName: 'Inductive reactance',
    description: 'Solve X_L directly from f and L and show the answer in the target quiz unit.',
    formulaPath: ['X_L = 2πfL'],
    fields: [
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '600', 'hertz', frequencyUnits),
      measurementField('inductance', 'Inductance', 'L', 'Enter the inductance.', '25', 'millihenry', inductanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'reactance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'capacitive_reactance',
    name: 'Capacitive reactance from frequency and capacitance',
    shortName: 'Capacitive reactance',
    description: 'Solve X_C and convert the displayed answer into the unit the quiz choices are using.',
    formulaPath: ['X_C = 1 / (2πfC)'],
    fields: [
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '60', 'hertz', frequencyUnits),
      measurementField('capacitance', 'Capacitance', 'C', 'Enter the capacitance.', '10', 'microfarad', capacitanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'reactance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'inductor_impedance_polar',
    name: 'Inductor impedance in polar form',
    shortName: 'Inductor impedance (polar)',
    description: 'Compute the magnitude from X_L and lock the phase at +90 degrees for an ideal inductor.',
    formulaPath: ['X_L = 2πfL', 'Z_L = X_L ∠ 90°'],
    fields: [
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '60', 'hertz', frequencyUnits),
      measurementField('inductance', 'Inductance', 'L', 'Enter the inductance.', '50', 'millihenry', inductanceUnits),
    ],
    output: {
      format: 'polar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'capacitor_impedance_rectangular',
    name: 'Capacitor impedance in rectangular form',
    shortName: 'Capacitor impedance (rectangular)',
    description: 'Compute X_C and show the capacitor impedance as a pure negative imaginary quantity.',
    formulaPath: ['X_C = 1 / (2πfC)', 'Z_C = 0 - jX_C'],
    fields: [
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '60', 'hertz', frequencyUnits),
      measurementField('capacitance', 'Capacitance', 'C', 'Enter the capacitance.', '10', 'microfarad', capacitanceUnits),
    ],
    output: {
      format: 'rectangular',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'voltage_phasor_rectangular',
    name: 'Voltage phasor from polar to rectangular form',
    shortName: 'Voltage phasor (rectangular)',
    description: 'Convert a phasor magnitude and angle into rectangular voltage components.',
    formulaPath: ['V = |V|(cos θ + j sin θ)', 'V_real = |V| cos θ', 'V_imag = |V| sin θ'],
    fields: [
      measurementField('magnitude', 'Voltage magnitude', '|V|', 'Enter the phasor magnitude.', '6', 'volt', voltageUnits),
      measurementField(
        'angle',
        'Phasor angle',
        'θ',
        'Enter the phasor angle.',
        '200',
        'degrees',
        angleUnits,
        {
          allowNegative: true,
        },
      ),
    ],
    output: {
      format: 'rectangular',
      quantityType: 'voltage',
      canonicalUnit: 'volt',
      allowedAlternateUnits: ['millivolt'],
      preferredOutputUnit: 'volt',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'series_rl_impedance_polar',
    name: 'Series RL impedance in polar form',
    shortName: 'Series RL impedance (polar)',
    description: 'Combine resistance and inductive reactance, then present Z_T in polar form.',
    formulaPath: ['Z_T = R + jX_L', '|Z_T| = √(R² + X_L²)', 'θ = tan⁻¹(X_L / R)'],
    fields: [
      measurementField('resistance', 'Resistance', 'R', 'Enter the series resistance.', '50', 'ohm', resistanceUnits),
      measurementField('reactance', 'Inductive reactance', 'X_L', 'Enter the inductive reactance.', '20', 'ohm', resistanceUnits),
    ],
    output: {
      format: 'polar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'coil_impedance_magnitude',
    name: 'Coil impedance magnitude from R, f, and L',
    shortName: 'Coil impedance magnitude',
    description: 'Use resistance plus inductive reactance to get the magnitude of a coil impedance.',
    formulaPath: ['X_L = 2πfL', '|Z| = √(R² + X_L²)'],
    fields: [
      measurementField('resistance', 'Internal resistance', 'R', 'Enter the coil resistance.', '55', 'ohm', resistanceUnits),
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '60', 'hertz', frequencyUnits),
      measurementField('inductance', 'Inductance', 'L', 'Enter the inductance.', '250', 'millihenry', inductanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'rc_series_impedance_magnitude',
    name: 'Series RC impedance magnitude from R, f, and C',
    shortName: 'Series RC impedance magnitude',
    description: 'Solve the magnitude of a series RC network using resistance and capacitive reactance.',
    formulaPath: ['X_C = 1 / (2πfC)', '|Z| = √(R² + X_C²)'],
    fields: [
      measurementField('resistance', 'Resistance', 'R', 'Enter the series resistance.', '56', 'kiloohm', resistanceUnits),
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '300', 'hertz', frequencyUnits),
      measurementField('capacitance', 'Capacitance', 'C', 'Enter the capacitance.', '0.05', 'microfarad', capacitanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'net_series_reactance',
    name: 'Net series reactance from frequency, L, and C',
    shortName: 'Net series reactance',
    description: 'Compute X_L and X_C, then subtract them to get the net series reactance.',
    formulaPath: ['X_L = 2πfL', 'X_C = 1 / (2πfC)', 'X_T = X_L - X_C'],
    fields: [
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '450', 'hertz', frequencyUnits),
      measurementField('inductance', 'Inductance', 'L', 'Enter the inductance.', '250', 'millihenry', inductanceUnits),
      measurementField('capacitance', 'Capacitance', 'C', 'Enter the capacitance.', '4.7', 'microfarad', capacitanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'reactance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'power_factor_from_angle',
    name: 'Power factor from impedance angle',
    shortName: 'Power factor',
    description: 'Convert an impedance angle into a power factor and keep the lead or lag note obvious.',
    formulaPath: ['PF = cos θ'],
    fields: [
      measurementField(
        'angle',
        'Impedance angle',
        'θ',
        'Enter the circuit angle.',
        '30',
        'degrees',
        angleUnits,
        {
          allowNegative: true,
        },
      ),
      selectField(
        'behavior',
        'Circuit behavior',
        'Select whether the circuit is lagging or leading.',
        'lagging',
        [
          { value: 'lagging', label: 'Lagging' },
          { value: 'leading', label: 'Leading' },
        ],
      ),
    ],
    output: {
      format: 'scalar',
      quantityType: 'power factor',
      canonicalUnit: 'unitless',
      allowedAlternateUnits: [],
      preferredOutputUnit: 'unitless',
      preferredRounding: '3dp',
    },
  },
  {
    id: 'rectangular_impedance_from_power_voltage_pf',
    name: 'Rectangular impedance from power, voltage, and power factor',
    shortName: 'Rectangular impedance from power',
    description: 'Compute the impedance magnitude from real power and power factor, then resolve it into rectangular form.',
    formulaPath: [
      'I = P / (V × PF)',
      '|Z| = V / I',
      'R = |Z| cos θ',
      'X = |Z| sin θ',
    ],
    fields: [
      measurementField('power', 'Real power', 'P', 'Enter real power.', '100', 'watt', powerUnits),
      measurementField('voltage', 'Applied voltage', 'V', 'Enter the rms voltage.', '500', 'volt', voltageUnits),
      measurementField(
        'powerFactor',
        'Power factor',
        'PF',
        'Enter the power factor magnitude.',
        '0.8',
        'unitless',
        ['unitless'],
      ),
      selectField(
        'behavior',
        'Circuit behavior',
        'Select whether the power factor is lagging or leading.',
        'lagging',
        [
          { value: 'lagging', label: 'Lagging' },
          { value: 'leading', label: 'Leading' },
        ],
      ),
    ],
    output: {
      format: 'rectangular',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'rectangular_impedance_from_phasors',
    name: 'Rectangular impedance from voltage and current phasors',
    shortName: 'Rectangular impedance from phasors',
    description: 'Divide the voltage phasor by the current phasor, then convert the result into rectangular impedance.',
    formulaPath: ['Z = V / I', '|Z| = |V| / |I|', 'θ_Z = θ_V - θ_I', 'Z = R + jX'],
    fields: [
      measurementField('voltageMagnitude', 'Voltage magnitude', '|V|', 'Enter the voltage magnitude.', '100', 'volt', voltageUnits),
      measurementField(
        'voltageAngle',
        'Voltage angle',
        'θ_V',
        'Enter the voltage angle.',
        '40',
        'degrees',
        angleUnits,
        { allowNegative: true },
      ),
      measurementField('currentMagnitude', 'Current magnitude', '|I|', 'Enter the current magnitude.', '1', 'amp', currentUnits),
      measurementField(
        'currentAngle',
        'Current angle',
        'θ_I',
        'Enter the current angle.',
        '10',
        'degrees',
        angleUnits,
        { allowNegative: true },
      ),
    ],
    output: {
      format: 'rectangular',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'equivalent_parallel_resistance_from_series_rl',
    name: 'Equivalent parallel resistance from a series RL branch',
    shortName: 'Equivalent parallel resistance',
    description: 'Convert a series RL impedance into its equivalent parallel resistance value.',
    formulaPath: ['R_P = (R² + X_L²) / R'],
    fields: [
      measurementField('resistance', 'Series resistance', 'R', 'Enter the series resistance.', '100', 'ohm', resistanceUnits),
      measurementField('reactance', 'Series inductive reactance', 'X_L', 'Enter the series inductive reactance.', '50', 'ohm', resistanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'resistance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'equivalent_parallel_inductive_reactance_from_series_rl',
    name: 'Equivalent parallel inductive reactance from a series RL branch',
    shortName: 'Equivalent parallel X_L',
    description: 'Convert a series RL impedance into its equivalent parallel inductive reactance value.',
    formulaPath: ['X_P = (R² + X_L²) / X_L'],
    fields: [
      measurementField('resistance', 'Series resistance', 'R', 'Enter the series resistance.', '100', 'ohm', resistanceUnits),
      measurementField('reactance', 'Series inductive reactance', 'X_L', 'Enter the series inductive reactance.', '50', 'ohm', resistanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'reactance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'parallel_resistor_and_coil_impedance',
    name: 'Parallel resistor and coil impedance magnitude',
    shortName: 'Parallel resistor + coil impedance',
    description: 'Solve the total impedance magnitude of a resistor in parallel with a coil that has both R and X_L.',
    formulaPath: [
      'X_L = 2πfL',
      'Y_total = 1 / R_shunt + 1 / (R_coil + jX_L)',
      '|Z_total| = 1 / |Y_total|',
    ],
    fields: [
      measurementField('shuntResistance', 'Parallel resistor', 'R_shunt', 'Enter the resistor in parallel with the coil.', '4700', 'ohm', resistanceUnits),
      measurementField('coilResistance', 'Coil resistance', 'R_coil', 'Enter the coil resistance.', '45', 'ohm', resistanceUnits),
      measurementField('frequency', 'Signal frequency', 'f', 'Enter the signal frequency.', '500', 'hertz', frequencyUnits),
      measurementField('inductance', 'Inductance', 'L', 'Enter the inductance.', '100', 'millihenry', inductanceUnits),
    ],
    output: {
      format: 'scalar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'series_rlc_impedance_polar',
    name: 'Series RLC impedance in polar form',
    shortName: 'Series RLC impedance (polar)',
    description: 'Use R, X_L, and X_C directly, then convert the resulting series impedance into polar form.',
    formulaPath: ['X_T = X_L - X_C', 'Z_T = R + jX_T', '|Z_T| = √(R² + X_T²)', 'θ = tan⁻¹(X_T / R)'],
    fields: [
      measurementField('resistance', 'Resistance', 'R', 'Enter the series resistance.', '10', 'ohm', resistanceUnits),
      measurementField('inductiveReactance', 'Inductive reactance', 'X_L', 'Enter the inductive reactance.', '20', 'ohm', resistanceUnits),
      measurementField('capacitiveReactance', 'Capacitive reactance', 'X_C', 'Enter the capacitive reactance.', '15', 'ohm', resistanceUnits),
    ],
    output: {
      format: 'polar',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'series_rlc_impedance_rectangular',
    name: 'Series RLC impedance in rectangular form',
    shortName: 'Series RLC impedance (rectangular)',
    description: 'Use R, X_L, and X_C directly and show Z_T in rectangular form for fast choice matching.',
    formulaPath: ['X_T = X_L - X_C', 'Z_T = R + jX_T'],
    fields: [
      measurementField('resistance', 'Resistance', 'R', 'Enter the series resistance.', '5', 'ohm', resistanceUnits),
      measurementField('inductiveReactance', 'Inductive reactance', 'X_L', 'Enter the inductive reactance.', '10', 'ohm', resistanceUnits),
      measurementField('capacitiveReactance', 'Capacitive reactance', 'X_C', 'Enter the capacitive reactance.', '15', 'ohm', resistanceUnits),
    ],
    output: {
      format: 'rectangular',
      quantityType: 'impedance',
      canonicalUnit: 'ohm',
      allowedAlternateUnits: ['kiloohm', 'milliohm'],
      preferredOutputUnit: 'ohm',
      preferredRounding: '2dp',
    },
  },
  {
    id: 'source_current_from_voltage_impedance',
    name: 'Source current from source voltage and total impedance',
    shortName: 'Source current from E and Z',
    description: 'Use phasor Ohm’s law to compute source or branch current from a voltage phasor and an impedance phasor.',
    formulaPath: ['I = E / Z', '|I| = |E| / |Z|', 'θ_I = θ_E - θ_Z'],
    fields: [
      measurementField('voltageMagnitude', 'Voltage magnitude', '|E|', 'Enter the voltage magnitude.', '50', 'volt', voltageUnits),
      measurementField('voltageAngle', 'Voltage angle', 'θ_E', 'Enter the voltage angle.', '0', 'degrees', angleUnits, {
        allowNegative: true,
      }),
      measurementField('impedanceMagnitude', 'Impedance magnitude', '|Z|', 'Enter the impedance magnitude.', '25', 'ohm', resistanceUnits),
      measurementField('impedanceAngle', 'Impedance angle', 'θ_Z', 'Enter the impedance angle.', '20', 'degrees', angleUnits, {
        allowNegative: true,
      }),
    ],
    output: {
      format: 'polar',
      quantityType: 'current',
      canonicalUnit: 'amp',
      allowedAlternateUnits: ['milliamp'],
      preferredOutputUnit: 'amp',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'current_divider_two_branch',
    name: 'Current divider for two impedances',
    shortName: 'Current divider',
    description: 'Solve the current through one branch of a two-branch parallel network using the opposite branch impedance in the numerator.',
    formulaPath: ['I_target = I_source × Z_other / (Z_target + Z_other)'],
    fields: [
      measurementField('sourceCurrentMagnitude', 'Source current magnitude', '|I_S|', 'Enter the source current magnitude.', '2', 'amp', currentUnits),
      measurementField('sourceCurrentAngle', 'Source current angle', 'θ_IS', 'Enter the source current angle.', '0', 'degrees', angleUnits, {
        allowNegative: true,
      }),
      measurementField('targetImpedanceMagnitude', 'Target branch |Z|', '|Z_target|', 'Enter the target branch impedance magnitude.', '10', 'ohm', resistanceUnits),
      measurementField('targetImpedanceAngle', 'Target branch angle', 'θ_target', 'Enter the target branch impedance angle.', '0', 'degrees', angleUnits, {
        allowNegative: true,
      }),
      measurementField('otherImpedanceMagnitude', 'Other branch |Z|', '|Z_other|', 'Enter the opposite branch impedance magnitude.', '20', 'ohm', resistanceUnits),
      measurementField('otherImpedanceAngle', 'Other branch angle', 'θ_other', 'Enter the opposite branch impedance angle.', '-30', 'degrees', angleUnits, {
        allowNegative: true,
      }),
    ],
    output: {
      format: 'polar',
      quantityType: 'current',
      canonicalUnit: 'amp',
      allowedAlternateUnits: ['milliamp'],
      preferredOutputUnit: 'amp',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'voltage_divider_impedance',
    name: 'Voltage divider with impedance phasors',
    shortName: 'Voltage divider',
    description: 'Solve the phasor voltage across an element or section using the impedance divider rule.',
    formulaPath: ['V_x = E × Z_x / Z_T'],
    fields: [
      measurementField('sourceVoltageMagnitude', 'Source voltage magnitude', '|E|', 'Enter the source-voltage magnitude.', '120', 'volt', voltageUnits),
      measurementField('sourceVoltageAngle', 'Source voltage angle', 'θ_E', 'Enter the source-voltage angle.', '0', 'degrees', angleUnits, {
        allowNegative: true,
      }),
      measurementField('targetImpedanceMagnitude', 'Target impedance magnitude', '|Z_x|', 'Enter the target impedance magnitude.', '15', 'ohm', resistanceUnits),
      measurementField('targetImpedanceAngle', 'Target impedance angle', 'θ_x', 'Enter the target impedance angle.', '-20', 'degrees', angleUnits, {
        allowNegative: true,
      }),
      measurementField('totalImpedanceMagnitude', 'Total impedance magnitude', '|Z_T|', 'Enter the total impedance magnitude.', '40', 'ohm', resistanceUnits),
      measurementField('totalImpedanceAngle', 'Total impedance angle', 'θ_T', 'Enter the total impedance angle.', '10', 'degrees', angleUnits, {
        allowNegative: true,
      }),
    ],
    output: {
      format: 'polar',
      quantityType: 'voltage',
      canonicalUnit: 'volt',
      allowedAlternateUnits: ['millivolt'],
      preferredOutputUnit: 'volt',
      preferredRounding: '2dp',
      allowedAngleUnits: angleUnits,
      preferredAngleUnit: 'degrees',
    },
  },
  {
    id: 'average_power_from_voltage_current_pf',
    name: 'Average power from voltage, current, and power factor',
    shortName: 'Average power',
    description: 'Compute average power from rms voltage, rms current, and power factor.',
    formulaPath: ['P = VI cos θ', 'P = VI × PF'],
    fields: [
      measurementField('voltage', 'RMS voltage', 'V', 'Enter the rms voltage.', '120', 'volt', voltageUnits),
      measurementField('current', 'RMS current', 'I', 'Enter the rms current.', '2', 'amp', currentUnits),
      measurementField('powerFactor', 'Power factor', 'PF', 'Enter the power-factor magnitude.', '0.8', 'unitless', ['unitless']),
    ],
    output: {
      format: 'scalar',
      quantityType: 'power',
      canonicalUnit: 'watt',
      allowedAlternateUnits: ['kilowatt'],
      preferredOutputUnit: 'watt',
      preferredRounding: '2dp',
    },
  },
]

export const defaultSolverGoalId: SolverGoalId = 'capacitive_susceptance'

export const solverGoalLookup = Object.fromEntries(
  solverGoals.map((goal) => [goal.id, goal]),
) as Record<SolverGoalId, SolverGoalDefinition>

function createDefaultFieldState(field: SolverFieldDefinition): SolverFieldInputState {
  if (field.kind === 'select') {
    return {
      kind: 'select',
      value: field.defaultValue,
    }
  }

  return {
    kind: 'measurement',
    value: '',
    unitId: field.defaultUnitId,
  }
}

export function createDefaultSolverFormState(goalId: SolverGoalId): SolverFormState {
  const goal = solverGoalLookup[goalId]

  return Object.fromEntries(goal.fields.map((field) => [field.id, createDefaultFieldState(field)]))
}
