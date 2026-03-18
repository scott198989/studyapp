import { startTransition, useEffect, useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { Shell } from './components/Shell'
import { figureLookup, questionBank } from './data/questionBank'
import { solverGoals } from './data/solverGoals'
import { sourceAudit } from './data/sourceAudit'
import { usePersistentAppState } from './hooks/usePersistentAppState'
import {
  buildAttemptSummary,
  buildReviewItems,
  createQuizSession,
  getDisplayedChoices,
  toggleFlagged,
} from './lib/quizEngine'
import { HomePage } from './pages/HomePage'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'
import { SolverPage } from './pages/SolverPage'
import type { Question, QuizSession, SessionMode } from './types/quiz'

const MAX_ATTEMPTS = 12

function findQuestionsById(ids: string[]) {
  const lookup = new Map(questionBank.map((question) => [question.id, question]))

  return ids
    .map((questionId) => lookup.get(questionId))
    .filter((question): question is Question => Boolean(question))
}

function HomeAside({
  auditedCaptureCount,
  canonicalCount,
  duplicateCount,
}: {
  auditedCaptureCount: number
  canonicalCount: number
  duplicateCount: number
}) {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Corpus audit</span>
        <strong>{auditedCaptureCount}</strong>
        <p>screenshots mapped</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Canonical bank</span>
        <strong>{canonicalCount}</strong>
        <p>deduped questions</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Support evidence</span>
        <strong>{duplicateCount}</strong>
        <p>duplicate or overlap captures</p>
      </div>
    </div>
  )
}

function QuizAside({ session }: { session: QuizSession }) {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Mode</span>
        <strong>{session.mode === 'retry_missed' ? 'Retry missed' : 'Full bank'}</strong>
        <p>{session.questionIds.length} questions in this run</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Flags</span>
        <strong>{session.flaggedIds.length}</strong>
        <p>marked for extra review</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Rule</span>
        <strong>Unique signature</strong>
        <p>Question order and answer order are tracked to avoid repeating prior runs.</p>
      </div>
    </div>
  )
}

function ResultsAside({
  flaggedCount,
  missedCount,
  perfectTopics,
}: {
  flaggedCount: number
  missedCount: number
  perfectTopics: string[]
}) {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Missed</span>
        <strong>{missedCount}</strong>
        <p>questions to revisit</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Flagged</span>
        <strong>{flaggedCount}</strong>
        <p>marked during the live run</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Perfect topics</span>
        <strong>{perfectTopics.length || '0'}</strong>
        <p>{perfectTopics.length ? perfectTopics.join(', ') : 'None on the latest attempt'}</p>
      </div>
    </div>
  )
}

