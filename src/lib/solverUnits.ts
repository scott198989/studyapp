import type {
  SolverRoundingMode,
  SolverUnitDefinition,
  SolverUnitDimension,
  SolverUnitId,
} from '../types/solver'

export const solverUnits: SolverUnitDefinition[] = [
  { id: 'ohm', label: 'Ohm', symbol: 'Ω', dimension: 'resistance', toBaseFactor: 1 },
  { id: 'kiloohm', label: 'kOhm', symbol: 'kΩ', dimension: 'resistance', toBaseFactor: 1_000 },
  { id: 'milliohm', label: 'mOhm', symbol: 'mΩ', dimension: 'resistance', toBaseFactor: 0.001 },
  { id: 'siemens', label: 'S', symbol: 'S', dimension: 'conductance', toBaseFactor: 1 },
  { id: 'millisiemens', label: 'mS', symbol: 'mS', dimension: 'conductance', toBaseFactor: 0.001 },
  { id: 'microsiemens', label: 'uS', symbol: 'μS', dimension: 'conductance', toBaseFactor: 0.000001 },
  { id: 'degrees', label: 'degrees', symbol: '°', dimension: 'angle', toBaseFactor: Math.PI / 180 },
  { id: 'radians', label: 'radians', symbol: 'rad', dimension: 'angle', toBaseFactor: 1 },
  { id: 'hertz', label: 'Hz', symbol: 'Hz', dimension: 'frequency', toBaseFactor: 1 },
  { id: 'kilohertz', label: 'kHz', symbol: 'kHz', dimension: 'frequency', toBaseFactor: 1_000 },
  { id: 'megahertz', label: 'MHz', symbol: 'MHz', dimension: 'frequency', toBaseFactor: 1_000_000 },
  { id: 'henry', label: 'H', symbol: 'H', dimension: 'inductance', toBaseFactor: 1 },
  { id: 'millihenry', label: 'mH', symbol: 'mH', dimension: 'inductance', toBaseFactor: 0.001 },
  { id: 'microhenry', label: 'uH', symbol: 'μH', dimension: 'inductance', toBaseFactor: 0.000001 },
  { id: 'farad', label: 'F', symbol: 'F', dimension: 'capacitance', toBaseFactor: 1 },
  { id: 'millifarad', label: 'mF', symbol: 'mF', dimension: 'capacitance', toBaseFactor: 0.001 },
  { id: 'microfarad', label: 'uF', symbol: 'μF', dimension: 'capacitance', toBaseFactor: 0.000001 },
  { id: 'nanofarad', label: 'nF', symbol: 'nF', dimension: 'capacitance', toBaseFactor: 0.000000001 },
  { id: 'volt', label: 'V', symbol: 'V', dimension: 'voltage', toBaseFactor: 1 },
  { id: 'millivolt', label: 'mV', symbol: 'mV', dimension: 'voltage', toBaseFactor: 0.001 },
  { id: 'amp', label: 'A', symbol: 'A', dimension: 'current', toBaseFactor: 1 },
  { id: 'milliamp', label: 'mA', symbol: 'mA', dimension: 'current', toBaseFactor: 0.001 },
  { id: 'microamp', label: 'uA', symbol: 'μA', dimension: 'current', toBaseFactor: 0.000001 },
  { id: 'watt', label: 'W', symbol: 'W', dimension: 'power', toBaseFactor: 1 },
  { id: 'kilowatt', label: 'kW', symbol: 'kW', dimension: 'power', toBaseFactor: 1_000 },
  { id: 'unitless', label: 'unitless', symbol: '', dimension: 'unitless', toBaseFactor: 1 },
]

export const solverUnitLookup = Object.fromEntries(
  solverUnits.map((unit) => [unit.id, unit]),
) as Record<SolverUnitId, SolverUnitDefinition>

export function getUnitDefinition(unitId: SolverUnitId) {
  return solverUnitLookup[unitId]
}

export function getUnitsForDimension(dimension: SolverUnitDimension) {
  return solverUnits.filter((unit) => unit.dimension === dimension)
}

export function isUnitCompatibleWithDimension(unitId: SolverUnitId, dimension: SolverUnitDimension) {
  return solverUnitLookup[unitId].dimension === dimension
}

export function convertToBase(value: number, unitId: SolverUnitId) {
  return value * solverUnitLookup[unitId].toBaseFactor
}

export function convertFromBase(value: number, unitId: SolverUnitId) {
  return value / solverUnitLookup[unitId].toBaseFactor
}

