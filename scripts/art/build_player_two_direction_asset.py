from __future__ import annotations

import argparse
import hashlib
import json
import os
import tempfile
from itertools import combinations
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw


FRAME_SIZE = 64
FRAME_COUNT = 5
BASELINE_Y = 56
SHEET_SIZE = (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE)
MAX_OPAQUE_COLORS = 16
EXPECTED_IDLE_RGBA_SHA256 = "a22cbc0606d41dc59c4c008e9c56e1d5aff96b0d619b2271c15ab553aad7911f"
SOCKET_KEYS = {"index", "gripX", "gripY", "supportX", "supportY", "equipmentLayer"}


PALETTE = {
    "outline": (7, 10, 14, 255),
    "deep": (14, 19, 25, 255),
    "charcoal": (25, 33, 43, 255),
    "armor": (45, 57, 70, 255),
    "steel": (79, 94, 108, 255),
    "highlight": (113, 128, 139, 255),
    "amber_deep": (133, 79, 12, 255),
    "amber": (224, 151, 29, 255),
    "amber_light": (255, 204, 73, 255),
}


POSES = (
    {
        "shift": (0, 0),
        "far": ((36, 41), (38, 48), (35, 51, 44, 55)),
        "near": ((27, 41), (26, 49), (21, 52, 32, 56)),
        "shoulders": ((17, 27), (47, 26)),
    },
    {
        "shift": (-1, 0),
        "far": ((36, 41), (42, 47), (40, 50, 51, 55)),
        "near": ((27, 41), (21, 47), (12, 51, 27, 56)),
        "shoulders": ((16, 26), (46, 27)),
    },
    {
        "shift": (0, 1),
        "far": ((36, 42), (33, 49), (27, 52, 38, 56)),
        "near": ((27, 42), (31, 49), (31, 51, 43, 55)),
        "shoulders": ((18, 28), (47, 27)),
    },
    {
        "shift": (-1, 0),
        "far": ((36, 41), (28, 47), (15, 50, 30, 56)),
        "near": ((27, 41), (36, 48), (36, 51, 50, 55)),
        "shoulders": ((16, 27), (45, 26)),
    },
    {
        "shift": (0, 0),
        "far": ((36, 41), (29, 48), (22, 51, 35, 55)),
        "near": ((27, 41), (35, 48), (34, 52, 48, 56)),
        "shoulders": ((18, 26), (47, 27)),
        "far_on_top": True,
    },
)

ARM_ENDPOINTS = (
    {"grip": (21, 31), "support": (36, 33)},
    {"grip": (20, 30), "support": (35, 32)},
    {"grip": (22, 32), "support": (37, 34)},
    {"grip": (20, 31), "support": (34, 33)},
    {"grip": (22, 30), "support": (36, 32)},
)


def _polygon(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], fill: tuple[int, int, int, int]) -> None:
    draw.polygon(points, fill=fill)


def _rectangle(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: tuple[int, int, int, int]) -> None:
    draw.rectangle(box, fill=fill)


def _draw_leg(
    draw: ImageDraw.ImageDraw,
    *,
    hip: tuple[int, int],
    knee: tuple[int, int],
    boot: tuple[int, int, int, int],
    near: bool,
) -> None:
    hx, hy = hip
    kx, ky = knee
    bx0, by0, bx1, by1 = boot
    _polygon(
        draw,
        [
            (hx - 4, hy - 2),
            (hx + 4, hy - 2),
            (kx + 4, ky),
            (bx1 - 2, by0 + 2),
            (bx1, by1),
            (bx0, by1),
            (bx0, by0 + 1),
            (kx - 4, ky),
        ],
        PALETTE["outline"],
    )
    _polygon(
        draw,
        [
            (hx - 2, hy),
            (hx + 2, hy),
            (kx + 2, ky),
            (bx1 - 3, by0 + 2),
            (bx1 - 2, by1 - 2),
            (bx0 + 2, by1 - 2),
            (bx0 + 2, by0 + 2),
            (kx - 2, ky),
        ],
        PALETTE["armor"] if near else PALETTE["charcoal"],
    )
    _rectangle(
        draw,
        (kx - 2, ky - 1, kx + 3, ky + 2),
        PALETTE["steel"] if near else PALETTE["armor"],
    )
    _rectangle(draw, (bx0 + 1, by1 - 2, bx1 - 1, by1), PALETTE["deep"])
    if near:
        _rectangle(
            draw,
            (bx0 + 2, by0 + 2, min(bx1 - 2, bx0 + 6), by0 + 3),
            PALETTE["highlight"],
        )


