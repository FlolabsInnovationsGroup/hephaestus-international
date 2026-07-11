"""Generate public/og-image.png for Open Graph and Twitter previews."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
HERO = ROOT / "public" / "images" / "hero-background.webp"
OUTPUT = ROOT / "public" / "og-image.png"

WIDTH = 1280
HEIGHT = 720

TITLE = "Hephaestus International"
TAGLINE = "Center of Excellence and Ethics"
SUBTITLE = "From Origins to the Architecture of Intelligence."


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/georgiab.ttf" if bold else "C:/Windows/Fonts/georgia.ttf",
        "C:/Windows/Fonts/timesbd.ttf" if bold else "C:/Windows/Fonts/times.ttf",
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"
        if bold
        else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def crop_cover(img: Image.Image, width: int, height: int) -> Image.Image:
    src_w, src_h = img.size
    target_ratio = width / height
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        new_w = int(src_h * target_ratio)
        left = (src_w - new_w) // 2
        cropped = img.crop((left, 0, left + new_w, src_h))
    else:
        new_h = int(src_w / target_ratio)
        top = (src_h - new_h) // 2
        cropped = img.crop((0, top, src_w, top + new_h))

    return cropped.resize((width, height), Image.Resampling.LANCZOS)


def draw_gradient_overlay(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    for y in range(height):
        progress = y / max(height - 1, 1)
        alpha = int(210 * (progress**1.6))
        draw.line([(0, y), (width, y)], fill=(8, 12, 20, alpha))


def main() -> None:
    with Image.open(HERO) as hero:
        base = crop_cover(hero.convert("RGBA"), WIDTH, HEIGHT)

    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw_gradient_overlay(draw, WIDTH, HEIGHT)
    composed = Image.alpha_composite(base, overlay).convert("RGB")

    draw = ImageDraw.Draw(composed)
    title_font = load_font(64, bold=True)
    tagline_font = load_font(34)
    subtitle_font = load_font(26)

    margin_x = 72
    bottom_y = HEIGHT - 72

    subtitle_bbox = draw.textbbox((0, 0), SUBTITLE, font=subtitle_font)
    subtitle_h = subtitle_bbox[3] - subtitle_bbox[1]
    tagline_bbox = draw.textbbox((0, 0), TAGLINE, font=tagline_font)
    tagline_h = tagline_bbox[3] - tagline_bbox[1]
    title_bbox = draw.textbbox((0, 0), TITLE, font=title_font)
    title_h = title_bbox[3] - title_bbox[1]

    subtitle_y = bottom_y - subtitle_h
    tagline_y = subtitle_y - 18 - tagline_h
    title_y = tagline_y - 14 - title_h

    text_color = (248, 250, 252)
    accent_color = (186, 214, 245)

    draw.text((margin_x, title_y), TITLE, font=title_font, fill=text_color)
    draw.text((margin_x, tagline_y), TAGLINE, font=tagline_font, fill=accent_color)
    draw.text((margin_x, subtitle_y), SUBTITLE, font=subtitle_font, fill=text_color)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    composed.save(OUTPUT, format="PNG", optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
