"""Download Facebook crawler OG image and convert to WebP."""
from __future__ import annotations

import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGE_URL = "https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=10234695140573798"
JPG = ROOT / "public" / "images" / "john-hazlewood-five-years-later.jpg"
WEBP = ROOT / "public" / "images" / "john-hazlewood-five-years-later.webp"

req = urllib.request.Request(
    IMAGE_URL,
    headers={"User-Agent": "facebookexternalhit/1.1"},
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
