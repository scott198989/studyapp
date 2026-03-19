import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { createDefaultSolverFormState, defaultSolverGoalId, solverGoalLookup, solverGoals } from '../data/solverGoals'
import { solveGoal } from '../lib/solverEngine'
import { buildSolverPresentation } from '../lib/solverPresentation'
import { getUnitDefinition, solverUnits } from '../lib/solverUnits'
import type {
  AnswerChoiceMatchResult,
  SolverFieldDefinition,
  SolverFieldInputState,
  SolverGoalDefinition,
  SolverGoalId,
  SolverRoundingMode,
  SolverUnitId,
} from '../types/solver'

const roundingOptions: { value: SolverRoundingMode; label: string }[] = [
  { value: 'exact', label: 'Exact value' },
  { value: '2dp', label: 'Rounded to 2 decimals' },
  { value: '3dp', label: 'Rounded to 3 decimals' },
  { value: 'scientific', label: 'Scientific notation' },
]

const dimensionLabels: Record<string, string> = {
  resistance: 'Resistance / impedance',
  conductance: 'Conductance / susceptance',
  angle: 'Angle',
  frequency: 'Frequency',
  inductance: 'Inductance',
  capacitance: 'Capacitance',
  voltage: 'Voltage',
  current: 'Current',
  power: 'Power',
  unitless: 'Unitless',
}

function createRequestedAngleUnit(goal: SolverGoalDefinition) {
  return goal.output.preferredAngleUnit ?? 'degrees'
}

function createRequestedOutputUnit(goal: SolverGoalDefinition) {
  return goal.output.preferredOutputUnit
}

function groupUnitsForSelector() {
  const byDimension = new Map<string, typeof solverUnits>()

  for (const unit of solverUnits) {
    const current = byDimension.get(unit.dimension) ?? []
    current.push(unit)
    byDimension.set(unit.dimension, current)
  }

  return Array.from(byDimension.entries())
}

function SolverField({
  field,
  inputState,
  onChange,
}: {
  field: SolverFieldDefinition
  inputState: SolverFieldInputState
  onChange: (nextState: SolverFieldInputState) => void
}) {
  if (field.kind === 'select' && inputState.kind === 'select') {
    return (
      <label className="solver-field">
        <span className="solver-field__label">{field.label}</span>
        <span className="solver-field__hint">{field.description}</span>
        <select
          aria-label={field.label}
          value={inputState.value}
          onChange={(event) => onChange({ kind: 'select', value: event.target.value })}
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.note ? <span className="solver-field__note">{field.note}</span> : null}
      </label>
    )
  }

  if (field.kind === 'measurement' && inputState.kind === 'measurement') {
    return (
      <label className="solver-field">
        <span className="solver-field__label">{field.label}</span>
        <span className="solver-field__hint">{field.description}</span>
        <div className="solver-field__input-row">
          <input
            aria-label={field.label}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={field.placeholder}
            value={inputState.value}
            onChange={(event) =>
              onChange({
                kind: 'measurement',
                value: event.target.value,
                unitId: inputState.unitId,
              })
            }
          />
          <select
            aria-label={`${field.label} unit`}
            value={inputState.unitId}
            onChange={(event) =>
              onChange({
                kind: 'measurement',
                value: inputState.value,
                unitId: event.target.value as SolverUnitId,
              })
            }
          >
            {field.unitOptions.map((unitId) => (
              <option key={unitId} value={unitId}>
                {getUnitDefinition(unitId).label}
              </option>
            ))}
          </select>
        </div>
        {field.note ? <span className="solver-field__note">{field.note}</span> : null}
      </label>
    )
  }

  return null
}