def _draw_shared_torso(draw: ImageDraw.ImageDraw, shift: tuple[int, int]) -> None:
    sx, sy = shift
    _polygon(
        draw,
        [
            (17 + sx, 25 + sy),
            (39 + sx, 22 + sy),
            (48 + sx, 28 + sy),
            (44 + sx, 42 + sy),
            (21 + sx, 43 + sy),
            (13 + sx, 34 + sy),
        ],
        PALETTE["outline"],
    )
    _polygon(
        draw,
        [
            (20 + sx, 27 + sy),
            (38 + sx, 25 + sy),
            (44 + sx, 29 + sy),
            (41 + sx, 39 + sy),
            (23 + sx, 40 + sy),
            (17 + sx, 34 + sy),
        ],
        PALETTE["charcoal"],
    )
    _polygon(
        draw,
        [
            (21 + sx, 28 + sy),
            (37 + sx, 26 + sy),
            (40 + sx, 30 + sy),
            (37 + sx, 36 + sy),
            (23 + sx, 37 + sy),
            (18 + sx, 33 + sy),
        ],
        PALETTE["armor"],
    )
    _polygon(
        draw,
        [(23 + sx, 29 + sy), (36 + sx, 28 + sy), (37 + sx, 31 + sy), (24 + sx, 33 + sy)],
        PALETTE["steel"],
    )
    _rectangle(draw, (24 + sx, 36 + sy, 39 + sx, 39 + sy), PALETTE["deep"])
    _rectangle(draw, (26 + sx, 36 + sy, 31 + sx, 37 + sy), PALETTE["amber_deep"])


def _draw_visible_upper_arm_stumps(
    draw: ImageDraw.ImageDraw,
    shoulders: tuple[tuple[int, int], tuple[int, int]],
) -> None:
    front_shoulder, rear_shoulder = shoulders
    fx, fy = front_shoulder
    rx, ry = rear_shoulder
    _polygon(
        draw,
        [(fx - 5, fy), (fx + 3, fy - 3), (fx + 6, fy + 4), (fx + 2, fy + 10), (fx - 4, fy + 8)],
        PALETTE["outline"],
    )
    _polygon(
        draw,
        [(fx - 3, fy + 1), (fx + 2, fy - 1), (fx + 4, fy + 4), (fx + 1, fy + 7), (fx - 2, fy + 6)],
        PALETTE["steel"],
    )
    _rectangle(draw, (fx - 2, fy + 7, fx + 2, fy + 9), PALETTE["deep"])
    _polygon(
        draw,
        [(rx - 3, ry - 2), (rx + 4, ry), (rx + 6, ry + 6), (rx + 1, ry + 10), (rx - 4, ry + 6)],
        PALETTE["outline"],
    )
    _polygon(
        draw,
        [(rx - 2, ry), (rx + 2, ry + 1), (rx + 3, ry + 5), (rx, ry + 7), (rx - 2, ry + 5)],
        PALETTE["armor"],
    )
    _rectangle(draw, (rx - 1, ry + 7, rx + 3, ry + 9), PALETTE["deep"])


def _terminal_arm_mask(start: tuple[int, int], endpoint: tuple[int, int]) -> Image.Image:
    mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE), 0)
    ImageDraw.Draw(mask).line((start, endpoint), fill=255, width=3)
    dx = endpoint[0] - start[0]
    dy = endpoint[1] - start[1]
    pixels = mask.load()
    for y in range(FRAME_SIZE):
        for x in range(FRAME_SIZE):
            if pixels[x, y] and (x - endpoint[0]) * dx + (y - endpoint[1]) * dy > 0:
                pixels[x, y] = 0
    pixels[endpoint[0], endpoint[1]] = 255
    return mask


def _paint_mask(layer: Image.Image, mask: Image.Image, color: tuple[int, int, int, int]) -> None:
    layer_pixels = layer.load()
    mask_pixels = mask.load()
    bbox = mask.getbbox()
    if bbox is None:
        return
    left, top, right, bottom = bbox
    for y in range(top, bottom):
        for x in range(left, right):
            if mask_pixels[x, y]:
                layer_pixels[x, y] = color


