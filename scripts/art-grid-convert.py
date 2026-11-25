"""Crop one quadrant of a 2x2 sheet, trim it and fit it onto a square canvas."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def convert(src: Path, dst: Path, quadrant: int, size: int) -> None:
    image = Image.open(src).convert("RGBA")
    half_w, half_h = image.width // 2, image.height // 2
    left = (quadrant % 2) * half_w
    top = (quadrant // 2) * half_h
    cell = image.crop((left, top, left + half_w, top + half_h))

    alpha = cell.getchannel("A")
    bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bounds:
        x0, y0, x1, y1 = bounds
        pad = int(max(x1 - x0, y1 - y0) * 0.05) + 2
        cell = cell.crop(
            (
                max(0, x0 - pad),
                max(0, y0 - pad),
                min(cell.width, x1 + pad),
                min(cell.height, y1 + pad),
            )
        )

    cell.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(cell, ((size - cell.width) // 2, (size - cell.height) // 2), cell)
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, "WEBP", quality=84, method=6)


if __name__ == "__main__":
    source, target, quadrant, size = sys.argv[1:5]
    convert(Path(source), Path(target), int(quadrant), int(size))
