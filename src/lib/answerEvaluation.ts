import type {
  AnswerSpec,
  ManualResponse,
  ReviewEvaluation,
  ScalarAnswerSpec,
  StudyItem,
  StudyItemResponse,
} from '../types/study'
import { convertToBase, getUnitDefinition } from './solverUnits'

const unitTokenMap = {
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
  unitless: 'unitless',
} as const

function normalizeText(text: string) {
  return text
    .replace(/,/gu, '')
    .replace(/[µμ]/gu, 'μ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function resolveUnitToken(token: string | undefined) {
  if (!token?.trim()) {
    return undefined
  }

  return unitTokenMap[token.trim().toLowerCase() as keyof typeof unitTokenMap]
}

function formatScalar(spec: ScalarAnswerSpec) {
  const unit = getUnitDefinition(spec.unitId)
  return unit.symbol ? `${spec.value} ${unit.symbol}` : `${spec.value}`
}

function formatExpectedAnswer(answerSpec: AnswerSpec) {
  switch (answerSpec.kind) {
    case 'choice':
      return undefined
    case 'manual-check':
      return undefined
    case 'scalar':
      return formatScalar(answerSpec)
    case 'polar': {
      const unit = getUnitDefinition(answerSpec.unitId)
      const angleUnit = getUnitDefinition(answerSpec.angleUnitId)
      const magnitude = unit.symbol ? `${answerSpec.magnitude} ${unit.symbol}` : `${answerSpec.magnitude}`
      const angle =
        answerSpec.angleUnitId === 'degrees'
          ? `${answerSpec.angle}${angleUnit.symbol}`
          : `${answerSpec.angle} ${angleUnit.symbol}`

      return `${magnitude} ∠ ${angle}`
    }
    case 'rectangular': {
      const unit = getUnitDefinition(answerSpec.unitId)
      const suffix = unit.symbol ? ` ${unit.symbol}` : ''
      const sign = answerSpec.imaginary >= 0 ? '+' : '-'
      return `${answerSpec.real}${suffix} ${sign} j${Math.abs(answerSpec.imaginary)}${suffix}`
    }
  }
}

function relativeTolerance(target: number, ratio: number | undefined) {
  const scale = Math.max(Math.abs(target), 1)
  return scale * (ratio ?? 0.02)
}

function includesRequiredKeywords(raw: string, requiredKeywords: string[] | undefined) {
  if (!requiredKeywords?.length) {
    return true
  }

  const normalized = raw.toLowerCase()
  return requiredKeywords.every((keyword) => normalized.includes(keyword.toLowerCase()))
}

function parseScalar(raw: string) {
  const normalized = normalizeText(raw)
  const match = normalized.match(/^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:\s+(.+))?$/iu)

  if (!match) {
    return undefined
  }

  const trailing = match[2]?.trim() ?? ''
  const [firstToken] = trailing.split(' ')

  return {
    value: Number(match[1]),
    unitId: resolveUnitToken(firstToken),
    normalized,
  }
}

function parsePolar(raw: string) {
  const normalized = normalizeText(raw).replace(/</gu, '∠')
  const match = normalized.match(
    /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?\s*∠\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-Zμ°]+)?$/iu,
  )

  if (!match) {
    return undefined
  }

  return {
    magnitude: Number(match[1]),
    unitId: resolveUnitToken(match[2]),
    angle: Number(match[3]),
    angleUnitId: resolveUnitToken(match[4]) ?? 'degrees',
    normalized,
  }
}

