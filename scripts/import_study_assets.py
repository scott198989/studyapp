from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import shutil
import stat
import zipfile
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Iterable
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = ROOT.parent / "Homeworks and Screenshots.zip"
PUBLIC_LIBRARY_DIR = ROOT / "public" / "study-library"
DOCUMENTS_DIR = PUBLIC_LIBRARY_DIR / "documents"
SCREENSHOTS_DIR = PUBLIC_LIBRARY_DIR / "screenshots"
GENERATED_DATA_PATH = ROOT / "src" / "data" / "studyLibrary.generated.ts"


@dataclass(frozen=True)
class ArchiveEntry:
    archive_path: str
    file_name: str
    extension: str
    size_bytes: int
    sha256: str
    data: bytes

    @property
    def source_folder(self) -> str:
        parts = PurePosixPath(self.archive_path).parts
        if len(parts) <= 1:
            return "Archive root"
        return parts[0]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import study assets from the uploaded archive.")
    parser.add_argument(
        "--zip",
        dest="archive_path",
        type=Path,
        default=DEFAULT_ARCHIVE,
        help="Path to the source zip archive.",
    )
    return parser.parse_args()


def compute_sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def load_archive_entries(archive_path: Path) -> list[ArchiveEntry]:
    if not archive_path.exists():
        raise FileNotFoundError(f"Archive not found: {archive_path}")

    entries: list[ArchiveEntry] = []

    with zipfile.ZipFile(archive_path) as archive:
        for info in sorted(archive.infolist(), key=lambda item: item.filename.lower()):
            if info.is_dir():
                continue

            payload = archive.read(info.filename)
            archive_entry = ArchiveEntry(
                archive_path=info.filename,
                file_name=PurePosixPath(info.filename).name,
                extension=PurePosixPath(info.filename).suffix.lower().lstrip("."),
                size_bytes=info.file_size,
                sha256=compute_sha256(payload),
                data=payload,
            )
            entries.append(archive_entry)

    return entries


def ensure_clean_output_dirs() -> None:
    if PUBLIC_LIBRARY_DIR.exists():
        shutil.rmtree(PUBLIC_LIBRARY_DIR, onexc=handle_remove_readonly)

    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)


def collapse_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def handle_remove_readonly(function, path, excinfo) -> None:
    _ = excinfo
    os.chmod(path, stat.S_IWRITE)
    function(path)


def repair_common_mojibake(value: str) -> str:
    replacements = {
        "Â°": "°",
        "Â": "",
        "â€™": "'",
        "â€œ": '"',
        "â€": '"',
        "â€”": "-",
        "â€“": "-",
        "âˆ ": "∠",
        "Î©": "Ω",
        "Î¼": "μ",
        "Ã—": "×",
    }

    repaired = value
    for broken, fixed in replacements.items():
        repaired = repaired.replace(broken, fixed)
    return repaired


def preview_text(value: str, limit: int = 260) -> str:
    normalized = collapse_whitespace(repair_common_mojibake(value))
    if len(normalized) <= limit:
        return normalized
    return normalized[: limit - 3].rstrip() + "..."


def extract_docx_text(payload: bytes) -> tuple[str, str]:
    try:
        from docx import Document

        document = Document(io.BytesIO(payload))
        text = "\n".join(paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip())
        normalized = collapse_whitespace(repair_common_mojibake(text))
        if normalized:
            return normalized, "docx_paragraphs"
    except Exception:
        pass

    try:
        import xml.etree.ElementTree as element_tree

        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            document_xml = archive.read("word/document.xml")
        root = element_tree.fromstring(document_xml)
        namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        fragments = [
            node.text.strip()
            for node in root.findall(".//w:t", namespaces)
            if node.text and node.text.strip()
        ]
        normalized = collapse_whitespace(repair_common_mojibake(" ".join(fragments)))
        if normalized:
            return normalized, "docx_xml"
    except Exception:
        pass

    return "", "none"


def build_rapidocr_engine():
    from rapidocr_onnxruntime import RapidOCR

    return RapidOCR()


def extract_pdf_text(payload: bytes, output_path: Path, ocr_engine) -> tuple[str, str, int | None]:
    page_count: int | None = None

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(payload))
        page_count = len(reader.pages)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        normalized = collapse_whitespace(repair_common_mojibake(text))
        if normalized:
            return normalized, "pdf_text", page_count
    except Exception:
        pass

    try:
        import fitz

        with fitz.open(stream=payload, filetype="pdf") as pdf_document:
            page_count = pdf_document.page_count
            page_text: list[str] = []
            temp_dir = ROOT / "tmp" / "pdf-ocr-pages"
            temp_dir.mkdir(parents=True, exist_ok=True)

            for page_index in range(pdf_document.page_count):
                pixmap = pdf_document.load_page(page_index).get_pixmap(dpi=160)
                page_image_path = temp_dir / f"{output_path.stem}-page-{page_index + 1}.png"
                pixmap.save(page_image_path)
                result, _ = ocr_engine(str(page_image_path))
                if result:
                    lines = [text.strip() for _, text, _ in result if text and text.strip()]
                    if lines:
                        page_text.append(" ".join(lines))

            shutil.rmtree(temp_dir, ignore_errors=True)
            normalized = collapse_whitespace(repair_common_mojibake("\n".join(page_text)))
            if normalized:
                return normalized, "pdf_ocr", page_count
    except Exception:
        pass

    return "", "none", page_count


