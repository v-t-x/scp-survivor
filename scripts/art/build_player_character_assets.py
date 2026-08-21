from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw


FRAME_SIZE = 64
# Revised 48 -> 50 on 2026-07-24 from Gate 2 asset-gate feedback: with union-max
# normalization the per-motion medians land one pixel below target at 48, while
# 50 puts every motion median at 49 (display drift 1.4px <= approved 2px) and
# keeps every frame inside the approved 44-50 band.
TARGET_VISIBLE_HEIGHT = 50
BODY_PROTOTYPE_VISIBLE_HEIGHT = 55
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
SOCKET_SCHEMA_VERSION = 1
SOCKET_ROOT_KEYS = frozenset({
    "schemaVersion",
    "frameWidth",
    "frameHeight",
    "directions",
    "frames",
})
SOCKET_FRAME_KEYS = frozenset({
    "index",
    "gripX",
    "gripY",
    "supportX",
    "supportY",
    "equipmentLayer",
})
SOCKET_COORDINATE_KEYS = ("gripX", "gripY", "supportX", "supportY")
EQUIPMENT_LAYERS = frozenset({"front", "behind"})
BODY_SHEET_SIZES = {
    28: (FRAME_SIZE * 28, FRAME_SIZE),
    120: (FRAME_SIZE * 30, FRAME_SIZE * 4),
}
BODY_VISIBLE_HEIGHT_RANGES = {
    28: (BODY_PROTOTYPE_VISIBLE_HEIGHT, BODY_PROTOTYPE_VISIBLE_HEIGHT),
    120: (MIN_VISIBLE_HEIGHT, MAX_VISIBLE_HEIGHT),
}


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


def place_in_frame(
    content: Image.Image,
    label: str,
    visible_height_range: tuple[int, int] = (MIN_VISIBLE_HEIGHT, MAX_VISIBLE_HEIGHT),
) -> Image.Image:
    width, height = content.size
    if not visible_height_range[0] <= height <= visible_height_range[1]:
        fail(
            f"visible height {height} outside "
            f"{visible_height_range[0]}..{visible_height_range[1]} in {label}"
        )
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
    target_visible_height: int = TARGET_VISIBLE_HEIGHT,
    visible_height_range: tuple[int, int] = (MIN_VISIBLE_HEIGHT, MAX_VISIBLE_HEIGHT),
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
    scale = target_visible_height / union_height
    frames = []
    for index, content in contents:
        scaled_size = (
            max(1, round(content.width * scale)),
            max(1, round(content.height * scale)),
        )
        scaled = content.resize(scaled_size, Image.Resampling.NEAREST)
        frames.append(place_in_frame(
            scaled,
            cell_label(board_label, columns, index),
            visible_height_range,
        ))
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


def build_prototype_sheet(
    path: Path,
    target_visible_height: int = TARGET_VISIBLE_HEIGHT,
    visible_height_range: tuple[int, int] = (MIN_VISIBLE_HEIGHT, MAX_VISIBLE_HEIGHT),
) -> Image.Image:
    frames = normalize_board(
        path,
        6,
        6,
        PROTOTYPE_SOURCE_CELLS,
        "down board",
        target_visible_height,
        visible_height_range,
    )
    sheet = Image.new("RGBA", (FRAME_SIZE * len(frames), FRAME_SIZE), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME_SIZE, 0))
    return quantize_sheet(sheet)


def normalized_production_frames(arguments: argparse.Namespace) -> dict[str, list[Image.Image]]:
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
    return direction_frames


def validate_each_right_frame_is_native(direction_frames: dict[str, list[Image.Image]]) -> None:
    for frame_index, (left_frame, right_frame) in enumerate(
        zip(direction_frames["left"], direction_frames["right"])
    ):
        left_shape = left_frame.getchannel("A")
        right_shape_bytes = right_frame.getchannel("A").tobytes()
        if right_shape_bytes == left_shape.tobytes():
            fail(
                f"right frame {frame_index} has the same opaque shape as left frame "
                f"{frame_index}; recoloring a copied frame is not a native right pose"
            )
        mirrored_left_shape = left_shape.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        if right_shape_bytes == mirrored_left_shape.tobytes():
            fail(
                f"right frame {frame_index} has the same opaque shape as the horizontal mirror "
                f"of left frame {frame_index}; recoloring a mirrored frame is not a native right pose"
            )


