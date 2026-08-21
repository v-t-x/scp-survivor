from __future__ import annotations

import hashlib
import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public/assets/art/characters/player-response-operative-breacher-sample.png"
LOCKED_SHA = "c95e247abac034c6fd770d685f1e45f9fab12279d639e63850c572ef95cc8396"
EXPECTED_SAME_FRAME_RGBA_SHA256 = {
    "weapons/foundation-containment-rifle-same-back.png":
        "4054847d1a33eb203703957410fc068e3cb12c04b92286d3bf7fa891ab956e37",
    "weapons/foundation-containment-rifle-same-front.png":
        "7a05434904983349a984c0d92a91209124b0e9de14c504fab2eaee45448a8112",
    "weapons/tesla-containment-emitter-same-back.png":
        "5610d407624556113f82695b53245b299ac2b36410668916e1b83171088d6e21",
    "weapons/tesla-containment-emitter-same-front.png":
        "8801a3378d439f7f078951af517879846ca551be18abe89bfc5a83cb1461df1d",
}

SPEC = importlib.util.spec_from_file_location(
    "player_equipment_builder", ROOT / "scripts/art/build_player_equipment_assets.py"
)
assert SPEC and SPEC.loader
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def alpha_values(image: Image.Image) -> set[int]:
    return set(image.convert("RGBA").getchannel("A").get_flattened_data())


def rgba_digest(image: Image.Image) -> str:
    return hashlib.sha256(image.convert("RGBA").tobytes()).hexdigest()


