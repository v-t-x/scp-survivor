from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / "scripts" / "art" / "build_player_character_assets.py"
APPROVED_A_SAMPLE = ROOT / "public" / "assets" / "art" / "characters" / "player-response-operative-breacher-sample.png"
BODY_PRODUCTION = ROOT / "public" / "assets" / "art" / "characters" / "player-response-operative-body.png"

FRAME_SIZE = 64
BASELINE_Y = 56
BOARD_SIZE = 1024
CONTENT_HEIGHT = 48
# Output height target after the 2026-07-24 Gate 2 revision
# (builder TARGET_VISIBLE_HEIGHT 48 -> 50).
TARGET_HEIGHT = 50
HIT_BOARD_WIDTH = 240
HIT_BOARD_HEIGHT = 120
HIT_WIDTHS = (50, 54)

OCCUPIED_CELLS = (0, 1, 2, 3, 6, 7, 8, 9, 10, 11,
                  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                  24, 25, 26, 27, 28, 29, 30, 31)
PROTOTYPE_SOURCE_CELLS = OCCUPIED_CELLS[:28]

DOWN_COLORS = ((190, 60, 60, 255), (120, 30, 30, 255))
LEFT_COLORS = ((60, 170, 60, 255), (30, 100, 30, 255))
RIGHT_COLORS = ((60, 90, 200, 255), (30, 50, 120, 255))
UP_COLORS = ((200, 180, 60, 255), (130, 110, 30, 255))
HIT_COLORS = ((255, 0, 255, 255), (180, 0, 180, 255))
SPARE_COLORS = ((0, 255, 255, 255), (0, 150, 150, 255))
SOCKET_FRAME_KEYS = (
    "index",
    "gripX",
    "gripY",
    "supportX",
    "supportY",
    "equipmentLayer",
)
DIRECTION_ORDER = ("down", "left", "right", "up")
PROTOTYPE_DIRECTIONS = ("down",)


def cell_box(image_width: int, image_height: int, columns: int, rows: int, index: int) -> tuple[int, int, int, int]:
    column = index % columns
    row = index // columns
    left = round(column * image_width / columns)
    right = round((column + 1) * image_width / columns)
    top = round(row * image_height / rows)
    bottom = round((row + 1) * image_height / rows)
    return (left, top, right, bottom)


def cell_origin(image_width: int, image_height: int, columns: int, rows: int, index: int) -> tuple[int, int]:
    left, top, _, _ = cell_box(image_width, image_height, columns, rows, index)
    return (left + 40, top + 60)


def draw_subject(
    pixels,
    origin_x: int,
    origin_y: int,
    width: int,
    height: int,
    body: tuple[int, int, int, int],
    accent: tuple[int, int, int, int],
    variant: int,
    pad_side: str = "left",
    phase: int = 0,
) -> None:
    def put(x: int, y: int, color: tuple[int, int, int, int]) -> None:
        pixels[origin_x + x, origin_y + y] = color

    # shoulder bar: guarantees the top row and both side columns are occupied.
    for y in range(0, 4):
        for x in range(width):
            put(x, y, body)
    # torso.
    for y in range(4, height - 18):
        for x in range(2, width - 2):
            put(x, y, body)
    # accent stripe whose row varies per cell.
    stripe_row = 6 + (variant % 7)
    for x in range(2, width - 2):
        put(x, stripe_row, accent)
    # asymmetric shoulder pad whose height varies per cell.
    pad_columns = (0, 1) if pad_side == "left" else (width - 2, width - 1)
    for y in range(4, 9 + (variant % 5)):
        for x in pad_columns:
            put(x, y, accent)
    # legs with a per-cell gap.
    gap = width // 2 + ((variant + phase) % 3) - 1
    for y in range(height - 18, height):
        for x in range(2, width - 2):
            if abs(x - gap) > 1:
                put(x, y, body)
    # asymmetric feet: guarantees the bottom row and both side columns are occupied.
    if pad_side == "left":
        for y in range(height - 4, height):
            for x in range(0, 5):
                put(x, y, accent)
        for y in range(height - 3, height):
            for x in range(width - 5, width):
                put(x, y, body)
    else:
        for y in range(height - 4, height):
            for x in range(width - 5, width):
                put(x, y, accent)
        for y in range(height - 3, height):
            for x in range(0, 5):
                put(x, y, body)


def crop_frame(sheet, frame_index: int, row_index: int = 0):
    left = frame_index * FRAME_SIZE
    top = row_index * FRAME_SIZE
    return sheet.crop((left, top, left + FRAME_SIZE, top + FRAME_SIZE))


def visible_bbox(image):
    return image.getchannel("A").getbbox()


def opaque_colors(image) -> set[tuple[int, int, int]]:
    return {pixel[:3] for pixel in image.get_flattened_data() if pixel[3] == 255}


