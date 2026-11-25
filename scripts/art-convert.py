"""Trim, fit and compress one generated PNG into a transparent WebP.

The image API returns 1024–1536px PNGs with a lot of empty margin and C2PA
metadata. The layout needs a predictable box, so every asset is trimmed to its
visible bounds, padded evenly and centred on the requested canvas.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def convert(src: Path, dst: Path, width: int, height: int) -> None:
    image = Image.open(src).convert("RGBA")
    alpha = image.getchannel("A")
    # A fully transparent border often still carries a 1px colour fringe.
    # Cropping to the first opaque pixel keeps that fringe out of the frame.
    bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if bounds:
        left, top, right, bottom = bounds
        pad = int(max(right - left, bottom - top) * 0.05) + 2
        image = image.crop(
            (
                max(0, left - pad),
                max(0, top - pad),
                min(image.width, right + pad),
                min(image.height, bottom + pad),
            )
        )

    image.thumbnail((width, height), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(
        image,
        ((width - image.width) // 2, (height - image.height) // 2),
        image,
    )
    dst.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dst, "WEBP", quality=84, method=6)


if __name__ == "__main__":
    source, target, w, h = sys.argv[1:5]
    convert(Path(source), Path(target), int(w), int(h))