def build_production_sheet(
    arguments: argparse.Namespace,
    require_each_right_frame_native: bool = False,
) -> Image.Image:
    direction_frames = normalized_production_frames(arguments)
    if require_each_right_frame_native:
        validate_each_right_frame_is_native(direction_frames)
    sheet = Image.new(
        "RGBA",
        (FRAME_SIZE * len(OCCUPIED_CELLS), FRAME_SIZE * len(DIRECTION_ORDER)),
        (0, 0, 0, 0),
    )
    for row_index, direction in enumerate(DIRECTION_ORDER):
        for frame_index, frame in enumerate(direction_frames[direction]):
            sheet.alpha_composite(frame, (frame_index * FRAME_SIZE, row_index * FRAME_SIZE))
    return quantize_sheet(sheet)


def validate_body_sheet(image: Image.Image, frame_count: int) -> None:
    expected_size = BODY_SHEET_SIZES.get(frame_count)
    if expected_size is None:
        fail(f"frame-count must be 28 or 120, got {frame_count}")
    if image.size != expected_size:
        fail(
            f"body sheet for {frame_count} frames must be exactly "
            f"{expected_size[0]}x{expected_size[1]}, got {image.width}x{image.height}"
        )
    alpha_values = set(image.getchannel("A").get_flattened_data())
    if not alpha_values.issubset({0, 255}):
        fail("body sheet alpha must be binary (0 or 255)")
    opaque_colors = {
        pixel[:3]
        for pixel in image.get_flattened_data()
        if pixel[3] == 255
    }
    if len(opaque_colors) > PALETTE_COLORS:
        fail(f"body sheet uses {len(opaque_colors)} opaque RGB colors; maximum is {PALETTE_COLORS}")
    visible_height_range = BODY_VISIBLE_HEIGHT_RANGES[frame_count]
    columns = image.width // FRAME_SIZE
    for frame_index in range(frame_count):
        column = frame_index % columns
        row = frame_index // columns
        frame = image.crop((
            column * FRAME_SIZE,
            row * FRAME_SIZE,
            (column + 1) * FRAME_SIZE,
            (row + 1) * FRAME_SIZE,
        ))
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            fail(f"body frame {frame_index} is empty")
        _, top, _, bottom = bbox
        visible_height = bottom - top
        if not visible_height_range[0] <= visible_height <= visible_height_range[1]:
            fail(
                f"body frame {frame_index} visible height {visible_height} outside "
                f"{visible_height_range[0]}..{visible_height_range[1]}"
            )
        baseline = bottom - 1
        if abs(baseline - BASELINE_Y) > 1:
            fail(
                f"body frame {frame_index} baseline y={baseline} outside "
                f"{BASELINE_Y - 1}..{BASELINE_Y + 1}"
            )


