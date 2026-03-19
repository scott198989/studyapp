import { startTransition, useEffect, useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { Shell } from './components/Shell'
import { formulaCatalog } from './data/formulaCatalog'
import { solverGoals } from './data/solverGoals'
import {
  figureLookup,
  studyFormulaLookup,
  studyItemLookup,
  studyItems,
  studySetLookup,
  studySets,
} from './data/studyContent'
import { studyLibraryAssets, studyLibraryStats } from './data/studyLibrary.generated'
import { studySourceAudit } from './data/studySourceAudit'
import { usePersistentAppState } from './hooks/usePersistentAppState'
import { evaluateStudyItemResponse } from './lib/answerEvaluation'
import {
  buildAttemptSummary,
  buildReviewItems,
  createQuizSession,
  getDisplayedChoices,
  toggleFlagged,
} from './lib/quizEngine'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { QuizPage } from './pages/QuizPage'
import { ResultsPage } from './pages/ResultsPage'
import { SolverPage } from './pages/SolverPage'
import type { StudyItem, StudyItemResponse, StudySession, StudySetId } from './types/study'

const MAX_ATTEMPTS = 20

function findItemsById(ids: string[]) {
  return ids
    .map((itemId) => studyItemLookup[itemId])
    .filter((item): item is StudyItem => Boolean(item))
}

function hasMeaningfulResponse(response?: StudyItemResponse) {
  if (!response) {
    return false
  }

  switch (response.kind) {
    case 'choice':
      return Boolean(response.value)
    case 'text':
      return Boolean(response.value.trim())
    case 'manual':
      return response.completed || Boolean(response.notes.trim())
  }
}

function HomeAside() {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Surfaced sets</span>
        <strong>{studySets.length}</strong>
        <p>canonical study entry points</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Surfaced items</span>
        <strong>{studyItems.length}</strong>
        <p>deduped quiz and homework items</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Formula cards</span>
        <strong>{formulaCatalog.length}</strong>
        <p>structured review formulas and solver links</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Audited sources</span>
        <strong>{studySourceAudit.length}</strong>
        <p>captures and homework docs mapped into surfaced content</p>
      </div>
    </div>
  )
}

function QuizAside({ session }: { session: StudySession }) {
  const set = studySetLookup[session.setId]
  const submittedCount = session.submittedItemIds?.length ?? 0

  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Study set</span>
        <strong>{set.title}</strong>
        <p>
          {session.mode === 'retry_missed' ? 'Retry missed' : 'Full run'} with {session.itemIds.length} items
        </p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Flags</span>
        <strong>{session.flaggedIds.length}</strong>
        <p>marked for review during the live attempt</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Checked</span>
        <strong>
          {submittedCount}/{session.itemIds.length}
        </strong>
        <p>items already graded live inside the run</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Reveal rule</span>
        <strong>Instant grading</strong>
        <p>Correct or incorrect shows after submit, while formulas stay hidden until review.</p>
      </div>
    </div>
  )
}

function ResultsAside({
  missedCount,
  manualCompleted,
  manualTotal,
}: {
  missedCount: number
  manualCompleted: number
  manualTotal: number
}) {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Missed</span>
        <strong>{missedCount}</strong>
        <p>gradable items to retry</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Manual checks</span>
        <strong>
          {manualCompleted}/{manualTotal}
        </strong>
        <p>self-check homework or OCR-guarded items completed</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Formula cards</span>
        <strong>Review ready</strong>
        <p>Each item now shows formulas, rationale, and solver links when supported.</p>
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
        <p>deterministic problem types with formula paths</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Coverage</span>
        <strong>Quiz + homework</strong>
        <p>The solver now supports the reusable formulas surfaced in review.</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Answer helper</span>
        <strong>Choice matching</strong>
        <p>Paste answer choices to compare units and highlight the closest match.</p>
      </div>
    </div>
  )
}

