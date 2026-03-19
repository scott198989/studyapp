import { sourceAudit as legacySourceAudit } from './sourceAudit'
import type { SourceAuditRecord } from '../types/study'

function mapLegacyId(id: string) {
  const numeric = Number(id.replace('q', ''))
  return `q1516_${numeric.toString().padStart(3, '0')}`
}

const quiz17Audit: SourceAuditRecord[] = [
  { fileName: 'Screenshot 2026-03-18 054952.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_001'], note: 'Primary OCR-backed capture for Question 1.' },
  { fileName: 'Screenshot 2026-03-18 055022.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_002', 'q17_003'], note: 'Primary capture for Questions 2 and 3.' },
  { fileName: 'Screenshot 2026-03-18 055116.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_004', 'q17_005'], note: 'Primary capture for Questions 4 and 5.' },
  { fileName: 'Screenshot 2026-03-18 055205.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_006', 'q17_007'], note: 'Primary capture for Questions 6 and 7.' },
  { fileName: 'Screenshot 2026-03-18 055247.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_008', 'q17_009'], note: 'Primary capture for Questions 8 and 9.' },
  { fileName: 'Screenshot 2026-03-18 055333.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_010'], note: 'Primary capture for Question 10.' },
  { fileName: 'Screenshot 2026-03-18 055417.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_011', 'q17_012'], note: 'Primary capture for Questions 11 and 12.' },
  { fileName: 'Screenshot 2026-03-18 055536.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_013', 'q17_014'], note: 'Primary capture for Questions 13 and 14.' },
  { fileName: 'Screenshot 2026-03-18 055622.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_015'], note: 'Primary capture for Question 15.' },
  { fileName: 'Screenshot 2026-03-18 055710.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_016'], note: 'Primary capture for Question 16.' },
  { fileName: 'Screenshot 2026-03-18 055813.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_017'], note: 'Primary capture for Question 17.' },
  { fileName: 'Screenshot 2026-03-18 055830.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_018'], note: 'Primary capture for Question 18.' },
  { fileName: 'Screenshot 2026-03-18 055908.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_019', 'q17_020'], note: 'Primary capture for Questions 19 and 20.' },
  { fileName: 'Screenshot 2026-03-18 055944.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_021'], note: 'Primary capture for Question 21.' },
  { fileName: 'Screenshot 2026-03-18 060049.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_022'], note: 'Primary capture for Question 22.' },
  { fileName: 'Screenshot 2026-03-18 060117.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_023', 'q17_024'], note: 'Primary capture for Questions 23 and 24.' },
  { fileName: 'Screenshot 2026-03-18 060152.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_025', 'q17_026'], note: 'Primary capture for Questions 25 and 26.' },
  { fileName: 'Screenshot 2026-03-18 060225.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_027', 'q17_028'], note: 'Primary capture for Questions 27 and 28.' },
  { fileName: 'Screenshot 2026-03-18 060255.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_029'], note: 'Primary capture for Question 29.' },
  { fileName: 'Screenshot 2026-03-18 060324.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_030'], note: 'Primary capture for Question 30.' },
  { fileName: 'Screenshot 2026-03-18 060445.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_031'], note: 'Primary capture for Question 31.' },
  { fileName: 'Screenshot 2026-03-18 060501.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_032'], note: 'Primary capture for Question 32.' },
  { fileName: 'Screenshot 2026-03-18 060617.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_033'], note: 'Primary capture for Question 33.' },
  { fileName: 'Screenshot 2026-03-18 060656.png', studySetId: 'quiz_17', resolution: 'canonical', itemIds: ['q17_034'], note: 'Primary capture for Question 34.' },
]

const homeworkAudit: SourceAuditRecord[] = [
  {
    fileName: 'Scott Tuschl HW Cha 15 A000834342.docx',
    studySetId: 'hw_15',
    resolution: 'canonical',
    itemIds: [
      'hw15_3a', 'hw15_3b', 'hw15_3c', 'hw15_3d', 'hw15_3e',
      'hw15_5a', 'hw15_5b', 'hw15_5c', 'hw15_5d', 'hw15_5e', 'hw15_5f',
      'hw15_7a', 'hw15_7b', 'hw15_7c', 'hw15_7d', 'hw15_7e',
      'hw15_13a_rect', 'hw15_13a_polar', 'hw15_13b_rect', 'hw15_13b_polar',
      'hw15_13c_rect', 'hw15_13c_polar', 'hw15_13_diagrams',
      'hw15_17a', 'hw15_17b', 'hw15_17c', 'hw15_17d', 'hw15_17e',
      'hw15_21a', 'hw15_21b', 'hw15_21c',
      'hw15_28a', 'hw15_28b', 'hw15_28c', 'hw15_28d',
    ],
    note: 'Primary Chapter 15 homework document used for surfaced homework items.',
  },
  {
    fileName: 'Scott Tuschl ch 16 HW (1).pdf',
    studySetId: 'hw_16',
    resolution: 'canonical',
    itemIds: ['hw16_3a', 'hw16_3b', 'hw16_5a', 'hw16_5b', 'hw16_5c', 'hw16_5d', 'hw16_9', 'hw16_14', 'hw16_19', 'hw16_21'],
    note: 'Primary Chapter 16 homework PDF used for surfaced homework items.',
  },
  {
    fileName: 'Scott Tuschl HW 17.docx',
    studySetId: 'hw_17',
    resolution: 'canonical',
    itemIds: ['hw17_3', 'hw17_5', 'hw17_7', 'hw17_16', 'hw17_17'],
    note: 'Primary Chapter 17 homework document used for surfaced homework items.',
  },
]

export const studySourceAudit: SourceAuditRecord[] = [
  ...legacySourceAudit.map((record) => ({
    fileName: record.fileName,
    studySetId: 'quiz_15_16' as const,
    resolution: record.resolution,
    itemIds: record.questionIds.map((id) => mapLegacyId(id)),
    note: record.note,
  })),
  ...quiz17Audit,
  ...homeworkAudit,
]