function parseRectangular(raw: string) {
  const normalized = normalizeText(raw)
  const match = normalized.match(
    /^([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?\s*([+-])\s*j\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*([a-zA-ZΩωμ]+)?$/iu,
  )

  if (!match) {
    return undefined
  }

  return {
    real: Number(match[1]),
    realUnitId: resolveUnitToken(match[2]),
    imaginary: Number(match[4]) * (match[3] === '-' ? -1 : 1),
    imaginaryUnitId: resolveUnitToken(match[5]) ?? resolveUnitToken(match[2]),
    normalized,
  }
}

function normalizeAngleDelta(deltaRadians: number) {
  const fullTurn = Math.PI * 2
  let wrapped = deltaRadians % fullTurn

  if (wrapped > Math.PI) {
    wrapped -= fullTurn
  }

  if (wrapped < -Math.PI) {
    wrapped += fullTurn
  }

  return wrapped
}

function evaluateChoice(item: StudyItem, response?: StudyItemResponse): ReviewEvaluation {
  if (!response || response.kind !== 'choice') {
    return {
      status: 'unanswered',
      isGradable: true,
      isCorrect: false,
      isAnswered: false,
      feedback: 'No answer selected.',
    }
  }

  const expected = item.answerSpec.kind === 'choice' ? item.answerSpec.correctChoiceId : undefined
  const isCorrect = response.value === expected

  return {
    status: isCorrect ? 'correct' : 'incorrect',
    isGradable: true,
    isCorrect,
    isAnswered: true,
    feedback: isCorrect ? 'Choice matched the keyed answer.' : 'Choice did not match the keyed answer.',
  }
}

function evaluateScalar(item: StudyItem, response?: StudyItemResponse): ReviewEvaluation {
  const spec = item.answerSpec
  if (spec.kind !== 'scalar') {
    throw new Error(`Expected scalar answer spec for ${item.id}.`)
  }

  if (!response || response.kind !== 'text' || !response.value.trim()) {
    return {
      status: 'unanswered',
      isGradable: true,
      isCorrect: false,
      isAnswered: false,
      feedback: 'No numeric answer entered.',
      expectedAnswer: formatExpectedAnswer(spec),
    }
  }

  const parsed = parseScalar(response.value)
  if (!parsed || (parsed.unitId && parsed.unitId !== spec.unitId && getUnitDefinition(parsed.unitId).dimension !== getUnitDefinition(spec.unitId).dimension)) {
    return {
      status: 'incorrect',
      isGradable: true,
      isCorrect: false,
      isAnswered: true,
      feedback: 'Answer format was not recognized for this scalar quantity.',
      expectedAnswer: formatExpectedAnswer(spec),
      actualAnswer: response.value,
    }
  }

  const effectiveUnitId = parsed.unitId ?? spec.unitId
  const actualBase = convertToBase(parsed.value, effectiveUnitId)
  const expectedBase = convertToBase(spec.value, spec.unitId)
  const difference = Math.abs(actualBase - expectedBase)
  const withinTolerance = difference <= relativeTolerance(expectedBase, spec.toleranceRatio)
  const hasKeywords = includesRequiredKeywords(response.value, spec.requiredKeywords)
  const isCorrect = withinTolerance && hasKeywords

  return {
    status: isCorrect ? 'correct' : 'incorrect',
    isGradable: true,
    isCorrect,
    isAnswered: true,
    feedback: isCorrect
      ? 'Numeric value and unit matched within tolerance.'
      : 'Numeric value or required notation did not match the expected answer.',
    expectedAnswer: formatExpectedAnswer(spec),
    actualAnswer: response.value,
  }
}

function evaluatePolar(item: StudyItem, response?: StudyItemResponse): ReviewEvaluation {
  const spec = item.answerSpec
  if (spec.kind !== 'polar') {
    throw new Error(`Expected polar answer spec for ${item.id}.`)
  }

  if (!response || response.kind !== 'text' || !response.value.trim()) {
    return {
      status: 'unanswered',
      isGradable: true,
      isCorrect: false,
      isAnswered: false,
      feedback: 'No polar answer entered.',
      expectedAnswer: formatExpectedAnswer(spec),
    }
  }

  const parsed = parsePolar(response.value)
  if (
    !parsed ||
    !parsed.unitId ||
    !parsed.angleUnitId ||
    getUnitDefinition(parsed.unitId).dimension !== getUnitDefinition(spec.unitId).dimension
  ) {
    return {
      status: 'incorrect',
      isGradable: true,
      isCorrect: false,
      isAnswered: true,
      feedback: 'Answer format was not recognized for a polar quantity.',
      expectedAnswer: formatExpectedAnswer(spec),
      actualAnswer: response.value,
    }
  }

  const actualMagnitudeBase = convertToBase(parsed.magnitude, parsed.unitId)
  const expectedMagnitudeBase = convertToBase(spec.magnitude, spec.unitId)
  const magnitudeMatches =
    Math.abs(actualMagnitudeBase - expectedMagnitudeBase) <=
    relativeTolerance(expectedMagnitudeBase, spec.magnitudeToleranceRatio)
  const actualAngleBase = convertToBase(parsed.angle, parsed.angleUnitId)
  const expectedAngleBase = convertToBase(spec.angle, spec.angleUnitId)
  const angleToleranceRadians = convertToBase(spec.angleToleranceDegrees ?? 2, 'degrees')
  const angleMatches = Math.abs(normalizeAngleDelta(actualAngleBase - expectedAngleBase)) <= angleToleranceRadians
  const hasKeywords = includesRequiredKeywords(response.value, spec.requiredKeywords)
  const isCorrect = magnitudeMatches && angleMatches && hasKeywords

  return {
    status: isCorrect ? 'correct' : 'incorrect',
    isGradable: true,
    isCorrect,
    isAnswered: true,
    feedback: isCorrect
      ? 'Magnitude, angle, and units matched within tolerance.'
      : 'Magnitude, angle, unit, or required notation did not match the expected answer.',
    expectedAnswer: formatExpectedAnswer(spec),
    actualAnswer: response.value,
  }
}

function evaluateRectangular(item: StudyItem, response?: StudyItemResponse): ReviewEvaluation {
  const spec = item.answerSpec
  if (spec.kind !== 'rectangular') {
    throw new Error(`Expected rectangular answer spec for ${item.id}.`)
  }

  if (!response || response.kind !== 'text' || !response.value.trim()) {
    return {
      status: 'unanswered',
      isGradable: true,
      isCorrect: false,
      isAnswered: false,
      feedback: 'No rectangular-form answer entered.',
      expectedAnswer: formatExpectedAnswer(spec),
    }
  }

  const parsed = parseRectangular(response.value)
  if (
    !parsed ||
    !parsed.realUnitId ||
    !parsed.imaginaryUnitId ||
    getUnitDefinition(parsed.realUnitId).dimension !== getUnitDefinition(spec.unitId).dimension ||
    getUnitDefinition(parsed.imaginaryUnitId).dimension !== getUnitDefinition(spec.unitId).dimension
  ) {
    return {
      status: 'incorrect',
      isGradable: true,
      isCorrect: false,
      isAnswered: true,
      feedback: 'Answer format was not recognized for a rectangular quantity.',
      expectedAnswer: formatExpectedAnswer(spec),
      actualAnswer: response.value,
    }
  }

  const actualRealBase = convertToBase(parsed.real, parsed.realUnitId)
  const actualImaginaryBase = convertToBase(parsed.imaginary, parsed.imaginaryUnitId)
  const expectedRealBase = convertToBase(spec.real, spec.unitId)
  const expectedImaginaryBase = convertToBase(spec.imaginary, spec.unitId)
  const realMatches =
    Math.abs(actualRealBase - expectedRealBase) <= relativeTolerance(expectedRealBase, spec.toleranceRatio)
  const imaginaryMatches =
    Math.abs(actualImaginaryBase - expectedImaginaryBase) <= relativeTolerance(expectedImaginaryBase, spec.toleranceRatio)
  const hasKeywords = includesRequiredKeywords(response.value, spec.requiredKeywords)
  const isCorrect = realMatches && imaginaryMatches && hasKeywords

  return {
    status: isCorrect ? 'correct' : 'incorrect',
    isGradable: true,
    isCorrect,
    isAnswered: true,
    feedback: isCorrect
      ? 'Real and imaginary components matched within tolerance.'
      : 'Real component, imaginary component, units, or required notation did not match the expected answer.',
    expectedAnswer: formatExpectedAnswer(spec),
    actualAnswer: response.value,
  }
}

function evaluateManual(response?: StudyItemResponse): ReviewEvaluation {
  const manualResponse = response?.kind === 'manual' ? (response as ManualResponse) : undefined
  const completed = Boolean(manualResponse?.completed)

  return {
    status: completed ? 'manual_complete' : 'manual_pending',
    isGradable: false,
    isCorrect: completed,
    isAnswered: completed || Boolean(manualResponse?.notes?.trim()),
    feedback: completed
      ? 'Manual self-check marked complete.'
      : 'Manual self-check is still waiting for review.',
    actualAnswer: manualResponse?.notes?.trim() ? manualResponse.notes : undefined,
  }
}

export function evaluateStudyItemResponse(item: StudyItem, response?: StudyItemResponse): ReviewEvaluation {
  if (item.kind === 'multiple_choice' || item.kind === 'true_false') {
    return evaluateChoice(item, response)
  }

  if (item.kind === 'manual_check') {
    return evaluateManual(response)
  }

  switch (item.answerSpec.kind) {
    case 'scalar':
      return evaluateScalar(item, response)
    case 'polar':
      return evaluatePolar(item, response)
    case 'rectangular':
      return evaluateRectangular(item, response)
    default:
      return {
        status: 'incorrect',
        isGradable: true,
        isCorrect: false,
        isAnswered: false,
        feedback: 'Unsupported numeric answer format.',
      }
  }
}

export function getExpectedAnswerText(item: StudyItem) {
  return formatExpectedAnswer(item.answerSpec)
}
