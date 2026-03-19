# AC Circuits Study Lab

This repository contains a local-first AC circuits study app built with React, TypeScript, and Vite.

The app is focused on Introductory Circuit Analysis chapters 15, 16, and 17:

- Chapter 15: Series AC Circuits
- Chapter 16: Parallel AC Circuits
- Chapter 17: Series-Parallel AC Networks

## App surfaces

The current product has three main surfaces:

- A quiz flow driven by the structured bank in `src/data/questionBank.part*.ts`
- A solver workspace in `src/pages/SolverPage.tsx` for AC-circuit calculations and answer-choice matching
- A repo-tracked study library in `src/pages/LibraryPage.tsx` that exposes imported homework files and screenshots from Git-tracked assets

## Mission and data rules

When adding questions into the app, preserve the source exactly:

- Use exactly what the screenshot or homework says for the prompt
- Include answer banks exactly as shown when they exist
- Attach the referenced figure when one is present
- Only add missing questions; do not create duplicate entries for material already in the app

Important implementation note:

- The current quiz data model only supports `multiple_choice` and `true_false`
- Homework prompts are open-ended problem statements, so they cannot be added cleanly without either extending the question model or creating a separate homework/problem bank view

## Source material in the repo

There are now two study-material layers in the repo:

1. Raw reference material under `reference-material/`
2. A generated canonical library under `public/study-library/`

### Raw reference material

These files remain useful for source audit work and future content expansion:

- `reference-material/homework/Scott Tuschl HW Cha 15 A000834342.docx`
- `reference-material/homework/Scott Tuschl ch 16 HW (1).pdf`
- `reference-material/homework/Scott Tuschl HW 17.docx`
- `reference-material/screenshots/test-2-study-guide/`
- `reference-material/screenshots/test-2-no-2/`
- `reference-material/screenshots/test-2-no-3/`
- `reference-material/ocr/test2no2.json`

### Generated canonical study library

The uploaded archive is normalized by `scripts/import_study_assets.py`.

What the importer does:

- Reads `Homeworks and Screenshots.zip`
- Computes SHA-256 hashes for every file
- Removes exact byte-for-byte duplicates
- Copies canonical documents into `public/study-library/documents/`
- Copies canonical screenshots into `public/study-library/screenshots/`
- Extracts searchable text from the `.docx`
- OCRs the image-based `.pdf`
- OCRs each canonical screenshot
- Generates the typed manifest at `src/data/studyLibrary.generated.ts`

Default archive path:

- `../Homeworks and Screenshots.zip` relative to the repo root

Run it again if you replace the uploaded archive:

```powershell
python scripts/import_study_assets.py
```

Current imported archive result:

- 126 files found
- 109 canonical files retained
- 17 exact duplicate files removed
- 2 homework documents retained
- 107 screenshots retained

## Current state

What has already been confirmed:

- The existing quiz bank is chapter 15 material
- `reference-material/screenshots/test-2-no-2/` is chapter 16 material
- `reference-material/screenshots/test-2-no-3/` appears to be the next test batch and likely chapter 17 material; the opening OCR text references series-parallel AC networks, but figure numbering should still be verified against the captures
- The app now includes a searchable, deduped study library route backed by Git-tracked assets

## Next content work

No new chapter 16 or chapter 17 questions have been added to `src/data/questionBank.part*.ts` yet.

The next content-ingestion pass should:

