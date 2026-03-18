import type {
  AttemptSummary,
  Choice,
  Question,
  QuizSession,
  ReviewItem,
  SessionMode,
  TopicBreakdownEntry,
} from '../types/quiz'

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

export function createSignature(questionIds: string[], choiceOrderByQuestion: Record<string, string[]>) {
  const order = questionIds.join('>')
  const choices = questionIds
    .map((questionId) => `${questionId}:${choiceOrderByQuestion[questionId].join(',')}`)
    .join('|')

  return `${order}::${choices}`
}

export function createQuizSession({
  questions,
  usedSignatures,
  mode,
  sourceQuestionIds,
  shuffleChoices,
  random = Math.random,
}: {
  questions: Question[]
  usedSignatures: string[]
  mode: SessionMode
  sourceQuestionIds?: string[]
  shuffleChoices: boolean
  random?: () => number
}): QuizSession {
  const questionLookup = new Map(questions.map((question) => [question.id, question]))
  const candidateIds = sourceQuestionIds ?? questions.map((question) => question.id)

  if (!candidateIds.length) {
    throw new Error('Cannot build a quiz session with zero questions.')
  }

  for (let attempt = 0; attempt < MAX_SIGNATURE_ATTEMPTS; attempt += 1) {
    const questionIds = shuffleValues(candidateIds, random)
    const choiceOrderByQuestion: Record<string, string[]> = {}

    for (const questionId of questionIds) {
      const question = questionLookup.get(questionId)
      if (!question) {
        throw new Error(`Question ${questionId} is not present in the current bank.`)
      }

      const orderedChoiceIds = question.choices.map((choice) => choice.id)
      choiceOrderByQuestion[questionId] = shuffleChoices
        ? shuffleValues(orderedChoiceIds, random)
        : orderedChoiceIds
    }

    const signature = createSignature(questionIds, choiceOrderByQuestion)

    if (!usedSignatures.includes(signature)) {
      return {
        sessionId: createSessionId(),
        mode,
        questionIds,
        choiceOrderByQuestion,
        answers: {} as Record<string, string>,
        flaggedIds: [],
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        signature,
      }
    }
  }

  throw new Error('Unable to generate a unique quiz signature after repeated attempts.')
}

export function getDisplayedChoices(question: Question, session: QuizSession) {
  const order = session.choiceOrderByQuestion[question.id]
  const choiceLookup = new Map(question.choices.map((choice) => [choice.id, choice]))

  return order.map((choiceId) => {
    const choice = choiceLookup.get(choiceId)
    if (!choice) {
      throw new Error(`Missing choice ${choiceId} for question ${question.id}.`)
    }

    return choice
  })
}

export function toggleFlagged(flaggedIds: string[], questionId: string) {
  return flaggedIds.includes(questionId)
    ? flaggedIds.filter((item) => item !== questionId)
    : [...flaggedIds, questionId]
}

export function buildTopicBreakdown(questions: Question[], answers: Record<string, string>) {
  const aggregate = new Map<string, TopicBreakdownEntry>()

  for (const question of questions) {
    for (const tag of question.tags) {
      const current = aggregate.get(tag) ?? { tag, correct: 0, total: 0 }
      current.total += 1
      if (answers[question.id] === question.correctChoiceId) {
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

export function buildAttemptSummary(session: QuizSession, questions: Question[]): AttemptSummary {
  const score = questions.filter((question) => session.answers[question.id] === question.correctChoiceId).length
  const missedIds = questions
    .filter((question) => session.answers[question.id] !== question.correctChoiceId)
    .map((question) => question.id)

  return {
    sessionId: session.sessionId,
    mode: session.mode,
    score,
    percent: Math.round((score / questions.length) * 100),
    missedIds,
    completedAt: session.completedAt ?? new Date().toISOString(),
    topicBreakdown: buildTopicBreakdown(questions, session.answers),
    signature: session.signature,
    questionIds: session.questionIds,
  }
}

export function buildReviewItems(session: QuizSession, questions: Question[]): ReviewItem[] {
  return questions.map((question) => ({
    question,
    displayedChoices: getDisplayedChoices(question, session),
    selectedChoiceId: session.answers[question.id],
    isCorrect: session.answers[question.id] === question.correctChoiceId,
  }))
}

export function getChoiceLabel(index: number) {
  return String.fromCharCode(65 + index)
}

export function findChoiceById(question: Question, choiceId?: string): Choice | undefined {
  if (!choiceId) {
    return undefined
  }

  return question.choices.find((choice) => choice.id === choiceId)
}