def load_socket_source(
    path: Path,
    expected_frame_count: int,
    expected_directions: tuple[str, ...],
) -> dict:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(f"could not read socket source {path}: {error}")
    if type(payload) is not dict:
        fail("socket source root must be a JSON object")
    root_keys = set(payload)
    missing_root_keys = SOCKET_ROOT_KEYS - root_keys
    unexpected_root_keys = root_keys - SOCKET_ROOT_KEYS
    if missing_root_keys:
        fail(f"socket source missing fields: {', '.join(sorted(missing_root_keys))}")
    if unexpected_root_keys:
        fail(f"socket source has unexpected fields: {', '.join(sorted(unexpected_root_keys))}")
    if type(payload["schemaVersion"]) is not int or payload["schemaVersion"] != SOCKET_SCHEMA_VERSION:
        fail(f"schemaVersion must be integer {SOCKET_SCHEMA_VERSION}")
    if type(payload["frameWidth"]) is not int or payload["frameWidth"] != FRAME_SIZE:
        fail(f"frameWidth must be integer {FRAME_SIZE}")
    if type(payload["frameHeight"]) is not int or payload["frameHeight"] != FRAME_SIZE:
        fail(f"frameHeight must be integer {FRAME_SIZE}")
    normalized_directions = list(expected_directions)
    if payload["directions"] != normalized_directions:
        fail(f"directions must be exactly {normalized_directions}")
    frames = payload["frames"]
    if type(frames) is not list:
        fail("frames must be a JSON array")
    if len(frames) != expected_frame_count:
        fail(f"frames must contain exactly {expected_frame_count} entries, got {len(frames)}")

    normalized_frames = []
    for expected_index, frame in enumerate(frames):
        if type(frame) is not dict:
            fail(f"socket frame {expected_index} must be a JSON object")
        frame_keys = set(frame)
        missing_frame_keys = SOCKET_FRAME_KEYS - frame_keys
        unexpected_frame_keys = frame_keys - SOCKET_FRAME_KEYS
        if missing_frame_keys:
            fail(
                f"socket frame {expected_index} missing fields: "
                f"{', '.join(sorted(missing_frame_keys))}"
            )
        if unexpected_frame_keys:
            fail(
                f"socket frame {expected_index} has unexpected fields: "
                f"{', '.join(sorted(unexpected_frame_keys))}"
            )
        if type(frame["index"]) is not int or frame["index"] != expected_index:
            fail(
                f"socket frame index must be consecutive: expected {expected_index}, "
                f"got {frame['index']!r}"
            )
        for coordinate_key in SOCKET_COORDINATE_KEYS:
            coordinate = frame[coordinate_key]
            if type(coordinate) is not int:
                fail(f"socket frame {expected_index} {coordinate_key} must be an integer")
            if not 0 <= coordinate < FRAME_SIZE:
                fail(f"socket frame {expected_index} {coordinate_key} must be in 0..63")
        equipment_layer = frame["equipmentLayer"]
        if type(equipment_layer) is not str or equipment_layer not in EQUIPMENT_LAYERS:
            fail(
                f'socket frame {expected_index} equipmentLayer must be "front" or "behind"'
            )
        normalized_frames.append({
            "index": frame["index"],
            "gripX": frame["gripX"],
            "gripY": frame["gripY"],
            "supportX": frame["supportX"],
            "supportY": frame["supportY"],
            "equipmentLayer": equipment_layer,
        })
    return {
        "schemaVersion": SOCKET_SCHEMA_VERSION,
        "frameWidth": FRAME_SIZE,
        "frameHeight": FRAME_SIZE,
        "directions": normalized_directions,
        "frames": normalized_frames,
    }


def render_socket_module(socket_data: dict) -> bytes:
    entries = []
    for frame in socket_data["frames"]:
        entries.append(
            "  Object.freeze({ "
            f"index: {frame['index']}, "
            f"gripX: {frame['gripX']}, "
            f"gripY: {frame['gripY']}, "
            f"supportX: {frame['supportX']}, "
            f"supportY: {frame['supportY']}, "
            f'equipmentLayer: "{frame["equipmentLayer"]}"'
            " })"
        )
    source = (
        f"export const BODY_SOCKET_SCHEMA_VERSION = {SOCKET_SCHEMA_VERSION};\n"
        f"export const BODY_SOCKET_FRAME_COUNT = {len(socket_data['frames'])};\n"
        "export const PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS = Object.freeze([\n"
        + ",\n".join(entries)
        + "\n]);\n"
    )
    return source.encode("utf-8")


def paths_are_same(first: Path, second: Path) -> bool:
    return first.resolve(strict=False) == second.resolve(strict=False)


def prepare_output_target(path: Path) -> None:
    if path.exists() and not path.is_file():
        fail(f"output target is not a file: {path}")
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        fail(f"could not create output directory for {path}: {error}")


def temporary_path_for(target: Path) -> Path:
    file_descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{target.name}.",
        suffix=".tmp",
        dir=target.parent,
    )
    os.close(file_descriptor)
    return Path(temporary_name)


def clean_temporary_path(path: Path | None) -> None:
    if path is None:
        return
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass


