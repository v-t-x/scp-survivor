from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


FRAME_SIZE = 64
# Revised 48 -> 50 on 2026-07-24 from Gate 2 asset-gate feedback: with union-max
# normalization the per-motion medians land one pixel below target at 48, while
# 50 puts every motion median at 49 (display drift 1.4px <= approved 2px) and
# keeps every frame inside the approved 44-50 band.
TARGET_VISIBLE_HEIGHT = 50
MIN_VISIBLE_HEIGHT = 44
MAX_VISIBLE_HEIGHT = 50
MAX_VISIBLE_WIDTH = 60
BASELINE_Y = 56
PALETTE_COLORS = 32
DIRECTION_ORDER = ("down", "left", "right", "up")
OCCUPIED_CELLS = (0, 1, 2, 3, 6, 7, 8, 9, 10, 11,
                  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                  24, 25, 26, 27, 28, 29, 30, 31)
# The plan's constant listing stops at cell 27, but the approved 28-frame
# prototype layout (idle 0-3, forward 4-9, backward 10-15, strafeLeft 16-21,
# strafeRight 22-27) requires source cells 0-3 and 6-29; cells 30-31 are hit
# poses and must never enter the prototype sheet.
PROTOTYPE_SOURCE_CELLS = (0, 1, 2, 3, 6, 7, 8, 9, 10, 11,
                          12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                          22, 23, 24, 25, 26, 27, 28, 29)
BACKGROUND_WIDTH = 960
BACKGROUND_HEIGHT = 540
ALPHA_THRESHOLD = 128


def fail(message: str) -> None:
    raise SystemExit(message)


def cell_box(image_width: int, image_height: int, columns: int, rows: int, index: int) -> tuple[int, int, int, int]:
    column = index % columns
    row = index // columns
    left = round(column * image_width / columns)
    right = round((column + 1) * image_width / columns)
    top = round(row * image_height / rows)
    bottom = round((row + 1) * image_height / rows)
    return (left, top, right, bottom)


def cell_label(board_label: str, columns: int, index: int) -> str:
    return f"{board_label} cell {index} (row {index // columns}, column {index % columns})"


def binarize_alpha(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value >= ALPHA_THRESHOLD else 0)
    gated = Image.composite(image, Image.new("RGBA", image.size, (0, 0, 0, 0)), alpha)
    gated.putalpha(alpha)
    return gated


def extract_content(cell: Image.Image) -> Image.Image | None:
    bbox = cell.getchannel("A").getbbox()
    if bbox is None:
        return None
    return binarize_alpha(cell.crop(bbox))


def place_in_frame(content: Image.Image, label: str) -> Image.Image:
    width, height = content.size
    if not MIN_VISIBLE_HEIGHT <= height <= MAX_VISIBLE_HEIGHT:
        fail(f"visible height {height} outside {MIN_VISIBLE_HEIGHT}..{MAX_VISIBLE_HEIGHT} in {label}")
    if width > MAX_VISIBLE_WIDTH:
        fail(f"visible width {width} exceeds {MAX_VISIBLE_WIDTH} in {label}")
    # Horizontal center is fixed at x=32; the last opaque row is baseline y=56.
    left = FRAME_SIZE // 2 - width // 2
    top = BASELINE_Y - height + 1
    if left < 1 or left + width > FRAME_SIZE - 1 or top < 1:
        fail(f"subject touches the frame edge in {label}")
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    frame.alpha_composite(content, (left, top))
    return frame


def normalize_board(
    path: Path,
    columns: int,
    rows: int,
    cell_indices: tuple[int, ...],
    board_label: str,
) -> list[Image.Image]:
    image = Image.open(path).convert("RGBA")
    contents: list[tuple[int, Image.Image]] = []
    for index in cell_indices:
        cell = image.crop(cell_box(image.width, image.height, columns, rows, index))
        content = extract_content(cell)
        if content is None:
            fail(f"empty required {cell_label(board_label, columns, index)}")
        contents.append((index, content))
    union_height = max(content.height for _, content in contents)
    scale = TARGET_VISIBLE_HEIGHT / union_height
    frames = []
    for index, content in contents:
        scaled_size = (
            max(1, round(content.width * scale)),
            max(1, round(content.height * scale)),
        )
        scaled = content.resize(scaled_size, Image.Resampling.NEAREST)
        frames.append(place_in_frame(scaled, cell_label(board_label, columns, index)))
    return frames


