# AC Circuits Study Lab

This repository contains a local-first AC circuits study app built with React, TypeScript, and Vite.

The app is now organized around five canonical study sets:

- `quiz_15_16`: combined Chapters 15 and 16 quiz
- `quiz_17`: separate Chapter 17 quiz
- `hw_15`: Chapter 15 homework
- `hw_16`: Chapter 16 homework
- `hw_17`: Chapter 17 homework

Chapters covered:

- Chapter 15: Series AC Circuits
- Chapter 16: Parallel AC Circuits
- Chapter 17: Series-Parallel AC Networks

## Current product shape

The app now has three main surfaces:

- A set-based study flow with one surfaced canonical copy of each quiz or homework item
- A solver workspace for reusable AC-circuit formulas and machine-solvable review paths
- A source library that keeps the homework files and screenshot captures available for audit and reference

## Study model

The old single-bank assumption has been replaced with a structured study model.

What is now supported:

- `multiple_choice`
- `true_false`
- `numeric`
- `manual_check`

Homework is folded into the same study flow with hybrid grading:

- Numeric, scalar, phasor, and rectangular answers are auto-graded when the source supports a reliable keyed answer.
- Figure-heavy, sketch-based, plot-based, or OCR-ambiguous items stay in the app as `manual_check` items with guided review.

## Formula and review system

Every surfaced item now has one of these:

- structured formula metadata
- an explicit no-formula reason for concept-only prompts

Formulas stay hidden during the live run and appear after submission in review.

Review can now show:

- the correct answer or expected answer format
- rationale
- one or more formula cards
- a solver link when the formula is machine-solvable

## Canonical content rules

The surfaced experience follows these rules:

- Chapters 15 and 16 are treated as one combined quiz set
- Chapter 17 is treated as a separate quiz set
- Chapters 15, 16, and 17 each keep their own homework set
- Only one surfaced canonical copy of each item appears in the app
- Raw screenshots and homework source files remain in the repo for audit history

## Source material in the repo

Raw reference material:

- `reference-material/homework/Scott Tuschl HW Cha 15 A000834342.docx`
- `reference-material/homework/Scott Tuschl ch 16 HW (1).pdf`
- `reference-material/homework/Scott Tuschl HW 17.docx`
- `reference-material/screenshots/test-2-study-guide/`
- `reference-material/screenshots/test-2-no-2/`
- `reference-material/screenshots/test-2-no-3/`
- `reference-material/ocr/test2no2.json`

Screenshot grouping used by the app:

- `reference-material/screenshots/test-2-study-guide/` supports the combined Chapters 15-16 quiz
- `reference-material/screenshots/test-2-no-2/` and `reference-material/screenshots/test-2-no-3/` support the separate Chapter 17 quiz

Imported study-library assets tracked in the repo:

- `public/study-library/documents/`
- `public/study-library/screenshots/`
- `src/data/studyLibrary.generated.ts`

## Important implementation notes

- The legacy 40-question bank is treated as the canonical surfaced bank for the combined Chapters 15-16 quiz.
- The Chapter 17 quiz is surfaced from the screenshot batches under `test-2-no-2` and `test-2-no-3`.
- Some Chapter 17 quiz items and much of the Chapter 16 and Chapter 17 homework stay as `manual_check` items because the source figures or OCR are not reliable enough for a trustworthy auto-graded key.
- Chapter 15 homework has broader auto-graded coverage because the source document preserves more answer data clearly.
- Persisted app state is versioned at `2`, with migration/reset behavior for incompatible older local data.

## Key code areas

- Study types: `src/types/study.ts`
- Canonical study sets and items: `src/data/studyContent.ts`
- Chapter 17 quiz content: `src/data/chapter17Quiz.ts`
- Homework sets: `src/data/homeworkSets.ts`
- Formula catalog: `src/data/formulaCatalog.ts`
- Source audit map: `src/data/studySourceAudit.ts`
- Quiz engine: `src/lib/quizEngine.ts`
- Answer evaluation: `src/lib/answerEvaluation.ts`
- Solver goals: `src/data/solverGoals.ts`
- Solver engine: `src/lib/solverEngine.ts`
- Storage migration: `src/lib/storage.ts`
- Home page: `src/pages/HomePage.tsx`
- Quiz page: `src/pages/QuizPage.tsx`
- Results page: `src/pages/ResultsPage.tsx`
- Solver page: `src/pages/SolverPage.tsx`
- Study library page: `src/pages/LibraryPage.tsx`

## Local development

Install and run:

```powershell
npm ci
npm run dev
```

Quality checks:

```powershell
npm run lint
npm run test
npm run build
npm run check
```

## Source-library import workflow

If you replace the uploaded archive later, re-run the importer:

```powershell
python scripts/import_study_assets.py
```

Optional OCR workflow for raw screenshots:

```powershell
python scripts/extract_ocr.py "reference-material/screenshots/test-2-no-3" --output "reference-material/ocr/test2no3.json"
```

## GitHub sync

This repo already points at:

- [https://github.com/scott198989/studyapp](https://github.com/scott198989/studyapp)

Recommended workflow:

```powershell
git pull --ff-only
git add .
git commit -m "Describe what changed"
git push
```

GitHub syncs the code and repo-tracked study assets. Browser `localStorage` remains device-local, so quiz history, active sessions, and theme state do not sync between machines unless a backend is added later.
