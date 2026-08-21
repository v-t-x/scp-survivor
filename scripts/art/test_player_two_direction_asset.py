from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from itertools import combinations
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / "scripts/art/build_player_two_direction_asset.py"
SOCKETS = ROOT / "scripts/art/data/player-two-direction-quality-sample-sockets.json"
ASSET = ROOT / "public/assets/art/characters/player-response-operative-breacher-sample.png"
EXPECTED_SIZE = (320, 64)
EXPECTED_FRAME_COUNT = 5
EXPECTED_BASELINE_Y = 56
EXPECTED_MAX_COLORS = 16
EXPECTED_IDLE_RGBA_SHA256 = "a22cbc0606d41dc59c4c008e9c56e1d5aff96b0d619b2271c15ab553aad7911f"
OLD_GATE_A_FULL_SHEET_SHA256 = "a37d0d906e7656909bdecb63cb8638e9149e3061c135d7846d58f71131fb0640"


def load_frames(path: Path) -> list[Image.Image]:
    with Image.open(path) as source:
        sheet = source.convert("RGBA")
    return [sheet.crop((index * 64, 0, (index + 1) * 64, 64)) for index in range(5)]


def run_builder(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(BUILDER), *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class PlayerTwoDirectionAssetTests(unittest.TestCase):
    def test_repo_asset_is_exact_five_frame_native_rgba(self) -> None:
        with Image.open(ASSET) as image:
            self.assertEqual(image.size, EXPECTED_SIZE)
            self.assertEqual(image.mode, "RGBA")
        self.assertEqual(len(load_frames(ASSET)), EXPECTED_FRAME_COUNT)

    def test_idle_frame_preserves_the_accepted_a_pixel_identity(self) -> None:
        idle = load_frames(ASSET)[0]
        self.assertEqual(
            hashlib.sha256(idle.tobytes()).hexdigest(),
            EXPECTED_IDLE_RGBA_SHA256,
        )

    def test_run_frames_replace_the_old_gate_a_full_sheet(self) -> None:
        self.assertNotEqual(
            hashlib.sha256(ASSET.read_bytes()).hexdigest(),
            OLD_GATE_A_FULL_SHEET_SHA256,
        )

    def test_all_frames_use_binary_alpha_limited_palette_and_fixed_baseline(self) -> None:
        frames = load_frames(ASSET)
        colors = set()
        for frame in frames:
            alpha = list(frame.getchannel("A").get_flattened_data())
            self.assertEqual(set(alpha), {0, 255})
            bbox = frame.getchannel("A").getbbox()
            self.assertIsNotNone(bbox)
            left, top, right, bottom = bbox
            self.assertGreaterEqual(left, 1)
            self.assertLessEqual(right, 63)
            self.assertIn(bottom - top, (54, 55, 56))
            self.assertEqual(bottom - 1, EXPECTED_BASELINE_Y)
            colors.update(pixel[:3] for pixel in frame.get_flattened_data() if pixel[3] == 255)
        self.assertLessEqual(len(colors), EXPECTED_MAX_COLORS)

    def test_idle_and_four_run_frames_are_unique_with_readable_alpha_motion(self) -> None:
        frames = load_frames(ASSET)
        self.assertEqual(len({frame.tobytes() for frame in frames}), 5)
        run_masks = [list(frame.getchannel("A").get_flattened_data()) for frame in frames[1:]]
        for left, right in combinations(run_masks, 2):
            changed = sum(a != b for a, b in zip(left, right, strict=True))
            opaque = max(sum(value == 255 for value in left), sum(value == 255 for value in right))
            self.assertGreaterEqual(changed / opaque, 0.04)

    def test_frame4_recovery_is_a_connected_reverse_passing_pose(self) -> None:
        idle, recovery = load_frames(ASSET)[0], load_frames(ASSET)[4]
        idle_lower = list(idle.crop((0, 40, 64, 57)).getchannel("A").get_flattened_data())
        recovery_lower = list(recovery.crop((0, 40, 64, 57)).getchannel("A").get_flattened_data())
        changed = sum(a != b for a, b in zip(idle_lower, recovery_lower, strict=True))
        self.assertGreaterEqual(changed, 120)

        row = [recovery.getchannel("A").getpixel((x, 47)) == 255 for x in range(12, 52)]
        opaque_runs = sum(value and (index == 0 or not row[index - 1]) for index, value in enumerate(row))
        self.assertEqual(opaque_runs, 1)

    def test_amber_identity_block_and_opaque_area_stay_stable(self) -> None:
        areas = []
        for frame in load_frames(ASSET):
            opaque = [pixel for pixel in frame.get_flattened_data() if pixel[3] == 255]
            amber = [pixel for pixel in opaque if pixel[0] > 150 and pixel[1] > 70 and pixel[2] < 80]
            self.assertGreaterEqual(len(amber), 60)
            self.assertLessEqual(len(amber), 100)
            areas.append(len(opaque))
        median = sorted(areas)[len(areas) // 2]
        for area in areas:
            self.assertLessEqual(abs(area - median) / median, 0.08)

    def test_builder_is_byte_deterministic(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            outputs = []
            for stem in ("first", "second"):
                png = directory / f"{stem}.png"
                js = directory / f"{stem}.js"
                result = run_builder(
                    "--socket-source", str(SOCKETS),
                    "--output", str(png),
                    "--socket-output", str(js),
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                outputs.append((png.read_bytes(), js.read_bytes()))
            self.assertEqual(outputs[0], outputs[1])

    def test_invalid_socket_payload_fails_without_replacing_png_or_js(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            bad = directory / "bad.json"
            png = directory / "asset.png"
            js = directory / "sockets.js"
            bad.write_text(json.dumps({"schemaVersion": 1, "frames": []}), encoding="utf-8")
            png.write_bytes(b"old-png")
            js.write_bytes(b"old-js")
            result = run_builder(
                "--socket-source", str(bad),
                "--output", str(png),
                "--socket-output", str(js),
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(png.read_bytes(), b"old-png")
            self.assertEqual(js.read_bytes(), b"old-js")

    def test_torso_only_support_socket_fails_without_replacing_png_or_js(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            payload = json.loads(SOCKETS.read_text(encoding="utf-8"))
            payload["frames"][0]["supportX"] = 31
            payload["frames"][0]["supportY"] = 35
            bad = directory / "torso-only-support.json"
            png = directory / "asset.png"
            js = directory / "sockets.js"
            bad.write_text(json.dumps(payload), encoding="utf-8")
            png.write_bytes(b"old-png")
            js.write_bytes(b"old-js")

            result = run_builder(
                "--socket-source", str(bad),
                "--output", str(png),
                "--socket-output", str(js),
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("upper-arm", result.stderr)
            self.assertEqual(png.read_bytes(), b"old-png")
            self.assertEqual(js.read_bytes(), b"old-js")


if __name__ == "__main__":
    unittest.main()
