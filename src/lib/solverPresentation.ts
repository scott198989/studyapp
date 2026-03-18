import type {
  AnswerChoiceMatchResult,
  SolverComputation,
  SolverComputationResult,
  SolverGoalDefinition,
  SolverPresentation,
  SolverRoundingMode,
  SolverUnitId,
} from '../types/solver'
import { matchAnswerChoices } from './choiceMatcher'
import {
  buildIncompatibleUnitWarning,
  convertFromBase,
  describeUnitConversion,
  formatPolarValue,
  formatRectangularValue,
  formatScalarValue,
  getUnitDefinition,
  isUnitCompatibleWithDimension,
} from './solverUnits'

interface BuildPresentationArgs {
  goal: SolverGoalDefinition
  result: SolverComputationResult
  requestedOutputUnitId: SolverUnitId
  requestedAngleUnitId?: SolverUnitId
  roundingMode: SolverRoundingMode
  answerChoicesText?: string
}

function formatComputation(
  computation: SolverComputation,
  outputUnitId: SolverUnitId,
  roundingMode: SolverRoundingMode,
  angleUnitId: SolverUnitId = 'degrees',
) {
  switch (computation.kind) {
    case 'scalar':
      return formatScalarValue(convertFromBase(computation.baseValue, outputUnitId), outputUnitId, roundingMode)
    case 'polar':
      return formatPolarValue(
        convertFromBase(computation.magnitudeBase, outputUnitId),
        outputUnitId,
        convertFromBase(computation.angleRadians, angleUnitId),
        angleUnitId,
        roundingMode,
      )
    case 'rectangular':
      return formatRectangularValue(
        convertFromBase(computation.realBase, outputUnitId),
        convertFromBase(computation.imaginaryBase, outputUnitId),
        outputUnitId,
        roundingMode,
      )
  }
}

function buildOutputWarnings(
  goal: SolverGoalDefinition,
  computation: SolverComputation,
  requestedOutputUnitId: SolverUnitId,
  effectiveOutputUnitId: SolverUnitId,
  rawDisplayUnitId: SolverUnitId,
  requestedAngleUnitId: SolverUnitId | undefined,
  effectiveAngleUnitId: SolverUnitId | undefined,
  choiceMatch: AnswerChoiceMatchResult,
) {
  const warnings: string[] = []

  if (requestedOutputUnitId !== effectiveOutputUnitId) {
    warnings.push(buildIncompatibleUnitWarning(goal.output.quantityType, requestedOutputUnitId, effectiveOutputUnitId))
  }

  if (rawDisplayUnitId !== effectiveOutputUnitId) {
    warnings.push('Unit conversion applied.')
    warnings.push(
      `Careful: raw result is in ${getUnitDefinition(rawDisplayUnitId).symbol || getUnitDefinition(rawDisplayUnitId).label}, but your quiz likely wants ${getUnitDefinition(effectiveOutputUnitId).symbol || getUnitDefinition(effectiveOutputUnitId).label}.`,
    )
    const factor =
      getUnitDefinition(rawDisplayUnitId).toBaseFactor / getUnitDefinition(effectiveOutputUnitId).toBaseFactor

    if (Math.abs(factor - 0.001) < Number.EPSILON || Math.abs(factor - 1000) < Number.EPSILON) {
      warnings.push('Careful: milli and base units differ by 1000x. Converted automatically for final answer.')
    }

    if (Math.abs(factor - 0.000001) < Number.EPSILON || Math.abs(factor - 1_000_000) < Number.EPSILON) {
      warnings.push('Careful: micro and base units differ by 1,000,000x. Converted automatically for final answer.')
    }
  }

  if (
    computation.kind === 'polar' &&
    requestedAngleUnitId &&
    effectiveAngleUnitId &&
    requestedAngleUnitId !== effectiveAngleUnitId
  ) {
    warnings.push('Warning: the requested angle unit is inconsistent, so the final answer falls back to the supported angle unit.')
  }

  if (
    computation.kind === 'polar' &&
    requestedAngleUnitId &&
    effectiveAngleUnitId &&
    requestedAngleUnitId !== effectiveAngleUnitId
  ) {
    warnings.push('Careful: degree and radian answers are not interchangeable.')
  }

  if (
    choiceMatch.bestMatch?.unitId &&
    choiceMatch.bestMatch.unitId !== effectiveOutputUnitId &&
    getUnitDefinition(choiceMatch.bestMatch.unitId).dimension === getUnitDefinition(effectiveOutputUnitId).dimension
  ) {
    warnings.push(
      `Quiz choices appear to use ${getUnitDefinition(choiceMatch.bestMatch.unitId).symbol || getUnitDefinition(choiceMatch.bestMatch.unitId).label}, not ${getUnitDefinition(effectiveOutputUnitId).symbol || getUnitDefinition(effectiveOutputUnitId).label}.`,
    )
  }

  warnings.push(...choiceMatch.warnings)

  return Array.from(new Set(warnings))
}

