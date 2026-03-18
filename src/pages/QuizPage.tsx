import { ChoiceList } from '../components/ChoiceList'
import { FigureCard } from '../components/FigureCard'
import type { FigureAsset, Question } from '../types/quiz'

interface QuizPageProps {
  question: Question
  questionNumber: number
  totalQuestions: number
  displayedChoices: Question['choices']
  selectedChoiceId?: string
  isFlagged: boolean
  figure?: FigureAsset
  answeredCount: number
  onSelectChoice: (choiceId: string) => void
  onPrevious: () => void
  onNext: () => void
  onToggleFlag: () => void
  onSubmit: () => void
}

export function QuizPage({
  question,
  questionNumber,
  totalQuestions,
  displayedChoices,
  selectedChoiceId,
  isFlagged,
  figure,
  answeredCount,
  onSelectChoice,
  onPrevious,
  onNext,
  onToggleFlag,
  onSubmit,
}: QuizPageProps) {
  const isLast = questionNumber === totalQuestions

  return (
    <div className="panel-stack">
      <div className="progress-header">
        <div>
          <p className="eyebrow">Run {questionNumber} of {totalQuestions}</p>
          <p className="question-meta">
            Source question {question.sourceNumbers.join(', ')}
          </p>
          <h2 className="section-title">{question.prompt}</h2>
        </div>
        <button type="button" className="ghost-action" onClick={onToggleFlag}>
          {isFlagged ? 'Unflag question' : 'Flag for review'}
        </button>
      </div>

      <div className="progress-meter" aria-hidden="true">
        <span style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} />
      </div>

      <p className="muted-copy">
        {answeredCount}/{totalQuestions} answered
      </p>

      {figure ? <FigureCard figure={figure} /> : null}

      <ChoiceList choices={displayedChoices} selectedChoiceId={selectedChoiceId} onSelect={onSelectChoice} />

      <div className="quiz-toolbar">
        <div className="status-copy">
          <span>{question.kind === 'true_false' ? 'True / False' : 'Multiple choice'}</span>
          <span>{isFlagged ? 'Flagged for review' : 'Ready to answer'}</span>
        </div>

        <div className="action-row">
          <button type="button" className="secondary-action" onClick={onPrevious} disabled={questionNumber === 1}>
            Previous
          </button>
          {isLast ? (
            <button type="button" className="primary-action" onClick={onSubmit}>
              Submit quiz
            </button>
          ) : (
            <button type="button" className="primary-action" onClick={onNext}>
              Next question
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
