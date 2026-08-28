from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

from PIL import Image


ALPHA_VALUES = frozenset({0, 255})
MAX_COLORS = 32
DIRECTIONS = ("down", "left", "right", "up")
SCOPES = ("gate1", "gate2", "gate3", "r17-all", "gate4a", "gate4", "all")
R17_ORDER = ("r17DrifterActionSheet", "r17RiftSkimmerActionSheet", "r17PulseSacActionSheet", "r17CarapaceGateActionSheet", "r17FrameGapActionSheet", "r17BroodMassActionSheet", "r17BudActionSheet")
GATE1_STATIC = {
    "r17-drifter.png": (48, 48), "r17-rift-skimmer.png": (48, 48),
    "r17-pulse-sac.png": (48, 48), "r17-carapace-gate.png": (64, 64),
    "r17-frame-gap.png": (64, 64), "r17-brood-mass.png": (64, 64),
    "r17-bud.png": (32, 32), "scp-049.png": (80, 96),
}


def fail(message: str) -> None:
    raise SystemExit(message)


def paths_are_same(first: Path, second: Path) -> bool:
    return first.resolve(strict=False) == second.resolve(strict=False)


def require_distinct_output(output: Path, inputs: tuple[Path, ...]) -> None:
    if any(paths_are_same(output, source) for source in inputs):
        fail("output path must differ from every input path")


def require_output_parent(output: Path, parent: Path | None) -> None:
    allowed = (parent or output.parent).resolve(strict=False)
    try: output.resolve(strict=False).relative_to(allowed)
    except ValueError: fail(f"output must be inside requested parent: {allowed}")


def load_contract(path: Path) -> dict:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(f"could not read contract {path}: {error}")
    if type(payload) is not dict or payload.get("schemaVersion") != 1:
        fail("contract schemaVersion must be integer 1")
    return payload


def open_rgba(path: Path, label: str) -> Image.Image:
    if not path.is_file():
        fail(f"missing {label}: {path}")
    try:
        with Image.open(path) as source:
            if source.format != "PNG": fail(f"{label} must be a PNG")
            if source.mode != "RGBA":
                fail(f"{label} must be an 8-bit RGBA PNG")
            return source.copy()
    except OSError as error:
        fail(f"could not read {label} {path}: {error}")


def temporary_path_for(target: Path) -> Path:
    descriptor, name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".tmp", dir=target.parent)
    os.close(descriptor)
    return Path(name)


def clean_temporary_path(path: Path | None) -> None:
    if path is not None:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass


def write_png_atomically(image: Image.Image, output: Path) -> None:
    if output.exists() and not output.is_file():
        fail(f"output target is not a file: {output}")
    try:
        output.parent.mkdir(parents=True, exist_ok=True)
    except OSError as error:
        fail(f"could not create output parent {output.parent}: {error}")
    temporary = None
    try:
        temporary = temporary_path_for(output)
        image.convert("RGBA").save(temporary, format="PNG", compress_level=9)
        with Image.open(temporary) as saved:
            saved.verify()
        temporary.replace(output)
    except (OSError, ValueError) as error:
        fail(f"could not write PNG output {output}: {error}")
    finally:
        clean_temporary_path(temporary)


def cell_box(image: Image.Image, columns: int, cells: int, index: int) -> tuple[int, int, int, int]:
    if columns <= 0 or cells <= 0 or index < 0 or index >= cells:
        fail("invalid board cell layout")
    rows = (cells + columns - 1) // columns
    if image.width % columns or image.height % rows:
        fail(f"board dimensions {image.width}x{image.height} do not divide {columns}x{rows} cells")
    width, height = image.width // columns, image.height // rows
    return (index % columns * width, index // columns * height, (index % columns + 1) * width, (index // columns + 1) * height)


def opaque_components(alpha: Image.Image) -> list[int]:
    width, height = alpha.size
    pixels = alpha.load()
    seen: set[tuple[int, int]] = set()
    components = []
    for y in range(height):
        for x in range(width):
            if pixels[x, y] != 255 or (x, y) in seen:
                continue
            stack = [(x, y)]; seen.add((x, y)); size = 0
            while stack:
                px, py = stack.pop(); size += 1
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] == 255 and (nx, ny) not in seen:
                        seen.add((nx, ny)); stack.append((nx, ny))
            components.append(size)
    return components


