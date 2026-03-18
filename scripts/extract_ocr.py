from __future__ import annotations

import argparse
import json
from pathlib import Path

from rapidocr_onnxruntime import RapidOCR

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}


def extract_file(engine: RapidOCR, image_path: Path) -> dict[str, object]:
    result, _ = engine(str(image_path))
    lines = []

    if result:
        for box, text, score in result:
            lines.append(
                {
                    "text": text.strip(),
                    "score": round(float(score), 6),
                    "box": [[int(point[0]), int(point[1])] for point in box],
                }
            )

    return {
        "filename": image_path.name,
        "joined_text": "\n".join(line["text"] for line in lines if line["text"]),
        "lines": lines,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract OCR text from screenshot files.")
    parser.add_argument("source_dir", type=Path, help="Directory containing screenshots.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("ocr-output.json"),
        help="Output JSON path.",
    )
    args = parser.parse_args()

    engine = RapidOCR()
    images = sorted(
        path
        for path in args.source_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
    )
    payload = [extract_file(engine, image_path) for image_path in images]

    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