def extract_image_text(image_path: Path, ocr_engine) -> tuple[str, str]:
    try:
        result, _ = ocr_engine(str(image_path))
        if result:
            lines = [text.strip() for _, text, _ in result if text and text.strip()]
            normalized = collapse_whitespace(repair_common_mojibake("\n".join(lines)))
            if normalized:
                return normalized, "image_ocr"
    except Exception:
        pass

    return "", "none"


def sort_entries(entries: Iterable[ArchiveEntry]) -> list[ArchiveEntry]:
    return sorted(entries, key=lambda entry: (entry.archive_path.lower(), entry.file_name.lower()))


def choose_canonical_entry(entries: list[ArchiveEntry]) -> ArchiveEntry:
    return sort_entries(entries)[0]


def unique_output_name(entry: ArchiveEntry, used_names: set[str]) -> str:
    candidate = entry.file_name
    if candidate not in used_names:
        used_names.add(candidate)
        return candidate

    stem = PurePosixPath(candidate).stem
    extension = PurePosixPath(candidate).suffix
    suffix = re.sub(r"[^a-z0-9]+", "-", entry.source_folder.lower()).strip("-") or "asset"
    deduped = f"{stem}-{suffix}{extension}"
    used_names.add(deduped)
    return deduped


def slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "study-asset"


def write_generated_data(stats: dict[str, object], assets: list[dict[str, object]]) -> None:
    header = "import type { StudyAsset, StudyLibraryStats } from '../types/studyLibrary'\n\n"
    stats_block = "export const studyLibraryStats: StudyLibraryStats = " + json.dumps(
        stats,
        indent=2,
        ensure_ascii=False,
    )
    assets_block = "export const studyLibraryAssets: StudyAsset[] = " + json.dumps(
        assets,
        indent=2,
        ensure_ascii=False,
    )
    GENERATED_DATA_PATH.write_text(f"{header}{stats_block}\n\n{assets_block}\n", encoding="utf-8")


def main() -> None:
    args = parse_args()
    archive_path: Path = args.archive_path.resolve()
    archive_entries = load_archive_entries(archive_path)
    grouped_entries: dict[str, list[ArchiveEntry]] = defaultdict(list)

    for entry in archive_entries:
        grouped_entries[entry.sha256].append(entry)

    ensure_clean_output_dirs()
    ocr_engine = build_rapidocr_engine()
    assets: list[dict[str, object]] = []
    used_document_names: set[str] = set()
    used_screenshot_names: set[str] = set()

    for sha256, entries in sorted(grouped_entries.items(), key=lambda item: choose_canonical_entry(item[1]).archive_path.lower()):
        canonical_entry = choose_canonical_entry(entries)
        duplicates = [entry.archive_path for entry in sort_entries(entries) if entry.archive_path != canonical_entry.archive_path]
        is_document = canonical_entry.extension in {"docx", "pdf"}
        output_directory = DOCUMENTS_DIR if is_document else SCREENSHOTS_DIR
        used_names = used_document_names if is_document else used_screenshot_names
        output_name = unique_output_name(canonical_entry, used_names)
        output_path = output_directory / output_name
        output_path.write_bytes(canonical_entry.data)

        text_source = "none"
        search_text = ""
        page_count: int | None = None

        if canonical_entry.extension == "docx":
            search_text, text_source = extract_docx_text(canonical_entry.data)
        elif canonical_entry.extension == "pdf":
            search_text, text_source, page_count = extract_pdf_text(canonical_entry.data, output_path, ocr_engine)
        elif canonical_entry.extension == "png":
            search_text, text_source = extract_image_text(output_path, ocr_engine)

        public_path = (
            f"/study-library/documents/{quote(output_name)}"
            if is_document
            else f"/study-library/screenshots/{quote(output_name)}"
        )

        asset = {
            "id": slugify(f"{canonical_entry.extension}-{PurePosixPath(output_name).stem}"),
            "kind": "document" if is_document else "screenshot",
            "title": PurePosixPath(output_name).stem,
            "originalFileName": canonical_entry.file_name,
            "sourceFolder": canonical_entry.source_folder,
            "archivePath": canonical_entry.archive_path,
            "publicPath": public_path,
            "extension": canonical_entry.extension,
            "sizeBytes": canonical_entry.size_bytes,
            "sha256": sha256,
            "duplicateArchivePaths": duplicates,
            "duplicateCount": len(duplicates),
            "searchText": search_text,
            "textPreview": preview_text(search_text),
            "textSource": text_source,
        }
        if page_count is not None:
            asset["pageCount"] = page_count

        assets.append(asset)

    assets.sort(key=lambda asset: (asset["kind"], asset["title"].lower()))
    stats = {
        "sourceArchiveName": archive_path.name,
        "sourceArchiveSizeBytes": archive_path.stat().st_size,
        "totalFiles": len(archive_entries),
        "uniqueFiles": len(assets),
        "duplicateGroups": sum(1 for entries in grouped_entries.values() if len(entries) > 1),
        "exactDuplicateFilesRemoved": len(archive_entries) - len(assets),
        "documentCount": sum(1 for asset in assets if asset["kind"] == "document"),
        "screenshotCount": sum(1 for asset in assets if asset["kind"] == "screenshot"),
    }
    write_generated_data(stats, assets)
    print(
        json.dumps(
            {
                "archive": str(archive_path),
                "stats": stats,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
