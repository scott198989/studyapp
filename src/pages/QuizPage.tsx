import { ChoiceList } from '../components/ChoiceList'
import { FigureCard } from '../components/FigureCard'
import type {
  Choice,
  FigureAsset,
  ManualResponse,
  ReviewEvaluation,
  StudyItem,
  StudyItemResponse,
} from '../types/study'

interface QuizPageProps {
  item: StudyItem
  itemNumber: number
  totalItems: number
  displayedChoices: Choice[]
  response?: StudyItemResponse
  isSubmitted: boolean
  liveEvaluation?: ReviewEvaluation
  isFlagged: boolean
  figure?: FigureAsset
  answeredCount: number
  onSelectChoice: (choiceId: string) => void
  onChangeText: (value: string) => void
  onChangeManual: (response: ManualResponse) => void
  onSubmitAnswer: () => void
  onPrevious: () => void
  onNext: () => void
  onToggleFlag: () => void
  onSubmit: () => void
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

function renderStatusCopy(item: StudyItem, flagged: boolean, isSubmitted: boolean) {
  const kindLabel =
    item.kind === 'true_false'
      ? 'True / False'
      : item.kind === 'multiple_choice'
        ? 'Multiple choice'
        : item.kind === 'numeric'
          ? 'Numeric or phasor answer'
          : 'Guided self-check'

  return (
    <div className="status-copy">
      <span>{kindLabel}</span>
      <span>
        {isSubmitted ? 'Answer submitted for instant grading' : flagged ? 'Flagged for review' : 'Ready to answer'}
      </span>
    </div>
  )
}

function getLiveStatusLabel(evaluation: ReviewEvaluation) {
  switch (evaluation.status) {
    case 'correct':
      return 'Correct'
    case 'incorrect':
      return 'Incorrect'
    case 'manual_complete':
      return 'Manual check complete'
    case 'manual_pending':
      return 'Manual review pending'
    default:
      return 'Awaiting answer'
  }
}

function getLiveStatusClassName(evaluation: ReviewEvaluation) {
  if (evaluation.status === 'correct' || evaluation.status === 'manual_complete') {
    return 'status-chip status-chip--correct'
  }

  if (evaluation.status === 'incorrect') {
    return 'status-chip status-chip--incorrect'
  }

  return 'status-chip status-chip--neutral'
}

export function QuizPage({
  item,
  itemNumber,
  totalItems,
  displayedChoices,
  response,
  isSubmitted,
  liveEvaluation,
  isFlagged,
  figure,
  answeredCount,
  onSelectChoice,
  onChangeText,
  onChangeManual,
  onSubmitAnswer,
  onPrevious,
  onNext,
  onToggleFlag,
  onSubmit,
}: QuizPageProps) {
  const isLast = itemNumber === totalItems
  const manualResponse: ManualResponse =
    response?.kind === 'manual' ? response : { kind: 'manual', completed: false, notes: '' }
  const textResponse = response?.kind === 'text' ? response.value : ''
  const selectedChoiceId = response?.kind === 'choice' ? response.value : undefined
  const canSubmitCurrent = hasMeaningfulResponse(response)

  return (
    <div className="panel-stack">
      <div className="progress-header">
        <div>
          <p className="eyebrow">
            Item {itemNumber} of {totalItems}
          </p>
          <p className="question-meta">{item.sourceLabel}</p>
          <h2 className="section-title">{item.prompt}</h2>
          {item.helperText ? <p className="muted-copy">{item.helperText}</p> : null}
        </div>
        <button type="button" className="ghost-action" onClick={onToggleFlag}>
          {isFlagged ? 'Unflag item' : 'Flag for review'}
        </button>
      </div>

      <div className="progress-meter" aria-hidden="true">
        <span style={{ width: `${(itemNumber / totalItems) * 100}%` }} />
      </div>

      <p className="muted-copy">
        {answeredCount}/{totalItems} answered or marked complete
      </p>

      {figure ? <FigureCard figure={figure} /> : null}

      {item.kind === 'multiple_choice' || item.kind === 'true_false' ? (
        <ChoiceList
          choices={displayedChoices}
          selectedChoiceId={selectedChoiceId}
          onSelect={onSelectChoice}
          disabled={isSubmitted}
          correctChoiceId={item.answerSpec.kind === 'choice' ? item.answerSpec.correctChoiceId : undefined}
          revealAnswers={isSubmitted}
        />
      ) : null}

      {item.kind === 'numeric' ? (
        <label className="solver-field">
          <span className="solver-field__label">{item.inputLabel}</span>
          <span className="solver-field__hint">
            Formulas stay hidden during the live run and appear after submission in review.
          </span>
          <input
            aria-label={item.inputLabel}
            type="text"
            value={textResponse}
            placeholder={item.placeholder}
            disabled={isSubmitted}
            onChange={(event) => onChangeText(event.target.value)}
          />
        </label>
      ) : null}

      {item.kind === 'manual_check' ? (
        <div className="manual-check-panel">
          <div className="panel-section">
            <h3>Manual review checklist</h3>
            <ul className="solver-list">
              {item.answerSpec.checklist.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <label className="solver-field">
            <span className="solver-field__label">Your notes</span>
            <span className="solver-field__hint">Optional. Jot down what you checked or what still needs work.</span>
            <textarea
              aria-label="Your notes"
              rows={5}
              value={manualResponse.notes}
              disabled={isSubmitted}
              onChange={(event) =>
                onChangeManual({
                  ...manualResponse,
                  notes: event.target.value,
                })
              }
            />
          </label>

          <label className="toggle-row">
            <input
              type="checkbox"
              checked={manualResponse.completed}
              disabled={isSubmitted}
              onChange={(event) =>
                onChangeManual({
                  ...manualResponse,
                  completed: event.target.checked,
                })
              }
            />
            <span>Mark manual self-check complete</span>
          </label>
        </div>
      ) : null}

      {isSubmitted && liveEvaluation ? (
        <section className="panel-section quiz-feedback-card">
          <div className="quiz-feedback-card__header">
            <div>
              <p className="eyebrow">Instant grading</p>
              <h3>{getLiveStatusLabel(liveEvaluation)}</h3>
            </div>
            <span className={getLiveStatusClassName(liveEvaluation)}>{getLiveStatusLabel(liveEvaluation)}</span>
          </div>
          <p>{liveEvaluation.feedback}</p>
          <p className="muted-copy">Formulas and full answer details still appear in the review screen after the set.</p>
        </section>
      ) : null}

      <div className="quiz-toolbar">
        {renderStatusCopy(item, isFlagged, isSubmitted)}

        <div className="action-row">
          <button type="button" className="secondary-action" onClick={onPrevious} disabled={itemNumber === 1}>
            Previous
          </button>
          {isSubmitted ? (
            isLast ? (
              <button type="button" className="primary-action" onClick={onSubmit}>
                Submit set
              </button>
            ) : (
              <button type="button" className="primary-action" onClick={onNext}>
                Next item
              </button>
            )
          ) : (
            <button type="button" className="primary-action" onClick={onSubmitAnswer} disabled={!canSubmitCurrent}>
              Submit answer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
