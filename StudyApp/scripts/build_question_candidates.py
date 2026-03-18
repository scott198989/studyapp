from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Iterable


QUESTION_PATTERN = re.compile(r"Question\s*(\d{1,2})", re.IGNORECASE)
CHOICE_PATTERN = re.compile(r"^[O0\s]*([A-D])\)\s*(.*)$")


def iter_question_blocks(lines: list[str]) -> Iterable[tuple[int, list[str]]]:
    current_number: int | None = None
    current_lines: list[str] = []

    for line in lines:
        line = line.strip()
        match = QUESTION_PATTERN.match(line)
        if match:
            if current_number is not None and current_lines:
                yield current_number, current_lines
            current_number = int(match.group(1))
            current_lines = [line]
            continue

        if current_number is not None:
            current_lines.append(line)

    if current_number is not None and current_lines:
        yield current_number, current_lines


def parse_block(question_number: int, block_lines: list[str], filename: str) -> dict[str, object]:
    body_lines = [line for line in block_lines[1:] if line]
    prompt_lines: list[str] = []
    choices: list[dict[str, str]] = []
    current_choice: dict[str, str] | None = None
    true_false_tokens: list[str] = []

    for raw_line in body_lines:
        line = raw_line.strip()
        normalized = line.removeprefix("O").strip()

        if normalized in {"True", "False"}:
            true_false_tokens.append(normalized)
            continue

        choice_match = CHOICE_PATTERN.match(line)
        if choice_match:
            current_choice = {"id": choice_match.group(1), "text": choice_match.group(2).strip()}
            choices.append(current_choice)
            continue

        if current_choice is not None:
            current_choice["text"] = f"{current_choice['text']} {line}".strip()
            continue

        prompt_lines.append(line)

    kind = "multiple_choice"
    if not choices and true_false_tokens:
        kind = "true_false"
        choices = [{"id": token[0].upper(), "text": token} for token in true_false_tokens]

    return {
        "question_number": question_number,
        "filename": filename,
        "line_count": len(block_lines),
        "kind": kind,
        "prompt": " ".join(prompt_lines).strip(),
        "choices": choices,
        "raw_lines": block_lines,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Turn OCR lines into question candidates.")
    parser.add_argument("ocr_json", type=Path)
    parser.add_argument("--output", type=Path, default=Path("question-candidates.json"))
    parser.add_argument(
        "--include-prefix",
        action="append",
        default=[],
        help="Only include OCR entries whose filename starts with this prefix. Repeatable.",
    )
    args = parser.parse_args()

    payload = json.loads(args.ocr_json.read_text(encoding="utf-8"))
    by_question: dict[int, list[dict[str, object]]] = {}

    for entry in payload:
        if args.include_prefix and not any(
            entry["filename"].startswith(prefix) for prefix in args.include_prefix
        ):
            continue
        lines = [line["text"] for line in entry["lines"] if line["text"].strip()]
        for question_number, block_lines in iter_question_blocks(lines):
            candidate = parse_block(question_number, block_lines, entry["filename"])
            by_question.setdefault(question_number, []).append(candidate)

    resolved: list[dict[str, object]] = []
    for question_number in sorted(by_question):
        best = max(
            by_question[question_number],
            key=lambda candidate: (len(candidate["prompt"]), len(candidate["choices"]), candidate["line_count"]),
        )
        resolved.append(
            {
                "question_number": question_number,
                "best_candidate": best,
                "alternates": by_question[question_number],
            }
        )

    args.output.write_text(json.dumps(resolved, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
