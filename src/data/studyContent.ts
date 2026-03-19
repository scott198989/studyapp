import { formulaLookup } from './formulaCatalog'
import { homeworkItems } from './homeworkSets'
import { figureLookup, questionBank as legacyQuestionBank } from './questionBank'
import { chapter17QuizItems } from './chapter17Quiz'
import { buildQuiz1516Id, cloneLegacyQuestion, formulaRefs, noFormula } from './studyContent.helpers'
import type { StudyItem, StudySet } from '../types/study'

function legacyFormulaSupport(question: (typeof legacyQuestionBank)[number]) {
  const prompt = question.prompt.toLowerCase()
  const tags = new Set(question.tags)

  if (tags.has('power_factor')) {
    return formulaRefs(['pf_from_impedance'])
  }

  if (tags.has('rectangular_form')) {
    return formulaRefs(['polar_to_rectangular'])
  }

  if (tags.has('inductive_reactance')) {
    return formulaRefs(
      prompt.includes('impedance') ? ['inductive_reactance', 'inductor_impedance_polar'] : ['inductive_reactance'],
    )
  }

  if (tags.has('capacitive_reactance')) {
    return formulaRefs(['capacitive_reactance'])
  }

  if (tags.has('susceptance')) {
    return formulaRefs(['parallel_admittance_sum'])
  }

  if (prompt.includes('rectangular form?') || prompt.includes('expressed in rectangular form')) {
    return formulaRefs(['impedance_from_phasors'])
  }

  if (prompt.includes('power factor')) {
    return formulaRefs(['pf_from_impedance'])
  }

  if (prompt.includes('reactance')) {
    return formulaRefs(['inductive_reactance'])
  }

  if (prompt.includes('susceptance')) {
    return formulaRefs(['parallel_admittance_sum'])
  }

  if (prompt.includes('voltage') && prompt.includes('current') && prompt.includes('phasor')) {
    return formulaRefs(['polar_to_rectangular'])
  }

  if (prompt.includes('impedance') && prompt.includes('phasor')) {
    return formulaRefs(['impedance_from_phasors'])
  }

  if (prompt.includes('rlc') || tags.has('series_rcl') || tags.has('resonance')) {
    return formulaRefs(['series_rlc_impedance'])
  }

  if (tags.has('series_circuit') || prompt.includes('z_t')) {
    return formulaRefs(['series_rl_impedance'])
  }

  if (tags.has('phasors') || tags.has('impedance')) {
    return formulaRefs(['impedance_from_phasors'])
  }

  return noFormula('This item is conceptual and does not need a standalone formula card.')
}

export const quiz1516Items: StudyItem[] = legacyQuestionBank.map((question, index) =>
  cloneLegacyQuestion(question, {
    id: buildQuiz1516Id(index + 1),
    setId: 'quiz_15_16',
    formulaSupport: legacyFormulaSupport(question),
  }),
)

export const studyItems: StudyItem[] = [...quiz1516Items, ...chapter17QuizItems, ...homeworkItems]

export const studyItemLookup = Object.fromEntries(
  studyItems.map((item) => [item.id, item]),
) as Record<string, StudyItem>

function collectAnswerMix(items: StudyItem[]) {
  return Array.from(new Set(items.map((item) => item.answerSpec.kind)))
}

export const studySets: StudySet[] = [
  {
    id: 'quiz_15_16',
    category: 'quiz',
    title: 'Chapters 15-16 Quiz',
    shortTitle: 'Quiz 15-16',
    chapters: ['15', '16'],
    description:
      'The canonical 40-question combined quiz bank for Chapters 15 and 16, deduped down to one surfaced copy of each question.',
    itemIds: quiz1516Items.map((item) => item.id),
    answerMix: collectAnswerMix(quiz1516Items),
  },
  {
    id: 'quiz_17',
    category: 'quiz',
    title: 'Chapter 17 Quiz',
    shortTitle: 'Quiz 17',
    chapters: ['17'],
    description:
      'The separate Chapter 17 series-parallel ac-network quiz canonicalized from the raw screenshot captures.',
    itemIds: chapter17QuizItems.map((item) => item.id),
    answerMix: collectAnswerMix(chapter17QuizItems),
  },
  {
    id: 'hw_15',
    category: 'homework',
    title: 'Chapter 15 Homework',
    shortTitle: 'HW 15',
    chapters: ['15'],
    description:
      'Homework items for Chapter 15, with solved phasor and impedance work auto-graded where the source doc preserved the answer.',
    itemIds: homeworkItems.filter((item) => item.setId === 'hw_15').map((item) => item.id),
    answerMix: collectAnswerMix(homeworkItems.filter((item) => item.setId === 'hw_15')),
  },
  {
    id: 'hw_16',
    category: 'homework',
    title: 'Chapter 16 Homework',
    shortTitle: 'HW 16',
    chapters: ['16'],
    description:
      'Homework items for Chapter 16, organized into one surfaced set with guided self-check for the figure-dependent work.',
    itemIds: homeworkItems.filter((item) => item.setId === 'hw_16').map((item) => item.id),
    answerMix: collectAnswerMix(homeworkItems.filter((item) => item.setId === 'hw_16')),
  },
  {
    id: 'hw_17',
    category: 'homework',
    title: 'Chapter 17 Homework',
    shortTitle: 'HW 17',
    chapters: ['17'],
    description:
      'Homework items for Chapter 17, organized around the visible problem statements and formula paths from the source document.',
    itemIds: homeworkItems.filter((item) => item.setId === 'hw_17').map((item) => item.id),
    answerMix: collectAnswerMix(homeworkItems.filter((item) => item.setId === 'hw_17')),
  },
]

export const studySetLookup = Object.fromEntries(
  studySets.map((set) => [set.id, set]),
) as Record<StudySet['id'], StudySet>

export const studyFormulaLookup = formulaLookup
export { figureLookup }
