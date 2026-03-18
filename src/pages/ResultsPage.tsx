import { useMemo, useState } from 'react'

import { ChoiceList } from '../components/ChoiceList'
import { FigureCard } from '../components/FigureCard'
import { findChoiceById } from '../lib/quizEngine'
import type { FigureAsset, ReviewItem } from '../types/quiz'

type ReviewFilter = 'all' | 'missed' | 'flagged'

interface ResultsPageProps {
  reviewItems: ReviewItem[]
  score: number
  percent: number
  flaggedIds: string[]
  figureLookup: Record<string, FigureAsset>
  onStartNewQuiz: () => void
  onRetryMissed: () => void
  canRetryMissed: boolean
}

export function ResultsPage({
  reviewItems,
  score,
  percent,
  flaggedIds,
  figureLookup,
  onStartNewQuiz,
  onRetryMissed,
  canRetryMissed,
}: ResultsPageProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all')

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'missed':
        return reviewItems.filter((item) => !item.isCorrect)
      case 'flagged':
        return reviewItems.filter((item) => flaggedIds.includes(item.question.id))
      default:
        return reviewItems
    }
  }, [filter, flaggedIds, reviewItems])

  return (
    <div className="panel-stack">
      <div className="results-summary">
        <div>
          <p className="eyebrow">Review complete</p>
          <h2 className="section-title">
            {score}/{reviewItems.length} correct
          </h2>
          <p className="muted-copy">{percent}% accuracy with rationales preserved for every item.</p>
        </div>

        <div className="action-row">
          <button type="button" className="primary-action" onClick={onStartNewQuiz}>
            Start fresh quiz
          </button>
          <button type="button" className="secondary-action" onClick={onRetryMissed} disabled={!canRetryMissed}>
            Retry missed only
          </button>
        </div>
      </div>

      <div className="filter-row" role="tablist" aria-label="Review filters">
        {(['all', 'missed', 'flagged'] as const).map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={candidate === filter ? 'filter-pill filter-pill--active' : 'filter-pill'}
            onClick={() => setFilter(candidate)}
          >
            {candidate}
          </button>
        ))}
      </div>

      <div className="review-stack">
        {filteredItems.map((item, index) => {
          const selectedChoice = findChoiceById(item.question, item.selectedChoiceId)
          const correctChoice = findChoiceById(item.question, item.question.correctChoiceId)
          const figure = item.question.figureId ? figureLookup[item.question.figureId] : undefined

          return (
            <article key={item.question.id} className="review-card">
              <div className="review-card__header">
                <div>
                  <p className="eyebrow">Review {index + 1}</p>
                  <p className="question-meta">
                    Source question {item.question.sourceNumbers.join(', ')}
                  </p>
                  <h3>{item.question.prompt}</h3>
                </div>
                <span className={item.isCorrect ? 'status-chip status-chip--correct' : 'status-chip status-chip--incorrect'}>
                  {item.isCorrect ? 'Correct' : 'Missed'}
                </span>
              </div>

              {figure ? <FigureCard figure={figure} /> : null}

              <ChoiceList
                choices={item.displayedChoices}
                selectedChoiceId={item.selectedChoiceId}
                onSelect={() => undefined}
                disabled
                correctChoiceId={item.question.correctChoiceId}
                revealAnswers
              />

              <div className="rationale-card">
                <p>
                  <strong>Your answer:</strong> {selectedChoice?.text ?? 'No answer selected'}
                </p>
                <p>
                  <strong>Correct answer:</strong> {correctChoice?.text}
                </p>
                <p>{item.question.rationale}</p>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
