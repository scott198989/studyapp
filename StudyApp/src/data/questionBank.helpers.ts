import type { FigureAsset, Question, SourceRef } from '../types/quiz'

export const choice = (id: string, text: string) => ({ id, text })

export const source = (
  filename: string,
  screenshotQuestionNumber: number,
  role: SourceRef['role'] = 'primary',
  notes?: string,
): SourceRef => ({
  filename,
  screenshotQuestionNumber,
  role,
  notes,
})

const tfChoices = [choice('true', 'True'), choice('false', 'False')]

export const mc = (
  id: string,
  sourceNumber: number,
  prompt: string,
  choices: [ReturnType<typeof choice>, ReturnType<typeof choice>, ReturnType<typeof choice>, ReturnType<typeof choice>],
  correctChoiceId: string,
  rationale: string,
  tags: string[],
  sourceRefs: SourceRef[],
  figureId?: string,
): Question => ({
  id,
  sourceNumbers: [sourceNumber],
  prompt,
  kind: 'multiple_choice',
  choices,
  correctChoiceId,
  rationale,
  tags,
  sourceRefs,
  figureId,
})

export const tf = (
  id: string,
  sourceNumber: number,
  prompt: string,
  correctChoiceId: 'true' | 'false',
  rationale: string,
  tags: string[],
  sourceRefs: SourceRef[],
): Question => ({
  id,
  sourceNumbers: [sourceNumber],
  prompt,
  kind: 'true_false',
  choices: tfChoices,
  correctChoiceId,
  rationale,
  tags,
  sourceRefs,
})

export const figures: FigureAsset[] = [
  {
    id: 'figure-15-1',
    label: 'Figure 15.1',
    src: '/figures/figure-15-1.png',
    alt: 'Phasor diagram showing a 6 volt vector at 200 degrees and a 4 amp vector displaced by 90 degrees.',
    caption: 'Voltage and current phasors used for rectangular-form and circuit-type questions.',
  },
  {
    id: 'figure-15-2',
    label: 'Figure 15.2',
    src: '/figures/figure-15-2.png',
    alt: 'Impedance triangle with resistance on the real axis, inductive reactance on the positive imaginary axis, and total impedance at angle theta.',
    caption: 'A standard RL impedance triangle used for angle, magnitude, and power-factor reasoning.',
  },
  {
    id: 'figure-15-3',
    label: 'Figure 15.3',
    src: '/figures/figure-15-3.png',
    alt: 'Series RLC circuit with a 100 volt source at 30 degrees, 10 ohms resistance, 20 ohms inductive reactance, and 15 ohms capacitive reactance.',
    caption: 'A mixed series RLC circuit used to reason about resonance and polar impedance.',
  },
  {
    id: 'figure-15-4',
    label: 'Figure 15.4',
    src: '/figures/figure-15-4.png',
    alt: 'Source and unknown impedance diagram with a 100 volt source at 40 degrees and 1 amp current at 10 degrees.',
    caption: 'A source and unknown impedance block used to compute rectangular impedance from phasors.',
  },
  {
    id: 'figure-15-6',
    label: 'Figure 15.6',
    src: '/figures/figure-15-6.png',
    alt: 'Series RL circuit with a 100 ohm resistor and 50 ohm inductive reactance.',
    caption: 'A simple series RL circuit used for magnitude, angle, and equivalent conversion questions.',
  },
]
