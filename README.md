# AC Circuits Study Lab

This repository contains a local-first AC circuits study app built with React, TypeScript, and Vite.

The app is intended to help with quiz prep and homework review for Introductory Circuit Analysis chapters 15, 16, and 17:

- Chapter 15: Series AC Circuits
- Chapter 16: Parallel AC Circuits
- Chapter 17: Series-Parallel AC Networks

The current product has two main surfaces:

- A quiz flow driven by a structured question bank in `src/data/questionBank.part*.ts`
- A solver workspace in `src/pages/SolverPage.tsx` for AC-circuit calculations and answer-choice matching

## Mission And Data Rules

When adding questions into the app, preserve the source exactly:

- Use exactly what the screenshot or homework says for the prompt
- Include answer banks exactly as shown when they exist
- Attach the referenced figure when one is present
- Only add missing questions; do not create duplicate entries for material already in the app

## Current State

The app currently contains a 40-question quiz bank that maps to the screenshot set now stored at `reference-material/screenshots/test-2-study-guide/`.

What has already been confirmed:

- The existing quiz bank is chapter 15 material
- `reference-material/screenshots/test-2-no-2/` is chapter 16 material
- `reference-material/screenshots/test-2-no-3/` appears to be the next test batch and likely chapter 17 material; the opening OCR text references series-parallel AC networks, but figure numbering should still be verified against the captures
- The homework source files for chapters 15, 16, and 17 are now included in this repo under `reference-material/homework/`

Important implementation note:

- The current quiz data model only supports `multiple_choice` and `true_false`
- Homework prompts are open-ended problem statements, so they cannot be added cleanly without either extending the question model or creating a separate homework/problem bank view

## Work Completed Before Handoff

- Cloned the app fresh and installed dependencies
- Verified the app builds successfully with `npm run build`
- Confirmed the current screenshot-to-question-bank mapping for the existing chapter 15 quiz data
- Located the Google Drive screenshot folders and copied the screenshots into this repo
- Copied the chapter 15, 16, and 17 homework files into this repo
- Patched `scripts/extract_ocr.py` so it ignores non-image files like `desktop.ini`
- Completed one OCR extraction run for chapter 16 screenshots and saved it at `reference-material/ocr/test2no2.json`

## Where Work Stopped

No new chapter 16 or chapter 17 questions have been added to `src/data/questionBank.part*.ts` yet.

The next agent should pick up from the source-audit stage:

1. Extract OCR for `reference-material/screenshots/test-2-no-3/`
2. Optionally extract or re-extract OCR for `reference-material/screenshots/test-2-study-guide/` inside the repo for a full local audit trail
3. Compare the screenshot material against `src/data/questionBank.part*.ts` and `src/data/sourceAudit.ts`
4. Add any missing chapter 16 and chapter 17 quiz questions with exact wording, exact choices, source refs, and figures
5. Decide how homework problems should be represented in the app before ingesting the chapter 15, 16, and 17 homework files

## Reference Material Included In This Repo

Homework files:

- `reference-material/homework/Scott Tuschl HW Cha 15 A000834342.docx`
- `reference-material/homework/Scott Tuschl ch 16 HW (1).pdf`
- `reference-material/homework/Scott Tuschl HW 17.docx`

Screenshot folders:

- `reference-material/screenshots/test-2-study-guide/`
- `reference-material/screenshots/test-2-no-2/`
- `reference-material/screenshots/test-2-no-3/`

OCR output:

- `reference-material/ocr/test2no2.json`

## Repo Areas To Continue In

- Question bank: `src/data/questionBank.part*.ts`
- Source audit map: `src/data/sourceAudit.ts`
- Figure catalog: `src/data/questionBank.helpers.ts`
- Quiz types: `src/types/quiz.ts`
- Quiz UI: `src/pages/QuizPage.tsx`
- Solver UI: `src/pages/SolverPage.tsx`

## Local Commands

Install and run:

```bash
npm ci
npm run dev
```

Build:

```bash
npm run build
```

Run OCR on a screenshot folder:

```bash
python scripts/extract_ocr.py "reference-material/screenshots/test-2-no-3" --output "reference-material/ocr/test2no3.json"
```

## Notes For Cloud Codex

- The textbook PDF was used locally to confirm that chapters 15, 16, and 17 correspond to Series AC Circuits, Parallel AC Circuits, and Series-Parallel AC Networks
- The textbook PDF is not included in this repo
- If homework problems are meant to appear inside the same quiz flow, the data model must be extended first
- If homework problems should live in a separate study mode, implement that mode before loading the chapter 15 to 17 homework prompts
