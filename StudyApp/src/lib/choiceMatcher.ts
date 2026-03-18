import type {
  AnswerChoiceMatchResult,
  ParsedAnswerChoice,
  SolverComputation,
  SolverUnitId,
} from '../types/solver'
import { convertToBase, getUnitDefinition } from './solverUnits'

const unitTokenMap: Record<string, SolverUnitId> = {
  ohm: 'ohm',
  ohms: 'ohm',
  'ω': 'ohm',
  kohm: 'kiloohm',
  kohms: 'kiloohm',
  'kω': 'kiloohm',
  mohm: 'milliohm',
  mohms: 'milliohm',
  'mω': 'milliohm',
  s: 'siemens',
  siemens: 'siemens',
  ms: 'millisiemens',
  us: 'microsiemens',
  'μs': 'microsiemens',
  degrees: 'degrees',
  degree: 'degrees',
  deg: 'degrees',
  '°': 'degrees',
  rad: 'radians',
  radians: 'radians',
  hz: 'hertz',
  khz: 'kilohertz',
  mhz: 'megahertz',
  h: 'henry',
  mh: 'millihenry',
  uh: 'microhenry',
  'μh': 'microhenry',
  f: 'farad',
  mf: 'millifarad',
  uf: 'microfarad',
  'μf': 'microfarad',
  nf: 'nanofarad',
  v: 'volt',
  mv: 'millivolt',
  a: 'amp',
  ma: 'milliamp',
  w: 'watt',
  kw: 'kilowatt',
}

function normalizeChoiceText(text: string) {
  return text
    .replace(/,/gu, '')
    .replace(/[µμ]/gu, 'μ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function resolveUnitToken(token?: string, fallbackUnitId?: SolverUnitId) {
  if (!token?.trim()) {
    return fallbackUnitId
  }

  const normalized = token.trim().toLowerCase()
  return unitTokenMap[normalized] ?? fallbackUnitId
}

function normalizeAngleDelta(delta: number) {
  const twoPi = Math.PI * 2
  let wrapped = delta % twoPi

  if (wrapped > Math.PI) {
    wrapped -= twoPi
  }

  if (wrapped < -Math.PI) {
    wrapped += twoPi
  }

  return wrapped
}

function scoreScalar(choiceBase: number, targetBase: number) {
  const scale = Math.max(Math.abs(targetBase), 1)
  return Math.abs(choiceBase - targetBase) / scale
}

function parseLineLabel(line: string, index: number) {
  const match = line.match(/^\s*([A-Z])(?:\)|\]|\.|:|-)?\s*(.+)$/u)

  if (!match) {
    return {
      label: `Choice ${index + 1}`,
      body: line.trim(),
    }
  }

  return {
    label: match[1],
    body: match[2].trim(),
  }
}

function buildIncomparableChoice(label: string, rawText: string): ParsedAnswerChoice {
  return {
    label,
    rawText,
    normalizedText: normalizeChoiceText(rawText),
    comparable: false,
    score: Number.POSITIVE_INFINITY,
  }
}

function parseScalarChoice(
  label: string,
  body: string,
  computation: SolverComputation,
  fallbackUnitId: SolverUnitId,
): ParsedAnswerChoice {
  if (computation.kind !== 'scalar') {
    return buildIncomparableChoice(label, body)
  }

  const normalizedText = normalizeChoiceText(body)
  const match = normalizedText.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ°]+)?$/iu)

  if (!match) {
    return buildIncomparableChoice(label, body)
  }

  const value = Number(match[1])
  const unitId = resolveUnitToken(match[2], fallbackUnitId)

  if (!unitId || getUnitDefinition(unitId).dimension !== computation.dimension) {
    return buildIncomparableChoice(label, body)
  }

  const baseValue = convertToBase(value, unitId)

  return {
    label,
    rawText: body,
    normalizedText,
    unitId,
    comparable: true,
    score: scoreScalar(baseValue, computation.baseValue),
  }
}

