"""Remove solid/near-black backgrounds from ecosystem card PNGs."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "public" / "images"
FILES = ["flobrain.png", "caipo.png", "robocolective.png"]
# Higher ceiling so charcoal plates and fringes are treated as background.
THRESHOLD = 48
SOFT = 40


def remove_black_background(src: Path, dst: Path) -> None:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    pix = im.load()
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def darkness(x: int, y: int) -> int:
        r, g, b, _a = pix[x, y]
        return max(r, g, b)

    def try_add(x: int, y: int) -> None:
        i = y * w + x
        if seen[i]:
            return
        r, g, b, a = pix[x, y]
        # Seed through already-transparent plate or dark pixels.
        if a < 16 or max(r, g, b) <= THRESHOLD + SOFT:
            seen[i] = 1
            q.append((x, y))

    for x in range(w):
        try_add(x, 0)
        try_add(x, h - 1)
    for y in range(h):
        try_add(0, y)
        try_add(w - 1, y)

    # Also seed from any existing transparent pixel so leftover dark islands clear.
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if pix[x, y][3] < 16:
                try_add(x, y)

    cleared = 0
    while q:
        x, y = q.popleft()
        r, g, b, a = pix[x, y]
        m = max(r, g, b)
        if a < 16 or m <= THRESHOLD:
            if a != 0 or (r, g, b) != (0, 0, 0):
                pix[x, y] = (0, 0, 0, 0)
                cleared += 1
        elif m <= THRESHOLD + SOFT:
            alpha = int(255 * (m - THRESHOLD) / SOFT)
            pix[x, y] = (r, g, b, min(a, alpha))
            cleared += 1
        else:
            continue
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if seen[i]:
                    continue
                nr, ng, nb, na = pix[nx, ny]
                if na < 16 or max(nr, ng, nb) <= THRESHOLD + SOFT:
                    seen[i] = 1
                    q.append((nx, ny))

    im.save(dst, "PNG", optimize=True)
    print(f"{src.name}: {w}x{h}, updated={cleared:,} -> {dst.stat().st_size:,} bytes")


def main() -> None:
    for name in FILES:
        path = ROOT / name
        if not path.exists():
            print(f"missing: {path}")
            continue
        tmp = path.with_suffix(".transparent.png")
        remove_black_background(path, tmp)
        tmp.replace(path)
        print(f"replaced {name}")


if __name__ == "__main__":
    main()