def _build_arm_layers(
    index: int,
    shoulders: tuple[tuple[int, int], tuple[int, int]],
) -> tuple[Image.Image, Image.Image, dict[str, tuple[Image.Image, tuple[int, int], tuple[int, int]]]]:
    front_shoulder, rear_shoulder = shoulders
    endpoints = ARM_ENDPOINTS[index]
    grip_start = (front_shoulder[0], front_shoulder[1] + 1)
    support_start = (rear_shoulder[0], rear_shoulder[1] + 1)
    grip_mask = _terminal_arm_mask(grip_start, endpoints["grip"])
    support_mask = _terminal_arm_mask(support_start, endpoints["support"])

    behind = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    front = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    _paint_mask(behind, support_mask, PALETTE["armor"])
    _draw_visible_upper_arm_stumps(ImageDraw.Draw(front), shoulders)
    return behind, front, {
        "grip": (grip_mask, grip_start, endpoints["grip"]),
        "support": (support_mask, support_start, endpoints["support"]),
    }


def _validate_arm_socket(
    *,
    index: int,
    label: str,
    socket: tuple[int, int],
    mask: Image.Image,
    start: tuple[int, int],
    endpoint: tuple[int, int],
    arm_alpha: Image.Image,
) -> None:
    if socket != endpoint or mask.getpixel(socket) != 255:
        raise ValueError(
            f"frame {index} {label} upper-arm endpoint must terminate at {endpoint}, got {socket}"
        )
    dx = endpoint[0] - start[0]
    dy = endpoint[1] - start[1]
    mask_pixels = mask.load()
    arm_pixels = arm_alpha.load()
    for y in range(FRAME_SIZE):
        for x in range(FRAME_SIZE):
            if not mask_pixels[x, y]:
                continue
            if arm_pixels[x, y] != 255:
                raise ValueError(f"frame {index} {label} upper-arm mask is not covered by its arm layer")
            if (x - endpoint[0]) * dx + (y - endpoint[1]) * dy > 0:
                raise ValueError(f"frame {index} {label} upper-arm continues beyond its socket")


def _draw_shared_helmet(draw: ImageDraw.ImageDraw, shift: tuple[int, int]) -> None:
    sx, sy = shift
    _polygon(
        draw,
        [
            (12 + sx, 13 + sy),
            (18 + sx, 5 + sy),
            (31 + sx, 2 + sy),
            (43 + sx, 6 + sy),
            (48 + sx, 14 + sy),
            (46 + sx, 23 + sy),
            (37 + sx, 28 + sy),
            (18 + sx, 26 + sy),
            (10 + sx, 21 + sy),
        ],
        PALETTE["outline"],
    )
    _polygon(
        draw,
        [
            (17 + sx, 12 + sy),
            (21 + sx, 7 + sy),
            (31 + sx, 5 + sy),
            (41 + sx, 8 + sy),
            (44 + sx, 14 + sy),
            (42 + sx, 20 + sy),
            (35 + sx, 24 + sy),
            (18 + sx, 23 + sy),
            (13 + sx, 20 + sy),
        ],
        PALETTE["charcoal"],
    )
    _polygon(
        draw,
        [(20 + sx, 8 + sy), (31 + sx, 5 + sy), (40 + sx, 8 + sy), (34 + sx, 12 + sy), (19 + sx, 14 + sy)],
        PALETTE["armor"],
    )
    _polygon(
        draw,
        [(11 + sx, 15 + sy), (18 + sx, 13 + sy), (34 + sx, 14 + sy), (36 + sx, 19 + sy), (30 + sx, 22 + sy), (13 + sx, 21 + sy)],
        PALETTE["deep"],
    )
    _polygon(
        draw,
        [(13 + sx, 16 + sy), (18 + sx, 15 + sy), (32 + sx, 16 + sy), (33 + sx, 19 + sy), (29 + sx, 21 + sy), (14 + sx, 20 + sy)],
        PALETTE["amber"],
    )
    _rectangle(draw, (15 + sx, 16 + sy, 28 + sx, 17 + sy), PALETTE["amber_light"])
    _rectangle(draw, (36 + sx, 12 + sy, 43 + sx, 20 + sy), PALETTE["deep"])
    _rectangle(draw, (38 + sx, 13 + sy, 42 + sx, 17 + sy), PALETTE["steel"])
    _rectangle(draw, (20 + sx, 24 + sy, 35 + sx, 26 + sy), PALETTE["armor"])


