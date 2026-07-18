from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a nearest-neighbor contact sheet from pixel PNGs."
    )
    parser.add_argument("--inputs", required=True, nargs="+", type=Path)
    parser.add_argument("--scale", required=True, type=int)
    parser.add_argument("--columns", required=True, type=int)
    parser.add_argument("--output", required=True, type=Path)
    arguments = parser.parse_args()
    if arguments.scale <= 0:
        parser.error("--scale must be a positive integer")
    if arguments.columns <= 0:
        parser.error("--columns must be a positive integer")
    return arguments


def build_contact_sheet(arguments: argparse.Namespace) -> None:
    images = [Image.open(path).convert("RGBA") for path in arguments.inputs]
    if not images:
        raise ValueError("--inputs requires at least one image")

    scaled = [
        image.resize(
            (image.width * arguments.scale, image.height * arguments.scale),
            Image.Resampling.NEAREST,
        )
        for image in images
    ]
    cell_width = max(image.width for image in scaled)
    cell_height = max(image.height for image in scaled)
    rows = math.ceil(len(scaled) / arguments.columns)
    sheet = Image.new(
        "RGBA",
        (cell_width * arguments.columns, cell_height * rows),
        (0, 0, 0, 0),
    )

    for index, image in enumerate(scaled):
        column = index % arguments.columns
        row = index // arguments.columns
        left = column * cell_width + (cell_width - image.width) // 2
        top = row * cell_height + (cell_height - image.height) // 2
        sheet.alpha_composite(image, (left, top))

    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(arguments.output, format="PNG", compress_level=9)


if __name__ == "__main__":
    build_contact_sheet(parse_arguments())