def restore_target(target: Path, previous_bytes: bytes | None) -> None:
    if previous_bytes is None:
        target.unlink(missing_ok=True)
        return
    rollback_path = temporary_path_for(target)
    try:
        rollback_path.write_bytes(previous_bytes)
        rollback_path.replace(target)
    finally:
        clean_temporary_path(rollback_path)


def replace_output_pair(
    png_temporary: Path,
    socket_temporary: Path,
    png_output: Path,
    socket_output: Path,
) -> None:
    if paths_are_same(png_output, socket_output):
        fail("PNG output and socket output must be different paths")
    targets = (png_output, socket_output)
    previous = {
        target: target.read_bytes() if target.exists() else None
        for target in targets
    }
    replaced: list[Path] = []
    try:
        png_temporary.replace(png_output)
        replaced.append(png_output)
        socket_temporary.replace(socket_output)
        replaced.append(socket_output)
    except OSError as error:
        rollback_errors = []
        for target in reversed(replaced):
            try:
                restore_target(target, previous[target])
            except OSError as rollback_error:
                rollback_errors.append(f"{target}: {rollback_error}")
        if rollback_errors:
            fail(
                f"could not replace body outputs ({error}); rollback also failed: "
                + "; ".join(rollback_errors)
            )
        fail(f"could not replace body outputs: {error}")


def write_body_outputs(
    image: Image.Image,
    socket_data: dict,
    png_output: Path,
    socket_output: Path,
) -> None:
    validate_body_sheet(image, len(socket_data["frames"]))
    socket_module = render_socket_module(socket_data)
    if paths_are_same(png_output, socket_output):
        fail("PNG output and socket output must be different paths")
    prepare_output_target(png_output)
    prepare_output_target(socket_output)
    png_temporary = None
    socket_temporary = None
    try:
        png_temporary = temporary_path_for(png_output)
        image.save(png_temporary, format="PNG", compress_level=9)
        with Image.open(png_temporary) as saved:
            validate_body_sheet(saved.convert("RGBA"), len(socket_data["frames"]))
        socket_temporary = temporary_path_for(socket_output)
        socket_temporary.write_bytes(socket_module)
        if socket_temporary.read_bytes() != socket_module:
            fail("socket module temporary output did not verify byte-for-byte")
        replace_output_pair(
            png_temporary,
            socket_temporary,
            png_output,
            socket_output,
        )
    except OSError as error:
        fail(f"could not write body outputs: {error}")
    finally:
        clean_temporary_path(png_temporary)
        clean_temporary_path(socket_temporary)


def write_png_atomically(image: Image.Image, output: Path) -> None:
    prepare_output_target(output)
    temporary = None
    try:
        temporary = temporary_path_for(output)
        image.save(temporary, format="PNG", compress_level=9)
        with Image.open(temporary) as saved:
            saved.verify()
        temporary.replace(output)
    except OSError as error:
        fail(f"could not write PNG output {output}: {error}")
    finally:
        clean_temporary_path(temporary)


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
    save_sheet(build_prototype_sheet(arguments.down_board), arguments.output)


def build_production(arguments: argparse.Namespace) -> None:
    save_sheet(build_production_sheet(arguments), arguments.output)


def build_body_prototype(arguments: argparse.Namespace) -> None:
    socket_data = load_socket_source(arguments.socket_source, 28, ("down",))
    sheet = build_prototype_sheet(
        arguments.down_board,
        BODY_PROTOTYPE_VISIBLE_HEIGHT,
        BODY_VISIBLE_HEIGHT_RANGES[28],
    )
    write_body_outputs(sheet, socket_data, arguments.output, arguments.socket_output)


def build_body_production(arguments: argparse.Namespace) -> None:
    socket_data = load_socket_source(arguments.socket_source, 120, DIRECTION_ORDER)
    sheet = build_production_sheet(arguments, require_each_right_frame_native=True)
    write_body_outputs(sheet, socket_data, arguments.output, arguments.socket_output)


