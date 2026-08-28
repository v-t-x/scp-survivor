from __future__ import annotations

import argparse
import contextlib
import io
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image, PngImagePlugin


ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / "scripts" / "art" / "build_enemy_boss_assets.py"
CONTRACT = ROOT / "scripts" / "art" / "data" / "enemy-boss-animation-contracts.json"
R17_IDS = (
    "r17DrifterActionSheet", "r17RiftSkimmerActionSheet", "r17PulseSacActionSheet",
    "r17CarapaceGateActionSheet", "r17FrameGapActionSheet", "r17BroodMassActionSheet",
    "r17BudActionSheet",
)
EXPECTED_SHEETS = {
    "r17DrifterActionSheet": (48, 48, 18, 864, 48),
    "r17RiftSkimmerActionSheet": (48, 48, 18, 864, 48),
    "r17PulseSacActionSheet": (48, 48, 20, 960, 48),
    "r17CarapaceGateActionSheet": (64, 64, 22, 1408, 64),
    "r17FrameGapActionSheet": (64, 64, 22, 1408, 64),
    "r17BroodMassActionSheet": (64, 64, 22, 1408, 64),
    "r17BudActionSheet": (32, 32, 18, 576, 32),
    "enemyScp049LocomotionSheet": (80, 96, 40, 800, 384),
    "enemyScp049ActionSheet": (80, 96, 19, 1520, 96),
}
GATE1_STATIC = {
    "r17-drifter.png": (48, 48),
    "r17-rift-skimmer.png": (48, 48),
    "r17-pulse-sac.png": (48, 48),
    "r17-carapace-gate.png": (64, 64),
    "r17-frame-gap.png": (64, 64),
    "r17-brood-mass.png": (64, 64),
    "r17-bud.png": (32, 32),
    "scp-049.png": (80, 96),
}
SCOPES = ("gate1", "gate2", "gate3", "r17-all", "gate4a", "gate4", "all")
EXPECTED_SCOPE_IDS = {
    "gate1": (),
    "gate2": ("r17RiftSkimmerActionSheet", "r17BudActionSheet", "r17FrameGapActionSheet"),
    "gate3": ("r17DrifterActionSheet", "r17PulseSacActionSheet", "r17CarapaceGateActionSheet", "r17BroodMassActionSheet"),
    "r17-all": R17_IDS,
    "gate4a": ("enemyScp049LocomotionSheet",),
    "gate4": ("enemyScp049LocomotionSheet", "enemyScp049ActionSheet"),
    "all": R17_IDS + ("enemyScp049LocomotionSheet", "enemyScp049ActionSheet"),
}

EXPECTED_CONTRACT = json.loads(r'''{
  "schemaVersion": 1,
  "r17DrifterActionSheet": {"kind":"r17","enemyType":"infectedStaff","textureKey":"r17-drifter-action-sheet","productionPath":"assets/art/enemies/r17-drifter-action-sheet.png","frameWidth":48,"frameHeight":48,"frameCount":18,"sheetWidth":864,"sheetHeight":48,"clips":{"move":{"start":0,"end":5,"fps":6,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"contact":{"start":14,"end":17,"fps":12,"repeat":0}}},
  "r17RiftSkimmerActionSheet": {"kind":"r17","enemyType":"crawler","textureKey":"r17-rift-skimmer-action-sheet","productionPath":"assets/art/enemies/r17-rift-skimmer-action-sheet.png","frameWidth":48,"frameHeight":48,"frameCount":18,"sheetWidth":864,"sheetHeight":48,"clips":{"move":{"start":0,"end":5,"fps":12,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"pierce":{"start":14,"end":17,"fps":15,"repeat":0}}},
  "r17PulseSacActionSheet": {"kind":"r17","enemyType":"drone","textureKey":"r17-pulse-sac-action-sheet","productionPath":"assets/art/enemies/r17-pulse-sac-action-sheet.png","frameWidth":48,"frameHeight":48,"frameCount":20,"sheetWidth":960,"sheetHeight":48,"clips":{"move":{"start":0,"end":5,"fps":6,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"shoot":{"start":14,"end":19,"fps":10,"repeat":0,"releaseFrame":18}}},
  "r17CarapaceGateActionSheet": {"kind":"r17","enemyType":"riotUnit","textureKey":"r17-carapace-gate-action-sheet","productionPath":"assets/art/enemies/r17-carapace-gate-action-sheet.png","frameWidth":64,"frameHeight":64,"frameCount":22,"sheetWidth":1408,"sheetHeight":64,"clips":{"move":{"start":0,"end":5,"fps":6,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"brace":{"start":14,"end":17,"fps":5,"repeat":0},"charge":{"start":18,"end":21,"fps":9,"repeat":-1}}},
  "r17FrameGapActionSheet": {"kind":"r17","enemyType":"blinkStalker","textureKey":"r17-frame-gap-action-sheet","productionPath":"assets/art/enemies/r17-frame-gap-action-sheet.png","frameWidth":64,"frameHeight":64,"frameCount":22,"sheetWidth":1408,"sheetHeight":64,"clips":{"move":{"start":0,"end":5,"fps":8,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"phase-out":{"start":14,"end":17,"fps":6,"repeat":0},"reappear-dash":{"start":18,"end":21,"fps":12.5,"repeat":-1}}},
  "r17BroodMassActionSheet": {"kind":"r17","enemyType":"biomass","textureKey":"r17-brood-mass-action-sheet","productionPath":"assets/art/enemies/r17-brood-mass-action-sheet.png","frameWidth":64,"frameHeight":64,"frameCount":22,"sheetWidth":1408,"sheetHeight":64,"clips":{"move":{"start":0,"end":5,"fps":5,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"split":{"start":14,"end":21,"fps":12,"repeat":0}}},
  "r17BudActionSheet": {"kind":"r17","enemyType":"biomassChild","textureKey":"r17-bud-action-sheet","productionPath":"assets/art/enemies/r17-bud-action-sheet.png","frameWidth":32,"frameHeight":32,"frameCount":18,"sheetWidth":576,"sheetHeight":32,"clips":{"move":{"start":0,"end":5,"fps":12,"repeat":-1},"hit":{"start":6,"end":7,"fps":24,"repeat":0},"death":{"start":8,"end":13,"fps":12,"repeat":0},"snap":{"start":14,"end":17,"fps":16,"repeat":0}}},
  "enemyScp049LocomotionSheet": {"kind":"scp049-locomotion","textureKey":"enemy-scp049-locomotion-sheet","productionPath":"assets/art/characters/scp-049-locomotion-sheet.png","frameWidth":80,"frameHeight":96,"frameCount":40,"sheetWidth":800,"sheetHeight":384,"directions":["down","left","right","up"],"rowClips":{"idle":{"start":0,"end":3,"fps":5,"repeat":-1},"walk":{"start":4,"end":9,"fps":8,"repeat":-1}}},
  "enemyScp049ActionSheet": {"kind":"scp049-action","textureKey":"enemy-scp049-action-sheet","productionPath":"assets/art/characters/scp-049-action-sheet.png","frameWidth":80,"frameHeight":96,"frameCount":19,"sheetWidth":1520,"sheetHeight":96,"clips":{"frenzy-enter":{"start":0,"end":4,"fps":10,"repeat":0},"frenzy-loop":{"start":5,"end":8,"fps":8,"repeat":-1},"hit-overlay":{"start":9,"end":10,"fps":24,"repeat":0},"recontain":{"start":11,"end":18,"fps":12,"repeat":0}}}
}''')


