import { getChoiceLabel } from '../lib/quizEngine'
import type { Choice } from '../types/quiz'

interface ChoiceListProps {
  choices: Choice[]
  selectedChoiceId?: string
  onSelect: (choiceId: string) => void
  disabled?: boolean
  correctChoiceId?: string
  revealAnswers?: boolean
}

export function ChoiceList({
  choices,
  selectedChoiceId,
  onSelect,
  disabled,
  correctChoiceId,
  revealAnswers,
}: ChoiceListProps) {
  return (
    <div className="choice-list" role="radiogroup">
      {choices.map((choice, index) => {
        const isSelected = selectedChoiceId === choice.id
        const isCorrect = revealAnswers && correctChoiceId === choice.id
        const isIncorrect = revealAnswers && isSelected && correctChoiceId !== choice.id

        return (
          <button
            key={choice.id}
            type="button"
            className={[
              'choice-card',
              isSelected ? 'choice-card--selected' : '',
              isCorrect ? 'choice-card--correct' : '',
              isIncorrect ? 'choice-card--incorrect' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelect(choice.id)}
            disabled={disabled}
            aria-pressed={isSelected}
          >
            <span className="choice-card__badge">{getChoiceLabel(index)}</span>
            <span className="choice-card__copy">{choice.text}</span>
          </button>
        )
      })}
    </div>
  )
}