class PlayerEquipmentAssetTests(unittest.TestCase):
    def test_locked_body_input_matches_exact_sha256(self):
        self.assertEqual(digest(SOURCE), LOCKED_SHA)

    def test_production_body_is_byte_identical_to_locked_a(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            self.assertEqual(
                (root / builder.BODY_PATH).read_bytes(),
                SOURCE.read_bytes(),
            )

    def test_runtime_layers_are_rgba_with_binary_alpha(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            for relative in builder.RUNTIME_LAYER_PATHS:
                with Image.open(root / relative) as image:
                    self.assertEqual(image.mode, "RGBA")
                    self.assertEqual(image.size, (64, 64))
                    self.assertLessEqual(alpha_values(image), {0, 255})

    def test_pose_sheets_have_five_non_empty_binary_alpha_frames(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            self.assertEqual(len(builder.POSE_SHEET_PATHS), 8)
            for relative in builder.POSE_SHEET_PATHS:
                with Image.open(root / relative) as image:
                    self.assertEqual(image.mode, "RGBA", relative)
                    self.assertEqual(image.size, (320, 64), relative)
                    self.assertLessEqual(alpha_values(image), {0, 255}, relative)
                    for frame in range(5):
                        alpha = image.crop((frame * 64, 0, (frame + 1) * 64, 64)).getchannel("A")
                        self.assertIsNotNone(alpha.getbbox(), f"{relative} frame {frame}")

    def test_same_pose_idle_frames_are_pixel_identical_to_the_approved_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            for relative, expected in EXPECTED_SAME_FRAME_RGBA_SHA256.items():
                with Image.open(root / relative) as sheet:
                    idle = sheet.crop((0, 0, 64, 64))
                    self.assertEqual(rgba_digest(idle), expected, relative)

    def test_cross_pose_is_authored_separately_from_same_pose(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            for equipment in ("foundation-containment-rifle", "tesla-containment-emitter"):
                for layer in ("back", "front"):
                    with Image.open(root / f"weapons/{equipment}-same-{layer}.png") as same:
                        with Image.open(root / f"weapons/{equipment}-cross-{layer}.png") as cross:
                            same_idle = same.crop((0, 0, 64, 64)).convert("RGBA")
                            cross_idle = cross.crop((0, 0, 64, 64)).convert("RGBA")
                            self.assertNotEqual(
                                rgba_digest(same_idle),
                                rgba_digest(cross_idle),
                                f"{equipment} {layer}",
                            )
                            self.assertNotEqual(
                                rgba_digest(ImageOps.mirror(same_idle)),
                                rgba_digest(cross_idle),
                                f"{equipment} {layer} must use a dedicated body-left/aim-right connection",
                            )

    def test_runtime_pose_sheets_match_the_deterministic_builder(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            for relative in builder.POSE_SHEET_PATHS:
                self.assertEqual(
                    (ROOT / "public/assets/art" / relative).read_bytes(),
                    (root / relative).read_bytes(),
                    relative,
                )

    def test_rifle_core_is_exactly_the_approved_same_weapon_without_arms_then_mirrored(self):
        same_back, same_front = builder.build_foundation_rifle_same_layers()
        weapon_front = builder._without_colors(
            same_front,
            (builder.ARMOR_DEEP, builder.ARMOR_MID, builder.ARMOR_EDGE),
        )
        expected = ImageOps.mirror(Image.alpha_composite(same_back, weapon_front))

        self.assertEqual(
            rgba_digest(builder.build_foundation_rifle_core_positive_x()),
            rgba_digest(expected),
            "continuous core must preserve the approved A weapon pixels without replacement stock",
        )

    def test_tesla_core_is_exactly_the_approved_emitter_mirrored_without_a_mast(self):
        approved_left = builder.new_layer()
        builder._draw_tesla_emitter_left(ImageDraw.Draw(approved_left))
        expected = ImageOps.mirror(approved_left)

        self.assertEqual(
            rgba_digest(builder.build_tesla_emitter_core_positive_x()),
            rgba_digest(expected),
            "continuous Tesla core must not append the rejected conductive mast",
        )

    def test_power_module_is_the_approved_pack_in_body_local_coordinates(self):
        module = builder.build_tesla_power_module_body_local()
        approved = builder.new_layer()
        builder._draw_tesla_pack(ImageDraw.Draw(approved))
        self.assertEqual(module.mode, "RGBA")
        self.assertEqual(module.size, (64, 64))
        self.assertLessEqual(alpha_values(module), {0, 255})
        self.assertLessEqual(module.getchannel("A").getbbox()[2] - module.getchannel("A").getbbox()[0], 16)
        self.assertEqual(rgba_digest(module), rgba_digest(approved))

    def test_connector_atlases_cover_eight_directions_and_five_walk_frames(self):
        expected_paths = (
            "weapons/foundation-containment-rifle-connector-back.png",
            "weapons/foundation-containment-rifle-connector-front.png",
            "weapons/tesla-containment-emitter-connector-back.png",
            "weapons/tesla-containment-emitter-connector-front.png",
        )
        self.assertEqual(builder.CONNECTOR_SHEET_PATHS, expected_paths)

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            sockets = builder.load_body_sockets()
            for relative in expected_paths:
                with Image.open(root / relative) as image:
                    self.assertEqual(image.mode, "RGBA", relative)
                    self.assertEqual(image.size, (320, 512), relative)
                    self.assertLessEqual(alpha_values(image), {0, 255}, relative)
                    for direction in range(8):
                        for frame in range(5):
                            cell = image.crop((
                                frame * 64,
                                direction * 64,
                                (frame + 1) * 64,
                                (direction + 1) * 64,
                            ))
                            self.assertIsNotNone(
                                cell.getchannel("A").getbbox(),
                                f"{relative} direction {direction} frame {frame}",
                            )
                            socket = sockets[frame]
                            socket_point = (
                                (socket["supportX"], socket["supportY"])
                                if "-back.png" in relative
                                else (socket["gripX"], socket["gripY"])
                            )
                            self.assertEqual(
                                cell.getpixel(socket_point)[3],
                                255,
                                f"{relative} direction {direction} frame {frame} must meet its body socket",
                            )

    def test_runtime_connector_atlases_match_the_deterministic_builder(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            for relative in builder.CONNECTOR_SHEET_PATHS:
                self.assertEqual(
                    (ROOT / "public/assets/art" / relative).read_bytes(),
                    (root / relative).read_bytes(),
                    relative,
                )

    def test_complete_aim_pose_atlases_cover_sixteen_directions_and_recoil_without_breaking_shoulders(self):
        expected_paths = (
            "weapons/foundation-containment-rifle-aim-back.png",
            "weapons/foundation-containment-rifle-aim-front.png",
            "weapons/foundation-containment-rifle-aim-recoil-back.png",
            "weapons/foundation-containment-rifle-aim-recoil-front.png",
            "weapons/tesla-containment-emitter-aim-back.png",
            "weapons/tesla-containment-emitter-aim-front.png",
            "weapons/tesla-containment-emitter-aim-recoil-back.png",
            "weapons/tesla-containment-emitter-aim-recoil-front.png",
        )
        self.assertEqual(getattr(builder, "AIM_POSE_SHEET_PATHS", ()), expected_paths)
        self.assertEqual(getattr(builder, "AIM_DIRECTION_COUNT", None), 16)
        self.assertEqual(getattr(builder, "AIM_SHEET_SIZE", None), (320, 1024))

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            sockets = builder.load_body_sockets()
            for relative in expected_paths:
                with Image.open(root / relative) as image:
                    self.assertEqual(image.mode, "RGBA", relative)
                    self.assertEqual(image.size, (320, 1024), relative)
                    self.assertLessEqual(alpha_values(image), {0, 255}, relative)
                    for direction in range(16):
                        for frame in range(5):
                            cell = image.crop((
                                frame * 64,
                                direction * 64,
                                (frame + 1) * 64,
                                (direction + 1) * 64,
                            )).convert("RGBA")
                            self.assertIsNotNone(
                                cell.getchannel("A").getbbox(),
                                f"{relative} direction {direction} frame {frame}",
                            )
                            socket = sockets[frame]
                            socket_point = (
                                (socket["supportX"], socket["supportY"])
                                if "-back.png" in relative
                                else (socket["gripX"], socket["gripY"])
                            )
                            self.assertEqual(
                                cell.getpixel(socket_point)[3],
                                255,
                                f"{relative} direction {direction} frame {frame} must stay attached to its shoulder",
                            )

            for equipment in ("foundation-containment-rifle", "tesla-containment-emitter"):
                for layer in ("back", "front"):
                    with Image.open(root / f"weapons/{equipment}-aim-{layer}.png") as normal:
                        with Image.open(root / f"weapons/{equipment}-aim-recoil-{layer}.png") as recoil:
                            self.assertNotEqual(
                                rgba_digest(normal),
                                rgba_digest(recoil),
                                f"{equipment} {layer} must author a connected recoil pose",
                            )

    def test_two_icons_are_exact_96px_and_visibly_distinct(self):
        rifle = builder.build_icon(builder.build_foundation_rifle_core_positive_x())
        tesla = builder.build_icon(
            builder.build_tesla_emitter_core_positive_x(),
            builder.build_tesla_power_module_body_local(),
        )
        self.assertEqual(rifle.size, (96, 96))
        self.assertEqual(tesla.size, (96, 96))
        self.assertNotEqual(hashlib.sha256(rifle.tobytes()).digest(), hashlib.sha256(tesla.tobytes()).digest())

    def test_builder_is_byte_deterministic(self):
        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second:
            builder.build_outputs(SOURCE, Path(first))
            builder.build_outputs(SOURCE, Path(second))
            self.assertEqual(
                {path: digest(Path(first) / path) for path in builder.ALL_OUTPUT_PATHS},
                {path: digest(Path(second) / path) for path in builder.ALL_OUTPUT_PATHS},
            )

    def test_invalid_input_writes_nothing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            bad_source = root / "bad.png"
            bad_source.write_bytes(b"not-the-locked-body")
            output = root / "output"
            with self.assertRaises(ValueError):
                builder.build_outputs(bad_source, output)
            self.assertFalse(output.exists())

    def test_mid_write_failure_restores_every_previous_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            before = {path: (root / path).read_bytes() for path in builder.ALL_OUTPUT_PATHS}
            calls = 0

            def fail_second_replace(source, destination):
                nonlocal calls
                calls += 1
                if calls == 2:
                    raise OSError("injected replacement failure")
                os.replace(source, destination)

            with self.assertRaises(OSError):
                builder.build_outputs(SOURCE, root, replace=fail_second_replace)
            self.assertEqual(before, {path: (root / path).read_bytes() for path in builder.ALL_OUTPUT_PATHS})

    def test_serialization_failure_preserves_destinations_and_leaves_no_temporary_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            builder.build_outputs(SOURCE, root)
            before = {path: (root / path).read_bytes() for path in builder.ALL_OUTPUT_PATHS}

            with mock.patch.object(Image.Image, "save", side_effect=OSError("injected serialization failure")):
                with self.assertRaises(OSError):
                    builder.build_outputs(SOURCE, root)

            self.assertEqual(before, {path: (root / path).read_bytes() for path in builder.ALL_OUTPUT_PATHS})
            self.assertEqual([], list(root.rglob("*.tmp")))


if __name__ == "__main__":
    unittest.main()