function SolverAside() {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Solver goals</span>
        <strong>{solverGoals.length}</strong>
        <p>deterministic problem types</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Top priority</span>
        <strong>Final answer first</strong>
        <p>The quiz-ready answer stays pinned at the top in the requested output unit.</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Helper mode</span>
        <strong>Choice matching</strong>
        <p>Paste answer choices to normalize units and spotlight the closest match automatically.</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const [state, setState] = usePersistentAppState()

  const latestAttempt = state.attempts[0]
  const activeSession = state.activeSession
  const activeQuestions = activeSession ? findQuestionsById(activeSession.questionIds) : []
  const activeQuestion = activeSession ? activeQuestions[activeSession.currentIndex] : undefined
  const activeDisplayedChoices =
    activeQuestion && activeSession ? getDisplayedChoices(activeQuestion, activeSession) : []
  const latestReviewItems = latestAttempt
    ? buildReviewItems(latestAttempt.session, findQuestionsById(latestAttempt.session.questionIds))
    : []

  const perfectTopics = useMemo(
    () =>
      (latestAttempt?.summary.topicBreakdown ?? [])
        .filter((entry) => entry.total > 0 && entry.correct === entry.total)
        .map((entry) => entry.tag.replaceAll('_', ' ')),
    [latestAttempt],
  )
  const duplicateCount = sourceAudit.filter((record) => record.resolution !== 'canonical').length

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme
    document.documentElement.style.colorScheme = state.settings.theme
  }, [state.settings.theme])

  function updateSession(mutator: (session: QuizSession) => QuizSession) {
    setState((current) => ({
      ...current,
      activeSession: current.activeSession ? mutator(current.activeSession) : current.activeSession,
    }))
  }

  function toggleTheme() {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        theme: current.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }))
  }

  function beginQuiz(mode: SessionMode) {
    const retryQuestionIds = latestAttempt?.summary.missedIds ?? []

    if (mode === 'retry_missed' && retryQuestionIds.length === 0) {
      return
    }

    startTransition(() => {
      const session = createQuizSession({
        questions: questionBank,
        usedSignatures: state.usedSignatures,
        mode,
        sourceQuestionIds: mode === 'retry_missed' ? retryQuestionIds : undefined,
        shuffleChoices: state.settings.shuffleChoices,
      })

      setState((current) => ({
        ...current,
        activeSession: session,
        usedSignatures: [...current.usedSignatures, session.signature],
      }))
      navigate('/quiz')
    })
  }

  function completeQuiz() {
    if (!activeSession) {
      return
    }

    const completedSession: QuizSession = {
      ...activeSession,
      completedAt: new Date().toISOString(),
    }
    const summary = buildAttemptSummary(completedSession, activeQuestions)

    startTransition(() => {
      setState((current) => ({
        ...current,
        activeSession: null,
        attempts: [{ session: completedSession, summary }, ...current.attempts].slice(0, MAX_ATTEMPTS),
      }))
      navigate('/results')
    })
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell
            eyebrow="AC Circuits Study App"
            title="A deduped, local-first quiz built from the screenshot pool."
            subtitle="The bank is solved, rationalized, and audited. Every run uses each canonical question once, with a fresh order and preserved answer wording."
            theme={state.settings.theme}
            onToggleTheme={toggleTheme}
            aside={
              <HomeAside
                auditedCaptureCount={sourceAudit.length}
                canonicalCount={questionBank.length}
                duplicateCount={duplicateCount}
              />
            }
          >
            <HomePage
              totalQuestions={questionBank.length}
              settings={state.settings}
              hasActiveSession={Boolean(activeSession)}
              latestAttempt={latestAttempt}
              topicBreakdown={latestAttempt?.summary.topicBreakdown ?? []}
              onStartQuiz={() => beginQuiz('full')}
              onOpenSolver={() => navigate('/solver')}
              onResumeQuiz={() => navigate('/quiz')}
              onRetryMissed={() => beginQuiz('retry_missed')}
              onToggleShuffleChoices={() =>
                setState((current) => ({
                  ...current,
                  settings: {
                    ...current.settings,
                    shuffleChoices: !current.settings.shuffleChoices,
                  },
                }))
              }
            />
          </Shell>
        }
      />
      <Route
        path="/solver"
        element={
          <Shell
            eyebrow="Quiz solver"
            title="Solve the circuit, then show the answer in the exact quiz unit."
            subtitle="The solver keeps the math deterministic, converts only at the presentation layer, and makes the final test answer impossible to miss."
            theme={state.settings.theme}
            onToggleTheme={toggleTheme}
            aside={<SolverAside />}
          >
            <SolverPage onBackHome={() => navigate('/')} />
          </Shell>
        }
      />
      <Route
        path="/quiz"
        element={
          activeSession && activeQuestion ? (
            <Shell
              eyebrow={activeSession.mode === 'retry_missed' ? 'Retry missed' : 'Full-bank run'}
              title="Focused attempt mode"
              subtitle="Work straight through, flag uncertain items, and review short rationales after submission."
              theme={state.settings.theme}
              onToggleTheme={toggleTheme}
              aside={<QuizAside session={activeSession} />}
            >
              <QuizPage
                question={activeQuestion}
                questionNumber={activeSession.currentIndex + 1}
                totalQuestions={activeSession.questionIds.length}
                displayedChoices={activeDisplayedChoices}
                selectedChoiceId={activeSession.answers[activeQuestion.id]}
                isFlagged={activeSession.flaggedIds.includes(activeQuestion.id)}
                figure={activeQuestion.figureId ? figureLookup[activeQuestion.figureId] : undefined}
                answeredCount={Object.values(activeSession.answers).filter(Boolean).length}
                onSelectChoice={(choiceId) =>
                  updateSession((session) => ({
                    ...session,
                    answers: {
                      ...session.answers,
                      [activeQuestion.id]: choiceId,
                    },
                  }))
                }
                onPrevious={() =>
                  updateSession((session) => ({
                    ...session,
                    currentIndex: Math.max(0, session.currentIndex - 1),
                  }))
                }
                onNext={() =>
                  updateSession((session) => ({
                    ...session,
                    currentIndex: Math.min(session.questionIds.length - 1, session.currentIndex + 1),
                  }))
                }
                onToggleFlag={() =>
                  updateSession((session) => ({
                    ...session,
                    flaggedIds: toggleFlagged(session.flaggedIds, activeQuestion.id),
                  }))
                }
                onSubmit={completeQuiz}
              />
            </Shell>
          ) : (
            <Navigate replace to="/" />
          )
        }
      />
      <Route
        path="/results"
        element={
          latestAttempt ? (
            <Shell
              eyebrow="Latest review"
              title="Scored, filtered, and ready to study"
              subtitle="Review missed and flagged questions, keep the exact answer text, and use the rationale bank to tighten the weak spots."
              theme={state.settings.theme}
              onToggleTheme={toggleTheme}
              aside={
                <ResultsAside
                  flaggedCount={latestAttempt.session.flaggedIds.length}
                  missedCount={latestAttempt.summary.missedIds.length}
                  perfectTopics={perfectTopics}
                />
              }
            >
              <ResultsPage
                reviewItems={latestReviewItems}
                score={latestAttempt.summary.score}
                percent={latestAttempt.summary.percent}
                flaggedIds={latestAttempt.session.flaggedIds}
                figureLookup={figureLookup}
                onStartNewQuiz={() => beginQuiz('full')}
                onRetryMissed={() => beginQuiz('retry_missed')}
                canRetryMissed={latestAttempt.summary.missedIds.length > 0}
              />
            </Shell>
          ) : (
            <Navigate replace to="/" />
          )
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}

export default App