def load_builder_module():
    spec = importlib.util.spec_from_file_location("player_character_asset_builder_for_tests", BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load builder module from {BUILDER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class PlayerCharacterAssetBuilderTests(unittest.TestCase):
    def run_builder(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(BUILDER), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def write_board(
        self,
        path: Path,
        body: tuple[int, int, int, int],
        accent: tuple[int, int, int, int],
        pad_side: str = "left",
        phase: int = 0,
        variant_offset: int = 0,
        skip_cells: tuple[int, ...] = (),
        overrides: dict[int, tuple[int, int, tuple[int, int, int, int], tuple[int, int, int, int]]] | None = None,
    ) -> None:
        from PIL import Image

        image = Image.new("RGBA", (BOARD_SIZE, BOARD_SIZE), (0, 0, 0, 0))
        pixels = image.load()
        overrides = overrides or {}
        for index in OCCUPIED_CELLS:
            if index in skip_cells:
                continue
            width, height, cell_body, cell_accent = overrides.get(index, (10 + index, CONTENT_HEIGHT, body, accent))
            origin_x, origin_y = cell_origin(BOARD_SIZE, BOARD_SIZE, 6, 6, index)
            draw_subject(
                pixels,
                origin_x,
                origin_y,
                width,
                height,
                cell_body,
                cell_accent,
                index + variant_offset,
                pad_side,
                phase,
            )
        image.save(path)

    def write_hit_board(self, path: Path) -> None:
        from PIL import Image

        image = Image.new("RGBA", (HIT_BOARD_WIDTH, HIT_BOARD_HEIGHT), (0, 0, 0, 0))
        pixels = image.load()
        for index, width in enumerate(HIT_WIDTHS):
            origin_x, origin_y = cell_origin(HIT_BOARD_WIDTH, HIT_BOARD_HEIGHT, 2, 1, index)
            draw_subject(pixels, origin_x, origin_y, width, CONTENT_HEIGHT, HIT_COLORS[0], HIT_COLORS[1], index)
        image.save(path)

    def write_production_fixtures(self, directory: Path) -> tuple[Path, Path, Path, Path, Path]:
        down = directory / "down_board.png"
        hit = directory / "down_hit_board.png"
        left = directory / "left_board.png"
        right = directory / "right_board.png"
        up = directory / "up_board.png"
        spare = {
            30: (40, CONTENT_HEIGHT, *SPARE_COLORS),
            31: (41, CONTENT_HEIGHT, *SPARE_COLORS),
        }
        self.write_board(down, *DOWN_COLORS, overrides=spare)
        self.write_board(left, *LEFT_COLORS)
        self.write_board(right, *RIGHT_COLORS, pad_side="right", phase=1, variant_offset=1)
        self.write_board(up, *UP_COLORS)
        self.write_hit_board(hit)
        return (down, hit, left, right, up)

    def write_socket_source(
        self,
        path: Path,
        frame_count: int,
        mutate=None,
        directions: tuple[str, ...] | None = None,
    ) -> dict:
        if directions is None:
            directions = PROTOTYPE_DIRECTIONS if frame_count == 28 else DIRECTION_ORDER
        payload = {
            "schemaVersion": 1,
            "frameWidth": FRAME_SIZE,
            "frameHeight": FRAME_SIZE,
            "directions": list(directions),
            "frames": [
                {
                    "index": index,
                    "gripX": 24 + index % 17,
                    "gripY": 25 + index % 13,
                    "supportX": 18 + index % 19,
                    "supportY": 27 + index % 15,
                    "equipmentLayer": "front" if index % 3 else "behind",
                }
                for index in range(frame_count)
            ],
        }
        if mutate is not None:
            mutate(payload)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        return payload

    def expected_socket_module(self, payload: dict) -> bytes:
        entries = []
        for frame in payload["frames"]:
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
            "export const BODY_SOCKET_SCHEMA_VERSION = 1;\n"
            f"export const BODY_SOCKET_FRAME_COUNT = {len(payload['frames'])};\n"
            "export const PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS = Object.freeze([\n"
            + ",\n".join(entries)
            + "\n]);\n"
        )
        return source.encode("utf-8")

    def assert_body_sheet_contract(
        self,
        image,
        frame_count: int,
        visible_height_range: tuple[int, int] = (44, 50),
    ) -> None:
        self.assertEqual(image.width % FRAME_SIZE, 0)
        self.assertEqual(image.height % FRAME_SIZE, 0)
        columns = image.width // FRAME_SIZE
        rows = image.height // FRAME_SIZE
        self.assertEqual(columns * rows, frame_count)
        self.assert_binary_alpha_and_palette(image)
        for index in range(frame_count):
            frame = crop_frame(image, index % columns, index // columns)
            bbox = visible_bbox(frame)
            self.assertIsNotNone(bbox)
            _, top, _, bottom = bbox
            self.assertGreaterEqual(bottom - top, visible_height_range[0])
            self.assertLessEqual(bottom - top, visible_height_range[1])
            self.assertLessEqual(abs((bottom - 1) - BASELINE_Y), 1)

    def write_cellwise_horizontal_mirror(self, source: Path, output: Path) -> None:
        from PIL import Image

        source_image = Image.open(source).convert("RGBA")
        mirrored = Image.new("RGBA", source_image.size, (0, 0, 0, 0))
        for index in OCCUPIED_CELLS:
            box = cell_box(source_image.width, source_image.height, 6, 6, index)
            cell = source_image.crop(box).transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            mirrored.alpha_composite(cell, (box[0], box[1]))
        mirrored.save(output)

    def replace_right_frame_with_recolored_left_shape(
        self,
        left_path: Path,
        right_path: Path,
        frame_index: int,
        horizontal_mirror: bool,
    ) -> None:
        from PIL import Image

        source_cell_index = OCCUPIED_CELLS[frame_index]
        left_image = Image.open(left_path).convert("RGBA")
        right_image = Image.open(right_path).convert("RGBA")
        box = cell_box(left_image.width, left_image.height, 6, 6, source_cell_index)
        replacement = left_image.crop(box)
        if horizontal_mirror:
            replacement = replacement.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        replacement.putdata([
            (18, 214, 236, pixel[3]) if pixel[3] else (0, 0, 0, 0)
            for pixel in replacement.get_flattened_data()
        ])
        right_image.paste((0, 0, 0, 0), box)
        right_image.alpha_composite(replacement, (box[0], box[1]))
        right_image.save(right_path)

    def run_production(self, directory: Path) -> tuple[subprocess.CompletedProcess[str], Path]:
        down, hit, left, right, up = self.write_production_fixtures(directory)
        output = directory / "production.png"
        result = self.run_builder(
            "production",
            "--down-board", str(down),
            "--down-hit-board", str(hit),
            "--left-board", str(left),
            "--right-board", str(right),
            "--up-board", str(up),
            "--output", str(output),
        )
        return (result, output)

    def assert_frame_geometry(self, frame, source_width: int) -> None:
        bbox = visible_bbox(frame)
        self.assertIsNotNone(bbox)
        left, top, right, bottom = bbox
        # Every fixture board has uniform content height CONTENT_HEIGHT, so the
        # builder's union-height scale is exactly TARGET_HEIGHT / CONTENT_HEIGHT.
        scale = TARGET_HEIGHT / CONTENT_HEIGHT
        self.assertEqual(right - left, max(1, round(source_width * scale)))
        self.assertEqual(bottom - top, TARGET_HEIGHT)
        # The last opaque row is the baseline row y=56 (PIL bbox bottom is exclusive).
        self.assertEqual(bottom - 1, BASELINE_Y)
        # Horizontal center must be x=32; left+right-1 is 63 (even width) or 64 (odd width).
        self.assertIn(left + right - 1, (63, 64))

    def assert_binary_alpha_and_palette(self, image) -> None:
        pixels = list(image.get_flattened_data())
        self.assertEqual({pixel[3] for pixel in pixels}, {0, 255})
        self.assertLessEqual(len({pixel[:3] for pixel in pixels if pixel[3] == 255}), 32)

    def test_silhouette_is_64_square_with_50_pixel_subject_and_y56_baseline(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            source = directory / "cutout.png"
            output = directory / "silhouette.png"
            cutout = Image.new("RGBA", (120, 160), (0, 0, 0, 0))
            draw_subject(cutout.load(), 30, 50, 24, 40, DOWN_COLORS[0], DOWN_COLORS[1], 1)
            cutout.save(source)

            result = self.run_builder("silhouette", "--input", str(source), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)

            silhouette = Image.open(output).convert("RGBA")
            self.assertEqual(silhouette.size, (64, 64))
            bbox = visible_bbox(silhouette)
            self.assertIsNotNone(bbox)
            left, top, right, bottom = bbox
            self.assertEqual(bottom - top, TARGET_HEIGHT)
            self.assertEqual(bottom - 1, BASELINE_Y)

    def test_preview_composites_native_silhouette_on_960x540_without_resampling(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            background_path = directory / "background.png"
            silhouette_path = directory / "silhouette.png"
            output_path = directory / "preview.png"
            background = Image.new("RGBA", (960, 540))
            background.putdata(
                [(x % 256, y % 256, (x + y) % 256, 255) for y in range(540) for x in range(960)]
            )
            background.save(background_path)
            silhouette = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
            draw_subject(silhouette.load(), 12, 9, 28, 48, UP_COLORS[0], UP_COLORS[1], 2)
            silhouette.save(silhouette_path)

            anchor_x, anchor_y = 500, 300
            result = self.run_builder(
                "preview",
                "--background", str(background_path),
                "--silhouette", str(silhouette_path),
                "--anchor-x", str(anchor_x),
                "--anchor-y", str(anchor_y),
                "--output", str(output_path),
            )
            self.assertEqual(result.returncode, 0, result.stderr)

            preview = Image.open(output_path).convert("RGBA")
            self.assertEqual(preview.size, (960, 540))
            origin_x, origin_y = anchor_x - 32, anchor_y - 56
            background_pixels = background.load()
            silhouette_pixels = silhouette.load()
            preview_pixels = preview.load()
            for dy in range(64):
                for dx in range(64):
                    source_pixel = silhouette_pixels[dx, dy]
                    expected = source_pixel if source_pixel[3] == 255 else background_pixels[origin_x + dx, origin_y + dy]
                    self.assertEqual(preview_pixels[origin_x + dx, origin_y + dy], expected)
            self.assertEqual(
                preview.crop((0, 0, 960, origin_y)).tobytes(),
                background.crop((0, 0, 960, origin_y)).tobytes(),
            )
            self.assertEqual(
                preview.crop((0, origin_y + 64, 960, 540)).tobytes(),
                background.crop((0, origin_y + 64, 960, 540)).tobytes(),
            )
            self.assertEqual(
                preview.crop((0, origin_y, origin_x, origin_y + 64)).tobytes(),
                background.crop((0, origin_y, origin_x, origin_y + 64)).tobytes(),
            )
            self.assertEqual(
                preview.crop((origin_x + 64, origin_y, 960, origin_y + 64)).tobytes(),
                background.crop((origin_x + 64, origin_y, 960, origin_y + 64)).tobytes(),
            )

    def test_preview_rejects_wrong_background_size_or_out_of_bounds_anchor_without_output(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            small_background = directory / "small_background.png"
            background = directory / "background.png"
            silhouette_path = directory / "silhouette.png"
            Image.new("RGBA", (800, 600), (10, 20, 30, 255)).save(small_background)
            Image.new("RGBA", (960, 540), (10, 20, 30, 255)).save(background)
            silhouette = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
            draw_subject(silhouette.load(), 12, 9, 28, 48, UP_COLORS[0], UP_COLORS[1], 2)
            silhouette.save(silhouette_path)

            wrong_size_output = directory / "wrong_size.png"
            wrong_size = self.run_builder(
                "preview",
                "--background", str(small_background),
                "--silhouette", str(silhouette_path),
                "--anchor-x", "500",
                "--anchor-y", "300",
                "--output", str(wrong_size_output),
            )
            self.assertNotEqual(wrong_size.returncode, 0)
            self.assertIn("800x600", wrong_size.stderr)
            self.assertFalse(wrong_size_output.exists())

            out_of_bounds_output = directory / "out_of_bounds.png"
            out_of_bounds = self.run_builder(
                "preview",
                "--background", str(background),
                "--silhouette", str(silhouette_path),
                "--anchor-x", "7",
                "--anchor-y", "900",
                "--output", str(out_of_bounds_output),
            )
            self.assertNotEqual(out_of_bounds.returncode, 0)
            self.assertIn("(7, 900)", out_of_bounds.stderr)
            self.assertFalse(out_of_bounds_output.exists())

    def test_prototype_is_1792_by_64_with_exact_28_down_frames(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            output = directory / "prototype.png"
            spare = {
                30: (40, CONTENT_HEIGHT, *SPARE_COLORS),
                31: (41, CONTENT_HEIGHT, *SPARE_COLORS),
            }
            self.write_board(board, *DOWN_COLORS, overrides=spare)

            result = self.run_builder("prototype", "--down-board", str(board), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)

            sheet = Image.open(output).convert("RGBA")
            self.assertEqual(sheet.size, (1792, 64))
            fingerprints = set()
            for frame_index in range(28):
                frame = crop_frame(sheet, frame_index)
                self.assert_frame_geometry(frame, 10 + PROTOTYPE_SOURCE_CELLS[frame_index])
                self.assertIn(DOWN_COLORS[0][:3], opaque_colors(frame))
                fingerprints.add(frame.tobytes())
            self.assertEqual(len(fingerprints), 28)
            self.assertNotIn(SPARE_COLORS[0][:3], opaque_colors(sheet))
            self.assertNotIn(SPARE_COLORS[1][:3], opaque_colors(sheet))

    def test_production_is_1920_by_256_with_rows_down_left_right_up(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            result, output = self.run_production(directory)
            self.assertEqual(result.returncode, 0, result.stderr)

            sheet = Image.open(output).convert("RGBA")
            self.assertEqual(sheet.size, (1920, 256))
            row_colors = (DOWN_COLORS, LEFT_COLORS, RIGHT_COLORS, UP_COLORS)
            for row_index in range(4):
                body = row_colors[row_index][0]
                for frame_index in range(30):
                    frame = crop_frame(sheet, frame_index, row_index)
                    if row_index == 0 and frame_index >= 28:
                        self.assert_frame_geometry(frame, HIT_WIDTHS[frame_index - 28])
                        self.assertIn(HIT_COLORS[0][:3], opaque_colors(frame))
                    else:
                        self.assert_frame_geometry(frame, 10 + OCCUPIED_CELLS[frame_index])
                        self.assertIn(body[:3], opaque_colors(frame))
            colors = opaque_colors(sheet)
            self.assertNotIn(SPARE_COLORS[0][:3], colors)
            self.assertNotIn(SPARE_COLORS[1][:3], colors)
            self.assertIn(HIT_COLORS[0][:3], colors)

    def test_body_prototype_writes_28_frames_and_exact_frozen_socket_module_deterministically(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            socket_source = directory / "body_sockets.json"
            self.write_board(board, *DOWN_COLORS)
            payload = self.write_socket_source(socket_source, 28)

            png_outputs = (directory / "body_first.png", directory / "body_second.png")
            socket_outputs = (directory / "body_first.js", directory / "body_second.js")
            for png_output, socket_output in zip(png_outputs, socket_outputs):
                result = self.run_builder(
                    "body-prototype",
                    "--down-board", str(board),
                    "--socket-source", str(socket_source),
                    "--output", str(png_output),
                    "--socket-output", str(socket_output),
                )
                self.assertEqual(result.returncode, 0, result.stderr)

            self.assertEqual(png_outputs[0].read_bytes(), png_outputs[1].read_bytes())
            self.assertEqual(socket_outputs[0].read_bytes(), socket_outputs[1].read_bytes())
            self.assertEqual(socket_outputs[0].read_bytes(), self.expected_socket_module(payload))
            sheet = Image.open(png_outputs[0]).convert("RGBA")
            self.assertEqual(sheet.size, (1792, 64))
            self.assert_body_sheet_contract(sheet, 28, (55, 55))

    def test_body_production_writes_120_frames_and_native_direction_socket_module(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            socket_source = directory / "body_sockets.json"
            payload = self.write_socket_source(socket_source, 120)
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"
            second_png_output = directory / "body_second.png"
            second_socket_output = directory / "bodySockets_second.js"

            for current_png, current_socket in (
                (png_output, socket_output),
                (second_png_output, second_socket_output),
            ):
                result = self.run_builder(
                    "body-production",
                    "--down-board", str(down),
                    "--down-hit-board", str(hit),
                    "--left-board", str(left),
                    "--right-board", str(right),
                    "--up-board", str(up),
                    "--socket-source", str(socket_source),
                    "--output", str(current_png),
                    "--socket-output", str(current_socket),
                )
                self.assertEqual(result.returncode, 0, result.stderr)

            sheet = Image.open(png_output).convert("RGBA")
            self.assertEqual(sheet.size, (1920, 256))
            self.assert_body_sheet_contract(sheet, 120)
            for frame_index in range(30):
                left_frame = crop_frame(sheet, frame_index, 1)
                right_frame = crop_frame(sheet, frame_index, 2)
                left_shape = left_frame.getchannel("A")
                right_shape = right_frame.getchannel("A")
                self.assertNotEqual(left_shape.tobytes(), right_shape.tobytes())
                self.assertNotEqual(
                    left_shape.transpose(Image.Transpose.FLIP_LEFT_RIGHT).tobytes(),
                    right_shape.tobytes(),
                )
            self.assertEqual(socket_output.read_bytes(), self.expected_socket_module(payload))
            self.assertEqual(png_output.read_bytes(), second_png_output.read_bytes())
            self.assertEqual(socket_output.read_bytes(), second_socket_output.read_bytes())

    def test_body_commands_reject_invalid_socket_schema_without_changing_either_target(self) -> None:
        invalid_cases = (
            ("count", lambda payload: payload["frames"].pop(), "28"),
            ("index", lambda payload: payload["frames"][5].__setitem__("index", 4), "index"),
            ("integer", lambda payload: payload["frames"][3].__setitem__("gripX", True), "integer"),
            ("range", lambda payload: payload["frames"][7].__setitem__("supportY", 64), "0..63"),
            (
                "equipment-layer",
                lambda payload: payload["frames"][9].__setitem__("equipmentLayer", "middle"),
                "equipmentLayer",
            ),
            ("schema-version", lambda payload: payload.__setitem__("schemaVersion", 2), "schemaVersion"),
            ("frame-width", lambda payload: payload.__setitem__("frameWidth", 32), "frameWidth"),
            (
                "directions",
                lambda payload: payload.__setitem__("directions", list(DIRECTION_ORDER)),
                "directions",
            ),
            (
                "unexpected-field",
                lambda payload: payload["frames"][0].__setitem__("damage", 99),
                "unexpected",
            ),
        )

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for name, mutate, expected_error in invalid_cases:
                with self.subTest(name=name):
                    directory = root / name
                    directory.mkdir()
                    board = directory / "down_board.png"
                    socket_source = directory / "body_sockets.json"
                    png_output = directory / "body.png"
                    socket_output = directory / "bodySockets.js"
                    self.write_board(board, *DOWN_COLORS)
                    self.write_socket_source(socket_source, 28, mutate)
                    seeded = self.run_builder(
                        "prototype",
                        "--down-board", str(board),
                        "--output", str(png_output),
                    )
                    self.assertEqual(seeded.returncode, 0, seeded.stderr)
                    socket_output.write_text("export const EXISTING_VALID_SOCKET_MODULE = true;\n", encoding="utf-8")
                    png_before = png_output.read_bytes()
                    socket_before = socket_output.read_bytes()

                    result = self.run_builder(
                        "body-prototype",
                        "--down-board", str(board),
                        "--socket-source", str(socket_source),
                        "--output", str(png_output),
                        "--socket-output", str(socket_output),
                    )
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(expected_error, result.stderr)
                    self.assertEqual(png_output.read_bytes(), png_before)
                    self.assertEqual(socket_output.read_bytes(), socket_before)

    def test_body_production_rejects_non_120_socket_count_without_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            socket_source = directory / "body_sockets.json"
            self.write_socket_source(socket_source, 119)
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"

            result = self.run_builder(
                "body-production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--socket-source", str(socket_source),
                "--output", str(png_output),
                "--socket-output", str(socket_output),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("120", result.stderr)
            self.assertFalse(png_output.exists())
            self.assertFalse(socket_output.exists())

    def test_body_production_rejects_down_only_socket_directions_without_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            socket_source = directory / "body_sockets.json"
            self.write_socket_source(
                socket_source,
                120,
                directions=PROTOTYPE_DIRECTIONS,
            )
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"

            result = self.run_builder(
                "body-production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--socket-source", str(socket_source),
                "--output", str(png_output),
                "--socket-output", str(socket_output),
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn(str(list(DIRECTION_ORDER)), result.stderr)
            self.assertFalse(png_output.exists())
            self.assertFalse(socket_output.exists())

    def test_body_production_rejects_each_right_frame_as_a_horizontal_left_mirror(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            self.write_cellwise_horizontal_mirror(left, right)
            socket_source = directory / "body_sockets.json"
            self.write_socket_source(socket_source, 120)
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"

            result = self.run_builder(
                "body-production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--socket-source", str(socket_source),
                "--output", str(png_output),
                "--socket-output", str(socket_output),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("mirror", result.stderr.lower())
            self.assertFalse(png_output.exists())
            self.assertFalse(socket_output.exists())

    def test_body_production_rejects_recolored_right_frame_with_same_left_opaque_shape(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            socket_source = directory / "body_sockets.json"
            self.write_socket_source(socket_source, 120)
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"
            seeded = self.run_builder(
                "production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--output", str(png_output),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            socket_output.write_text("export const EXISTING_VALID_SOCKET_MODULE = true;\n", encoding="utf-8")
            png_before = png_output.read_bytes()
            socket_before = socket_output.read_bytes()
            rejected_frame_index = 7
            self.replace_right_frame_with_recolored_left_shape(
                left,
                right,
                rejected_frame_index,
                horizontal_mirror=False,
            )

            result = self.run_builder(
                "body-production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--socket-source", str(socket_source),
                "--output", str(png_output),
                "--socket-output", str(socket_output),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(f"right frame {rejected_frame_index}", result.stderr)
            self.assertIn("opaque shape", result.stderr)
            self.assertEqual(png_output.read_bytes(), png_before)
            self.assertEqual(socket_output.read_bytes(), socket_before)

    def test_body_production_rejects_recolored_horizontal_mirror_of_one_left_frame(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            down, hit, left, right, up = self.write_production_fixtures(directory)
            socket_source = directory / "body_sockets.json"
            self.write_socket_source(socket_source, 120)
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"
            seeded = self.run_builder(
                "production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--output", str(png_output),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            socket_output.write_text("export const EXISTING_VALID_SOCKET_MODULE = true;\n", encoding="utf-8")
            png_before = png_output.read_bytes()
            socket_before = socket_output.read_bytes()
            rejected_frame_index = 11
            self.replace_right_frame_with_recolored_left_shape(
                left,
                right,
                rejected_frame_index,
                horizontal_mirror=True,
            )

            result = self.run_builder(
                "body-production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--socket-source", str(socket_source),
                "--output", str(png_output),
                "--socket-output", str(socket_output),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn(f"right frame {rejected_frame_index}", result.stderr)
            self.assertIn("horizontal mirror", result.stderr)
            self.assertEqual(png_output.read_bytes(), png_before)
            self.assertEqual(socket_output.read_bytes(), socket_before)

    def test_socket_overlay_is_a_read_only_audit_output(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            sheet = directory / "body.png"
            socket_source = directory / "body_sockets.json"
            socket_output = directory / "body_sockets.js"
            overlay = directory / "socket_overlay.png"
            self.write_board(board, *DOWN_COLORS)
            self.write_socket_source(socket_source, 28)
            seeded = self.run_builder(
                "body-prototype",
                "--down-board", str(board),
                "--socket-source", str(socket_source),
                "--output", str(sheet),
                "--socket-output", str(socket_output),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            sheet_before = sheet.read_bytes()
            socket_before = socket_source.read_bytes()

            result = self.run_builder(
                "socket-overlay",
                "--sheet", str(sheet),
                "--socket-source", str(socket_source),
                "--frame-count", "28",
                "--output", str(overlay),
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(sheet.read_bytes(), sheet_before)
            self.assertEqual(socket_source.read_bytes(), socket_before)
            self.assertTrue(overlay.exists())
            overlay_image = Image.open(overlay).convert("RGBA")
            self.assertEqual(overlay_image.size, (1792, 64))
            self.assertNotEqual(overlay_image.tobytes(), Image.open(sheet).convert("RGBA").tobytes())
            for protected_output in (sheet, socket_source):
                with self.subTest(protected_output=protected_output.name):
                    rejected = self.run_builder(
                        "socket-overlay",
                        "--sheet", str(sheet),
                        "--socket-source", str(socket_source),
                        "--frame-count", "28",
                        "--output", str(protected_output),
                    )
                    self.assertNotEqual(rejected.returncode, 0)
                    self.assertEqual(sheet.read_bytes(), sheet_before)
                    self.assertEqual(socket_source.read_bytes(), socket_before)

    def test_socket_overlay_enforces_direction_contract_for_each_sheet_shape(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            prototype_sheet = directory / "prototype.png"
            prototype_sockets = directory / "prototype_sockets.json"
            self.write_board(board, *DOWN_COLORS)
            seeded = self.run_builder(
                "prototype",
                "--down-board", str(board),
                "--output", str(prototype_sheet),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            self.write_socket_source(
                prototype_sockets,
                28,
                directions=DIRECTION_ORDER,
            )

            prototype_result = self.run_builder(
                "socket-overlay",
                "--sheet", str(prototype_sheet),
                "--socket-source", str(prototype_sockets),
                "--frame-count", "28",
                "--output", str(directory / "prototype-overlay.png"),
            )
            self.assertNotEqual(prototype_result.returncode, 0)
            self.assertIn(str(list(PROTOTYPE_DIRECTIONS)), prototype_result.stderr)

            down, hit, left, right, up = self.write_production_fixtures(directory)
            production_sheet = directory / "production.png"
            seeded = self.run_builder(
                "production",
                "--down-board", str(down),
                "--down-hit-board", str(hit),
                "--left-board", str(left),
                "--right-board", str(right),
                "--up-board", str(up),
                "--output", str(production_sheet),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            production_sockets = directory / "production_sockets.json"
            self.write_socket_source(
                production_sockets,
                120,
                directions=PROTOTYPE_DIRECTIONS,
            )

            production_result = self.run_builder(
                "socket-overlay",
                "--sheet", str(production_sheet),
                "--socket-source", str(production_sockets),
                "--frame-count", "120",
                "--output", str(directory / "production-overlay.png"),
            )
            self.assertNotEqual(production_result.returncode, 0)
            self.assertIn(str(list(DIRECTION_ORDER)), production_result.stderr)

    def test_pair_replace_failure_rolls_back_png_and_js_without_temp_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            socket_source = directory / "body_sockets.json"
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"
            self.write_board(board, *DOWN_COLORS)
            payload = self.write_socket_source(socket_source, 28)
            seeded = self.run_builder(
                "prototype",
                "--down-board", str(board),
                "--output", str(png_output),
            )
            self.assertEqual(seeded.returncode, 0, seeded.stderr)
            socket_output.write_bytes(self.expected_socket_module(payload))
            png_before = png_output.read_bytes()
            socket_before = socket_output.read_bytes()

            self.write_board(board, *UP_COLORS)
            self.write_socket_source(
                socket_source,
                28,
                lambda value: value["frames"][0].__setitem__("gripX", 63),
            )
            builder = load_builder_module()
            real_replace = Path.replace
            state = {"socket_attempts": 0}

            def fail_first_socket_replace(path: Path, target: Path):
                if Path(target) == socket_output:
                    state["socket_attempts"] += 1
                    if state["socket_attempts"] == 1:
                        raise OSError("simulated socket replace failure")
                return real_replace(path, target)

            with mock.patch.object(Path, "replace", fail_first_socket_replace):
                with self.assertRaises(SystemExit):
                    builder.main([
                        "body-prototype",
                        "--down-board", str(board),
                        "--socket-source", str(socket_source),
                        "--output", str(png_output),
                        "--socket-output", str(socket_output),
                    ])

            self.assertEqual(state["socket_attempts"], 1)
            self.assertEqual(png_output.read_bytes(), png_before)
            self.assertEqual(socket_output.read_bytes(), socket_before)
            leftovers = [
                path.name
                for path in directory.iterdir()
                if path.name.startswith(f".{png_output.name}.")
                or path.name.startswith(f".{socket_output.name}.")
            ]
            self.assertEqual(leftovers, [])

    def test_pair_replace_failure_leaves_no_new_png_or_js_when_targets_were_absent(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            socket_source = directory / "body_sockets.json"
            png_output = directory / "body.png"
            socket_output = directory / "bodySockets.js"
            self.write_board(board, *DOWN_COLORS)
            self.write_socket_source(socket_source, 28)
            builder = load_builder_module()
            real_replace = Path.replace
            state = {"socket_attempts": 0}

            def fail_first_socket_replace(path: Path, target: Path):
                if Path(target) == socket_output:
                    state["socket_attempts"] += 1
                    if state["socket_attempts"] == 1:
                        raise OSError("simulated socket replace failure")
                return real_replace(path, target)

            with mock.patch.object(Path, "replace", fail_first_socket_replace):
                with self.assertRaises(SystemExit):
                    builder.main([
                        "body-prototype",
                        "--down-board", str(board),
                        "--socket-source", str(socket_source),
                        "--output", str(png_output),
                        "--socket-output", str(socket_output),
                    ])

            self.assertEqual(state["socket_attempts"], 1)
            self.assertFalse(png_output.exists())
            self.assertFalse(socket_output.exists())
            leftovers = [
                path.name
                for path in directory.iterdir()
                if path.name.startswith(f".{png_output.name}.")
                or path.name.startswith(f".{socket_output.name}.")
            ]
            self.assertEqual(leftovers, [])

    def test_right_row_is_not_derived_by_mirroring_left(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            result, output = self.run_production(directory)
            self.assertEqual(result.returncode, 0, result.stderr)

            sheet = Image.open(output).convert("RGBA")
            for frame_index in range(30):
                left_frame = crop_frame(sheet, frame_index, 1)
                right_frame = crop_frame(sheet, frame_index, 2)
                self.assertNotEqual(left_frame.tobytes(), right_frame.tobytes())
                mirrored = left_frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                self.assertNotEqual(mirrored.tobytes(), right_frame.tobytes())

    def test_outputs_are_deterministic_binary_alpha_and_at_most_32_colors(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)

            source = directory / "cutout.png"
            cutout = Image.new("RGBA", (120, 160), (0, 0, 0, 0))
            draw_subject(cutout.load(), 30, 50, 24, 40, DOWN_COLORS[0], DOWN_COLORS[1], 1)
            cutout.save(source)
            silhouette_first = directory / "silhouette_first.png"
            silhouette_second = directory / "silhouette_second.png"
            for output in (silhouette_first, silhouette_second):
                result = self.run_builder("silhouette", "--input", str(source), "--output", str(output))
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(silhouette_first.read_bytes(), silhouette_second.read_bytes())
            self.assert_binary_alpha_and_palette(Image.open(silhouette_first).convert("RGBA"))

            board = directory / "down_board.png"
            self.write_board(board, *DOWN_COLORS)
            prototype_first = directory / "prototype_first.png"
            prototype_second = directory / "prototype_second.png"
            for output in (prototype_first, prototype_second):
                result = self.run_builder("prototype", "--down-board", str(board), "--output", str(output))
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(prototype_first.read_bytes(), prototype_second.read_bytes())
            self.assert_binary_alpha_and_palette(Image.open(prototype_first).convert("RGBA"))

            down, hit, left, right, up = self.write_production_fixtures(directory)
            production_first = directory / "production_first.png"
            production_second = directory / "production_second.png"
            for output in (production_first, production_second):
                result = self.run_builder(
                    "production",
                    "--down-board", str(down),
                    "--down-hit-board", str(hit),
                    "--left-board", str(left),
                    "--right-board", str(right),
                    "--up-board", str(up),
                    "--output", str(output),
                )
                self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(production_first.read_bytes(), production_second.read_bytes())
            self.assert_binary_alpha_and_palette(Image.open(production_first).convert("RGBA"))

    def test_empty_required_cell_fails_without_writing_output(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            board = directory / "down_board.png"
            output = directory / "prototype.png"
            self.write_board(board, *DOWN_COLORS, skip_cells=(13,))

            result = self.run_builder("prototype", "--down-board", str(board), "--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("cell 13", result.stderr)
            self.assertIn("row 2", result.stderr)
            self.assertIn("column 1", result.stderr)
            self.assertFalse(output.exists())

    def test_subject_wider_than_60_or_shorter_than_44_after_fit_fails(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)

            wide_board = directory / "wide_board.png"
            wide_output = directory / "wide.png"
            wide = {index: (100, CONTENT_HEIGHT, *DOWN_COLORS) for index in OCCUPIED_CELLS}
            self.write_board(wide_board, *DOWN_COLORS, overrides=wide)
            wide_result = self.run_builder("prototype", "--down-board", str(wide_board), "--output", str(wide_output))
            self.assertNotEqual(wide_result.returncode, 0)
            self.assertFalse(wide_output.exists())

            short_board = directory / "short_board.png"
            short_output = directory / "short.png"
            self.write_board(short_board, *DOWN_COLORS, overrides={7: (17, 20, *DOWN_COLORS)})
            short_result = self.run_builder("prototype", "--down-board", str(short_board), "--output", str(short_output))
            self.assertNotEqual(short_result.returncode, 0)
            self.assertFalse(short_output.exists())

    def test_body_production_preserves_selected_a_large_shape_identity(self) -> None:
        from PIL import Image, ImageChops

        approved = crop_frame(Image.open(APPROVED_A_SAMPLE).convert("RGBA"), 0)
        candidate = crop_frame(Image.open(BODY_PRODUCTION).convert("RGBA"), 0)
        approved_box = visible_bbox(approved)
        candidate_box = visible_bbox(candidate)
        self.assertIsNotNone(approved_box)
        self.assertIsNotNone(candidate_box)

        approved_width = approved_box[2] - approved_box[0]
        approved_height = approved_box[3] - approved_box[1]
        candidate_width = candidate_box[2] - candidate_box[0]
        candidate_height = candidate_box[3] - candidate_box[1]
        self.assertEqual(candidate_width, approved_width)
        self.assertEqual(candidate_height, approved_height)
        self.assertEqual(candidate_box[1], approved_box[1])
        self.assertEqual(candidate_box[3], approved_box[3])

        mirrored_alpha = candidate.getchannel("A").transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        asymmetric_pixels = sum(
            1
            for value in ImageChops.difference(candidate.getchannel("A"), mirrored_alpha).get_flattened_data()
            if value
        )
        self.assertGreaterEqual(
            asymmetric_pixels,
            100,
            "the down-facing 3/4 silhouette must retain A's layered, non-iconic shoulder and helmet read",
        )

        opaque_pixels = [pixel for pixel in candidate.get_flattened_data() if pixel[3] == 255]
        amber_pixels = [
            pixel
            for pixel in opaque_pixels
            if pixel[0] > 150 and pixel[1] > 70 and pixel[2] < 50
        ]
        self.assertGreaterEqual(len(opaque_pixels), 1250)
        self.assertGreaterEqual(len(amber_pixels), 50)
        self.assertLessEqual(len(amber_pixels), 100)


if __name__ == "__main__":
    unittest.main(verbosity=2)