def validate_frame_pixels(frame: Image.Image, label: str) -> None:
    image = frame.convert("RGBA")
    alpha = image.getchannel("A")
    values = set(alpha.get_flattened_data())
    if not values.issubset(ALPHA_VALUES):
        fail(f"{label} alpha must be binary (0 or 255)")
    bbox = alpha.getbbox()
    if bbox is None:
        fail(f"{label} is empty")
    if bbox[0] == 0 or bbox[1] == 0 or bbox[2] == image.width or bbox[3] == image.height:
        fail(f"{label} subject touches the frame edge")
    colors = {pixel[:3] for pixel in image.get_flattened_data() if pixel[3] == 255}
    if len(colors) > MAX_COLORS:
        fail(f"{label} uses {len(colors)} opaque colors; maximum is {MAX_COLORS}")
    if any(size == 1 for size in opaque_components(alpha)):
        fail(f"{label} has isolated single-pixel component")


def content(frame: Image.Image, label: str) -> Image.Image:
    validate_frame_pixels(frame, label)
    bbox = frame.getchannel("A").getbbox()
    assert bbox is not None
    return frame.crop(bbox)


def normalized_frames(board_path: Path, count: int, frame_width: int, frame_height: int, label: str, board_cells: int | None = None, start: int = 0) -> list[Image.Image]:
    board = open_rgba(board_path, label)
    contents = []
    board_cells = board_cells or count
    for index in range(start, start + count):
        cell = board.crop(cell_box(board, board_cells, board_cells, index))
        contents.append(content(cell, f"{label} cell {index}"))
    max_height = max(frame.height for frame in contents)
    # One shared scale per clip is intentional: its shorter poses must remain shorter.
    scale = min((frame_width - 2) / max(frame.width for frame in contents), (frame_height - 2) / max_height)
    normalized = []
    for index, source in enumerate(contents):
        size = (max(1, round(source.width * scale)), max(1, round(source.height * scale)))
        scaled = source.resize(size, Image.Resampling.NEAREST)
        frame = Image.new("RGBA", (frame_width, frame_height), (0, 0, 0, 0))
        left = (frame_width - scaled.width) // 2
        top = frame_height - 1 - scaled.height
        if left < 1 or top < 1 or left + scaled.width >= frame_width or top + scaled.height >= frame_height:
            fail(f"{label} cell {index} cannot fit within frame safely")
        frame.alpha_composite(scaled, (left, top))
        validate_frame_pixels(frame, f"{label} normalized cell {index}")
        normalized.append(frame)
    return normalized


def normalized_shape(frame: Image.Image) -> bytes:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        return b""
    return alpha.crop(bbox).tobytes() + str((bbox[2] - bbox[0], bbox[3] - bbox[1])).encode()


def validate_motion_frames(frames: list[Image.Image], label: str) -> None:
    if len(frames) < 2:
        return
    hashes = [normalized_shape(frame) for frame in frames]
    if len(set(hashes)) != len(hashes):
        fail(f"{label} has identical pose hashes, recolor-only motion, or translated-copy-only motion")


def validate_alignment(frames: list[Image.Image], label: str) -> None:
    boxes = [frame.getchannel("A").getbbox() for frame in frames]
    centers = [(box[0] + box[2] - 1) / 2 for box in boxes if box]
    baselines = [box[3] - 1 for box in boxes if box]
    if max(centers) - min(centers) > 0.5 or len(set(baselines)) != 1:
        fail(f"{label} frames do not share a stable center and baseline")


