import { describe, expect, it } from 'vitest'

import { questionBank } from '../data/questionBank'
import { sourceAudit } from '../data/sourceAudit'
import { validateQuestionBank } from './validation'

describe('validateQuestionBank', () => {
  it('accepts the canonical bank and source audit', () => {
    const result = validateQuestionBank(questionBank, sourceAudit)

    expect(questionBank).toHaveLength(40)
    expect(sourceAudit).toHaveLength(59)
    expect(result).toEqual({ isValid: true, errors: [] })
  })
})
