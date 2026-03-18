import type { FigureAsset, Question } from '../types/quiz'
import { figures } from './questionBank.helpers'
import { questionBankPart1 } from './questionBank.part1'
import { questionBankPart2 } from './questionBank.part2'
import { questionBankPart3 } from './questionBank.part3'
import { questionBankPart4 } from './questionBank.part4'

export const questionBank: Question[] = [
  ...questionBankPart1,
  ...questionBankPart2,
  ...questionBankPart3,
  ...questionBankPart4,
]

export const figureLookup = Object.fromEntries(
  figures.map((figure) => [figure.id, figure]),
) as Record<string, FigureAsset>

export const figureCatalog = figureLookup

export const questionLookup = Object.fromEntries(
  questionBank.map((question) => [question.id, question]),
) as Record<string, Question>