def build_socket_overlay(arguments: argparse.Namespace) -> None:
    if arguments.frame_count not in BODY_SHEET_SIZES:
        fail(f"frame-count must be 28 or 120, got {arguments.frame_count}")
    if paths_are_same(arguments.output, arguments.sheet):
        fail("socket overlay output must not overwrite the source sheet")
    if paths_are_same(arguments.output, arguments.socket_source):
        fail("socket overlay output must not overwrite the socket source")
    expected_directions = ("down",) if arguments.frame_count == 28 else DIRECTION_ORDER
    socket_data = load_socket_source(
        arguments.socket_source,
        arguments.frame_count,
        expected_directions,
    )
    try:
        source = Image.open(arguments.sheet).convert("RGBA")
    except (OSError, ValueError) as error:
        fail(f"could not read body sheet {arguments.sheet}: {error}")
    validate_body_sheet(source, arguments.frame_count)
    overlay = source.copy()
    drawing = ImageDraw.Draw(overlay)
    columns = overlay.width // FRAME_SIZE
    for frame in socket_data["frames"]:
        frame_index = frame["index"]
        offset_x = (frame_index % columns) * FRAME_SIZE
        offset_y = (frame_index // columns) * FRAME_SIZE
        grip = (offset_x + frame["gripX"], offset_y + frame["gripY"])
        support = (offset_x + frame["supportX"], offset_y + frame["supportY"])
        layer_color = (255, 96, 32, 255) if frame["equipmentLayer"] == "front" else (128, 96, 255, 255)
        drawing.line((support, grip), fill=(255, 224, 64, 255), width=1)
        drawing.rectangle(
            (grip[0] - 2, grip[1] - 2, grip[0] + 2, grip[1] + 2),
            outline=layer_color,
            width=1,
        )
        drawing.line(
            (support[0] - 2, support[1], support[0] + 2, support[1]),
            fill=(64, 240, 255, 255),
            width=1,
        )
        drawing.line(
            (support[0], support[1] - 2, support[0], support[1] + 2),
            fill=(64, 240, 255, 255),
            width=1,
        )
    write_png_atomically(overlay, arguments.output)


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

    body_prototype = subparsers.add_parser(
        "body-prototype",
        help="pack 28 down body-only frames and emit their validated socket module",
    )
    body_prototype.add_argument("--down-board", required=True, type=Path)
    body_prototype.add_argument("--socket-source", required=True, type=Path)
    body_prototype.add_argument("--output", required=True, type=Path)
    body_prototype.add_argument("--socket-output", required=True, type=Path)
    body_prototype.set_defaults(handler=build_body_prototype)

    production = subparsers.add_parser("production", help="pack four native direction boards into 1920x256")
    production.add_argument("--down-board", required=True, type=Path)
    production.add_argument("--down-hit-board", required=True, type=Path)
    production.add_argument("--left-board", required=True, type=Path)
    production.add_argument("--right-board", required=True, type=Path)
    production.add_argument("--up-board", required=True, type=Path)
    production.add_argument("--output", required=True, type=Path)
    production.set_defaults(handler=build_production)

    body_production = subparsers.add_parser(
        "body-production",
        help="pack 120 native body-only frames and emit their validated socket module",
    )
    body_production.add_argument("--down-board", required=True, type=Path)
    body_production.add_argument("--down-hit-board", required=True, type=Path)
    body_production.add_argument("--left-board", required=True, type=Path)
    body_production.add_argument("--right-board", required=True, type=Path)
    body_production.add_argument("--up-board", required=True, type=Path)
    body_production.add_argument("--socket-source", required=True, type=Path)
    body_production.add_argument("--output", required=True, type=Path)
    body_production.add_argument("--socket-output", required=True, type=Path)
    body_production.set_defaults(handler=build_body_production)

    socket_overlay = subparsers.add_parser(
        "socket-overlay",
        help="draw grip/support socket markers onto a read-only body sheet copy",
    )
    socket_overlay.add_argument("--sheet", required=True, type=Path)
    socket_overlay.add_argument("--socket-source", required=True, type=Path)
    socket_overlay.add_argument("--frame-count", required=True, type=int)
    socket_overlay.add_argument("--output", required=True, type=Path)
    socket_overlay.set_defaults(handler=build_socket_overlay)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    arguments = parse_arguments(argv)
    arguments.handler(arguments)


if __name__ == "__main__":
    main()