function ChoiceMatchPanel({ match }: { match: AnswerChoiceMatchResult }) {
  if (!match.parsedChoices.length) {
    return null
  }

  return (
    <section className="solver-result-section">
      <div className="solver-result-section__header">
        <h3>Closest answer choice</h3>
        <span className="status-chip status-chip--correct">
          {match.bestMatch
            ? `${match.bestMatch.label} — ${match.bestMatch.rawText}`
            : 'No comparable choice'}
        </span>
      </div>

      <div className="solver-choice-match-list">
        {match.parsedChoices.map((choice) => (
          <article
            key={`${choice.label}-${choice.rawText}`}
            className={`solver-choice-match-card ${
              match.bestMatch?.label === choice.label ? 'solver-choice-match-card--best' : ''
            }`}
          >
            <strong>{choice.label}</strong>
            <span>{choice.rawText}</span>
            <small>{choice.comparable ? `Match score ${choice.score.toFixed(4)}` : 'Not comparable'}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SolverPage({ onBackHome }: { onBackHome: () => void }) {
  const [searchParams] = useSearchParams()
  const requestedGoalId = searchParams.get('goal') as SolverGoalId | null
  const initialGoalId = requestedGoalId && solverGoalLookup[requestedGoalId] ? requestedGoalId : defaultSolverGoalId

  return <SolverWorkspace key={initialGoalId} onBackHome={onBackHome} initialGoalId={initialGoalId} />
}

function SolverWorkspace({
  onBackHome,
  initialGoalId,
}: {
  onBackHome: () => void
  initialGoalId: SolverGoalId
}) {
  const [goalId, setGoalId] = useState<SolverGoalId>(initialGoalId)
  const [formState, setFormState] = useState(() => createDefaultSolverFormState(initialGoalId))
  const [requestedOutputUnitId, setRequestedOutputUnitId] = useState<SolverUnitId>(
    createRequestedOutputUnit(solverGoalLookup[initialGoalId]),
  )
  const [requestedAngleUnitId, setRequestedAngleUnitId] = useState<SolverUnitId>(
    createRequestedAngleUnit(solverGoalLookup[initialGoalId]),
  )
  const [roundingMode, setRoundingMode] = useState<SolverRoundingMode>(
    solverGoalLookup[initialGoalId].output.preferredRounding,
  )
  const [answerChoicesText, setAnswerChoicesText] = useState('')
  const [hasSolved, setHasSolved] = useState(false)

  const goal = solverGoalLookup[goalId]
  const groupedUnits = groupUnitsForSelector()

  function updateGoal(nextGoalId: SolverGoalId) {
    const nextGoal = solverGoalLookup[nextGoalId]

    setGoalId(nextGoalId)
    setFormState(createDefaultSolverFormState(nextGoalId))
    setRequestedOutputUnitId(createRequestedOutputUnit(nextGoal))
    setRequestedAngleUnitId(createRequestedAngleUnit(nextGoal))
    setRoundingMode(nextGoal.output.preferredRounding)
    setAnswerChoicesText('')
    setHasSolved(false)
  }

  let solvedView:
    | ReturnType<typeof buildSolverPresentation> & {
        result: ReturnType<typeof solveGoal>
      }
    | null = null
  let solveError: string | null = null

  if (hasSolved) {
    try {
      const result = solveGoal(goal, formState)
      const presentation = buildSolverPresentation({
        goal,
        result,
        requestedOutputUnitId,
        requestedAngleUnitId,
        roundingMode,
        answerChoicesText,
      })

      solvedView = {
        ...presentation,
        result,
      }
    } catch (error) {
      solveError = error instanceof Error ? error.message : 'Could not solve this problem.'
    }
  }

  function updateField(fieldId: string, nextState: SolverFieldInputState) {
    setFormState((current) => ({
      ...current,
      [fieldId]: nextState,
    }))
  }

  function resetGoalInputs() {
    setFormState(createDefaultSolverFormState(goalId))
    setRequestedOutputUnitId(createRequestedOutputUnit(goal))
    setRequestedAngleUnitId(createRequestedAngleUnit(goal))
    setRoundingMode(goal.output.preferredRounding)
    setAnswerChoicesText('')
    setHasSolved(false)
  }

  return (
    <div className="solver-layout">
      <section className="panel-stack">
        <div className="panel-section">
          <div className="solver-section-heading">
            <div>
              <h2>Solver workspace</h2>
              <p className="muted-copy">
                Pick the quiz goal, enter the known values, then force the answer into the exact unit and form
                the test is expecting.
              </p>
            </div>
            <button type="button" className="ghost-action" onClick={onBackHome}>
              Back to quiz home
            </button>
          </div>
        </div>

        <div className="panel-section">
          <label className="solver-field">
            <span className="solver-field__label">Problem type</span>
            <span className="solver-field__hint">Choose the exact kind of AC-circuit question you want to solve.</span>
            <select value={goalId} onChange={(event) => updateGoal(event.target.value as SolverGoalId)}>
              {solverGoals.map((goalOption) => (
                <option key={goalOption.id} value={goalOption.id}>
                  {goalOption.shortName}
                </option>
              ))}
            </select>
          </label>

          <div className="solver-goal-summary">
            <article className="tag-card">
              <span>Quantity type</span>
              <strong>{goal.output.quantityType}</strong>
            </article>
            <article className="tag-card">
              <span>Canonical unit</span>
              <strong>{getUnitDefinition(goal.output.canonicalUnit).label}</strong>
            </article>
            <article className="tag-card">
              <span>Preferred rounding</span>
              <strong>{roundingOptions.find((option) => option.value === goal.output.preferredRounding)?.label}</strong>
            </article>
          </div>

          <p className="muted-copy">{goal.description}</p>
        </div>

        <div className="panel-section">
          <div className="solver-section-heading">
            <div>
              <h2>Known values</h2>
              <p className="muted-copy">Every field below maps directly to the chosen formula path.</p>
            </div>
          </div>

          <div className="solver-field-grid">
            {goal.fields.map((field) => (
              <SolverField
                key={field.id}
                field={field}
                inputState={formState[field.id]}
                onChange={(nextState) => updateField(field.id, nextState)}
              />
            ))}
          </div>
        </div>

        <div className="panel-section">
          <div className="solver-section-heading">
            <div>
              <h2>Quiz output</h2>
              <p className="muted-copy">Tell the app the exact answer unit and rounding style you need on the test.</p>
            </div>
          </div>

          <div className="solver-field-grid">
            <label className="solver-field">
              <span className="solver-field__label">Answer should be in</span>
              <span className="solver-field__hint">Required. The final answer box uses this unit when the quantity type supports it.</span>
              <select
                aria-label="Answer should be in"
                value={requestedOutputUnitId}
                onChange={(event) => setRequestedOutputUnitId(event.target.value as SolverUnitId)}
              >
                {groupedUnits.map(([dimension, units]) => (
                  <optgroup key={dimension} label={dimensionLabels[dimension] ?? dimension}>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>

            {goal.output.format === 'polar' ? (
              <label className="solver-field">
                <span className="solver-field__label">Angle should be in</span>
                <span className="solver-field__hint">Use degrees when your quiz choices are written with degree symbols.</span>
                <select
                  aria-label="Angle should be in"
                  value={requestedAngleUnitId}
                  onChange={(event) => setRequestedAngleUnitId(event.target.value as SolverUnitId)}
                >
                  {(goal.output.allowedAngleUnits ?? ['degrees']).map((unitId) => (
                    <option key={unitId} value={unitId}>
                      {getUnitDefinition(unitId).label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="solver-field">
              <span className="solver-field__label">Quiz rounding</span>
              <span className="solver-field__hint">Show both the exact converted answer and the rounded quiz-friendly version.</span>
              <select
                aria-label="Quiz rounding"
                value={roundingMode}
                onChange={(event) => setRoundingMode(event.target.value as SolverRoundingMode)}
              >
                {roundingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="panel-section">
          <div className="solver-section-heading">
            <div>
              <h2>Answer-choice helper</h2>
              <p className="muted-copy">Paste answer choices here if you want the solver to point at the closest match.</p>
            </div>
          </div>

          <label className="solver-field">
            <span className="solver-field__label">Multiple-choice answers</span>
            <span className="solver-field__hint">One choice per line. Formats like `A) 0.63 S` and `B) 86.6 Ω + j50 Ω` both work.</span>
            <textarea
              rows={6}
              placeholder={`A) 0.63 S\nB) 10^4 S\nC) 10^-4 S\nD) 1.59 S`}
              value={answerChoicesText}
              onChange={(event) => setAnswerChoicesText(event.target.value)}
            />
          </label>
        </div>

        <div className="action-grid">
          <button type="button" className="primary-action" onClick={() => setHasSolved(true)}>
            Solve problem
          </button>
          <button type="button" className="secondary-action" onClick={resetGoalInputs}>
            Reset solver
          </button>
        </div>
      </section>

      <section className="panel-stack">
        {!hasSolved ? (
          <div className="panel-section solver-empty-state">
            <h2>Results</h2>
            <p className="muted-copy">
              Solve a problem to get a loud final-answer card, conversion trail, and multiple-choice match helper.
            </p>
          </div>
        ) : null}

        {solveError ? (
          <div className="panel-section solver-warning-panel" role="alert">
            <h2>Need one more fix</h2>
            <p>{solveError}</p>
          </div>
        ) : null}

        {solvedView ? (
          <>
            <section className="solver-answer-callout" aria-live="polite" data-testid="final-quiz-answer">
              <p className="solver-answer-callout__eyebrow">FINAL QUIZ ANSWER</p>
              <h2>{solvedView.presentation.finalExact}</h2>
              <p className="solver-answer-callout__subcopy">SUBMIT THIS</p>
              <p className="solver-answer-callout__copy">Answer in requested units</p>

              <div className="solver-answer-callout__rounded">
                <span>Rounded quiz answer</span>
                <strong>{solvedView.presentation.finalRounded}</strong>
              </div>
            </section>

            {solvedView.choiceMatch.bestMatch ? (
              <div className="panel-section solver-highlight-strip">
                <strong>Closest matching answer choice:</strong>{' '}
                <span>
                  {solvedView.choiceMatch.bestMatch.label} — {solvedView.choiceMatch.bestMatch.rawText}
                </span>
              </div>
            ) : null}

            {solvedView.presentation.warnings.length ? (
              <section className="solver-result-section">
                <div className="solver-result-section__header">
                  <h3>Notes and warnings</h3>
                </div>
                <div className="solver-warning-list">
                  {solvedView.presentation.warnings.map((warning) => (
                    <span key={warning} className="solver-warning-pill">
                      {warning}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="solver-result-section">
              <div className="solver-result-section__header">
                <h3>Raw computed result</h3>
              </div>
              <p className="solver-result-value">{solvedView.presentation.rawComputed}</p>
            </section>

            <section className="solver-result-section">
              <div className="solver-result-section__header">
                <h3>Formula path</h3>
              </div>
              <ol className="solver-list">
                {solvedView.result.formulaPath.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className="solver-result-section">
              <div className="solver-result-section__header">
                <h3>Substitution details</h3>
              </div>
              <ul className="solver-list">
                {solvedView.result.substitutionDetails.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>

            <section className="solver-result-section">
              <div className="solver-result-section__header">
                <h3>Unit conversion trail</h3>
              </div>
              <ul className="solver-list">
                {solvedView.presentation.conversionSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </section>

            {solvedView.result.notes.length ? (
              <section className="solver-result-section">
                <div className="solver-result-section__header">
                  <h3>Notes</h3>
                </div>
                <ul className="solver-list">
                  {solvedView.result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <ChoiceMatchPanel match={solvedView.choiceMatch} />
          </>
        ) : null}
      </section>
    </div>
  )
}