def _draw_frame(
    index: int,
) -> tuple[
    Image.Image,
    Image.Image,
    dict[str, tuple[Image.Image, tuple[int, int], tuple[int, int]]],
]:
    pose = POSES[index]
    frame = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    leg_order = (("near", True), ("far", False)) if pose.get("far_on_top") else (("far", False), ("near", True))
    for leg_name, is_near in leg_order:
        leg = pose[leg_name]
        _draw_leg(draw, hip=leg[0], knee=leg[1], boot=leg[2], near=is_near)
    behind_arms, front_arms, arm_paths = _build_arm_layers(index, pose["shoulders"])
    frame.alpha_composite(behind_arms)
    _draw_shared_torso(draw, pose["shift"])
    frame.alpha_composite(front_arms)
    _draw_shared_helmet(draw, pose["shift"])
    arm_alpha = Image.alpha_composite(behind_arms, front_arms).getchannel("A")
    return frame, arm_alpha, arm_paths


def _validate_socket_payload(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        raise ValueError("socket payload must be an object")
    expected_top_keys = {"schemaVersion", "frameWidth", "frameHeight", "frameCount", "frames"}
    if set(payload) != expected_top_keys:
        raise ValueError("socket payload has unexpected or missing top-level fields")
    if payload["schemaVersion"] != 1:
        raise ValueError("schemaVersion must be 1")
    if payload["frameWidth"] != FRAME_SIZE or payload["frameHeight"] != FRAME_SIZE:
        raise ValueError("socket frame dimensions must be 64x64")
    if payload["frameCount"] != FRAME_COUNT:
        raise ValueError("socket frameCount must be 5")
    frames = payload["frames"]
    if not isinstance(frames, list) or len(frames) != FRAME_COUNT:
        raise ValueError("socket frames must contain exactly five entries")
    validated = []
    for expected_index, frame in enumerate(frames):
        if not isinstance(frame, dict) or set(frame) != SOCKET_KEYS:
            raise ValueError(f"socket frame {expected_index} has invalid fields")
        if frame["index"] != expected_index:
            raise ValueError(f"socket frame {expected_index} has a mismatched index")
        for key in ("gripX", "gripY", "supportX", "supportY"):
            value = frame[key]
            if isinstance(value, bool) or not isinstance(value, int) or not 0 <= value < FRAME_SIZE:
                raise ValueError(f"socket frame {expected_index} {key} must be an integer in 0..63")
        if frame["equipmentLayer"] not in ("front", "behind"):
            raise ValueError(f"socket frame {expected_index} equipmentLayer must be front or behind")
        validated.append(dict(frame))
    return validated


def _load_sockets(path: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ValueError(f"cannot read socket payload: {error}") from error
    return _validate_socket_payload(payload)


def _build_sheet(sockets: list[dict[str, Any]]) -> Image.Image:
    rendered = [_draw_frame(index) for index in range(FRAME_COUNT)]
    frames = [item[0] for item in rendered]
    idle_hash = hashlib.sha256(frames[0].tobytes()).hexdigest()
    if idle_hash != EXPECTED_IDLE_RGBA_SHA256:
        raise ValueError(f"idle RGBA hash changed: {idle_hash}")

    colors: set[tuple[int, int, int]] = set()
    areas: list[int] = []
    for index, ((frame, arm_alpha, arm_paths), socket) in enumerate(zip(rendered, sockets, strict=True)):
        alpha = list(frame.getchannel("A").get_flattened_data())
        if set(alpha) != {0, 255}:
            raise ValueError(f"frame {index} must use binary alpha")
        bbox = frame.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError(f"frame {index} is empty")
        left, top, right, bottom = bbox
        if left < 1 or right > 63:
            raise ValueError(f"frame {index} touches a horizontal edge")
        if bottom - top not in (54, 55, 56) or bottom - 1 != BASELINE_Y:
            raise ValueError(f"frame {index} violates the fixed baseline or visible height")
        opaque = [pixel for pixel in frame.get_flattened_data() if pixel[3] == 255]
        amber = [pixel for pixel in opaque if pixel[0] > 150 and pixel[1] > 70 and pixel[2] < 80]
        if not 60 <= len(amber) <= 100:
            raise ValueError(f"frame {index} amber area is {len(amber)}, expected 60..100")
        for label, key_pair in (("grip", ("gripX", "gripY")), ("support", ("supportX", "supportY"))):
            point = (socket[key_pair[0]], socket[key_pair[1]])
            mask, start, endpoint = arm_paths[label]
            _validate_arm_socket(
                index=index,
                label=label,
                socket=point,
                mask=mask,
                start=start,
                endpoint=endpoint,
                arm_alpha=arm_alpha,
            )
        colors.update(pixel[:3] for pixel in opaque)
        areas.append(len(opaque))

    if len(colors) > MAX_OPAQUE_COLORS:
        raise ValueError(f"sheet uses {len(colors)} opaque colors, maximum is {MAX_OPAQUE_COLORS}")
    median = sorted(areas)[FRAME_COUNT // 2]
    if any(abs(area - median) / median > 0.08 for area in areas):
        raise ValueError(f"opaque areas vary by more than 8%: {areas}")
    run_masks = [list(frame.getchannel("A").get_flattened_data()) for frame in frames[1:]]
    for left, right in combinations(run_masks, 2):
        changed = sum(a != b for a, b in zip(left, right, strict=True))
        opaque = max(sum(value == 255 for value in left), sum(value == 255 for value in right))
        if changed / opaque < 0.04:
            raise ValueError("run frame alpha masks differ by less than 4%")

    sheet = Image.new("RGBA", SHEET_SIZE, (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        sheet.alpha_composite(frame, (index * FRAME_SIZE, 0))
    return sheet


def _render_socket_module(sockets: list[dict[str, Any]]) -> bytes:
    lines = ["export const PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS = Object.freeze(["]
    for frame in sockets:
        lines.append(
            "  Object.freeze({ "
            f"index: {frame['index']}, "
            f"gripX: {frame['gripX']}, "
            f"gripY: {frame['gripY']}, "
            f"supportX: {frame['supportX']}, "
            f"supportY: {frame['supportY']}, "
            f'equipmentLayer: "{frame["equipmentLayer"]}"'
            " }),"
        )
    lines.append("]);\n")
    return "\n".join(lines).encode("utf-8")


def _new_temporary_path(parent: Path, suffix: str) -> Path:
    handle = tempfile.NamedTemporaryFile(prefix=".player-two-direction-", suffix=suffix, dir=parent, delete=False)
    path = Path(handle.name)
    handle.close()
    return path


def _write_temporary_outputs(sheet: Image.Image, module: bytes, output: Path, socket_output: Path) -> tuple[Path, Path]:
    output.parent.mkdir(parents=True, exist_ok=True)
    socket_output.parent.mkdir(parents=True, exist_ok=True)
    png_temp = _new_temporary_path(output.parent, ".png")
    js_temp = _new_temporary_path(socket_output.parent, ".js")
    try:
        sheet.save(png_temp, format="PNG", optimize=False, compress_level=9)
        js_temp.write_bytes(module)
        with Image.open(png_temp) as image:
            image.load()
            if image.size != SHEET_SIZE or image.mode != "RGBA":
                raise ValueError("temporary PNG failed validation")
        if js_temp.read_bytes() != module:
            raise ValueError("temporary socket module failed validation")
        return png_temp, js_temp
    except Exception:
        png_temp.unlink(missing_ok=True)
        js_temp.unlink(missing_ok=True)
        raise


def _restore_target(path: Path, old_bytes: bytes | None) -> None:
    if old_bytes is None:
        path.unlink(missing_ok=True)
        return
    temporary = _new_temporary_path(path.parent, path.suffix)
    try:
        temporary.write_bytes(old_bytes)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def _replace_pair(png_temp: Path, js_temp: Path, output: Path, socket_output: Path) -> None:
    old_png = output.read_bytes() if output.exists() else None
    old_js = socket_output.read_bytes() if socket_output.exists() else None
    try:
        os.replace(png_temp, output)
        os.replace(js_temp, socket_output)
    except Exception as replace_error:
        restore_errors = []
        for path, old_bytes in ((output, old_png), (socket_output, old_js)):
            try:
                _restore_target(path, old_bytes)
            except Exception as restore_error:
                restore_errors.append(f"{path}: {restore_error}")
        detail = f"; rollback errors: {', '.join(restore_errors)}" if restore_errors else ""
        raise RuntimeError(f"paired replacement failed and was rolled back: {replace_error}{detail}") from replace_error
    finally:
        png_temp.unlink(missing_ok=True)
        js_temp.unlink(missing_ok=True)


def build(socket_source: Path, output: Path, socket_output: Path) -> None:
    sockets = _load_sockets(socket_source)
    sheet = _build_sheet(sockets)
    module = _render_socket_module(sockets)
    png_temp, js_temp = _write_temporary_outputs(sheet, module, output, socket_output)
    _replace_pair(png_temp, js_temp, output, socket_output)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the fixed five-frame two-direction A quality sample.")
    parser.add_argument("--socket-source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--socket-output", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    build(args.socket_source, args.output, args.socket_output)


if __name__ == "__main__":
    main()
