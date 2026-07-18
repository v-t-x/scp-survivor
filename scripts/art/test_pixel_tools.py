from __future__ import annotations

import hashlib
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
NORMALIZER = ROOT / "scripts" / "art" / "normalize_pixel_asset.py"
CONTACT_SHEET = ROOT / "scripts" / "art" / "build_contact_sheet.py"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class PixelToolTests(unittest.TestCase):
    def run_tool(self, tool: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(tool), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def write_fixture(self, path: Path, pixels: list[tuple[int, int, int, int]], size: tuple[int, int]) -> None:
        from PIL import Image

        image = Image.new("RGBA", size)
        image.putdata(pixels)
        image.save(path)

    def test_00_required_tools_exist_before_contract_checks(self) -> None:
        self.assertTrue(NORMALIZER.is_file(), f"missing deterministic normalizer: {NORMALIZER}")
        self.assertTrue(CONTACT_SHEET.is_file(), f"missing deterministic contact-sheet builder: {CONTACT_SHEET}")

    def test_normalizer_is_deterministic_and_enforces_binary_alpha(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            source = directory / "source.png"
            first = directory / "first.png"
            second = directory / "second.png"
            self.write_fixture(
                source,
                [
                    (24, 40, 58, 255), (24, 40, 58, 255), (176, 124, 48, 128), (176, 124, 48, 0),
                    (51, 72, 94, 255), (51, 72, 94, 255), (190, 148, 66, 200), (190, 148, 66, 0),
                ],
                (4, 2),
            )
            args = [
                "--input", str(source), "--width", "8", "--height", "8", "--fit", "contain",
                "--alpha", "binary", "--colors", "4",
            ]
            first_run = self.run_tool(NORMALIZER, *args, "--output", str(first))
            self.assertEqual(first_run.returncode, 0, first_run.stderr)
            second_run = self.run_tool(NORMALIZER, *args, "--output", str(second))
            self.assertEqual(second_run.returncode, 0, second_run.stderr)

            self.assertEqual(sha256(first), sha256(second))
            image = Image.open(first).convert("RGBA")
            self.assertEqual(image.size, (8, 8))
            values = list(image.get_flattened_data())
            self.assertTrue(all(pixel[3] in (0, 255) for pixel in values))
            self.assertLessEqual(len({pixel[:3] for pixel in values if pixel[3] == 255}), 4)

    def test_seam_wrap_makes_opposite_edges_identical(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            source = directory / "source.png"
            output = directory / "wrapped.png"
            self.write_fixture(
                source,
                [
                    (15, 28, 42, 255), (48, 66, 84, 255), (92, 112, 132, 255), (154, 112, 46, 255),
                    (22, 38, 54, 255), (56, 76, 96, 255), (98, 120, 142, 255), (166, 126, 52, 255),
                    (30, 48, 64, 255), (66, 88, 108, 255), (108, 132, 154, 255), (180, 142, 60, 255),
                    (38, 58, 76, 255), (78, 102, 124, 255), (122, 148, 168, 255), (194, 156, 66, 255),
                ],
                (4, 4),
            )
            result = self.run_tool(
                NORMALIZER,
                "--input", str(source), "--output", str(output), "--width", "8", "--height", "8",
                "--fit", "cover", "--alpha", "opaque", "--colors", "8", "--seam-wrap",
            )
            self.assertEqual(result.returncode, 0, result.stderr)

            image = Image.open(output).convert("RGBA")
            self.assertEqual(image.size, (8, 8))
            for y in range(image.height):
                self.assertEqual(image.getpixel((0, y)), image.getpixel((image.width - 1, y)))
            for x in range(image.width):
                self.assertEqual(image.getpixel((x, 0)), image.getpixel((x, image.height - 1)))

    def test_contact_sheet_uses_integer_nearest_scale_only(self) -> None:
        from PIL import Image

        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            first = directory / "first.png"
            second = directory / "second.png"
            output = directory / "sheet.png"
            self.write_fixture(first, [(20, 30, 40, 255), (50, 60, 70, 255), (80, 90, 100, 255), (110, 120, 130, 255)], (2, 2))
            self.write_fixture(second, [(180, 120, 50, 255), (150, 90, 40, 255), (120, 60, 30, 255), (90, 30, 20, 255)], (2, 2))

            result = self.run_tool(
                CONTACT_SHEET,
                "--inputs", str(first), str(second), "--scale", "4", "--columns", "2", "--output", str(output),
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            image = Image.open(output).convert("RGBA")
            self.assertEqual(image.size, (16, 8))
            self.assertEqual(image.getpixel((0, 0)), image.getpixel((3, 3)))
            self.assertEqual(image.getpixel((8, 0)), image.getpixel((11, 3)))

            invalid = self.run_tool(
                CONTACT_SHEET,
                "--inputs", str(first), "--scale", "1.5", "--columns", "1", "--output", str(directory / "invalid.png"),
            )
            self.assertNotEqual(invalid.returncode, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
