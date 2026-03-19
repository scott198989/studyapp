import { evaluateStudyItemResponse } from './answerEvaluation'
import type {
  AttemptSummary,
  Choice,
  ChoiceStudyItem,
  ReviewItem,
  SessionMode,
  StudyItem,
  StudyItemResponse,
  StudySession,
  TopicBreakdownEntry,
} from '../types/study'

const MAX_SIGNATURE_ATTEMPTS = 100

function randomIndex(max: number, random: () => number = Math.random) {
  return Math.floor(random() * max)
}

function shuffleValues<T>(items: readonly T[], random: () => number = Math.random) {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, random)
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }

  return copy
}

function createSessionId() {
  return crypto.randomUUID()
}

function hasChoices(item: StudyItem): item is ChoiceStudyItem {
  return item.kind === 'multiple_choice' || item.kind === 'true_false'
}

export function createSignature(itemIds: string[], choiceOrderByItem: Record<string, string[]>) {
  const order = itemIds.join('>')
  const choices = itemIds
    .map((itemId) => `${itemId}:${(choiceOrderByItem[itemId] ?? []).join(',')}`)
    .join('|')

  return `${order}::${choices}`
}

export function createQuizSession({
  items,
  usedSignatures,
  setId,
  mode,
  sourceItemIds,
  shuffleChoices,
  random = Math.random,
}: {
  items: StudyItem[]
  usedSignatures: string[]
  setId: StudySession['setId']
  mode: SessionMode
  sourceItemIds?: string[]
  shuffleChoices: boolean
  random?: () => number
}): StudySession {
  const itemLookup = new Map(items.map((item) => [item.id, item]))
  const candidateIds = sourceItemIds ?? items.map((item) => item.id)

  if (!candidateIds.length) {
    throw new Error('Cannot build a study session with zero items.')
  }

  for (let attempt = 0; attempt < MAX_SIGNATURE_ATTEMPTS; attempt += 1) {
    const itemIds = shuffleValues(candidateIds, random)
    const choiceOrderByItem: Record<string, string[]> = {}

    for (const itemId of itemIds) {
      const item = itemLookup.get(itemId)
      if (!item) {
        throw new Error(`Item ${itemId} is not present in the current set.`)
      }

      if (!hasChoices(item)) {
        choiceOrderByItem[itemId] = []
        continue
      }

      const orderedChoiceIds = item.choices.map((choice) => choice.id)
      choiceOrderByItem[itemId] = shuffleChoices
        ? shuffleValues(orderedChoiceIds, random)
        : orderedChoiceIds
    }

    const signature = `${setId}::${createSignature(itemIds, choiceOrderByItem)}`

    if (!usedSignatures.includes(signature)) {
      return {
        sessionId: createSessionId(),
        setId,
        mode,
        itemIds,
        choiceOrderByItem,
        responses: {},
        submittedItemIds: [],
        flaggedIds: [],
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        signature,
      }
    }
  }

  throw new Error('Unable to generate a unique study-session signature after repeated attempts.')
}

export function getDisplayedChoices(item: StudyItem, session: StudySession) {
  if (!hasChoices(item)) {
    return []
  }

  const order = session.choiceOrderByItem[item.id] ?? item.choices.map((choice) => choice.id)
  const choiceLookup = new Map(item.choices.map((choice) => [choice.id, choice]))

  return order.map((choiceId) => {
    const choice = choiceLookup.get(choiceId)
    if (!choice) {
      throw new Error(`Missing choice ${choiceId} for item ${item.id}.`)
    }

    return choice
  })
}

export function toggleFlagged(flaggedIds: string[], itemId: string) {
  return flaggedIds.includes(itemId)
    ? flaggedIds.filter((candidate) => candidate !== itemId)
    : [...flaggedIds, itemId]
}

export function buildTopicBreakdown(items: StudyItem[], responses: Record<string, StudyItemResponse>) {
  const aggregate = new Map<string, TopicBreakdownEntry>()

  for (const item of items) {
    const evaluation = evaluateStudyItemResponse(item, responses[item.id])
    if (!evaluation.isGradable) {
      continue
    }

    for (const tag of item.tags) {
      const current = aggregate.get(tag) ?? { tag, correct: 0, total: 0 }
      current.total += 1
      if (evaluation.isCorrect) {
        current.correct += 1
      }
      aggregate.set(tag, current)
    }
  }

  return [...aggregate.values()].sort((left, right) => {
    const leftAccuracy = left.total === 0 ? 0 : left.correct / left.total
    const rightAccuracy = right.total === 0 ? 0 : right.correct / right.total

    return leftAccuracy - rightAccuracy || left.tag.localeCompare(right.tag)
  })
}

export function buildAttemptSummary(session: StudySession, items: StudyItem[]): AttemptSummary {
  const evaluations = items.map((item) => ({
    item,
    evaluation: evaluateStudyItemResponse(item, session.responses[item.id]),
  }))
  const gradableItems = evaluations.filter(({ evaluation }) => evaluation.isGradable)
  const manualItems = evaluations.filter(({ evaluation }) => !evaluation.isGradable)
  const score = gradableItems.filter(({ evaluation }) => evaluation.isCorrect).length
  const missedIds = gradableItems
    .filter(({ evaluation }) => evaluation.status !== 'correct')
    .map(({ item }) => item.id)

  return {
    sessionId: session.sessionId,
    setId: session.setId,
    mode: session.mode,
    score,
    percent: gradableItems.length ? Math.round((score / gradableItems.length) * 100) : 100,
    gradableCount: gradableItems.length,
    manualTotal: manualItems.length,
    manualCompleted: manualItems.filter(({ evaluation }) => evaluation.status === 'manual_complete').length,
    missedIds,
    completedAt: session.completedAt ?? new Date().toISOString(),
    topicBreakdown: buildTopicBreakdown(items, session.responses),
    signature: session.signature,
    itemIds: session.itemIds,
  }
}

export function buildReviewItems(session: StudySession, items: StudyItem[]): ReviewItem[] {
  return items.map((item) => ({
    item,
    displayedChoices: getDisplayedChoices(item, session),
    response: session.responses[item.id],
    evaluation: evaluateStudyItemResponse(item, session.responses[item.id]),
  }))
}

export function getChoiceLabel(index: number) {
  return String.fromCharCode(65 + index)
}

export function findChoiceById(item: StudyItem, choiceId?: string): Choice | undefined {
  if (!choiceId || !hasChoices(item)) {
    return undefined
  }

  return item.choices.find((choice) => choice.id === choiceId)
}
