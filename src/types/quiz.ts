export type QuestionKind = 'multiple_choice' | 'true_false'
export type SessionMode = 'full' | 'retry_missed'
export type ThemeMode = 'light' | 'dark'
export type SourceRole = 'primary' | 'duplicate' | 'overlap' | 'clarification'
export type SourceResolution =
  | 'canonical'
  | 'duplicate_capture'
  | 'overlap'
  | 'support_capture'

export interface SourceRef {
  filename: string
  screenshotQuestionNumber: number
  role: SourceRole
  notes?: string
}

export interface SourceAuditRecord {
  fileName: string
  resolution: SourceResolution
  questionIds: string[]
  note: string
}

export interface Choice {
  id: string
  text: string
}

export interface Question {
  id: string
  sourceNumbers: number[]
  prompt: string
  kind: QuestionKind
  choices: Choice[]
  correctChoiceId: string
  rationale: string
  tags: string[]
  figureId?: string
  sourceRefs: SourceRef[]
}

export interface FigureAsset {
  id: string
  label: string
  src: string
  alt: string
  caption: string
}

export interface QuizSettings {
  shuffleChoices: boolean
  theme: ThemeMode
}

export interface QuizSession {
  sessionId: string
  mode: SessionMode
  questionIds: string[]
  choiceOrderByQuestion: Record<string, string[]>
  answers: Record<string, string>
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
  mode: SessionMode
  score: number
  percent: number
  missedIds: string[]
  completedAt: string
  topicBreakdown: TopicBreakdownEntry[]
  signature: string
  questionIds: string[]
}

export interface AttemptRecord {
  session: QuizSession
  summary: AttemptSummary
}

export interface PersistedAppState {
  version: 1
  settings: QuizSettings
  activeSession: QuizSession | null
  attempts: AttemptRecord[]
  usedSignatures: string[]
}

export interface ReviewItem {
  question: Question
  displayedChoices: Choice[]
  selectedChoiceId?: string
  isCorrect: boolean
}
