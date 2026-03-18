import type { AttemptRecord, QuizSettings, TopicBreakdownEntry } from '../types/quiz'

interface HomePageProps {
  totalQuestions: number
  settings: QuizSettings
  hasActiveSession: boolean
  latestAttempt?: AttemptRecord
  topicBreakdown: TopicBreakdownEntry[]
  onStartQuiz: () => void
  onOpenSolver: () => void
  onResumeQuiz: () => void
  onRetryMissed: () => void
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
  totalQuestions,
  settings,
  hasActiveSession,
  latestAttempt,
  topicBreakdown,
  onStartQuiz,
  onOpenSolver,
  onResumeQuiz,
  onRetryMissed,
  onToggleShuffleChoices,
}: HomePageProps) {
  const accuracy = latestAttempt?.summary.percent ?? 0

  return (
    <div className="home-layout">
      <section className="panel-stack">
        <div className="panel-section">
          <h2>Study flow</h2>
          <p className="muted-copy">
            Every new run uses the full deduped question bank once, with a fresh question order and
            a fresh answer order.
          </p>
        </div>

        <div className="action-grid">
          <button type="button" className="primary-action" onClick={onStartQuiz}>
            Start full quiz
          </button>
          <button type="button" className="secondary-action" onClick={onOpenSolver}>
            Open quiz solver
          </button>
          <button type="button" className="secondary-action" onClick={onResumeQuiz} disabled={!hasActiveSession}>
            Resume quiz
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={onRetryMissed}
            disabled={!latestAttempt || latestAttempt.summary.missedIds.length === 0}
          >
            Retry missed questions
          </button>
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.shuffleChoices}
            onChange={onToggleShuffleChoices}
          />
          <span>Shuffle answer order between attempts</span>
        </label>
      </section>

      <section className="panel-stack">
        <div className="metric-grid">
          <article className="metric-card">
            <span>Question bank</span>
            <strong>{totalQuestions}</strong>
            <small>deduped questions</small>
          </article>
          <article className="metric-card">
            <span>Last score</span>
            <strong>{latestAttempt ? `${latestAttempt.summary.score}/${latestAttempt.summary.questionIds.length}` : '--'}</strong>
            <small>{latestAttempt ? `${accuracy}% accuracy` : 'Take the first quiz'}</small>
          </article>
          <article className="metric-card">
            <span>Last attempt</span>
            <strong>{formatDate(latestAttempt?.summary.completedAt)}</strong>
            <small>{latestAttempt ? latestAttempt.summary.mode.replace('_', ' ') : 'No history yet'}</small>
          </article>
        </div>

        <div className="panel-section">
          <h2>Topic snapshot</h2>
          <div className="tag-grid">
            {topicBreakdown.length ? (
              topicBreakdown.map((entry) => (
                <article key={entry.tag} className="tag-card">
                  <span>{entry.tag.replace('_', ' ')}</span>
                  <strong>
                    {entry.correct}/{entry.total}
                  </strong>
                </article>
              ))
            ) : (
              <p className="muted-copy">Topic accuracy appears here after the first completed attempt.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
