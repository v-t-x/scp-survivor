from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Normalize an image into a deterministic hard-edged pixel PNG."
    )
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--width", required=True, type=int)
    parser.add_argument("--height", required=True, type=int)
    parser.add_argument("--fit", required=True, choices=("contain", "cover"))
    parser.add_argument("--alpha", required=True, choices=("opaque", "binary"))
    parser.add_argument("--colors", required=True, type=int)
    parser.add_argument("--seam-wrap", action="store_true")
    arguments = parser.parse_args()
    if arguments.width <= 0 or arguments.height <= 0:
        parser.error("--width and --height must be positive")
    if not 1 <= arguments.colors <= 256:
        parser.error("--colors must be between 1 and 256")
    return arguments


def resize_for_fit(image: Image.Image, width: int, height: int, fit: str) -> Image.Image:
    source_width, source_height = image.size
    ratio = max(width / source_width, height / source_height) if fit == "cover" else min(
        width / source_width, height / source_height
    )
    resized_width = max(1, round(source_width * ratio))
    resized_height = max(1, round(source_height * ratio))
    resized = image.resize((resized_width, resized_height), Image.Resampling.NEAREST)

    if fit == "cover":
        left = max(0, (resized_width - width) // 2)
        top = max(0, (resized_height - height) // 2)
        return resized.crop((left, top, left + width, top + height))

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    left = (width - resized_width) // 2
    top = (height - resized_height) // 2
    canvas.alpha_composite(resized, (left, top))
    return canvas


def gate_alpha(image: Image.Image, mode: str) -> Image.Image:
    pixels = list(image.convert("RGBA").get_flattened_data())
    gated = []
    for red, green, blue, alpha in pixels:
        if mode == "opaque":
            gated.append((red, green, blue, 255))
        elif alpha >= 128:
            gated.append((red, green, blue, 255))
        else:
            gated.append((0, 0, 0, 0))
    output = Image.new("RGBA", image.size)
    output.putdata(gated)
    return output


def quantize_without_dither(image: Image.Image, colors: int) -> Image.Image:
    alpha = image.getchannel("A")
    rgb = image.convert("RGB")
    quantized = rgb.quantize(
        colors=colors,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    output = quantized.convert("RGBA")
    output.putalpha(alpha)
    return output


def wrap_seams(image: Image.Image) -> Image.Image:
    output = image.copy()
    width, height = output.size
    for y in range(height):
        output.putpixel((width - 1, y), output.getpixel((0, y)))
    for x in range(width):
        output.putpixel((x, height - 1), output.getpixel((x, 0)))
    return output


def normalize(arguments: argparse.Namespace) -> None:
    source = Image.open(arguments.input).convert("RGBA")
    resized = resize_for_fit(source, arguments.width, arguments.height, arguments.fit)
    gated = gate_alpha(resized, arguments.alpha)
    quantized = quantize_without_dither(gated, arguments.colors)
    output = wrap_seams(quantized) if arguments.seam_wrap else quantized
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(arguments.output, format="PNG", compress_level=9)


if __name__ == "__main__":
    normalize(parse_arguments())