def quantize_sheet(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    quantized = image.convert("RGB").quantize(
        colors=PALETTE_COLORS,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )
    colored = quantized.convert("RGBA")
    colored.putalpha(alpha)
    return Image.composite(colored, Image.new("RGBA", image.size, (0, 0, 0, 0)), alpha)


def save_sheet(image: Image.Image, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, format="PNG", compress_level=9)


def build_silhouette(arguments: argparse.Namespace) -> None:
    source = Image.open(arguments.input).convert("RGBA")
    content = extract_content(source)
    if content is None:
        fail("silhouette input has no non-transparent pixels")
    scale = TARGET_VISIBLE_HEIGHT / content.height
    scaled_size = (
        max(1, round(content.width * scale)),
        max(1, round(content.height * scale)),
    )
    scaled = content.resize(scaled_size, Image.Resampling.NEAREST)
    frame = place_in_frame(scaled, "silhouette input")
    save_sheet(quantize_sheet(frame), arguments.output)


def build_preview(arguments: argparse.Namespace) -> None:
    background = Image.open(arguments.background).convert("RGBA")
    if background.size != (BACKGROUND_WIDTH, BACKGROUND_HEIGHT):
        fail(f"background must be exactly 960x540, got {background.width}x{background.height}")
    silhouette = Image.open(arguments.silhouette).convert("RGBA")
    if silhouette.size != (FRAME_SIZE, FRAME_SIZE):
        fail(f"silhouette must be exactly 64x64, got {silhouette.width}x{silhouette.height}")
    left = arguments.anchor_x - FRAME_SIZE // 2
    top = arguments.anchor_y - BASELINE_Y
    if left < 0 or top < 0 or left + FRAME_SIZE > BACKGROUND_WIDTH or top + FRAME_SIZE > BACKGROUND_HEIGHT:
        fail(
            f"anchor ({arguments.anchor_x}, {arguments.anchor_y}) places the 64x64 silhouette "
            "outside the 960x540 background"
        )
    background.alpha_composite(silhouette, (left, top))
    save_sheet(background, arguments.output)


def build_prototype(arguments: argparse.Namespace) -> None:
    frames = normalize_board(arguments.down_board, 6, 6, PROTOTYPE_SOURCE_CELLS, "down board")
    sheet = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME_SIZE, 0))
    save_sheet(quantize_sheet(sheet), arguments.output)


def build_production(arguments: argparse.Namespace) -> None:
    board_paths = {
        "down": (arguments.down_board, "down board"),
        "left": (arguments.left_board, "left board"),
        "right": (arguments.right_board, "right board"),
        "up": (arguments.up_board, "up board"),
    }
    direction_frames: dict[str, list[Image.Image]] = {}
    for direction in DIRECTION_ORDER:
        path, label = board_paths[direction]
        direction_frames[direction] = normalize_board(path, 6, 6, OCCUPIED_CELLS, label)
    mirrored = all(
        right_frame.getchannel("A").tobytes()
        == left_frame.getchannel("A").transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes()
        for left_frame, right_frame in zip(direction_frames["left"], direction_frames["right"])
    )
    if mirrored:
        fail("left and right rows are exact horizontal mirrors; the right row must be drawn natively")
    hit_frames = normalize_board(arguments.down_hit_board, 2, 1, (0, 1), "down hit board")
    direction_frames["down"][28] = hit_frames[0]
    direction_frames["down"][29] = hit_frames[1]
    sheet = Image.new(
        "RGBA",
        (FRAME_SIZE * len(OCCUPIED_CELLS), FRAME_SIZE * len(DIRECTION_ORDER)),
        (0, 0, 0, 0),
    )
    for row_index, direction in enumerate(DIRECTION_ORDER):
        for frame_index, frame in enumerate(direction_frames[direction]):
            sheet.alpha_composite(frame, (frame_index * FRAME_SIZE, row_index * FRAME_SIZE))
    save_sheet(quantize_sheet(sheet), arguments.output)


def parse_arguments(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Assemble deterministic player character sprite sheets from raw boards."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    silhouette = subparsers.add_parser("silhouette", help="normalize one RGBA cutout into a 64x64 frame")
    silhouette.add_argument("--input", required=True, type=Path)
    silhouette.add_argument("--output", required=True, type=Path)
    silhouette.set_defaults(handler=build_silhouette)

    preview = subparsers.add_parser("preview", help="composite a 64x64 silhouette onto a 960x540 screenshot")
    preview.add_argument("--background", required=True, type=Path)
    preview.add_argument("--silhouette", required=True, type=Path)
    preview.add_argument("--anchor-x", required=True, type=int)
    preview.add_argument("--anchor-y", required=True, type=int)
    preview.add_argument("--output", required=True, type=Path)
    preview.set_defaults(handler=build_preview)

    prototype = subparsers.add_parser("prototype", help="pack the 28 down locomotion frames into 1792x64")
    prototype.add_argument("--down-board", required=True, type=Path)
    prototype.add_argument("--output", required=True, type=Path)
    prototype.set_defaults(handler=build_prototype)

    production = subparsers.add_parser("production", help="pack four native direction boards into 1920x256")
    production.add_argument("--down-board", required=True, type=Path)
    production.add_argument("--down-hit-board", required=True, type=Path)
    production.add_argument("--left-board", required=True, type=Path)
    production.add_argument("--right-board", required=True, type=Path)
    production.add_argument("--up-board", required=True, type=Path)
    production.add_argument("--output", required=True, type=Path)
    production.set_defaults(handler=build_production)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    arguments = parse_arguments(argv)
    arguments.handler(arguments)


if __name__ == "__main__":
    main()
