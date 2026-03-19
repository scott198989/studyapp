import type { Question as LegacyQuestion } from '../types/quiz'
import type {
  AnswerSpec,
  Choice,
  FormulaSupport,
  ManualCheckStudyItem,
  NumericStudyItem,
  SourceRef,
  StudyItem,
  StudySetId,
} from '../types/study'

const trueFalseChoices: Choice[] = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
]

function padNumber(value: number) {
  return value.toString().padStart(3, '0')
}

export function buildQuiz1516Id(value: number) {
  return `q1516_${padNumber(value)}`
}

export function buildQuiz17Id(value: number) {
  return `q17_${padNumber(value)}`
}

export function choice(id: string, text: string): Choice {
  return { id, text }
}

export function sourceRef(
  filename: string,
  screenshotQuestionNumber: number | undefined,
  role: SourceRef['role'] = 'primary',
  notes?: string,
): SourceRef {
  return {
    filename,
    screenshotQuestionNumber,
    role,
    notes,
  }
}

export function cloneLegacyQuestion(
  legacyQuestion: LegacyQuestion,
  options: {
    id: string
    setId: StudySetId
    sourceLabel?: string
    formulaSupport: FormulaSupport
  },
): StudyItem {
  return {
    id: options.id,
    setId: options.setId,
    kind: legacyQuestion.kind,
    sourceLabel: options.sourceLabel ?? `Question ${legacyQuestion.sourceNumbers[0]}`,
    sourceNumbers: legacyQuestion.sourceNumbers,
    prompt: legacyQuestion.prompt,
    choices: legacyQuestion.kind === 'true_false' ? trueFalseChoices : legacyQuestion.choices,
    answerSpec: {
      kind: 'choice',
      correctChoiceId: legacyQuestion.correctChoiceId,
    },
    rationale: legacyQuestion.rationale,
    tags: legacyQuestion.tags,
    sourceRefs: legacyQuestion.sourceRefs.map((ref) => ({
      filename: ref.filename,
      screenshotQuestionNumber: ref.screenshotQuestionNumber,
      role: ref.role,
      notes: ref.notes,
    })),
    formulaSupport: options.formulaSupport,
    figureId: legacyQuestion.figureId,
  }
}

export function numericItem(options: {
  id: string
  setId: StudySetId
  sourceLabel: string
  sourceNumbers?: number[]
  prompt: string
  inputLabel: string
  placeholder?: string
  rationale: string
  tags: string[]
  sourceRefs: SourceRef[]
  formulaSupport: FormulaSupport
  answerSpec: NumericStudyItem['answerSpec']
  helperText?: string
}): NumericStudyItem {
  return {
    id: options.id,
    setId: options.setId,
    kind: 'numeric',
    sourceLabel: options.sourceLabel,
    sourceNumbers: options.sourceNumbers ?? [],
    prompt: options.prompt,
    inputLabel: options.inputLabel,
    placeholder: options.placeholder,
    rationale: options.rationale,
    tags: options.tags,
    sourceRefs: options.sourceRefs,
    formulaSupport: options.formulaSupport,
    answerSpec: options.answerSpec,
    helperText: options.helperText,
  }
}

export function manualItem(options: {
  id: string
  setId: StudySetId
  sourceLabel: string
  sourceNumbers?: number[]
  prompt: string
  rationale: string
  tags: string[]
  sourceRefs: SourceRef[]
  formulaSupport: FormulaSupport
  checklist: string[]
  workedSolution?: string[]
  helperText?: string
}): ManualCheckStudyItem {
  return {
    id: options.id,
    setId: options.setId,
    kind: 'manual_check',
    sourceLabel: options.sourceLabel,
    sourceNumbers: options.sourceNumbers ?? [],
    prompt: options.prompt,
    rationale: options.rationale,
    tags: options.tags,
    sourceRefs: options.sourceRefs,
    formulaSupport: options.formulaSupport,
    answerSpec: {
      kind: 'manual-check',
      checklist: options.checklist,
    },
    workedSolution: options.workedSolution,
    helperText: options.helperText,
  }
}

export function choiceItem(options: {
  id: string
  setId: StudySetId
  sourceLabel: string
  sourceNumbers?: number[]
  prompt: string
  kind?: 'multiple_choice' | 'true_false'
  choices?: Choice[]
  correctChoiceId: string
  rationale: string
  tags: string[]
  sourceRefs: SourceRef[]
  formulaSupport: FormulaSupport
  helperText?: string
}): StudyItem {
  const kind = options.kind ?? 'multiple_choice'

  return {
    id: options.id,
    setId: options.setId,
    kind,
    sourceLabel: options.sourceLabel,
    sourceNumbers: options.sourceNumbers ?? [],
    prompt: options.prompt,
    choices: kind === 'true_false' ? trueFalseChoices : options.choices ?? [],
    answerSpec: {
      kind: 'choice',
      correctChoiceId: options.correctChoiceId,
    },
    rationale: options.rationale,
    tags: options.tags,
    sourceRefs: options.sourceRefs,
    formulaSupport: options.formulaSupport,
    helperText: options.helperText,
  }
}

export function noFormula(reason: string): FormulaSupport {
  return {
    kind: 'no_formula',
    reason,
  }
}

export function formulaRefs(formulaIds: string[]): FormulaSupport {
  return {
    kind: 'formula_refs',
    formulaIds,
  }
}

export function scalarAnswer(
  value: number,
  unitId: NumericStudyItem['answerSpec'] extends infer T ? T extends { kind: 'scalar'; unitId: infer U } ? U : never : never,
  extra: Omit<Extract<AnswerSpec, { kind: 'scalar' }>, 'kind' | 'value' | 'unitId'> = {},
): Extract<AnswerSpec, { kind: 'scalar' }> {
  return {
    kind: 'scalar',
    value,
    unitId,
    ...extra,
  }
}

export function polarAnswer(
  magnitude: number,
  unitId: Extract<AnswerSpec, { kind: 'polar' }>['unitId'],
  angle: number,
  angleUnitId: Extract<AnswerSpec, { kind: 'polar' }>['angleUnitId'],
  extra: Omit<Extract<AnswerSpec, { kind: 'polar' }>, 'kind' | 'magnitude' | 'unitId' | 'angle' | 'angleUnitId'> = {},
): Extract<AnswerSpec, { kind: 'polar' }> {
  return {
    kind: 'polar',
    magnitude,
    unitId,
    angle,
    angleUnitId,
    ...extra,
  }
}

export function rectangularAnswer(
  real: number,
  imaginary: number,
  unitId: Extract<AnswerSpec, { kind: 'rectangular' }>['unitId'],
  extra: Omit<Extract<AnswerSpec, { kind: 'rectangular' }>, 'kind' | 'real' | 'imaginary' | 'unitId'> = {},
): Extract<AnswerSpec, { kind: 'rectangular' }> {
  return {
    kind: 'rectangular',
    real,
    imaginary,
    unitId,
    ...extra,
  }
}