export function buildSolverPresentation({
  goal,
  result,
  requestedOutputUnitId,
  requestedAngleUnitId,
  roundingMode,
  answerChoicesText = '',
}: BuildPresentationArgs): { presentation: SolverPresentation; choiceMatch: AnswerChoiceMatchResult } {
  const computation = result.computation
  const compatibleRequestedUnit = isUnitCompatibleWithDimension(requestedOutputUnitId, computation.dimension)
  const allowedUnits = [goal.output.canonicalUnit, ...goal.output.allowedAlternateUnits]
  const effectiveOutputUnitId =
    compatibleRequestedUnit && allowedUnits.includes(requestedOutputUnitId)
      ? requestedOutputUnitId
      : goal.output.preferredOutputUnit
  const rawDisplayUnitId =
    goal.output.rawDisplayUnit && isUnitCompatibleWithDimension(goal.output.rawDisplayUnit, computation.dimension)
      ? goal.output.rawDisplayUnit
      : goal.output.canonicalUnit
  const effectiveAngleUnitId =
    computation.kind === 'polar'
      ? goal.output.allowedAngleUnits?.includes(requestedAngleUnitId ?? goal.output.preferredAngleUnit ?? 'degrees')
        ? requestedAngleUnitId ?? goal.output.preferredAngleUnit ?? 'degrees'
        : goal.output.preferredAngleUnit ?? 'degrees'
      : undefined
  const rawAngleUnitId = computation.kind === 'polar' ? goal.output.preferredAngleUnit ?? 'degrees' : undefined
  const rawComputed = formatComputation(computation, rawDisplayUnitId, 'exact', rawAngleUnitId)
  const finalExact = formatComputation(computation, effectiveOutputUnitId, 'exact', effectiveAngleUnitId)
  const finalRounded = formatComputation(computation, effectiveOutputUnitId, roundingMode, effectiveAngleUnitId)
  const conversionSteps = [`Computed: ${rawComputed}`]

  if (rawDisplayUnitId !== effectiveOutputUnitId) {
    conversionSteps.push(describeUnitConversion(rawDisplayUnitId, effectiveOutputUnitId))
  } else {
    conversionSteps.push(describeUnitConversion(rawDisplayUnitId, rawDisplayUnitId))
  }

  if (computation.kind === 'polar' && rawAngleUnitId && effectiveAngleUnitId && rawAngleUnitId !== effectiveAngleUnitId) {
    conversionSteps.push(describeUnitConversion(rawAngleUnitId, effectiveAngleUnitId))
  }

  conversionSteps.push(`Final: ${finalExact}`)
  conversionSteps.push(`Rounded for quiz: ${finalRounded}`)

  const choiceMatch = matchAnswerChoices(
    answerChoicesText,
    computation,
    effectiveOutputUnitId,
    effectiveAngleUnitId ?? goal.output.preferredAngleUnit ?? 'degrees',
  )
  const warnings = buildOutputWarnings(
    goal,
    computation,
    requestedOutputUnitId,
    effectiveOutputUnitId,
    rawDisplayUnitId,
    requestedAngleUnitId,
    effectiveAngleUnitId,
    choiceMatch,
  )

  return {
    presentation: {
      rawComputed,
      finalExact,
      finalRounded,
      effectiveOutputUnitId,
      effectiveAngleUnitId,
      requestedOutputUnitId,
      requestedAngleUnitId,
      conversionSteps,
      warnings,
    },
    choiceMatch,
  }
}