def validate_native_scp049_sides(left: list[Image.Image], right: list[Image.Image]) -> None:
    for index, (left_frame, right_frame) in enumerate(zip(left, right)):
        left_alpha = left_frame.getchannel("A"); right_alpha = right_frame.getchannel("A")
        left_box, right_box = left_alpha.getbbox(), right_alpha.getbbox()
        if left_box is None or right_box is None: fail(f"SCP-049 side frame {index} is empty")
        left_shape, right_shape = left_alpha.crop(left_box), right_alpha.crop(right_box)
        if right_shape.tobytes() == left_shape.tobytes() or right_shape.tobytes() == left_shape.transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes():
            fail(f"SCP-049 right frame {index} reuses an exact left or left-mirror pose")


def build_r17_action(arguments: argparse.Namespace) -> None:
    contract = load_contract(arguments.contract)
    entry = contract.get(arguments.asset_id)
    if type(entry) is not dict or entry.get("kind") != "r17":
        fail(f"--asset-id must name an R-17 contract entry, got {arguments.asset_id}")
    expected_role_count = sum(clip["end"] - clip["start"] + 1 for name, clip in entry["clips"].items() if name not in {"move", "hit", "death"})
    require_output_parent(arguments.output, arguments.output_parent)
    require_distinct_output(arguments.output, (arguments.move_board, arguments.hit_board, arguments.death_board, arguments.role_board))
    width, height = entry["frameWidth"], entry["frameHeight"]
    role_name = next(name for name in entry["clips"] if name not in {"move", "hit", "death"})
    groups = [
        (arguments.move_board, 6, "move board"), (arguments.hit_board, 2, "hit board"),
        (arguments.death_board, 6, "death board")]
    role_start = 0
    for role_name, clip in entry["clips"].items():
        if role_name not in {"move", "hit", "death"}:
            role_count = clip["end"] - clip["start"] + 1
            groups.append((arguments.role_board, role_count, f"{role_name} board", expected_role_count, role_start)); role_start += role_count
    frames = []
    for group_spec in groups:
        path, count, label, *layout = group_spec
        group = normalized_frames(path, count, width, height, label, *layout) if layout else normalized_frames(path, count, width, height, label)
        validate_motion_frames(group, label); validate_alignment(group, label)
        frames.extend(group)
    if len(frames) != entry["frameCount"]:
        fail(f"packed frame count does not match contract for {arguments.asset_id}")
    sheet = Image.new("RGBA", (entry["sheetWidth"], entry["sheetHeight"]), (0, 0, 0, 0))
    for index, frame in enumerate(frames): sheet.alpha_composite(frame, (index * width, 0))
    write_png_atomically(sheet, arguments.output)


def build_locomotion(arguments: argparse.Namespace) -> None:
    contract = load_contract(arguments.contract)["enemyScp049LocomotionSheet"]
    width, height = contract["frameWidth"], contract["frameHeight"]
    paths = (arguments.down_board, arguments.left_board, arguments.right_board, arguments.up_board)
    require_output_parent(arguments.output, arguments.output_parent)
    require_distinct_output(arguments.output, paths)
    rows = []
    for direction, path in zip(DIRECTIONS, paths):
        idle = normalized_frames(path, 4, width, height, f"{direction} idle", 10, 0)
        walk = normalized_frames(path, 6, width, height, f"{direction} walk", 10, 4)
        rows.append(idle + walk)
    for direction, row in zip(DIRECTIONS, rows):
        validate_motion_frames(row[:4], f"{direction} idle"); validate_alignment(row[:4], f"{direction} idle")
        validate_motion_frames(row[4:], f"{direction} walk"); validate_alignment(row[4:], f"{direction} walk")
    validate_native_scp049_sides(rows[1], rows[2])
    sheet = Image.new("RGBA", (contract["sheetWidth"], contract["sheetHeight"]), (0, 0, 0, 0))
    for row_index, row in enumerate(rows):
        for frame_index, frame in enumerate(row): sheet.alpha_composite(frame, (frame_index * width, row_index * height))
    write_png_atomically(sheet, arguments.output)