export function convertBetweenUnits(value: number, fromUnitId: SolverUnitId, toUnitId: SolverUnitId) {
  const fromUnit = solverUnitLookup[fromUnitId]
  const toUnit = solverUnitLookup[toUnitId]

  if (fromUnit.dimension !== toUnit.dimension) {
    throw new Error(`Cannot convert ${fromUnit.label} to ${toUnit.label}.`)
  }

  return convertFromBase(convertToBase(value, fromUnitId), toUnitId)
}

function trimTrailingZeroes(value: string) {
  return value.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '')
}

function formatExactNumber(value: number) {
  if (value === 0) {
    return '0'
  }

  if (Math.abs(value) < 0.000001 || Math.abs(value) >= 1_000_000) {
    return value.toExponential(6)
  }

  const formatted = value.toPrecision(9)
  return formatted.includes('e') ? formatted : trimTrailingZeroes(formatted)
}

export function formatNumber(value: number, roundingMode: SolverRoundingMode) {
  switch (roundingMode) {
    case '2dp':
      return value.toFixed(2)
    case '3dp':
      return value.toFixed(3)
    case 'scientific':
      return value.toExponential(3)
    case 'exact':
    default:
      return formatExactNumber(value)
  }
}

export function formatScalarValue(value: number, unitId: SolverUnitId, roundingMode: SolverRoundingMode) {
  const symbol = solverUnitLookup[unitId].symbol
  const formatted = formatNumber(value, roundingMode)

  return symbol ? `${formatted} ${symbol}` : formatted
}

function formatAngleValue(value: number, unitId: SolverUnitId, roundingMode: SolverRoundingMode) {
  const symbol = solverUnitLookup[unitId].symbol
  const formatted = formatNumber(value, roundingMode)

  return unitId === 'degrees' ? `${formatted}${symbol}` : `${formatted} ${symbol}`
}

export function formatPolarValue(
  magnitudeValue: number,
  magnitudeUnitId: SolverUnitId,
  angleValue: number,
  angleUnitId: SolverUnitId,
  roundingMode: SolverRoundingMode,
) {
  return `${formatScalarValue(magnitudeValue, magnitudeUnitId, roundingMode)} ∠ ${formatAngleValue(
    angleValue,
    angleUnitId,
    roundingMode,
  )}`
}

export function formatRectangularValue(
  realValue: number,
  imaginaryValue: number,
  unitId: SolverUnitId,
  roundingMode: SolverRoundingMode,
) {
  const symbol = solverUnitLookup[unitId].symbol
  const formattedReal = formatNumber(realValue, roundingMode)
  const formattedImaginary = formatNumber(Math.abs(imaginaryValue), roundingMode)
  const sign = imaginaryValue >= 0 ? '+' : '-'
  const unitSuffix = symbol ? ` ${symbol}` : ''

  return `${formattedReal}${unitSuffix} ${sign} j${formattedImaginary}${unitSuffix}`
}

function describeScale(value: number) {
  if (value === 0) {
    return 'no scale change'
  }

  if (value > 1) {
    return `multiply by ${formatExactNumber(value)}`
  }

  return `divide by ${formatExactNumber(1 / value)}`
}

export function describeUnitConversion(fromUnitId: SolverUnitId, toUnitId: SolverUnitId) {
  if (fromUnitId === toUnitId) {
    return `No unit conversion needed: ${solverUnitLookup[fromUnitId].symbol || solverUnitLookup[fromUnitId].label}`
  }

  const fromUnit = solverUnitLookup[fromUnitId]
  const toUnit = solverUnitLookup[toUnitId]

  if (fromUnit.dimension !== toUnit.dimension) {
    return `Requested ${toUnit.label}, but the computed quantity is ${fromUnit.label}.`
  }

  const ratio = fromUnit.toBaseFactor / toUnit.toBaseFactor
  return `Convert ${fromUnit.symbol || fromUnit.label} → ${toUnit.symbol || toUnit.label}: ${describeScale(ratio)}`
}

export function buildIncompatibleUnitWarning(quantityType: string, requestedUnitId: SolverUnitId, fallbackUnitId: SolverUnitId) {
  const requested = solverUnitLookup[requestedUnitId]
  const fallback = solverUnitLookup[fallbackUnitId]

  return `Warning: ${quantityType} is typically expressed in ${fallback.symbol || fallback.label}, not ${requested.symbol || requested.label}.`
}
