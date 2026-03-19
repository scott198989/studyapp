from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SCREENSHOT_DIR = ROOT / 'public' / 'study-library' / 'screenshots'
FIGURE_DIR = ROOT / 'public' / 'figures'
ICON_DIR = ROOT / 'public' / 'icons'


FIGURE_SPECS = {
    'figure-15-1.png': ('Screenshot 2026-03-16 234444.png', (150, 330, 440, 545)),
    'figure-15-2.png': ('Screenshot 2026-03-16 234638.png', (160, 45, 450, 220)),
    'figure-15-3.png': ('Screenshot 2026-03-16 234734.png', (120, 40, 430, 230)),
    'figure-15-4.png': ('Screenshot 2026-03-16 234703.png', (130, 35, 430, 235)),
    'figure-15-6.png': ('Screenshot 2026-03-16 234755.png', (150, 30, 410, 190)),
}


def ensure_directories() -> None:
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)


def crop_figures() -> None:
    for output_name, (source_name, box) in FIGURE_SPECS.items():
        source_path = SCREENSHOT_DIR / source_name
        with Image.open(source_path) as image:
            cropped = image.crop(box)
            cropped.save(FIGURE_DIR / output_name)


def build_icon(size: int, output_name: str) -> None:
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    radius = int(size * 0.18)

    draw.rounded_rectangle(
        (0, 0, size, size),
        radius=radius,
        fill='#14532D',
    )

    line_width = max(10, size // 20)
    draw.arc(
        (size * 0.16, size * 0.12, size * 0.84, size * 0.82),
        start=200,
        end=340,
        fill='#F8F4EB',
        width=line_width,
    )
    draw.line(
        (size * 0.14, size * 0.42, size * 0.34, size * 0.42),
        fill='#D97706',
        width=line_width - 2,
    )
    draw.line(
        (size * 0.56, size * 0.42, size * 0.76, size * 0.42),
        fill='#D97706',
        width=line_width - 2,
    )

    font_size = size // 4
    try:
        font = ImageFont.truetype('georgia.ttf', font_size)
    except OSError:
        font = ImageFont.load_default()

    text = 'AC'
    text_box = draw.textbbox((0, 0), text, font=font)
    text_width = text_box[2] - text_box[0]
    text_height = text_box[3] - text_box[1]
    draw.text(
        ((size - text_width) / 2, size * 0.63 - text_height / 2),
        text,
        fill='#F8F4EB',
        font=font,
    )

    image.save(ICON_DIR / output_name)


def main() -> None:
    ensure_directories()
    crop_figures()
    build_icon(192, 'icon-192.png')
    build_icon(512, 'icon-512.png')


if __name__ == '__main__':
    main()