def load_builder_module():
    spec = importlib.util.spec_from_file_location("enemy_boss_asset_builder_for_tests", BUILDER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"could not load builder module from {BUILDER}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def make_board(path: Path, cells: int, columns: int, width: int, height: int, *, variant: int = 0) -> None:
    rows = (cells + columns - 1) // columns
    image = Image.new("RGBA", (columns * width, rows * height), (0, 0, 0, 0))
    pixels = image.load()
    for index in range(cells):
        x0 = (index % columns) * width + 8
        y0 = (index // columns) * height + 8
        subject_width = max(4, width // 4 + index + variant)
        subject_height = max(4, height // 3 + index + variant)
        for y in range(subject_height):
            for x in range(subject_width):
                pixels[x0 + x, y0 + y] = (30 + index, 80 + variant, 120, 255)
        if variant % 2:
            for y in range(3):
                for x in range(4):
                    pixels[x0 + x, y0 - 3 + y] = (30 + index, 80 + variant, 120, 255)
        elif variant:
            for y in range(2):
                for x in range(6):
                    pixels[x0 + subject_width - 6 + x, y0 - 2 + y] = (30 + index, 80 + variant, 120, 255)
        # Asymmetry makes a reflected/moved copy observable in the real output.
        pixels[x0 + subject_width - 1, y0 + 1] = (220, 50 + index, 20, 255)
    image.save(path, format="PNG")


def make_pattern_board(
    path: Path,
    cells: int,
    cell_width: int,
    cell_height: int,
    *,
    colors: list[tuple[int, int, int, int]],
    sizes: list[tuple[int, int]] | None = None,
    shape_seed: int = 0,
) -> None:
    """Write connected, clip-unique alpha poses with exact per-cell marker colors."""
    if len(colors) != cells:
        raise ValueError("one literal marker color is required per cell")
    sizes = sizes or [(max(8, cell_width // 3), max(10, cell_height // 2))] * cells
    if len(sizes) != cells:
        raise ValueError("one literal subject size is required per cell")
    image = Image.new("RGBA", (cells * cell_width, cell_height), (0, 0, 0, 0))
    pixels = image.load()
    for index, ((subject_width, subject_height), color) in enumerate(zip(sizes, colors)):
        left = index * cell_width + 4
        top = 4
        if subject_width + 8 > cell_width or subject_height + 8 > cell_height:
            raise ValueError("pattern subject needs a four-pixel source-cell margin")
        for y in range(subject_height):
            for x in range(subject_width):
                pixels[left + x, top + y] = color
        # A two-pixel-deep notch keeps the component connected while giving every
        # frame a different cropped alpha shape. It survives nearest scaling.
        notch_x = 1 + ((shape_seed + index) % max(1, subject_width - 3))
        notch_depth = 1 + ((shape_seed + index) % 2)
        for y in range(notch_depth):
            pixels[left + notch_x, top + y] = (0, 0, 0, 0)
    image.save(path, format="PNG")


def crop_frame(image: Image.Image, frame_width: int, frame_height: int, index: int, row: int = 0) -> Image.Image:
    return image.crop((index * frame_width, row * frame_height, (index + 1) * frame_width, (row + 1) * frame_height))


def visible_height(image: Image.Image) -> int:
    box = image.getchannel("A").getbbox()
    if box is None:
        raise AssertionError("expected an opaque subject")
    return box[3] - box[1]


def sole_opaque_color(image: Image.Image) -> tuple[int, int, int]:
    colors = {pixel[:3] for pixel in image.get_flattened_data() if pixel[3] == 255}
    if len(colors) != 1:
        raise AssertionError(f"expected one marker color, got {colors}")
    return next(iter(colors))


def valid_static_image(size: tuple[int, int], color: tuple[int, int, int, int] = (10, 20, 30, 255)) -> Image.Image:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    for y in range(3, 9):
        for x in range(3, 9):
            image.putpixel((x, y), color)
    return image


class EnemyBossAssetBuilderTests(unittest.TestCase):
    def run_builder(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(BUILDER), *args], cwd=ROOT, text=True, capture_output=True, check=False)

    def write_locomotion_pose_boards(self, directory: Path) -> list[Path]:
        boards = []
        for direction in range(4):
            path = directory / f"direction-{direction}.png"
            colors = [(40 + direction * 30 + index, 30 + direction, 90, 255) for index in range(10)]
            sizes = [(16 + direction, 28)] * 10
            make_pattern_board(path, 10, 80, 96, colors=colors, sizes=sizes, shape_seed=direction * 20)
            image = Image.open(path).convert("RGBA")
            # Cell 4 has the same alpha pose as cell 0. Because both clips have
            # the same maximum geometry, the normalized poses are also identical.
            copied = image.crop((0, 0, 80, 96))
            copied.putdata([
                (colors[4][0], colors[4][1], colors[4][2], pixel[3]) if pixel[3] else (0, 0, 0, 0)
                for pixel in copied.get_flattened_data()
            ])
            image.paste(copied, (4 * 80, 0)); image.save(path, format="PNG")
            boards.append(path)
        return boards

    def locomotion_args(self, boards: list[Path], output: Path) -> tuple[str, ...]:
        return (
            "scp049-locomotion", "--contract", str(CONTRACT),
            "--down-board", str(boards[0]), "--left-board", str(boards[1]),
            "--right-board", str(boards[2]), "--up-board", str(boards[3]),
            "--output", str(output),
        )

    def write_gate1_root(self, root: Path) -> dict[str, Path]:
        paths = {}
        for index, (basename, size) in enumerate(GATE1_STATIC.items()):
            path = root / f"nested-{index}" / basename
            path.parent.mkdir(parents=True, exist_ok=True)
            valid_static_image(size, (10 + index, 30, 60, 255)).save(path, format="PNG")
            paths[basename] = path
        return paths

    def build_r17_fixture(self, directory: Path, asset_id: str, output: Path) -> tuple[list[tuple[int, int, int]], subprocess.CompletedProcess[str]]:
        entry = EXPECTED_CONTRACT[asset_id]
        width, height = entry["frameWidth"], entry["frameHeight"]
        role_clips = [(name, clip) for name, clip in entry["clips"].items() if name not in {"move", "hit", "death"}]
        role_count = sum(clip["end"] - clip["start"] + 1 for _, clip in role_clips)
        group_counts = (6, 2, 6, role_count)
        color_groups = (
            [(40 + index, 10, 10, 255) for index in range(6)],
            [(10, 70 + index, 10, 255) for index in range(2)],
            [(10, 10, 100 + index, 255) for index in range(6)],
            [(120 + index, 50, 20, 255) for index in range(role_count)],
        )
        paths = [directory / f"{asset_id}-{name}.png" for name in ("move", "hit", "death", "role")]
        for group_index, (path, count, colors) in enumerate(zip(paths, group_counts, color_groups)):
            if asset_id in {"r17CarapaceGateActionSheet", "r17FrameGapActionSheet"} and group_index == 3:
                sizes = [(12, 20)] * 4 + [(24, 40)] * 4
            else:
                sizes = [(max(8, width // 3), max(10, height // 2))] * count
            make_pattern_board(path, count, width, height, colors=colors, sizes=sizes, shape_seed=group_index * 30)
        result = self.run_builder(
            "r17-action", "--contract", str(CONTRACT), "--asset-id", asset_id,
            "--move-board", str(paths[0]), "--hit-board", str(paths[1]),
            "--death-board", str(paths[2]), "--role-board", str(paths[3]),
            "--output", str(output),
        )
        return ([color[:3] for group in color_groups for color in group], result)

    def build_scp049_fixtures(self, directory: Path, locomotion_output: Path, action_output: Path) -> tuple[list[list[tuple[int, int, int]]], list[tuple[int, int, int]]]:
        boards = []
        direction_colors = []
        for direction in range(4):
            path = directory / f"scp049-{direction}.png"
            colors = [(20 + direction * 40 + index, 80 + direction, 30, 255) for index in range(10)]
            sizes = [(12 + direction, 20)] * 4 + [(24 + direction, 40)] * 6
            make_pattern_board(path, 10, 80, 96, colors=colors, sizes=sizes, shape_seed=direction * 20)
            boards.append(path); direction_colors.append([color[:3] for color in colors])
        result = self.run_builder(*self.locomotion_args(boards, locomotion_output))
        self.assertEqual(result.returncode, 0, result.stderr)

        counts = (5, 4, 2, 8)
        action_boards = []
        action_colors = []
        for group_index, count in enumerate(counts):
            path = directory / f"scp049-action-{group_index}.png"
            colors = [(30 + group_index * 40 + index, 20, 120 + group_index, 255) for index in range(count)]
            make_pattern_board(path, count, 80, 96, colors=colors, sizes=[(18, 30)] * count, shape_seed=group_index * 20)
            action_boards.append(path); action_colors.extend(color[:3] for color in colors)
        result = self.run_builder(
            "scp049-action", "--contract", str(CONTRACT),
            "--frenzy-enter-board", str(action_boards[0]), "--frenzy-loop-board", str(action_boards[1]),
            "--hit-overlay-board", str(action_boards[2]), "--recontain-board", str(action_boards[3]),
            "--output", str(action_output),
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return direction_colors, action_colors

    def build_complete_candidate_root(self, root: Path) -> dict[str, Path]:
        outputs = self.write_gate1_root(root)
        work = root / "boards"; work.mkdir(parents=True, exist_ok=True)
        output_root = root / "candidate" / "nested"; output_root.mkdir(parents=True, exist_ok=True)
        for asset_id in R17_IDS:
            output = output_root / Path(EXPECTED_CONTRACT[asset_id]["productionPath"]).name
            _, result = self.build_r17_fixture(work, asset_id, output)
            self.assertEqual(result.returncode, 0, result.stderr)
            outputs[asset_id] = output
        locomotion = output_root / "scp-049-locomotion-sheet.png"
        action = output_root / "scp-049-action-sheet.png"
        self.build_scp049_fixtures(work, locomotion, action)
        outputs["enemyScp049LocomotionSheet"] = locomotion
        outputs["enemyScp049ActionSheet"] = action
        return outputs

    # A: same normalized pose across idle/walk is permitted; duplicates inside either clip are not.
    def test_locomotion_validates_motion_per_clip_not_across_idle_walk(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); boards = self.write_locomotion_pose_boards(directory)
            output = directory / "locomotion.png"
            result = self.run_builder(*self.locomotion_args(boards, output))
            self.assertEqual(result.returncode, 0, result.stderr)
            with Image.open(output) as sheet:
                idle = crop_frame(sheet, 80, 96, 0, 0).getchannel("A")
                walk = crop_frame(sheet, 80, 96, 4, 0).getchannel("A")
                self.assertEqual(idle.tobytes(), walk.tobytes(), "fixture must be identical after normalization")

    def test_locomotion_rejects_duplicate_pose_within_idle_clip(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); boards = self.write_locomotion_pose_boards(directory)
            image = Image.open(boards[0]).convert("RGBA"); image.paste(image.crop((0, 0, 80, 96)), (80, 0)); image.save(boards[0])
            result = self.run_builder(*self.locomotion_args(boards, directory / "out.png"))
            self.assertNotEqual(result.returncode, 0); self.assertIn("down idle", result.stderr)

    def test_locomotion_rejects_duplicate_pose_within_walk_clip(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); boards = self.write_locomotion_pose_boards(directory)
            image = Image.open(boards[0]).convert("RGBA"); image.paste(image.crop((4 * 80, 0, 5 * 80, 96)), (5 * 80, 0)); image.save(boards[0])
            result = self.run_builder(*self.locomotion_args(boards, directory / "out.png"))
            self.assertNotEqual(result.returncode, 0); self.assertIn("down walk", result.stderr)

    # I: parser structure, not source text, proves each exact flag and optional parent.
    def test_parser_locks_exact_subcommands_required_flags_and_scopes(self) -> None:
        builder = load_builder_module()
        parser = builder.build_parser()
        subparsers = next(action for action in parser._actions if isinstance(action, argparse._SubParsersAction))
        expected_required = {
            "silhouette": {"--input", "--frame-width", "--frame-height", "--output"},
            "extract-frame": {"--sheet", "--frame-width", "--frame-height", "--frame-index", "--output"},
            "r17-action": {"--contract", "--asset-id", "--move-board", "--hit-board", "--death-board", "--role-board", "--output"},
            "scp049-locomotion": {"--contract", "--down-board", "--left-board", "--right-board", "--up-board", "--output"},
            "scp049-action": {"--contract", "--frenzy-enter-board", "--frenzy-loop-board", "--hit-overlay-board", "--recontain-board", "--output"},
            "lineup": {"--background", "--player", "--r17-drifter", "--r17-rift-skimmer", "--r17-pulse-sac", "--r17-carapace-gate", "--r17-frame-gap", "--r17-brood-mass", "--r17-bud", "--scp049", "--output"},
            "review-board": {"--native-lineup", "--zoomed-lineup", "--gameplay-lineup", "--output"},
            "validate": {"--contract", "--asset-root", "--scope"},
        }
        self.assertEqual(tuple(subparsers.choices), tuple(expected_required))
        for command, required_flags in expected_required.items():
            command_parser = subparsers.choices[command]
            actual_required = {
                option
                for action in command_parser._actions if action.required
                for option in action.option_strings
            }
            self.assertEqual(actual_required, required_flags, command)
            output_parent = next((action for action in command_parser._actions if "--output-parent" in action.option_strings), None)
            if command == "validate":
                self.assertIsNone(output_parent)
                scope = next(action for action in command_parser._actions if "--scope" in action.option_strings)
                self.assertEqual(tuple(scope.choices), SCOPES)
            else:
                self.assertIsNotNone(output_parent, command)
                self.assertFalse(output_parent.required, command)

    def test_parser_rejects_each_required_flag_individually_and_parses_every_producer_with_parent(self) -> None:
        builder = load_builder_module()
        parser = builder.build_parser()
        commands = {
            "silhouette": ["--input", "in.png", "--frame-width", "48", "--frame-height", "48", "--output", "out.png"],
            "extract-frame": ["--sheet", "sheet.png", "--frame-width", "64", "--frame-height", "64", "--frame-index", "0", "--output", "out.png"],
            "r17-action": ["--contract", "contract.json", "--asset-id", R17_IDS[0], "--move-board", "move.png", "--hit-board", "hit.png", "--death-board", "death.png", "--role-board", "role.png", "--output", "out.png"],
            "scp049-locomotion": ["--contract", "contract.json", "--down-board", "down.png", "--left-board", "left.png", "--right-board", "right.png", "--up-board", "up.png", "--output", "out.png"],
            "scp049-action": ["--contract", "contract.json", "--frenzy-enter-board", "enter.png", "--frenzy-loop-board", "loop.png", "--hit-overlay-board", "hit.png", "--recontain-board", "recontain.png", "--output", "out.png"],
            "lineup": ["--background", "background.png", "--player", "player.png", "--r17-drifter", "drifter.png", "--r17-rift-skimmer", "skimmer.png", "--r17-pulse-sac", "pulse.png", "--r17-carapace-gate", "carapace.png", "--r17-frame-gap", "gap.png", "--r17-brood-mass", "brood.png", "--r17-bud", "bud.png", "--scp049", "049.png", "--output", "out.png"],
            "review-board": ["--native-lineup", "native.png", "--zoomed-lineup", "zoomed.png", "--gameplay-lineup", "gameplay.png", "--output", "out.png"],
        }
        for command, arguments in commands.items():
            parsed = parser.parse_args([command, *arguments, "--output-parent", "allowed"])
            self.assertEqual(parsed.command, command); self.assertEqual(parsed.output_parent, Path("allowed"))
            required_flags = arguments[::2]
            for flag in required_flags:
                index = arguments.index(flag)
                missing = arguments[:index] + arguments[index + 2:]
                with self.subTest(command=command, missing=flag), contextlib.redirect_stderr(io.StringIO()):
                    with self.assertRaises(SystemExit): parser.parse_args([command, *missing])
        for scope in SCOPES:
            parsed = parser.parse_args(["validate", "--contract", "contract.json", "--asset-root", "root", "--scope", scope])
            self.assertEqual(parsed.scope, scope)
    # Break caught: output may escape an explicitly approved directory before any write.
    def test_output_parent_contains_a_valid_silhouette_output_and_large_source_is_downscaled(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); allowed = directory / "allowed"; source = directory / "source.png"
            Image.new("RGBA", (100, 100), (0, 0, 0, 0)).save(source)
            image = Image.open(source).convert("RGBA")
            for y in range(10, 90):
                for x in range(10, 90): image.putpixel((x, y), (10, 20, 30, 255))
            image.save(source)
            outside = directory / "outside.png"
            rejected = self.run_builder("silhouette", "--input", str(source), "--frame-width", "48", "--frame-height", "48", "--output", str(outside), "--output-parent", str(allowed))
            self.assertNotEqual(rejected.returncode, 0); self.assertFalse(outside.exists())
            output = allowed / "inside.png"
            result = self.run_builder("silhouette", "--input", str(source), "--frame-width", "48", "--frame-height", "48", "--output", str(output), "--output-parent", str(allowed))
            self.assertEqual(result.returncode, 0, result.stderr)
            with Image.open(output) as scaled: self.assertEqual(scaled.size, (48, 48))

    # J: a known 4x-nearest source must recover the literal native pattern at
    # one-pixel margin, centered x, and bottom baseline without smoothing.
    def test_silhouette_uses_exact_nearest_geometry_center_and_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); source = directory / "large-keyed.png"; output = directory / "normalized.png"
            pattern = Image.new("RGBA", (4, 3), (0, 0, 0, 0))
            literal = (
                ((255, 0, 0, 255), (255, 0, 0, 255), (0, 255, 0, 255), (0, 255, 0, 255)),
                ((255, 0, 0, 255), (0, 0, 255, 255), (0, 0, 255, 255), (0, 255, 0, 255)),
                ((255, 255, 0, 255), (255, 255, 0, 255), (0, 0, 255, 255), (0, 0, 255, 255)),
            )
            for y, row in enumerate(literal):
                for x, pixel in enumerate(row): pattern.putpixel((x, y), pixel)
            large = Image.new("RGBA", (100, 80), (0, 0, 0, 0)); large.alpha_composite(pattern.resize((16, 12), Image.Resampling.NEAREST), (31, 29)); large.save(source)
            result = self.run_builder("silhouette", "--input", str(source), "--frame-width", "6", "--frame-height", "5", "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            expected = Image.new("RGBA", (6, 5), (0, 0, 0, 0)); expected.alpha_composite(pattern, (1, 1))
            with Image.open(output) as actual:
                self.assertEqual(actual.convert("RGBA").tobytes(), expected.tobytes())

    def test_corrected_scope_membership_is_ordered_and_contract_derived(self) -> None:
        builder = load_builder_module()
        self.assertEqual(builder.expected_ids("gate2"), ("r17RiftSkimmerActionSheet", "r17BudActionSheet", "r17FrameGapActionSheet"))
        self.assertEqual(builder.expected_ids("gate3"), ("r17DrifterActionSheet", "r17PulseSacActionSheet", "r17CarapaceGateActionSheet", "r17BroodMassActionSheet"))
    # Break caught: removing/changing a required contract sheet or its public geometry.
    def test_contract_is_the_complete_exact_nine_entry_literal(self) -> None:
        payload = json.loads(CONTRACT.read_text(encoding="utf-8"))
        self.assertEqual(payload, EXPECTED_CONTRACT)

    def test_r17_action_packs_scaled_frames_on_common_center_and_baseline(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            boards = [directory / f"{name}.png" for name in ("move", "hit", "death", "role")]
            for board, count in zip(boards, (6, 2, 6, 4)):
                make_board(board, count, count, 48, 48, variant=count)
            output = directory / "action.png"
            result = self.run_builder("r17-action", "--contract", str(CONTRACT), "--asset-id", "r17RiftSkimmerActionSheet", "--move-board", str(boards[0]), "--hit-board", str(boards[1]), "--death-board", str(boards[2]), "--role-board", str(boards[3]), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            sheet = Image.open(output).convert("RGBA")
            self.assertEqual(sheet.size, (864, 48))
            centers, baselines = [], []
            for index in range(18):
                bbox = sheet.crop((index * 48, 0, (index + 1) * 48, 48)).getchannel("A").getbbox()
                self.assertIsNotNone(bbox)
                centers.append((bbox[0] + bbox[2] - 1) / 2)
                baselines.append(bbox[3] - 1)
            self.assertLessEqual(max(centers) - min(centers), 0.5)
            self.assertEqual(len(set(baselines)), 1)

    # Break caught: fitting individual cells independently instead of using one scale for the clip.
    def test_r17_action_uses_a_single_nearest_neighbor_scale_per_clip(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            boards = [directory / f"{name}.png" for name in ("move", "hit", "death", "role")]
            for board, count in zip(boards, (6, 2, 6, 4)):
                make_board(board, count, count, 48, 48)
            # The first move pose is shorter; shared clipping scale must leave it shorter after packing.
            image = Image.open(boards[0]).convert("RGBA")
            image.paste((0, 0, 0, 0), (0, 0, 48, 48))
            image.paste(Image.new("RGBA", (12, 16), (255, 0, 0, 255)), (10, 20))
            image.save(boards[0])
            output = directory / "action.png"
            result = self.run_builder("r17-action", "--contract", str(CONTRACT), "--asset-id", "r17RiftSkimmerActionSheet", "--move-board", str(boards[0]), "--hit-board", str(boards[1]), "--death-board", str(boards[2]), "--role-board", str(boards[3]), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            sheet = Image.open(output).convert("RGBA")
            heights = [sheet.crop((index * 48, 0, (index + 1) * 48, 48)).getchannel("A").getbbox()[3] - sheet.crop((index * 48, 0, (index + 1) * 48, 48)).getchannel("A").getbbox()[1] for index in range(6)]
            self.assertLess(heights[0], max(heights[1:]))

    # B: 0.5px is the exact odd/even placement allowance; 1px is not accepted.
    def test_alignment_accepts_half_pixel_center_spread_and_rejects_one_pixel(self) -> None:
        builder = load_builder_module()
        even = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); even.paste((1, 2, 3, 255), (5, 10, 9, 20))
        odd = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); odd.paste((1, 2, 3, 255), (5, 10, 10, 20))
        shifted = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); shifted.paste((1, 2, 3, 255), (6, 10, 10, 20))
        builder.validate_alignment([even, odd], "half-pixel fixture")
        with self.assertRaises(SystemExit):
            builder.validate_alignment([even, shifted], "one-pixel fixture")

    # C: every R-17 contract packs all four base clips and every role cell in literal order.
    def test_all_seven_r17_contracts_pack_exact_totals_and_marker_order(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for asset_id in R17_IDS:
                with self.subTest(asset_id=asset_id):
                    entry = EXPECTED_CONTRACT[asset_id]
                    output = directory / f"{asset_id}.png"
                    expected_colors, result = self.build_r17_fixture(directory, asset_id, output)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    with Image.open(output) as sheet:
                        self.assertEqual(sheet.size, (entry["sheetWidth"], entry["sheetHeight"]))
                        actual = [sole_opaque_color(crop_frame(sheet, entry["frameWidth"], entry["frameHeight"], index)) for index in range(entry["frameCount"])]
                    self.assertEqual(actual, expected_colors)

    def test_carapace_and_frame_gap_normalize_each_four_cell_role_clip_independently(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            for asset_id in ("r17CarapaceGateActionSheet", "r17FrameGapActionSheet"):
                with self.subTest(asset_id=asset_id):
                    output = directory / f"{asset_id}.png"
                    expected_colors, result = self.build_r17_fixture(directory, asset_id, output)
                    self.assertEqual(result.returncode, 0, result.stderr)
                    with Image.open(output) as sheet:
                        role_frames = [crop_frame(sheet, 64, 64, index) for index in range(14, 22)]
                        self.assertEqual([visible_height(frame) for frame in role_frames], [62] * 8)
                        self.assertEqual([sole_opaque_color(frame) for frame in role_frames], expected_colors[14:22])

    def test_builder_rejects_bad_inputs_and_leaves_output_untouched(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            output = directory / "out.png"
            output.write_bytes(b"before")
            result = self.run_builder("silhouette", "--input", str(directory / "missing.png"), "--frame-width", "48", "--frame-height", "48", "--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_bytes(), b"before")
            source = directory / "source.png"
            Image.new("RGBA", (48, 48), (0, 0, 0, 0)).save(source)
            for problem in (source, directory / "outside.png"):
                args = ("silhouette", "--input", str(source), "--frame-width", "48", "--frame-height", "48", "--output", str(problem))
                rejected = self.run_builder(*args)
                self.assertNotEqual(rejected.returncode, 0)
            self.assertEqual(output.read_bytes(), b"before")

    def test_pixel_gate_rejects_empty_soft_edge_palette_and_isolated_pixel(self) -> None:
        builder = load_builder_module()
        empty = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
        soft = empty.copy(); soft.putpixel((3, 3), (1, 2, 3, 127))
        edge = empty.copy(); edge.putpixel((0, 3), (1, 2, 3, 255))
        many = empty.copy()
        for index in range(33): many.putpixel((index + 2, 3), (index, index, index, 255))
        isolated = empty.copy(); isolated.putpixel((4, 4), (1, 2, 3, 255)); isolated.putpixel((10, 10), (1, 2, 3, 255))
        for image in (empty, soft, edge, many, isolated):
            with self.assertRaises(SystemExit):
                builder.validate_frame_pixels(image, "fixture")

    def test_motion_gate_rejects_static_recolor_translated_and_mirrored_scp049_frames(self) -> None:
        builder = load_builder_module()
        frame = Image.new("RGBA", (80, 96), (0, 0, 0, 0))
        frame.paste(Image.new("RGBA", (10, 30), (10, 20, 30, 255)), (20, 40))
        recolor = frame.copy(); recolor.paste(Image.new("RGBA", (10, 30), (200, 20, 30, 255)), (20, 40))
        translated = Image.new("RGBA", frame.size, (0, 0, 0, 0)); translated.alpha_composite(frame, (1, 0))
        mirrored = frame.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        for candidate in (frame.copy(), recolor, translated):
            with self.assertRaises(SystemExit): builder.validate_motion_frames([frame, candidate], "move")
        with self.assertRaises(SystemExit): builder.validate_native_scp049_sides([frame], [mirrored])

    def test_atomic_write_rolls_back_when_replace_fails(self) -> None:
        builder = load_builder_module()
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "out.png"
            output.write_bytes(b"before")
            image = Image.new("RGBA", (8, 8), (1, 2, 3, 255))
            real_replace = Path.replace
            with mock.patch.object(Path, "replace", side_effect=OSError("simulated replace failure")):
                with self.assertRaises(SystemExit): builder.write_png_atomically(image, output)
            self.assertEqual(output.read_bytes(), b"before")
            self.assertFalse(any(path.name.startswith(".out.png.") for path in output.parent.iterdir()))

    # E: save, verify, and replace each leave the prior target and directory intact.
    def test_atomic_write_rolls_back_when_save_or_verify_fails(self) -> None:
        builder = load_builder_module()
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            image = Image.new("RGBA", (8, 8), (1, 2, 3, 255))
            failure_patches = (
                mock.patch.object(Image.Image, "save", side_effect=OSError("simulated save failure")),
                mock.patch.object(PngImagePlugin.PngImageFile, "verify", side_effect=OSError("simulated verify failure")),
            )
            for index, failure_patch in enumerate(failure_patches):
                with self.subTest(stage=("save", "verify")[index]):
                    output = directory / f"out-{index}.png"; output.write_bytes(b"before")
                    with failure_patch:
                        with self.assertRaises(SystemExit): builder.write_png_atomically(image, output)
                    self.assertEqual(output.read_bytes(), b"before")
                    self.assertEqual([path for path in directory.iterdir() if path.name.startswith(f".{output.name}.")], [])

    def test_atomic_write_replaces_existing_target_with_verified_png(self) -> None:
        builder = load_builder_module()
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary) / "out.png"; output.write_bytes(b"before")
            image = Image.new("RGBA", (8, 8), (1, 2, 3, 255))
            builder.write_png_atomically(image, output)
            self.assertNotEqual(output.read_bytes(), b"before")
            with Image.open(output) as saved:
                saved.verify()

    def test_builder_validation_failure_preserves_existing_output(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); output = directory / "action.png"; output.write_bytes(b"before")
            boards = [directory / f"{name}.png" for name in ("move", "hit", "death", "role")]
            for group_index, (board, count) in enumerate(zip(boards, (6, 2, 6, 4))):
                colors = [(30 + group_index * 30 + index, 40, 50, 255) for index in range(count)]
                make_pattern_board(board, count, 48, 48, colors=colors, shape_seed=group_index * 20)
            move = Image.open(boards[0]).convert("RGBA"); move.paste(move.crop((0, 0, 48, 48)), (48, 0)); move.save(boards[0])
            result = self.run_builder(
                "r17-action", "--contract", str(CONTRACT), "--asset-id", "r17RiftSkimmerActionSheet",
                "--move-board", str(boards[0]), "--hit-board", str(boards[1]), "--death-board", str(boards[2]),
                "--role-board", str(boards[3]), "--output", str(output),
            )
            self.assertNotEqual(result.returncode, 0); self.assertEqual(output.read_bytes(), b"before")

    # D: 049 rows and action clips preserve literal direction/clip/cell order.
    def test_locomotion_and_action_pack_exact_marker_orders_and_per_clip_scales(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            locomotion = directory / "locomotion.png"
            action = directory / "action.png"
            direction_colors, action_colors = self.build_scp049_fixtures(directory, locomotion, action)
            with Image.open(locomotion) as image:
                self.assertEqual(image.size, (800, 384))
                for row, expected in enumerate(direction_colors):
                    frames = [crop_frame(image, 80, 96, index, row) for index in range(10)]
                    self.assertEqual([sole_opaque_color(frame) for frame in frames], expected)
                    self.assertEqual([visible_height(frame) for frame in frames[:4]], [94] * 4)
                    self.assertEqual([visible_height(frame) for frame in frames[4:]], [94] * 6)
            with Image.open(action) as image:
                self.assertEqual(image.size, (1520, 96))
                self.assertEqual([sole_opaque_color(crop_frame(image, 80, 96, index)) for index in range(19)], action_colors)

    # F: Gate 1 recursively admits exactly eight real, pixel-gated RGBA PNGs.
    def test_gate1_recursive_success_excludes_player_reference_and_rejects_duplicate(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); paths = self.write_gate1_root(root)
            (root / "player-reference").mkdir(); (root / "player-reference" / "player-frame-0.png").write_bytes(b"not a PNG and intentionally out of scope")
            result = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", "gate1")
            self.assertEqual(result.returncode, 0, result.stderr)
            duplicate = root / "second" / "r17-drifter.png"; duplicate.parent.mkdir(); shutil.copyfile(paths["r17-drifter.png"], duplicate)
            result = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", "gate1")
            self.assertNotEqual(result.returncode, 0); self.assertIn("found 2", result.stderr)

    def test_gate1_rejects_full_format_size_missing_and_pixel_matrix(self) -> None:
        def mutate_missing(path: Path) -> None: path.unlink()
        def mutate_corrupt(path: Path) -> None: path.write_bytes(b"not-a-real-image")
        def mutate_format(path: Path) -> None: valid_static_image((48, 48)).save(path, format="BMP")
        def mutate_mode(path: Path) -> None: Image.new("RGB", (48, 48), (1, 2, 3)).save(path, format="PNG")
        def mutate_size(path: Path) -> None: valid_static_image((47, 48)).save(path, format="PNG")
        def mutate_empty(path: Path) -> None: Image.new("RGBA", (48, 48), (0, 0, 0, 0)).save(path)
        def mutate_soft(path: Path) -> None:
            image = valid_static_image((48, 48)); image.putpixel((10, 10), (1, 2, 3, 127)); image.save(path)
        def mutate_edge(path: Path) -> None:
            image = valid_static_image((48, 48)); image.putpixel((0, 4), (1, 2, 3, 255)); image.save(path)
        def mutate_palette(path: Path) -> None:
            image = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
            for index in range(33): image.putpixel((index + 2, 4), (index, 100, 120, 255))
            image.save(path)
        def mutate_isolated(path: Path) -> None:
            image = valid_static_image((48, 48)); image.putpixel((20, 20), (1, 2, 3, 255)); image.save(path)

        cases = (
            ("missing", mutate_missing, "exactly one match"), ("corrupt", mutate_corrupt, "could not read"),
            ("format", mutate_format, "must be a PNG"), ("mode", mutate_mode, "8-bit RGBA"),
            ("size", mutate_size, "must be 48x48"), ("empty", mutate_empty, "is empty"),
            ("soft-alpha", mutate_soft, "alpha must be binary"), ("edge", mutate_edge, "touches the frame edge"),
            ("palette", mutate_palette, "maximum is 32"), ("isolated", mutate_isolated, "isolated single-pixel"),
        )
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            for name, mutate, expected_error in cases:
                with self.subTest(name=name):
                    root = base / name; paths = self.write_gate1_root(root)
                    mutate(paths["r17-drifter.png"])
                    result = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", "gate1")
                    self.assertNotEqual(result.returncode, 0); self.assertIn(expected_error, result.stderr)

    # G: validate re-runs motion/alignment/mirror admission gates on candidate sheets.
    def test_sheet_validation_wires_motion_alignment_and_native_side_rejection(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); outputs = self.build_complete_candidate_root(root)
            asset_root = root
            valid = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "all")
            self.assertEqual(valid.returncode, 0, valid.stderr)

            r17_path = outputs["r17DrifterActionSheet"]; r17_before = r17_path.read_bytes()
            with Image.open(r17_path) as source:
                image = source.convert("RGBA")
            image.paste(image.crop((0, 0, 48, 48)), (48, 0)); image.save(r17_path)
            rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "r17-all")
            self.assertNotEqual(rejected.returncode, 0); self.assertIn("identical pose hashes", rejected.stderr)
            r17_path.write_bytes(r17_before)

            with Image.open(r17_path) as source:
                image = source.convert("RGBA")
            frame = image.crop((48, 0, 96, 48)); moved = Image.new("RGBA", frame.size, (0, 0, 0, 0)); moved.alpha_composite(frame, (2, 0)); image.paste(moved, (48, 0)); image.save(r17_path)
            rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "r17-all")
            self.assertNotEqual(rejected.returncode, 0); self.assertIn("stable center and baseline", rejected.stderr)
            r17_path.write_bytes(r17_before)

            locomotion_path = outputs["enemyScp049LocomotionSheet"]; locomotion_before = locomotion_path.read_bytes()
            with Image.open(locomotion_path) as source:
                image = source.convert("RGBA")
            image.paste(image.crop((0, 0, 80, 96)), (80, 0)); image.save(locomotion_path)
            rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "gate4a")
            self.assertNotEqual(rejected.returncode, 0); self.assertIn("row 0 idle", rejected.stderr)
            locomotion_path.write_bytes(locomotion_before)

            with Image.open(locomotion_path) as source:
                image = source.convert("RGBA")
            left = image.crop((0, 96, 80, 192)); image.paste(left, (0, 192)); image.save(locomotion_path)
            rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "gate4a")
            self.assertNotEqual(rejected.returncode, 0); self.assertIn("reuses an exact left", rejected.stderr)
            locomotion_path.write_bytes(locomotion_before)

            action_path = outputs["enemyScp049ActionSheet"]
            with Image.open(action_path) as source:
                image = source.convert("RGBA")
            image.paste(image.crop((0, 0, 80, 96)), (80, 0)); image.save(action_path)
            rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(asset_root), "--scope", "gate4")
            self.assertNotEqual(rejected.returncode, 0); self.assertIn("frenzy-enter", rejected.stderr)

    def test_sheet_validation_rejects_format_size_and_every_pixel_class(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary); outputs = self.build_complete_candidate_root(root)
            path = outputs["r17DrifterActionSheet"]; original = path.read_bytes()

            def wrong_format() -> None: Image.new("RGBA", (864, 48), (0, 0, 0, 0)).save(path, format="BMP")
            def wrong_mode() -> None: Image.new("RGB", (864, 48), (1, 2, 3)).save(path, format="PNG")
            def wrong_size() -> None:
                with Image.open(io.BytesIO(original)) as source: source.convert("RGBA").crop((0, 0, 863, 48)).save(path)
            def empty() -> None:
                with Image.open(io.BytesIO(original)) as source: image = source.convert("RGBA")
                image.paste((0, 0, 0, 0), (0, 0, 48, 48)); image.save(path)
            def soft() -> None:
                with Image.open(io.BytesIO(original)) as source: image = source.convert("RGBA")
                image.putpixel((2, 2), (1, 2, 3, 127)); image.save(path)
            def edge() -> None:
                with Image.open(io.BytesIO(original)) as source: image = source.convert("RGBA")
                image.putpixel((0, 20), (1, 2, 3, 255)); image.save(path)
            def palette() -> None:
                with Image.open(io.BytesIO(original)) as source: image = source.convert("RGBA")
                for index in range(33): image.putpixel((7 + index, 20), (index, 100, 120, 255))
                image.save(path)
            def isolated() -> None:
                with Image.open(io.BytesIO(original)) as source: image = source.convert("RGBA")
                image.putpixel((2, 2), (1, 2, 3, 255)); image.save(path)

            cases = (
                (wrong_format, "must be a PNG"), (wrong_mode, "8-bit RGBA"), (wrong_size, "wrong canvas size"),
                (empty, "is empty"), (soft, "alpha must be binary"), (edge, "touches the frame edge"),
                (palette, "maximum is 32"), (isolated, "isolated single-pixel"),
            )
            for mutate, expected_error in cases:
                with self.subTest(expected_error=expected_error):
                    path.write_bytes(original); mutate()
                    rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", "r17-all")
                    self.assertNotEqual(rejected.returncode, 0); self.assertIn(expected_error, rejected.stderr)
            path.write_bytes(original)

    # H: each actual scope succeeds with only its exact recursive membership and
    # reports its first required missing basename deterministically.
    def test_every_validate_scope_uses_exact_actual_root_membership_and_order(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary); source_root = directory / "source"
            outputs = self.build_complete_candidate_root(source_root)
            for scope in SCOPES:
                with self.subTest(scope=scope):
                    root = directory / f"scope-{scope}"
                    selected_paths = []
                    if scope in {"gate1", "all"}:
                        selected_paths.extend(outputs[name] for name in GATE1_STATIC)
                    selected_paths.extend(outputs[asset_id] for asset_id in EXPECTED_SCOPE_IDS[scope])
                    copied = []
                    for index, source in enumerate(selected_paths):
                        target = root / f"nested-{index}" / source.name; target.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(source, target); copied.append(target)
                    success = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", scope)
                    self.assertEqual(success.returncode, 0, success.stderr)
                    copied[0].unlink()
                    rejected = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", scope)
                    self.assertNotEqual(rejected.returncode, 0)
                    first_name = next(iter(GATE1_STATIC)) if scope in {"gate1", "all"} else EXPECTED_SCOPE_IDS[scope][0]
                    self.assertIn(first_name, rejected.stderr)
                    copied[0].parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(selected_paths[0], copied[0])
                    duplicate = root / "duplicate" / selected_paths[0].name; duplicate.parent.mkdir(); shutil.copyfile(selected_paths[0], duplicate)
                    duplicate_result = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", str(root), "--scope", scope)
                    self.assertNotEqual(duplicate_result.returncode, 0); self.assertIn("found 2", duplicate_result.stderr)

    # K: lineup anchors are literal and every native sprite pixel is preserved.
    def test_lineup_uses_exact_fixed_anchors_order_and_native_pixels(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            background = directory / "background.png"; Image.new("RGBA", (960, 540), (3, 4, 5, 255)).save(background)
            sizes = ((64, 64), (48, 48), (48, 48), (48, 48), (64, 64), (64, 64), (64, 64), (32, 32), (80, 96))
            anchors = ((64, 103), (264, 111), (456, 111), (648, 111), (832, 103), (64, 373), (256, 373), (464, 389), (632, 357))
            inputs, images = [], []
            for index, size in enumerate(sizes):
                path = directory / f"input-{index}.png"; image = Image.new("RGBA", size, (20 + index, 40, 60, 255))
                image.putpixel((0, 0), (200, index, 10, 255)); image.putpixel((size[0] - 1, size[1] - 1), (10, index, 220, 255)); image.save(path)
                inputs.append(path); images.append(image)
            lineup = directory / "lineup.png"
            args = ("lineup", "--background", str(background), "--player", str(inputs[0]), "--r17-drifter", str(inputs[1]), "--r17-rift-skimmer", str(inputs[2]), "--r17-pulse-sac", str(inputs[3]), "--r17-carapace-gate", str(inputs[4]), "--r17-frame-gap", str(inputs[5]), "--r17-brood-mass", str(inputs[6]), "--r17-bud", str(inputs[7]), "--scp049", str(inputs[8]), "--output", str(lineup))
            result = self.run_builder(*args); self.assertEqual(result.returncode, 0, result.stderr)
            with Image.open(lineup) as output:
                self.assertEqual(output.size, (960, 540))
                for source, (left, top) in zip(images, anchors):
                    self.assertEqual(output.crop((left, top, left + source.width, top + source.height)).tobytes(), source.tobytes())
                self.assertEqual(output.getpixel((0, 0)), (3, 4, 5, 255))

    def test_review_board_stacks_native_four_x_and_gameplay_panels_with_centered_padding(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            native = Image.new("RGBA", (240, 135), (20, 30, 40, 255)); native.putpixel((0, 0), (255, 0, 0, 255)); native.putpixel((239, 134), (0, 255, 0, 255))
            zoomed = native.resize((960, 540), Image.Resampling.NEAREST)
            gameplay = Image.new("RGBA", (960, 540), (70, 80, 90, 255)); gameplay.putpixel((959, 0), (0, 0, 255, 255))
            paths = []
            for name, image in (("native", native), ("zoomed", zoomed), ("gameplay", gameplay)):
                path = directory / f"{name}.png"; image.save(path); paths.append(path)
            output = directory / "review.png"
            result = self.run_builder("review-board", "--native-lineup", str(paths[0]), "--zoomed-lineup", str(paths[1]), "--gameplay-lineup", str(paths[2]), "--output", str(output))
            self.assertEqual(result.returncode, 0, result.stderr)
            with Image.open(output) as review:
                self.assertEqual(review.size, (960, 1215))
                self.assertEqual(review.crop((360, 0, 600, 135)).tobytes(), native.tobytes())
                self.assertEqual(review.crop((0, 135, 960, 675)).tobytes(), zoomed.tobytes())
                self.assertEqual(review.crop((0, 675, 960, 1215)).tobytes(), gameplay.tobytes())
                self.assertEqual(review.getpixel((0, 0)), (0, 0, 0, 0)); self.assertEqual(review.getpixel((959, 134)), (0, 0, 0, 0))

    def test_public_output_rejection_uses_resolved_path_not_lexical_alias(self) -> None:
        builder = load_builder_module(); lexical_alias = Path("evidence") / "alias" / "out.png"
        with mock.patch.object(Path, "resolve", return_value=Path("C:/site/public/out.png")):
            with self.assertRaises(SystemExit): builder.reject_public_output(lexical_alias)

    # Break caught: silently accepting a non-RGBA review source changes pixel-alpha semantics.
    def test_lineup_rejects_non_rgba_source_before_creating_an_output(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            background = directory / "background.png"; Image.new("RGBA", (960, 540)).save(background)
            source = directory / "rgb.png"; Image.new("RGB", (16, 16), (1, 2, 3)).save(source)
            output = directory / "lineup.png"
            result = self.run_builder("lineup", "--background", str(background), "--player", str(source), "--r17-drifter", str(source), "--r17-rift-skimmer", str(source), "--r17-pulse-sac", str(source), "--r17-carapace-gate", str(source), "--r17-frame-gap", str(source), "--r17-brood-mass", str(source), "--r17-bud", str(source), "--scp049", str(source), "--output", str(output))
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())

    def test_cli_has_required_subcommands_and_validate_scopes(self) -> None:
        result = self.run_builder()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("r17-action", result.stderr)
        for subcommand in ("silhouette", "extract-frame", "r17-action", "scp049-locomotion", "scp049-action", "lineup", "review-board"):
            result = self.run_builder(subcommand)
            self.assertNotEqual(result.returncode, 0)
        for scope in ("gate1", "gate2", "gate3", "r17-all", "gate4a", "gate4", "all"):
            with tempfile.TemporaryDirectory() as temporary:
                result = self.run_builder("validate", "--contract", str(CONTRACT), "--asset-root", temporary, "--scope", scope)
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn("invalid choice", result.stderr)


def main() -> None:
    parser = __import__("argparse").ArgumentParser()
    parser.add_argument("command", choices=("unit",))
    parser.parse_args()
    unittest.main(argv=[sys.argv[0]], verbosity=2)


if __name__ == "__main__":
    main()
