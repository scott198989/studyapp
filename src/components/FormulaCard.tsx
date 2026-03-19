import type { FormulaCard as FormulaCardType } from '../types/study'

export function FormulaCard({ formula }: { formula: FormulaCardType }) {
  return (
    <section className="formula-card">
      <div className="formula-card__header">
        <p className="eyebrow">Formula</p>
        <h4>{formula.title}</h4>
      </div>

      <ul className="formula-card__expressions">
        {formula.expressions.map((expression) => (
          <li key={expression}>{expression}</li>
        ))}
      </ul>

      <div className="formula-card__variables">
        {formula.variables.map((variable) => (
          <p key={`${variable.symbol}-${variable.meaning}`}>
            <strong>{variable.symbol}</strong>: {variable.meaning}
          </p>
        ))}
      </div>

      {formula.checkSteps?.length ? (
        <div className="formula-card__section">
          <strong>Check path</strong>
          <ul className="formula-card__list">
            {formula.checkSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {formula.notes?.length ? (
        <div className="formula-card__section">
          <strong>Notes</strong>
          <ul className="formula-card__list">
            {formula.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
