import { useMemo, useState } from 'react'

import { ChoiceList } from '../components/ChoiceList'
import { FigureCard } from '../components/FigureCard'
import { FormulaCard } from '../components/FormulaCard'
import { findChoiceById } from '../lib/quizEngine'
import type { FigureAsset, FormulaCard as FormulaCardType, ReviewItem } from '../types/study'

type ReviewFilter = 'all' | 'missed' | 'flagged' | 'manual'

interface ResultsPageProps {
  reviewItems: ReviewItem[]
  score: number
  percent: number
  gradableCount: number
  manualCompleted: number
  manualTotal: number
  flaggedIds: string[]
  figureLookup: Record<string, FigureAsset>
  formulaLookup: Record<string, FormulaCardType>
  setTitle: string
  onStartNewSet: () => void
  onRetryMissed: () => void
  canRetryMissed: boolean
  onOpenSolver: (goalId?: string) => void
}

export function ResultsPage({
  reviewItems,
  score,
  percent,
  gradableCount,
  manualCompleted,
  manualTotal,
  flaggedIds,
  figureLookup,
  formulaLookup,
  setTitle,
  onStartNewSet,
  onRetryMissed,
  canRetryMissed,
  onOpenSolver,
}: ResultsPageProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all')

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'missed':
        return reviewItems.filter(
          (item) => item.evaluation.isGradable && item.evaluation.status !== 'correct',
        )
      case 'flagged':
        return reviewItems.filter((item) => flaggedIds.includes(item.item.id))
      case 'manual':
        return reviewItems.filter((item) => !item.evaluation.isGradable)
      default:
        return reviewItems
    }
  }, [filter, flaggedIds, reviewItems])

  return (
    <div className="panel-stack">
      <div className="results-summary">
        <div>
          <p className="eyebrow">Review complete</p>
          <h2 className="section-title">{setTitle}</h2>
          <p className="muted-copy">
            {score}/{gradableCount} graded items correct, {percent}% accuracy, and {manualCompleted}/{manualTotal} manual items checked.
          </p>
        </div>

        <div className="action-row">
          <button type="button" className="primary-action" onClick={onStartNewSet}>
            Start this set again
          </button>
          <button type="button" className="secondary-action" onClick={onRetryMissed} disabled={!canRetryMissed}>
            Retry missed only
          </button>
        </div>
      </div>

      <div className="filter-row" role="tablist" aria-label="Review filters">
        {(['all', 'missed', 'flagged', 'manual'] as const).map((candidate) => (
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
        {filteredItems.map((reviewItem, index) => {
          const item = reviewItem.item
          const responseChoiceId = reviewItem.response?.kind === 'choice' ? reviewItem.response.value : undefined
          const selectedChoice = findChoiceById(item, responseChoiceId)
          const correctChoice =
            item.answerSpec.kind === 'choice' ? findChoiceById(item, item.answerSpec.correctChoiceId) : undefined
          const figure = item.figureId ? figureLookup[item.figureId] : undefined
          const formulas =
            item.formulaSupport.kind === 'formula_refs'
              ? item.formulaSupport.formulaIds.map((formulaId) => formulaLookup[formulaId]).filter(Boolean)
              : []

          return (
            <article key={item.id} className="review-card">
              <div className="review-card__header">
                <div>
                  <p className="eyebrow">Review {index + 1}</p>
                  <p className="question-meta">{item.sourceLabel}</p>
                  <h3>{item.prompt}</h3>
                </div>
                <span
                  className={
                    reviewItem.evaluation.status === 'correct' || reviewItem.evaluation.status === 'manual_complete'
                      ? 'status-chip status-chip--correct'
                      : reviewItem.evaluation.status === 'manual_pending'
                        ? 'status-chip status-chip--neutral'
                        : 'status-chip status-chip--incorrect'
                  }
                >
                  {reviewItem.evaluation.status.replace('_', ' ')}
                </span>
              </div>

              {figure ? <FigureCard figure={figure} /> : null}

              {item.kind === 'multiple_choice' || item.kind === 'true_false' ? (
                <ChoiceList
                  choices={reviewItem.displayedChoices}
                  selectedChoiceId={responseChoiceId}
                  onSelect={() => undefined}
                  disabled
                  correctChoiceId={item.answerSpec.kind === 'choice' ? item.answerSpec.correctChoiceId : undefined}
                  revealAnswers
                />
              ) : null}

              <div className="rationale-card">
                {item.answerSpec.kind === 'choice' ? (
                  <>
                    <p>
                      <strong>Your answer:</strong> {selectedChoice?.text ?? 'No answer selected'}
                    </p>
                    <p>
                      <strong>Correct answer:</strong> {correctChoice?.text ?? 'Unavailable'}
                    </p>
                  </>
                ) : null}

                {reviewItem.evaluation.actualAnswer ? (
                  <p>
                    <strong>Your response:</strong> {reviewItem.evaluation.actualAnswer}
                  </p>
                ) : null}

                {reviewItem.evaluation.expectedAnswer ? (
                  <p>
                    <strong>Expected answer:</strong> {reviewItem.evaluation.expectedAnswer}
                  </p>
                ) : null}

                <p>{reviewItem.evaluation.feedback}</p>
                <p>{item.rationale}</p>
              </div>

              {item.kind === 'manual_check' && item.workedSolution?.length ? (
                <section className="formula-card">
                  <div className="formula-card__header">
                    <p className="eyebrow">Worked review</p>
                    <h4>Manual check guide</h4>
                  </div>
                  <ul className="formula-card__list">
                    {item.workedSolution.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {item.formulaSupport.kind === 'no_formula' ? (
                <section className="formula-card">
                  <div className="formula-card__header">
                    <p className="eyebrow">Formula note</p>
                    <h4>No standalone formula card</h4>
                  </div>
                  <p>{item.formulaSupport.reason}</p>
                </section>
              ) : null}

              {formulas.map((formula) => (
                <div key={`${item.id}-${formula.id}`} className="panel-stack">
                  <FormulaCard formula={formula} />
                  {formula.solverGoalId ? (
                    <div className="action-row">
                      <button type="button" className="secondary-action" onClick={() => onOpenSolver(formula.solverGoalId)}>
                        Open solver for this formula
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </article>
          )
        })}
      </div>
    </div>
  )
}
