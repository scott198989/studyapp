import type { SolverGoalId, SolverUnitId } from './solver'

export type ThemeMode = 'light' | 'dark'
export type SessionMode = 'full' | 'retry_missed'
export type StudySetId = 'quiz_15_16' | 'quiz_17' | 'hw_15' | 'hw_16' | 'hw_17'
export type StudySetCategory = 'quiz' | 'homework'
export type StudyItemKind = 'multiple_choice' | 'true_false' | 'numeric' | 'manual_check'
export type SourceRole = 'primary' | 'duplicate' | 'overlap' | 'clarification'
export type SourceResolution =
  | 'canonical'
  | 'duplicate_capture'
  | 'overlap'
  | 'support_capture'

export interface SourceRef {
  filename: string
  screenshotQuestionNumber?: number
  role: SourceRole
  notes?: string
}

export interface SourceAuditRecord {
  fileName: string
  studySetId: StudySetId
  resolution: SourceResolution
  itemIds: string[]
  note: string
}

export interface Choice {
  id: string
  text: string
}

export interface FormulaVariable {
  symbol: string
  meaning: string
}

export interface FormulaCard {
  id: string
  title: string
  expressions: string[]
  variables: FormulaVariable[]
  solverGoalId?: SolverGoalId
  notes?: string[]
  checkSteps?: string[]
}

export type FormulaSupport =
  | {
      kind: 'formula_refs'
      formulaIds: string[]
    }
  | {
      kind: 'no_formula'
      reason: string
    }

export interface ChoiceAnswerSpec {
  kind: 'choice'
  correctChoiceId: string
}

export interface ScalarAnswerSpec {
  kind: 'scalar'
  value: number
  unitId: SolverUnitId
  toleranceRatio?: number
  requiredKeywords?: string[]
}

export interface PolarAnswerSpec {
  kind: 'polar'
  magnitude: number
  unitId: SolverUnitId
  angle: number
  angleUnitId: SolverUnitId
  magnitudeToleranceRatio?: number
  angleToleranceDegrees?: number
  requiredKeywords?: string[]
}

export interface RectangularAnswerSpec {
  kind: 'rectangular'
  real: number
  imaginary: number
  unitId: SolverUnitId
  toleranceRatio?: number
  requiredKeywords?: string[]
}

export interface ManualCheckAnswerSpec {
  kind: 'manual-check'
  checklist: string[]
}

export type AnswerSpec =
  | ChoiceAnswerSpec
  | ScalarAnswerSpec
  | PolarAnswerSpec
  | RectangularAnswerSpec
  | ManualCheckAnswerSpec

interface BaseStudyItem {
  id: string
  setId: StudySetId
  kind: StudyItemKind
  sourceLabel: string
  sourceNumbers: number[]
  prompt: string
  rationale: string
  tags: string[]
  sourceRefs: SourceRef[]
  formulaSupport: FormulaSupport
  helperText?: string
  figureId?: string
}

export interface ChoiceStudyItem extends BaseStudyItem {
  kind: 'multiple_choice' | 'true_false'
  choices: Choice[]
  answerSpec: ChoiceAnswerSpec
}

export interface NumericStudyItem extends BaseStudyItem {
  kind: 'numeric'
  inputLabel: string
  placeholder?: string
  answerSpec: ScalarAnswerSpec | PolarAnswerSpec | RectangularAnswerSpec
}

export interface ManualCheckStudyItem extends BaseStudyItem {
  kind: 'manual_check'
  answerSpec: ManualCheckAnswerSpec
  workedSolution?: string[]
}

export type StudyItem = ChoiceStudyItem | NumericStudyItem | ManualCheckStudyItem

export interface FigureAsset {
  id: string
  label: string
  src: string
  alt: string
  caption: string
}

export interface StudySet {
  id: StudySetId
  category: StudySetCategory
  title: string
  shortTitle: string
  chapters: string[]
  description: string
  itemIds: string[]
  answerMix: AnswerSpec['kind'][]
}

export interface QuizSettings {
  shuffleChoices: boolean
  theme: ThemeMode
}

export interface ChoiceResponse {
  kind: 'choice'
  value: string
}

export interface TextResponse {
  kind: 'text'
  value: string
}

export interface ManualResponse {
  kind: 'manual'
  completed: boolean
  notes: string
}

export type StudyItemResponse = ChoiceResponse | TextResponse | ManualResponse

export interface StudySession {
  sessionId: string
  setId: StudySetId
  mode: SessionMode
  itemIds: string[]
  choiceOrderByItem: Record<string, string[]>
  responses: Record<string, StudyItemResponse>
  submittedItemIds?: string[]
  flaggedIds: string[]
  currentIndex: number
  startedAt: string
  completedAt?: string
  signature: string
}

export interface TopicBreakdownEntry {
  tag: string
  correct: number
  total: number
}

export interface AttemptSummary {
  sessionId: string
  setId: StudySetId
  mode: SessionMode
  score: number
  percent: number
  gradableCount: number
  manualTotal: number
  manualCompleted: number
  missedIds: string[]
  completedAt: string
  topicBreakdown: TopicBreakdownEntry[]
  signature: string
  itemIds: string[]
}

export interface AttemptRecord {
  session: StudySession
  summary: AttemptSummary
}

export interface PersistedAppState {
  version: 2
  settings: QuizSettings
  activeSession: StudySession | null
  attempts: AttemptRecord[]
  usedSignatures: string[]
}

export type ReviewStatus = 'correct' | 'incorrect' | 'unanswered' | 'manual_complete' | 'manual_pending'

export interface ReviewEvaluation {
  status: ReviewStatus
  isGradable: boolean
  isCorrect: boolean
  isAnswered: boolean
  feedback: string
  expectedAnswer?: string
  actualAnswer?: string
}

export interface ReviewItem {
  item: StudyItem
  displayedChoices: Choice[]
  response?: StudyItemResponse
  evaluation: ReviewEvaluation
}
