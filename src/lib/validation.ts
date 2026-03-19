import type { FormulaCard, SourceAuditRecord, StudyItem, StudySet } from '../types/study'

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

export function validateStudyContent(
  sets: readonly StudySet[],
  items: readonly StudyItem[],
  formulas: readonly FormulaCard[],
  auditRecords: readonly SourceAuditRecord[],
): ValidationResult {
  const errors: string[] = []
  const setLookup = new Map(sets.map((set) => [set.id, set]))
  const formulaLookup = new Set(formulas.map((formula) => formula.id))
  const seenItemIds = new Set<string>()
  const seenAuditFiles = new Set<string>()
  const duplicateShapeBySet = new Map<string, Set<string>>()

  for (const expectedSetId of ['quiz_15_16', 'quiz_17', 'hw_15', 'hw_16', 'hw_17'] as const) {
    if (!setLookup.has(expectedSetId)) {
      errors.push(`Missing required study set: ${expectedSetId}`)
    }
  }

  for (const item of items) {
    if (seenItemIds.has(item.id)) {
      errors.push(`Duplicate surfaced item id detected: ${item.id}`)
    }
    seenItemIds.add(item.id)

    if (!setLookup.has(item.setId)) {
      errors.push(`Item ${item.id} references missing set ${item.setId}.`)
    }

    if (!item.prompt.trim()) {
      errors.push(`Item ${item.id} is missing prompt text.`)
    }

    if (!item.rationale.trim()) {
      errors.push(`Item ${item.id} is missing rationale text.`)
    }

    if (item.kind === 'multiple_choice' || item.kind === 'true_false') {
      if (item.choices.length < 2) {
        errors.push(`Choice item ${item.id} must contain at least two answer choices.`)
      }

      if (!item.choices.some((choice) => choice.id === item.answerSpec.correctChoiceId)) {
        errors.push(`Choice item ${item.id} references a missing correct choice id.`)
      }
    }

    if (item.kind === 'manual_check' && item.answerSpec.checklist.length === 0) {
      errors.push(`Manual-check item ${item.id} must include a checklist.`)
    }

    if (item.sourceRefs.length === 0) {
      errors.push(`Item ${item.id} is missing source references.`)
    }

    if (item.formulaSupport.kind === 'formula_refs') {
      if (item.formulaSupport.formulaIds.length === 0) {
        errors.push(`Item ${item.id} uses formula_refs but does not reference any formula ids.`)
      }

      for (const formulaId of item.formulaSupport.formulaIds) {
        if (!formulaLookup.has(formulaId)) {
          errors.push(`Item ${item.id} references missing formula ${formulaId}.`)
        }
      }
    } else if (!item.formulaSupport.reason.trim()) {
      errors.push(`Item ${item.id} must explain why no standalone formula is surfaced.`)
    }

    const setShapes = duplicateShapeBySet.get(item.setId) ?? new Set<string>()
    const normalizedShape = [
      normalizeText(item.prompt),
      item.kind,
      item.kind === 'multiple_choice' || item.kind === 'true_false'
        ? item.choices.map((choice) => normalizeText(choice.text)).join('|')
        : '',
    ].join('::')

    if (setShapes.has(normalizedShape)) {
      errors.push(`Item ${item.id} duplicates another surfaced item inside set ${item.setId}.`)
    }
    setShapes.add(normalizedShape)
    duplicateShapeBySet.set(item.setId, setShapes)
  }

  for (const set of sets) {
    const surfacedIds = new Set(set.itemIds)
    if (surfacedIds.size !== set.itemIds.length) {
      errors.push(`Set ${set.id} contains duplicate item ids in its surfaced list.`)
    }

    for (const itemId of surfacedIds) {
      if (!seenItemIds.has(itemId)) {
        errors.push(`Set ${set.id} references missing item ${itemId}.`)
      }
    }
  }

  for (const record of auditRecords) {
    if (seenAuditFiles.has(record.fileName)) {
      errors.push(`Duplicate source audit file detected: ${record.fileName}`)
    }
    seenAuditFiles.add(record.fileName)

    if (!setLookup.has(record.studySetId)) {
      errors.push(`Source audit file ${record.fileName} references missing set ${record.studySetId}.`)
    }

    for (const itemId of record.itemIds) {
      if (!seenItemIds.has(itemId)) {
        errors.push(`Source audit file ${record.fileName} references missing item ${itemId}.`)
      }
    }
  }

  for (const item of items) {
    for (const ref of item.sourceRefs) {
      if (!seenAuditFiles.has(ref.filename)) {
        errors.push(`Item ${item.id} references ${ref.filename}, which is missing from the study source audit.`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
