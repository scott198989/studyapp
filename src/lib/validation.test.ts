import { describe, expect, it } from 'vitest'

import { formulaCatalog } from '../data/formulaCatalog'
import { studyItems, studySets } from '../data/studyContent'
import { studySourceAudit } from '../data/studySourceAudit'
import { validateStudyContent } from './validation'

describe('validateStudyContent', () => {
  it('accepts the canonical surfaced study content', () => {
    const result = validateStudyContent(studySets, studyItems, formulaCatalog, studySourceAudit)

    expect(studySets.map((set) => set.id)).toEqual(['quiz_15_16', 'quiz_17', 'hw_15', 'hw_16', 'hw_17'])
    expect(new Set(studyItems.map((item) => item.id)).size).toBe(studyItems.length)
    expect(result).toEqual({ isValid: true, errors: [] })
  })
})