function LibraryAside() {
  return (
    <div className="aside-stack">
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Unique assets</span>
        <strong>{studyLibraryStats.uniqueFiles}</strong>
        <p>
          {studyLibraryStats.documentCount} documents and {studyLibraryStats.screenshotCount} screenshots
        </p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Exact dedupe</span>
        <strong>{studyLibraryStats.exactDuplicateFilesRemoved}</strong>
        <p>byte-identical files removed during import</p>
      </div>
      <div className="aside-panel">
        <span className="aside-panel__eyebrow">Canonical UI</span>
        <strong>One surfaced copy</strong>
        <p>Raw screenshots stay in the repo, but the home screen now surfaces only the canonical study sets.</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  const navigate = useNavigate()
  const [state, setState] = usePersistentAppState()

  const latestAttempt = state.attempts[0]
  const latestAttemptBySet = useMemo(
    () =>
      Object.fromEntries(
        studySets
          .map((set) => [set.id, state.attempts.find((attempt) => attempt.summary.setId === set.id)])
          .filter((entry) => Boolean(entry[1])),
      ) as Partial<Record<StudySetId, (typeof state.attempts)[number]>>,
    [state],
  )

  const activeSession = state.activeSession
  const activeItems = activeSession ? findItemsById(activeSession.itemIds) : []
  const activeItem = activeSession ? activeItems[activeSession.currentIndex] : undefined
  const activeSubmittedItemIds = activeSession?.submittedItemIds ?? []
  const activeItemIsSubmitted = Boolean(activeItem && activeSubmittedItemIds.includes(activeItem.id))
  const activeDisplayedChoices =
    activeItem && activeSession ? getDisplayedChoices(activeItem, activeSession) : []
  const activeEvaluation =
    activeItem && activeItemIsSubmitted && activeSession
      ? evaluateStudyItemResponse(activeItem, activeSession.responses[activeItem.id])
      : undefined
  const latestReviewItems = latestAttempt
    ? buildReviewItems(latestAttempt.session, findItemsById(latestAttempt.session.itemIds))
    : []

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme
    document.documentElement.style.colorScheme = state.settings.theme
  }, [state.settings.theme])

  function updateSession(mutator: (session: StudySession) => StudySession) {
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

  function beginSet(setId: StudySetId, mode: 'full' | 'retry_missed' = 'full') {
    const set = studySetLookup[setId]
    const latestSetAttempt = latestAttemptBySet[setId]
    const retryItemIds = latestSetAttempt?.summary.missedIds ?? []

    if (mode === 'retry_missed' && retryItemIds.length === 0) {
      return
    }

    startTransition(() => {
      const session = createQuizSession({
        items: findItemsById(set.itemIds),
        usedSignatures: state.usedSignatures,
        setId,
        mode,
        sourceItemIds: mode === 'retry_missed' ? retryItemIds : undefined,
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

    const completedSession: StudySession = {
      ...activeSession,
      completedAt: new Date().toISOString(),
    }
    const summary = buildAttemptSummary(completedSession, activeItems)

    startTransition(() => {
      setState((current) => ({
        ...current,
        activeSession: null,
        attempts: [{ session: completedSession, summary }, ...current.attempts].slice(0, MAX_ATTEMPTS),
      }))
      navigate('/results')
    })
  }

  function submitActiveItem() {
    if (!activeSession || !activeItem) {
      return
    }

    const response = activeSession.responses[activeItem.id]
    if (!hasMeaningfulResponse(response)) {
      return
    }

    updateSession((session) => {
      const submittedItemIds = session.submittedItemIds ?? []
      if (submittedItemIds.includes(activeItem.id)) {
        return session
      }

      return {
        ...session,
        submittedItemIds: [...submittedItemIds, activeItem.id],
      }
    })
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Shell
            eyebrow="AC Circuits Study App"
            title="Canonical study sets, cleaner flow, and formula-backed review."
            subtitle="The app now surfaces one combined Chapters 15-16 quiz, one Chapter 17 quiz, and three chapter-specific homework sets with formula cards, solver links, and hybrid grading."
            theme={state.settings.theme}
            onToggleTheme={toggleTheme}
            aside={<HomeAside />}
          >
            <HomePage
              settings={state.settings}
              studySets={studySets}
              latestAttemptBySet={latestAttemptBySet}
              hasActiveSession={Boolean(activeSession)}
              activeSessionSetId={activeSession?.setId}
              onStartSet={(setId) => beginSet(setId, 'full')}
              onOpenSolver={() => navigate('/solver')}
              onOpenLibrary={() => navigate('/library')}
              onResumeQuiz={() => navigate('/quiz')}
              onRetrySet={(setId) => beginSet(setId, 'retry_missed')}
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
        path="/library"
        element={
          <Shell
            eyebrow="Study library"
            title="Homework files and screenshots, deduped and tracked."
            subtitle="Raw captures stay available for audit, but the main app experience now points at the canonical study sets and one surfaced copy of each item."
            theme={state.settings.theme}
            onToggleTheme={toggleTheme}
            aside={<LibraryAside />}
          >
            <LibraryPage
              assets={studyLibraryAssets}
              stats={studyLibraryStats}
              onBackHome={() => navigate('/')}
              onOpenSolver={() => navigate('/solver')}
              onStartQuiz={() => beginSet('quiz_15_16', 'full')}
            />
          </Shell>
        }
      />
      <Route
        path="/solver"
        element={
          <Shell
            eyebrow="Formula solver"
            title="Solve the circuit, then show the answer in the exact quiz unit."
            subtitle="The solver now backs the surfaced formula cards in review and can be opened directly from supported quiz or homework items."
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
          activeSession && activeItem ? (
            <Shell
              eyebrow={activeSession.mode === 'retry_missed' ? 'Retry missed' : 'Study set run'}
              title={studySetLookup[activeSession.setId].title}
              subtitle="Work through the set, flag anything uncertain, and reveal the formula cards only after you submit."
              theme={state.settings.theme}
              onToggleTheme={toggleTheme}
              aside={<QuizAside session={activeSession} />}
            >
              <QuizPage
                item={activeItem}
                itemNumber={activeSession.currentIndex + 1}
                totalItems={activeSession.itemIds.length}
                displayedChoices={activeDisplayedChoices}
                response={activeSession.responses[activeItem.id]}
                isSubmitted={activeItemIsSubmitted}
                liveEvaluation={activeEvaluation}
                isFlagged={activeSession.flaggedIds.includes(activeItem.id)}
                figure={activeItem.figureId ? figureLookup[activeItem.figureId] : undefined}
                answeredCount={Object.values(activeSession.responses).filter((response) => hasMeaningfulResponse(response)).length}
                onSelectChoice={(choiceId) =>
                  updateSession((session) => ({
                    ...session,
                    responses: {
                      ...session.responses,
                      [activeItem.id]: {
                        kind: 'choice',
                        value: choiceId,
                      },
                    },
                    submittedItemIds: (session.submittedItemIds ?? []).filter((itemId) => itemId !== activeItem.id),
                  }))
                }
                onChangeText={(value) =>
                  updateSession((session) => ({
                    ...session,
                    responses: {
                      ...session.responses,
                      [activeItem.id]: {
                        kind: 'text',
                        value,
                      },
                    },
                    submittedItemIds: (session.submittedItemIds ?? []).filter((itemId) => itemId !== activeItem.id),
                  }))
                }
                onChangeManual={(response) =>
                  updateSession((session) => ({
                    ...session,
                    responses: {
                      ...session.responses,
                      [activeItem.id]: response,
                    },
                    submittedItemIds: (session.submittedItemIds ?? []).filter((itemId) => itemId !== activeItem.id),
                  }))
                }
                onSubmitAnswer={submitActiveItem}
                onPrevious={() =>
                  updateSession((session) => ({
                    ...session,
                    currentIndex: Math.max(0, session.currentIndex - 1),
                  }))
                }
                onNext={() =>
                  updateSession((session) => ({
                    ...session,
                    currentIndex: Math.min(session.itemIds.length - 1, session.currentIndex + 1),
                  }))
                }
                onToggleFlag={() =>
                  updateSession((session) => ({
                    ...session,
                    flaggedIds: toggleFlagged(session.flaggedIds, activeItem.id),
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
              title={studySetLookup[latestAttempt.summary.setId].title}
              subtitle="Review the keyed answer, surface the formula card, and open the solver directly from any supported item."
              theme={state.settings.theme}
              onToggleTheme={toggleTheme}
              aside={
                <ResultsAside
                  missedCount={latestAttempt.summary.missedIds.length}
                  manualCompleted={latestAttempt.summary.manualCompleted}
                  manualTotal={latestAttempt.summary.manualTotal}
                />
              }
            >
              <ResultsPage
                reviewItems={latestReviewItems}
                score={latestAttempt.summary.score}
                percent={latestAttempt.summary.percent}
                gradableCount={latestAttempt.summary.gradableCount}
                manualCompleted={latestAttempt.summary.manualCompleted}
                manualTotal={latestAttempt.summary.manualTotal}
                flaggedIds={latestAttempt.session.flaggedIds}
                figureLookup={figureLookup}
                formulaLookup={studyFormulaLookup}
                setTitle={studySetLookup[latestAttempt.summary.setId].title}
                onStartNewSet={() => beginSet(latestAttempt.summary.setId, 'full')}
                onRetryMissed={() => beginSet(latestAttempt.summary.setId, 'retry_missed')}
                canRetryMissed={latestAttempt.summary.missedIds.length > 0}
                onOpenSolver={(goalId) => navigate(goalId ? `/solver?goal=${goalId}` : '/solver')}
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