1. Extract OCR for `reference-material/screenshots/test-2-no-3/`
2. Optionally re-extract OCR for `reference-material/screenshots/test-2-study-guide/` for a full local audit trail
3. Compare the screenshot material against `src/data/questionBank.part*.ts` and `src/data/sourceAudit.ts`
4. Add any missing chapter 16 and chapter 17 quiz questions with exact wording, exact choices, source refs, and figures
5. Decide how homework problems should be represented before ingesting the chapter 15 to 17 homework prompts into the app experience

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
```

Run OCR on a raw screenshot folder:

```powershell
python scripts/extract_ocr.py "reference-material/screenshots/test-2-no-3" --output "reference-material/ocr/test2no3.json"
```

## GitHub sync across desktop and laptop

This repo already points at:

- [https://github.com/scott198989/studyapp](https://github.com/scott198989/studyapp)

Recommended workflow on either machine:

```powershell
git pull --ff-only
```

Make changes, then:

```powershell
git add .
git commit -m "Your detailed message here"
git push
```

Because the canonical study library now lives inside the repo, the imported homework files and screenshots travel with normal Git pull/push operations just like the code.

## Important sync note

GitHub now syncs:

- source code
- imported homework documents
- imported screenshots
- generated OCR/document manifest
- README and project configuration

GitHub does not sync browser `localStorage`.

That means quiz progress, recent attempts, and theme state are still per-device right now. If you want runtime study state shared automatically between desktop and laptop, the next step is adding a real backend or cloud database.

## Repo areas to continue in

- Question bank: `src/data/questionBank.part*.ts`
- Source audit map: `src/data/sourceAudit.ts`
- Figure catalog: `src/data/questionBank.helpers.ts`
- Quiz types: `src/types/quiz.ts`
- Quiz UI: `src/pages/QuizPage.tsx`
- Solver UI: `src/pages/SolverPage.tsx`
- Study library types: `src/types/studyLibrary.ts`
- Study library manifest: `src/data/studyLibrary.generated.ts`
- Asset importer: `scripts/import_study_assets.py`

## Notes for cloud work

- The canonical study library is now safe to access from both GitHub and local clones
- The figure-generation script now reads repo-local screenshots from `public/study-library/screenshots/`
- The textbook PDF used for chapter confirmation is still not included in this repo
- If homework problems should live inside the same quiz flow, the data model must be extended first
- If homework problems should live in a separate study mode, implement that mode before loading the chapter 15 to 17 homework prompts into the interactive experience

## Desktop and laptop setup checklist

If you want the laptop to behave like the desktop, use this as the standard setup.

Working desktop toolchain at the time this was written:

- Git `2.53.0.windows.1`
- Node `24.14.0`
- npm `11.9.0`
- Python `3.12.10`
- GitHub CLI `2.87.3`

Recommended laptop setup steps:

1. Install Git, Node 24, Python 3.12, and GitHub CLI on the laptop.
2. Sign into GitHub on the laptop:

```powershell
gh auth login
gh auth status
```

3. Clone the repo to the laptop. If you want the same shape as the desktop, use the same folder name:

```powershell
cd C:\Users\<your-user>\OneDrive\Desktop
git clone https://github.com/scott198989/studyapp.git StudyApp
cd StudyApp
```

4. Install the Node dependencies:

```powershell
npm ci
```

5. Install the Python packages used by the OCR and asset-import scripts:

```powershell
python -m pip install python-docx pypdf pymupdf rapidocr_onnxruntime pillow
```

6. Start the app locally:

```powershell
npm run dev
```

7. If you are using Codex or the ChatGPT desktop app on the laptop, open this repo folder as the workspace. Because the homework files, screenshots, and generated library are now in Git, the same project context will be available there after pull or clone.

Daily sync workflow on either machine:

```powershell
git pull --ff-only
npm ci
npm run dev
```

Standard save-and-sync workflow after changes:

```powershell
git add .
git commit -m "Describe what changed"
git push
```

If you add a new homework or screenshot archive later:

1. Put `Homeworks and Screenshots.zip` one folder above the repo root.
2. Run:

```powershell
python scripts/import_study_assets.py
```

3. Commit and push the updated files.

What will sync automatically through GitHub:

- app code
- README and project files
- homework documents tracked in the repo
- screenshots tracked in the repo
- generated OCR and library manifest files

What will not sync automatically yet:

- quiz history
- in-progress session state
- theme and other browser `localStorage` values

If you want those last items shared between desktop and laptop too, the next project step is adding a backend or cloud database.