function parsePolarChoice(
  label: string,
  body: string,
  computation: SolverComputation,
  fallbackUnitId: SolverUnitId,
  fallbackAngleUnitId: SolverUnitId,
): ParsedAnswerChoice {
  if (computation.kind !== 'polar') {
    return buildIncomparableChoice(label, body)
  }

  const normalizedText = normalizeChoiceText(body).replace(/</gu, '∠')
  const match = normalizedText.match(
    /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?\s*∠\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-Zμ°]+)?$/iu,
  )

  if (!match) {
    return buildIncomparableChoice(label, body)
  }

  const magnitude = Number(match[1])
  const unitId = resolveUnitToken(match[2], fallbackUnitId)
  const angle = Number(match[3])
  const angleUnitId = resolveUnitToken(match[4], fallbackAngleUnitId)

  if (
    !unitId ||
    !angleUnitId ||
    getUnitDefinition(unitId).dimension !== computation.dimension ||
    getUnitDefinition(angleUnitId).dimension !== 'angle'
  ) {
    return buildIncomparableChoice(label, body)
  }

  const magnitudeBase = convertToBase(magnitude, unitId)
  const angleBase = convertToBase(angle, angleUnitId)
  const magnitudeScore = scoreScalar(magnitudeBase, computation.magnitudeBase)
  const angleScore = Math.abs(normalizeAngleDelta(angleBase - computation.angleRadians)) / Math.PI

  return {
    label,
    rawText: body,
    normalizedText,
    unitId,
    angleUnitId,
    comparable: true,
    score: magnitudeScore + angleScore,
  }
}

function parseRectangularChoice(
  label: string,
  body: string,
  computation: SolverComputation,
  fallbackUnitId: SolverUnitId,
): ParsedAnswerChoice {
  if (computation.kind !== 'rectangular') {
    return buildIncomparableChoice(label, body)
  }

  const normalizedText = normalizeChoiceText(body)
  const match = normalizedText.match(
    /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?\s*([+-])\s*j\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?$/iu,
  )

  if (!match) {
    return buildIncomparableChoice(label, body)
  }

  const real = Number(match[1])
  const realUnitId = resolveUnitToken(match[2], fallbackUnitId)
  const imaginary = Number(match[4]) * (match[3] === '-' ? -1 : 1)
  const imaginaryUnitId = resolveUnitToken(match[5], realUnitId ?? fallbackUnitId)

  if (
    !realUnitId ||
    !imaginaryUnitId ||
    getUnitDefinition(realUnitId).dimension !== computation.dimension ||
    getUnitDefinition(imaginaryUnitId).dimension !== computation.dimension
  ) {
    return buildIncomparableChoice(label, body)
  }

  const realBase = convertToBase(real, realUnitId)
  const imaginaryBase = convertToBase(imaginary, imaginaryUnitId)
  const scale = Math.max(Math.abs(computation.realBase) + Math.abs(computation.imaginaryBase), 1)
  const score =
    (Math.abs(realBase - computation.realBase) + Math.abs(imaginaryBase - computation.imaginaryBase)) / scale

  return {
    label,
    rawText: body,
    normalizedText,
    unitId: realUnitId,
    comparable: true,
    score,
  }
}

export function matchAnswerChoices(
  rawChoicesText: string,
  computation: SolverComputation,
  fallbackUnitId: SolverUnitId,
  fallbackAngleUnitId: SolverUnitId = 'degrees',
): AnswerChoiceMatchResult {
  const lines = rawChoicesText
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return {
      parsedChoices: [],
      warnings: [],
    }
  }

  const parsedChoices = lines.map((line, index) => {
    const { label, body } = parseLineLabel(line, index)

    if (body.includes('∠') || body.includes('<')) {
      return parsePolarChoice(label, body, computation, fallbackUnitId, fallbackAngleUnitId)
    }

    if (/j\s*[+-]?\d/u.test(body) || /\+\s*j/u.test(body) || /-\s*j/u.test(body)) {
      return parseRectangularChoice(label, body, computation, fallbackUnitId)
    }

    return parseScalarChoice(label, body, computation, fallbackUnitId)
  })

  const comparableChoices = parsedChoices.filter((choice) => choice.comparable)
  const bestMatch = comparableChoices.reduce<ParsedAnswerChoice | undefined>((best, choice) => {
    if (!best || choice.score < best.score) {
      return choice
    }

    return best
  }, undefined)

  const warnings: string[] = []

  if (lines.length > 0 && comparableChoices.length === 0) {
    warnings.push('Could not compare these answer choices. Check the units or formatting.')
  }

  return {
    parsedChoices,
    bestMatch,
    warnings,
  }
}