def build_scp049_action(arguments: argparse.Namespace) -> None:
    contract = load_contract(arguments.contract)["enemyScp049ActionSheet"]
    width, height = contract["frameWidth"], contract["frameHeight"]
    require_output_parent(arguments.output, arguments.output_parent)
    require_distinct_output(arguments.output, (arguments.frenzy_enter_board, arguments.frenzy_loop_board, arguments.hit_overlay_board, arguments.recontain_board))
    groups = ((arguments.frenzy_enter_board, 5, "frenzy-enter board"), (arguments.frenzy_loop_board, 4, "frenzy-loop board"), (arguments.hit_overlay_board, 2, "hit-overlay board"), (arguments.recontain_board, 8, "recontain board"))
    frames = []
    for board, count, label in groups:
        group = normalized_frames(board, count, width, height, label); validate_motion_frames(group, label); validate_alignment(group, label); frames.extend(group)
    sheet = Image.new("RGBA", (contract["sheetWidth"], contract["sheetHeight"]), (0, 0, 0, 0))
    for index, frame in enumerate(frames): sheet.alpha_composite(frame, (index * width, 0))
    write_png_atomically(sheet, arguments.output)


def build_silhouette(arguments: argparse.Namespace) -> None:
    if paths_are_same(arguments.input, arguments.output): fail("input and output paths must differ")
    source = content(open_rgba(arguments.input, "silhouette input"), "silhouette input")
    require_output_parent(arguments.output, arguments.output_parent)
    canvas = Image.new("RGBA", (arguments.frame_width, arguments.frame_height), (0, 0, 0, 0))
    scale = min((arguments.frame_width - 2) / source.width, (arguments.frame_height - 2) / source.height, 1)
    if scale < 1: source = source.resize((max(1, round(source.width * scale)), max(1, round(source.height * scale))), Image.Resampling.NEAREST)
    canvas.alpha_composite(source, ((arguments.frame_width - source.width) // 2, arguments.frame_height - 1 - source.height))
    validate_frame_pixels(canvas, "silhouette output")
    write_png_atomically(canvas, arguments.output)


def build_extract_frame(arguments: argparse.Namespace) -> None:
    if paths_are_same(arguments.sheet, arguments.output): fail("sheet and output paths must differ")
    sheet = open_rgba(arguments.sheet, "sheet")
    require_output_parent(arguments.output, arguments.output_parent)
    if sheet.width % arguments.frame_width or sheet.height % arguments.frame_height: fail("sheet dimensions do not divide frame dimensions")
    columns = sheet.width // arguments.frame_width; rows = sheet.height // arguments.frame_height
    if not 0 <= arguments.frame_index < columns * rows: fail("--frame-index is outside the sheet")
    index = arguments.frame_index
    frame = sheet.crop((index % columns * arguments.frame_width, index // columns * arguments.frame_height, (index % columns + 1) * arguments.frame_width, (index // columns + 1) * arguments.frame_height))
    write_png_atomically(frame, arguments.output)


def reject_public_output(output: Path) -> None:
    if "public" in {part.lower() for part in output.resolve(strict=False).parts}:
        fail("lineup and review-board outputs must not write to public")


def build_lineup(arguments: argparse.Namespace) -> None:
    reject_public_output(arguments.output)
    require_output_parent(arguments.output, arguments.output_parent)
    require_distinct_output(arguments.output, (arguments.background, arguments.player, arguments.r17_drifter, arguments.r17_rift_skimmer, arguments.r17_pulse_sac, arguments.r17_carapace_gate, arguments.r17_frame_gap, arguments.r17_brood_mass, arguments.r17_bud, arguments.scp049))
    background = open_rgba(arguments.background, "lineup background")
    if background.size != (960, 540): fail("lineup background must be exactly 960x540")
    sheet = background.copy()
    paths = (arguments.player, arguments.r17_drifter, arguments.r17_rift_skimmer, arguments.r17_pulse_sac, arguments.r17_carapace_gate, arguments.r17_frame_gap, arguments.r17_brood_mass, arguments.r17_bud, arguments.scp049)
    images = [open_rgba(path, "lineup input") for path in paths]
    columns = 5
    for index, image in enumerate(images):
        x = (index % columns) * 192 + (192 - image.width) // 2
        y = (index // columns) * 270 + (270 - image.height) // 2
        sheet.alpha_composite(image, (x, y))
    write_png_atomically(sheet, arguments.output)


def build_review_board(arguments: argparse.Namespace) -> None:
    reject_public_output(arguments.output)
    require_output_parent(arguments.output, arguments.output_parent)
    require_distinct_output(arguments.output, (arguments.native_lineup, arguments.zoomed_lineup, arguments.gameplay_lineup))
    images = [open_rgba(path, "review input") for path in (arguments.native_lineup, arguments.zoomed_lineup, arguments.gameplay_lineup)]
    width, height = max(image.width for image in images), sum(image.height for image in images)
    sheet = Image.new("RGBA", (width, height), (0, 0, 0, 0)); top = 0
    for image in images:
        sheet.alpha_composite(image, ((width - image.width) // 2, top)); top += image.height
    write_png_atomically(sheet, arguments.output)


def expected_ids(scope: str) -> tuple[str, ...]:
    gate2 = ("r17RiftSkimmerActionSheet", "r17BudActionSheet", "r17FrameGapActionSheet")
    gate3 = ("r17DrifterActionSheet", "r17PulseSacActionSheet", "r17CarapaceGateActionSheet", "r17BroodMassActionSheet")
    if scope == "gate2": return gate2
    if scope == "gate3": return gate3
    if scope == "r17-all": return R17_ORDER
    if scope == "gate4a": return ("enemyScp049LocomotionSheet",)
    if scope == "gate4": return ("enemyScp049LocomotionSheet", "enemyScp049ActionSheet")
    if scope == "all": return R17_ORDER + expected_ids("gate4")
    return ()


def validate_root(arguments: argparse.Namespace) -> None:
    contract = load_contract(arguments.contract)
    if arguments.scope in {"gate1", "all"}:
        for basename, expected_size in GATE1_STATIC.items():
            matches = list(arguments.asset_root.rglob(basename))
            if len(matches) != 1:
                fail(f"Gate 1 {basename} requires exactly one match beneath asset root; found {len(matches)}")
            static = open_rgba(matches[0], basename)
            if static.size != expected_size:
                fail(f"Gate 1 {basename} must be {expected_size[0]}x{expected_size[1]}")
            validate_frame_pixels(static, f"Gate 1 {basename}")
        if arguments.scope == "gate1":
            return
    for asset_id in expected_ids(arguments.scope):
        entry = contract[asset_id]
        matches = list(arguments.asset_root.rglob(Path(entry["productionPath"]).name))
        if len(matches) != 1: fail(f"{asset_id} requires exactly one production basename match beneath asset root; found {len(matches)}")
        image = open_rgba(matches[0], asset_id)
        if image.size != (entry["sheetWidth"], entry["sheetHeight"]): fail(f"{asset_id} has wrong canvas size {image.size}")
        width, height, count = entry["frameWidth"], entry["frameHeight"], entry["frameCount"]
        if entry["kind"] == "scp049-locomotion":
            rows = []
            for row in range(4):
                frames = [image.crop((index * width, row * height, (index + 1) * width, (row + 1) * height)) for index in range(10)]
                for index, frame in enumerate(frames): validate_frame_pixels(frame, f"{asset_id} frame {row}:{index}")
                validate_motion_frames(frames[:4], f"{asset_id} row {row} idle"); validate_motion_frames(frames[4:], f"{asset_id} row {row} walk"); validate_alignment(frames[:4], f"{asset_id} row {row} idle"); validate_alignment(frames[4:], f"{asset_id} row {row} walk"); rows.append(frames)
            validate_native_scp049_sides(rows[1], rows[2])
        else:
            frames = [image.crop((index * width, 0, (index + 1) * width, height)) for index in range(count)]
            for index, frame in enumerate(frames): validate_frame_pixels(frame, f"{asset_id} frame {index}")
            clips = entry["clips"]
            for name, clip in clips.items():
                segment = frames[clip["start"]:clip["end"] + 1]
                validate_motion_frames(segment, f"{asset_id} {name}"); validate_alignment(segment, f"{asset_id} {name}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build deterministic enemy and SCP-049 pixel assets.")
    sub = parser.add_subparsers(dest="command", required=True)
    silhouette = sub.add_parser("silhouette"); silhouette.add_argument("--input", type=Path, required=True); silhouette.add_argument("--frame-width", type=int, required=True); silhouette.add_argument("--frame-height", type=int, required=True); silhouette.add_argument("--output", type=Path, required=True); silhouette.add_argument("--output-parent", type=Path)
    extract = sub.add_parser("extract-frame"); extract.add_argument("--sheet", type=Path, required=True); extract.add_argument("--frame-width", type=int, required=True); extract.add_argument("--frame-height", type=int, required=True); extract.add_argument("--frame-index", type=int, required=True); extract.add_argument("--output", type=Path, required=True); extract.add_argument("--output-parent", type=Path)
    r17 = sub.add_parser("r17-action"); r17.add_argument("--contract", type=Path, required=True); r17.add_argument("--asset-id", required=True, choices=R17_ORDER); r17.add_argument("--move-board", type=Path, required=True); r17.add_argument("--hit-board", type=Path, required=True); r17.add_argument("--death-board", type=Path, required=True); r17.add_argument("--role-board", type=Path, required=True); r17.add_argument("--output", type=Path, required=True); r17.add_argument("--output-parent", type=Path)
    locomotion = sub.add_parser("scp049-locomotion"); locomotion.add_argument("--contract", type=Path, required=True); [locomotion.add_argument(f"--{direction}-board", type=Path, required=True) for direction in DIRECTIONS]; locomotion.add_argument("--output", type=Path, required=True); locomotion.add_argument("--output-parent", type=Path)
    action = sub.add_parser("scp049-action"); action.add_argument("--contract", type=Path, required=True); [action.add_argument(f"--{name}-board", type=Path, required=True) for name in ("frenzy-enter", "frenzy-loop", "hit-overlay", "recontain")]; action.add_argument("--output", type=Path, required=True); action.add_argument("--output-parent", type=Path)
    lineup = sub.add_parser("lineup")
    lineup.add_argument("--background", type=Path, required=True); lineup.add_argument("--player", type=Path, required=True)
    for name in ("r17-drifter", "r17-rift-skimmer", "r17-pulse-sac", "r17-carapace-gate", "r17-frame-gap", "r17-brood-mass", "r17-bud"):
        lineup.add_argument(f"--{name}", type=Path, required=True)
    lineup.add_argument("--scp049", type=Path, required=True); lineup.add_argument("--output", type=Path, required=True); lineup.add_argument("--output-parent", type=Path)
    review = sub.add_parser("review-board"); review.add_argument("--native-lineup", type=Path, required=True); review.add_argument("--zoomed-lineup", type=Path, required=True); review.add_argument("--gameplay-lineup", type=Path, required=True); review.add_argument("--output", type=Path, required=True); review.add_argument("--output-parent", type=Path)
    validate = sub.add_parser("validate"); validate.add_argument("--contract", type=Path, required=True); validate.add_argument("--asset-root", type=Path, required=True); validate.add_argument("--scope", required=True, choices=SCOPES)
    return parser


def parse_arguments(argv: list[str] | None = None) -> argparse.Namespace:
    return build_parser().parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    arguments = parse_arguments(argv)
    dispatch = {"silhouette": build_silhouette, "extract-frame": build_extract_frame, "r17-action": build_r17_action, "scp049-locomotion": build_locomotion, "scp049-action": build_scp049_action, "lineup": build_lineup, "review-board": build_review_board, "validate": validate_root}
    dispatch[arguments.command](arguments)


if __name__ == "__main__":
    main()
