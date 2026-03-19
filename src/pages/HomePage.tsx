import type { AttemptRecord, QuizSettings, StudySet, StudySetId } from '../types/study'

interface HomePageProps {
  settings: QuizSettings
  studySets: StudySet[]
  latestAttemptBySet: Partial<Record<StudySetId, AttemptRecord>>
  hasActiveSession: boolean
  activeSessionSetId?: StudySetId
  onStartSet: (setId: StudySetId) => void
  onOpenSolver: () => void
  onOpenLibrary: () => void
  onResumeQuiz: () => void
  onRetrySet: (setId: StudySetId) => void
  onToggleShuffleChoices: () => void
}

function formatDate(value?: string) {
  if (!value) {
    return 'No attempts yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function HomePage({
  settings,
  studySets,
  latestAttemptBySet,
  hasActiveSession,
  activeSessionSetId,
  onStartSet,
  onOpenSolver,
  onOpenLibrary,
  onResumeQuiz,
  onRetrySet,
  onToggleShuffleChoices,
}: HomePageProps) {
  return (
    <div className="home-layout">
      <section className="panel-stack">
        <div className="panel-section">
          <h2>Study flow</h2>
          <p className="muted-copy">
            The app is now organized around five surfaced study sets: one combined Chapters 15-16 quiz,
            one separate Chapter 17 quiz, and three chapter-specific homework sets.
          </p>
        </div>

        <div className="action-grid">
          <button type="button" className="secondary-action" onClick={onOpenSolver}>
            Open quiz solver
          </button>
          <button type="button" className="secondary-action" onClick={onOpenLibrary}>
            Open study library
          </button>
          <button type="button" className="secondary-action" onClick={onResumeQuiz} disabled={!hasActiveSession}>
            Resume active set
          </button>
        </div>

        <label className="toggle-row">
          <input type="checkbox" checked={settings.shuffleChoices} onChange={onToggleShuffleChoices} />
          <span>Shuffle answer order between attempts</span>
        </label>

        {hasActiveSession && activeSessionSetId ? (
          <p className="muted-copy">Active session: {studySets.find((set) => set.id === activeSessionSetId)?.title}</p>
        ) : null}
      </section>

      <section className="panel-stack">
        <div className="library-document-grid">
          {studySets.map((set) => {
            const latestAttempt = latestAttemptBySet[set.id]

            return (
              <article key={set.id} className="library-card library-card--document">
                <div className="library-card__meta">
                  <span className="eyebrow">{set.category === 'quiz' ? 'Quiz set' : 'Homework set'}</span>
                  <h3>{set.title}</h3>
                  <p className="muted-copy">{set.description}</p>
                </div>

                <div className="library-card__chips">
                  <span className="status-chip status-chip--correct">{set.itemIds.length} surfaced items</span>
                  <span className="status-chip status-chip--neutral">Chapters {set.chapters.join(', ')}</span>
                  <span className="status-chip status-chip--neutral">{set.answerMix.join(', ')}</span>
                </div>

                <p className="library-card__preview">
                  Last attempt: {formatDate(latestAttempt?.summary.completedAt)}
                </p>

                {latestAttempt ? (
                  <p className="library-card__duplicates">
                    Score: {latestAttempt.summary.score}/{latestAttempt.summary.gradableCount} graded correct,{' '}
                    {latestAttempt.summary.manualCompleted}/{latestAttempt.summary.manualTotal} manual items checked.
                  </p>
                ) : (
                  <p className="library-card__duplicates">No history yet for this set.</p>
                )}

                <div className="action-row">
                  <button type="button" className="primary-action" onClick={() => onStartSet(set.id)}>
                    Start {set.shortTitle}
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() => onRetrySet(set.id)}
                    disabled={!latestAttempt || latestAttempt.summary.missedIds.length === 0}
                  >
                    Retry missed
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
