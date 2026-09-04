"""Download an external preview image and convert to WebP."""
from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGE_URL = sys.argv[1]
OUT_NAME = sys.argv[2]
JPG = ROOT / "public" / "images" / f"{OUT_NAME}.jpg"
WEBP = ROOT / "public" / "images" / f"{OUT_NAME}.webp"

req = urllib.request.Request(
    IMAGE_URL,
    headers={"User-Agent": "Mozilla/5.0"},
)
with urllib.request.urlopen(req, timeout=30) as resp:
    data = resp.read()
    print("content-type:", resp.headers.get("Content-Type"))
    print("bytes:", len(data))
    JPG.write_bytes(data)

with Image.open(JPG) as img:
    rgb = img.convert("RGB")
    rgb.save(WEBP, format="WEBP", quality=85, method=6)
    print("webp size:", WEBP.stat().st_size)
    print("dimensions:", rgb.size)

JPG.unlink(missing_ok=True)
