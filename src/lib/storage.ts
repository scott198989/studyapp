import type {
  AttemptRecord,
  PersistedAppState,
  StudyItemResponse,
  StudySession,
  QuizSettings,
  ThemeMode,
} from '../types/study'

const STORAGE_KEY = 'ac-study-lab-state'
const STORAGE_VERSION = 2

export const defaultSettings: QuizSettings = {
  shuffleChoices: true,
  theme: 'light',
}

export const defaultAppState: PersistedAppState = {
  version: STORAGE_VERSION,
  settings: defaultSettings,
  activeSession: null,
  attempts: [],
  usedSignatures: [],
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function isStudyItemResponse(value: unknown): value is StudyItemResponse {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    return false
  }

  switch (value.kind) {
    case 'choice':
    case 'text':
      return typeof value.value === 'string'
    case 'manual':
      return typeof value.completed === 'boolean' && typeof value.notes === 'string'
    default:
      return false
  }
}

function isResponseRecord(value: unknown): value is Record<string, StudyItemResponse> {
  return isRecord(value) && Object.values(value).every((item) => isStudyItemResponse(item))
}

function isStudySession(value: unknown): value is StudySession {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.sessionId === 'string' &&
    typeof value.setId === 'string' &&
    (value.mode === 'full' || value.mode === 'retry_missed') &&
    isStringArray(value.itemIds) &&
    isRecord(value.choiceOrderByItem) &&
    isResponseRecord(value.responses) &&
    (!('submittedItemIds' in value) || value.submittedItemIds === undefined || isStringArray(value.submittedItemIds)) &&
    isStringArray(value.flaggedIds) &&
    typeof value.currentIndex === 'number' &&
    typeof value.startedAt === 'string' &&
    typeof value.signature === 'string'
  )
}

function isAttemptRecord(value: unknown): value is AttemptRecord {
  if (!isRecord(value) || !isStudySession(value.session) || !isRecord(value.summary)) {
    return false
  }

  const summary = value.summary
  return (
    typeof summary.sessionId === 'string' &&
    typeof summary.setId === 'string' &&
    (summary.mode === 'full' || summary.mode === 'retry_missed') &&
    typeof summary.score === 'number' &&
    typeof summary.percent === 'number' &&
    typeof summary.gradableCount === 'number' &&
    typeof summary.manualTotal === 'number' &&
    typeof summary.manualCompleted === 'number' &&
    isStringArray(summary.missedIds) &&
    typeof summary.completedAt === 'string' &&
    isStringArray(summary.itemIds) &&
    typeof summary.signature === 'string' &&
    Array.isArray(summary.topicBreakdown)
  )
}

function migrateVersionOne(parsed: Record<string, unknown>): PersistedAppState {
  const settings = isRecord(parsed.settings)
    ? {
        shuffleChoices:
          typeof parsed.settings.shuffleChoices === 'boolean'
            ? parsed.settings.shuffleChoices
            : defaultSettings.shuffleChoices,
        theme: isThemeMode(parsed.settings.theme) ? parsed.settings.theme : defaultSettings.theme,
      }
    : defaultSettings

  return {
    ...defaultAppState,
    settings,
  }
}

export function loadAppState(): PersistedAppState {
  if (typeof window === 'undefined') {
    return defaultAppState
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return defaultAppState
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    if (parsed.version === 1) {
      return migrateVersionOne(parsed)
    }

    if (
      parsed.version !== STORAGE_VERSION ||
      !isRecord(parsed.settings) ||
      typeof parsed.settings.shuffleChoices !== 'boolean' ||
      (!parsed.activeSession && parsed.activeSession !== null) ||
      !Array.isArray(parsed.attempts) ||
      !isStringArray(parsed.usedSignatures)
    ) {
      return defaultAppState
    }

    if (parsed.activeSession !== null && !isStudySession(parsed.activeSession)) {
      return defaultAppState
    }

    if (!parsed.attempts.every((attempt) => isAttemptRecord(attempt))) {
      return defaultAppState
    }

    return {
      version: STORAGE_VERSION,
      settings: {
        shuffleChoices: parsed.settings.shuffleChoices,
        theme: isThemeMode(parsed.settings.theme) ? parsed.settings.theme : defaultSettings.theme,
      },
      activeSession: parsed.activeSession,
      attempts: parsed.attempts,
      usedSignatures: parsed.usedSignatures,
    }
  } catch {
    return defaultAppState
  }
}

export function saveAppState(state: PersistedAppState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
