import type { Question, SourceAuditRecord } from '../types/quiz'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

const normalizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.+-]/g, '')
    .trim()

export function validateQuestionBank(
  questions: readonly Question[],
  auditRecords: readonly SourceAuditRecord[],
): ValidationResult {
  const errors: string[] = []
  const seenIds = new Set<string>()
  const seenShapes = new Set<string>()
  const seenAuditFiles = new Set<string>()

  for (const question of questions) {
    if (seenIds.has(question.id)) {
      errors.push(`Duplicate question id detected: ${question.id}`)
    }
    seenIds.add(question.id)

    if (!question.prompt.trim()) {
      errors.push(`Question ${question.id} is missing prompt text.`)
    }

    if (question.choices.length < 2) {
      errors.push(`Question ${question.id} must contain at least two answer choices.`)
    }

    if (!question.choices.some((choice) => choice.id === question.correctChoiceId)) {
      errors.push(`Question ${question.id} references a missing correct choice id.`)
    }

    if (!question.rationale.trim()) {
      errors.push(`Question ${question.id} is missing rationale text.`)
    }

    if (question.sourceRefs.length === 0) {
      errors.push(`Question ${question.id} is missing source references.`)
    }

    const normalizedShape = [
      normalizeText(question.prompt),
      question.figureId ?? 'no-figure',
      question.choices.map((choice) => normalizeText(choice.text)).join('|'),
    ].join('::')

    if (seenShapes.has(normalizedShape)) {
      errors.push(`Question ${question.id} duplicates another canonical question.`)
    }
    seenShapes.add(normalizedShape)
  }

  for (const record of auditRecords) {
    if (seenAuditFiles.has(record.fileName)) {
      errors.push(`Duplicate source audit file detected: ${record.fileName}`)
    }
    seenAuditFiles.add(record.fileName)
  }

  for (const question of questions) {
    for (const ref of question.sourceRefs) {
      if (!seenAuditFiles.has(ref.filename)) {
        errors.push(
          `Question ${question.id} references ${ref.filename}, which is missing from the source audit.`,
        )
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
