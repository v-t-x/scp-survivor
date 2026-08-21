from __future__ import annotations

import hashlib
import io
import json
import math
import os
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[2]
PUBLIC_ROOT = ROOT / "public/assets/art"
LOCKED_BODY_SHA256 = "c95e247abac034c6fd770d685f1e45f9fab12279d639e63850c572ef95cc8396"

BODY_PATH = "characters/player-response-operative-body.png"
SOCKET_PATH = ROOT / "scripts/art/data/player-two-direction-quality-sample-sockets.json"
RUNTIME_LAYER_PATHS = (
    "weapons/foundation-containment-rifle-core.png",
    "weapons/tesla-containment-emitter-core.png",
    "weapons/tesla-containment-power-module.png",
)
POSE_SHEET_PATHS = (
    "weapons/foundation-containment-rifle-same-back.png",
    "weapons/foundation-containment-rifle-same-front.png",
    "weapons/foundation-containment-rifle-cross-back.png",
    "weapons/foundation-containment-rifle-cross-front.png",
    "weapons/tesla-containment-emitter-same-back.png",
    "weapons/tesla-containment-emitter-same-front.png",
    "weapons/tesla-containment-emitter-cross-back.png",
    "weapons/tesla-containment-emitter-cross-front.png",
)
CONNECTOR_SHEET_PATHS = (
    "weapons/foundation-containment-rifle-connector-back.png",
    "weapons/foundation-containment-rifle-connector-front.png",
    "weapons/tesla-containment-emitter-connector-back.png",
    "weapons/tesla-containment-emitter-connector-front.png",
)
AIM_POSE_SHEET_PATHS = (
    "weapons/foundation-containment-rifle-aim-back.png",
    "weapons/foundation-containment-rifle-aim-front.png",
    "weapons/foundation-containment-rifle-aim-recoil-back.png",
    "weapons/foundation-containment-rifle-aim-recoil-front.png",
    "weapons/tesla-containment-emitter-aim-back.png",
    "weapons/tesla-containment-emitter-aim-front.png",
    "weapons/tesla-containment-emitter-aim-recoil-back.png",
    "weapons/tesla-containment-emitter-aim-recoil-front.png",
)
ICON_PATHS = (
    "weapons/foundation-containment-rifle-icon.png",
    "weapons/tesla-containment-emitter-icon.png",
)
ALL_OUTPUT_PATHS = (
    BODY_PATH,
    *RUNTIME_LAYER_PATHS,
    *POSE_SHEET_PATHS,
    *CONNECTOR_SHEET_PATHS,
    *AIM_POSE_SHEET_PATHS,
    *ICON_PATHS,
)

POSE_FRAME_OFFSETS = ((0, 0), (-1, -1), (1, 1), (-1, 0), (1, -1))
CONNECTOR_DIRECTION_COUNT = 8
CONNECTOR_FRAME_COUNT = 5
CONNECTOR_SHEET_SIZE = (CONNECTOR_FRAME_COUNT * 64, CONNECTOR_DIRECTION_COUNT * 64)
AIM_DIRECTION_COUNT = 16
AIM_FRAME_COUNT = 5
AIM_SHEET_SIZE = (AIM_FRAME_COUNT * 64, AIM_DIRECTION_COUNT * 64)
CORE_WORLD_PIVOT = (32, 32)

EQUIPMENT_CONNECTOR_POINTS = {
    "rifle": {
        "pivot": (27, 34),
        "grip": (25, 37),
        "support": (42, 32),
        "cable": None,
        "power_port": None,
    },
    "tesla": {
        "pivot": (30, 34),
        "grip": (29, 35),
        "support": (43, 31),
        "cable": (23, 38),
        "power_port": (51, 38),
    },
}
EQUIPMENT_RECOIL_PIXELS = {"rifle": 2, "tesla": 3}

RIFLE_DEEP = (10, 13, 17, 255)
RIFLE_MID = (86, 101, 113, 255)
RIFLE_EDGE = (154, 166, 172, 255)
SAFETY_AMBER = (224, 151, 29, 255)
SAFETY_WHITE = (225, 231, 231, 255)

ARMOR_DEEP = (7, 10, 14, 255)
ARMOR_MID = (45, 57, 70, 255)
ARMOR_EDGE = (79, 94, 108, 255)

TESLA_SHADOW = (7, 10, 14, 255)
TESLA_DARK = (14, 19, 25, 255)
TESLA_STEEL = (45, 57, 70, 255)
TESLA_STEEL_LIGHT = (79, 94, 108, 255)
TESLA_COPPER_DEEP = (104, 49, 13, 255)
TESLA_COPPER = (223, 116, 25, 255)
TESLA_CERAMIC = (202, 210, 205, 255)
TESLA_ELECTRIC_BLUE = (54, 146, 255, 255)
TESLA_ELECTRIC_WHITE = (226, 247, 255, 255)
TESLA_COPPER_COLORS = (TESLA_COPPER_DEEP, TESLA_COPPER)
TESLA_CERAMIC_COLORS = (TESLA_CERAMIC,)
TESLA_ELECTRIC_COLORS = (TESLA_ELECTRIC_BLUE, TESLA_ELECTRIC_WHITE)


def new_layer() -> Image.Image:
    return Image.new("RGBA", (64, 64), (0, 0, 0, 0))


def assert_binary_alpha(image: Image.Image) -> None:
    if image.mode != "RGBA" or image.size != (64, 64):
        raise ValueError("runtime equipment layers must be 64x64 RGBA")
    if not set(image.getchannel("A").get_flattened_data()).issubset({0, 255}):
        raise ValueError("runtime equipment layers must have binary alpha")


def assert_pose_sheet(image: Image.Image) -> None:
    if image.mode != "RGBA" or image.size != (320, 64):
        raise ValueError("runtime equipment pose sheets must be 320x64 RGBA")
    if not set(image.getchannel("A").get_flattened_data()).issubset({0, 255}):
        raise ValueError("runtime equipment pose sheets must have binary alpha")
    for frame in range(5):
        if image.crop((frame * 64, 0, (frame + 1) * 64, 64)).getchannel("A").getbbox() is None:
            raise ValueError("runtime equipment pose sheet contains an empty frame")


def assert_connector_sheet(image: Image.Image) -> None:
    if image.mode != "RGBA" or image.size != CONNECTOR_SHEET_SIZE:
        raise ValueError("runtime equipment connector sheets must be 320x512 RGBA")
    if not set(image.getchannel("A").get_flattened_data()).issubset({0, 255}):
        raise ValueError("runtime equipment connector sheets must have binary alpha")
    for direction in range(CONNECTOR_DIRECTION_COUNT):
        for frame in range(CONNECTOR_FRAME_COUNT):
            cell = image.crop((
                frame * 64,
                direction * 64,
                (frame + 1) * 64,
                (direction + 1) * 64,
            ))
            if cell.getchannel("A").getbbox() is None:
                raise ValueError("runtime equipment connector sheet contains an empty frame")


def assert_aim_pose_sheet(image: Image.Image) -> None:
    if image.mode != "RGBA" or image.size != AIM_SHEET_SIZE:
        raise ValueError("runtime complete aim pose sheets must be 320x1024 RGBA")
    if not set(image.getchannel("A").get_flattened_data()).issubset({0, 255}):
        raise ValueError("runtime complete aim pose sheets must have binary alpha")
    for direction in range(AIM_DIRECTION_COUNT):
        for frame in range(AIM_FRAME_COUNT):
            cell = image.crop((
                frame * 64,
                direction * 64,
                (frame + 1) * 64,
                (direction + 1) * 64,
            ))
            if cell.getchannel("A").getbbox() is None:
                raise ValueError("runtime complete aim pose sheet contains an empty frame")


def load_body_sockets(path: Path = SOCKET_PATH) -> tuple[dict[str, int | str], ...]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    frames = payload.get("frames")
    if (
        payload.get("frameWidth") != 64
        or payload.get("frameHeight") != 64
        or payload.get("frameCount") != CONNECTOR_FRAME_COUNT
        or not isinstance(frames, list)
        or len(frames) != CONNECTOR_FRAME_COUNT
    ):
        raise ValueError("formal player socket contract must contain five 64px frames")
    required = ("gripX", "gripY", "supportX", "supportY")
    for index, socket in enumerate(frames):
        if (
            not isinstance(socket, dict)
            or socket.get("index") != index
            or any(not isinstance(socket.get(key), int) for key in required)
            or any(not 0 <= socket[key] < 64 for key in required)
        ):
            raise ValueError("formal player socket contract is invalid")
    return tuple(dict(socket) for socket in frames)


def verify_locked_body(path: Path) -> bytes:
    payload = path.read_bytes()
    if hashlib.sha256(payload).hexdigest() != LOCKED_BODY_SHA256:
        raise ValueError("locked A body sheet hash mismatch")
    with Image.open(io.BytesIO(payload)) as image:
        if image.mode != "RGBA" or image.size != (320, 64):
            raise ValueError("locked A body sheet must be 320x64 RGBA")
    return payload


def build_foundation_rifle_same_layers() -> tuple[Image.Image, Image.Image]:
    """Reproduce the user-approved screen-left rifle back/front pixels."""
    back = new_layer()
    back_draw = ImageDraw.Draw(back)
    back_draw.line([(39, 30), (44, 25), (47, 24)], fill=RIFLE_DEEP, width=2)
    back_draw.line([(40, 29), (45, 24), (47, 24)], fill=RIFLE_MID, width=1)
    back_draw.polygon(
        [(47, 23), (49, 23), (53, 25), (54, 26), (54, 27), (53, 28), (52, 29), (48, 25)],
        fill=RIFLE_DEEP,
    )
    back_draw.polygon(
        [(48, 24), (49, 24), (53, 26), (53, 27), (52, 28), (49, 25)],
        fill=RIFLE_MID,
    )
    back_draw.line([(47, 23), (49, 23), (53, 25), (54, 26)], fill=RIFLE_EDGE, width=1)
    back_draw.line([(54, 26), (54, 27)], fill=RIFLE_EDGE, width=1)

    front = new_layer()
    front_draw = ImageDraw.Draw(front)
    front_draw.rectangle((4, 29, 7, 32), fill=RIFLE_DEEP)
    front_draw.rectangle((4, 30, 5, 31), fill=RIFLE_EDGE)
    front_draw.rectangle((7, 30, 17, 31), fill=RIFLE_DEEP)
    front_draw.line([(8, 30), (16, 30)], fill=RIFLE_MID, width=1)
    front_draw.polygon(
        [(16, 28), (27, 28), (29, 30), (29, 34), (26, 35), (17, 34), (15, 32)],
        fill=RIFLE_DEEP,
    )
    front_draw.polygon(
        [(18, 29), (26, 29), (28, 30), (28, 33), (25, 34), (18, 33)],
        fill=RIFLE_MID,
    )
    front_draw.line([(17, 28), (27, 28)], fill=RIFLE_EDGE, width=1)
    front_draw.point((21, 32), fill=RIFLE_DEEP)
    front_draw.point((25, 32), fill=RIFLE_DEEP)
    front_draw.polygon(
        [(24, 27), (39, 27), (42, 30), (41, 35), (38, 37), (27, 36), (24, 34)],
        fill=RIFLE_DEEP,
    )
    front_draw.polygon(
        [(26, 29), (38, 29), (40, 31), (39, 34), (37, 35), (27, 34)],
        fill=RIFLE_MID,
    )
    front_draw.line([(32, 29), (39, 29)], fill=RIFLE_MID, width=1)
    front_draw.rectangle((23, 24, 31, 26), fill=RIFLE_DEEP)
    front_draw.rectangle((25, 23, 28, 24), fill=RIFLE_EDGE)
    front_draw.line([(24, 27), (39, 27)], fill=RIFLE_EDGE, width=1)
    front_draw.polygon(
        [(27, 35), (33, 35), (33, 38), (32, 41), (29, 44), (27, 43), (26, 41)],
        fill=RIFLE_DEEP,
    )
    front_draw.polygon(
        [(28, 36), (31, 36), (31, 39), (30, 41), (28, 42), (28, 39)],
        fill=RIFLE_MID,
    )
    front_draw.line([(27, 36), (26, 41), (27, 43), (29, 44), (32, 41)], fill=RIFLE_EDGE, width=1)
    front_draw.polygon([(37, 35), (41, 36), (41, 38), (40, 42), (38, 41), (38, 38)], fill=RIFLE_DEEP)
    front_draw.polygon([(39, 37), (40, 37), (40, 39), (39, 41)], fill=RIFLE_MID)
    front_draw.polygon([(16, 35), (18, 31), (21, 29), (23, 31), (21, 35)], fill=ARMOR_MID)
    front_draw.rectangle((19, 29, 23, 33), fill=ARMOR_DEEP)
    front_draw.rectangle((20, 30, 22, 32), fill=ARMOR_EDGE)
    front_draw.polygon([(39, 38), (38, 34), (36, 31), (34, 32), (34, 36)], fill=ARMOR_MID)
    front_draw.rectangle((34, 31, 38, 35), fill=ARMOR_DEEP)
    front_draw.rectangle((35, 32, 37, 34), fill=ARMOR_EDGE)
    front_draw.rectangle((28, 29, 31, 30), fill=SAFETY_WHITE)
    front_draw.rectangle((17, 28, 18, 28), fill=SAFETY_AMBER)
    assert_binary_alpha(back)
    assert_binary_alpha(front)
    return back, front


def _draw_tesla_pack(draw: ImageDraw.ImageDraw) -> None:
    draw.polygon([(52, 15), (60, 15), (62, 18), (62, 39), (59, 43), (50, 43), (48, 40), (48, 20)], fill=TESLA_SHADOW)
    draw.polygon([(52, 17), (59, 17), (60, 19), (60, 38), (58, 41), (51, 41), (50, 39), (50, 20)], fill=TESLA_STEEL)
    draw.rectangle((52, 20, 58, 26), fill=TESLA_DARK)
    draw.rectangle((53, 21, 57, 24), fill=TESLA_CERAMIC)
    draw.rectangle((52, 29, 58, 37), fill=TESLA_DARK)
    draw.rectangle((54, 30, 58, 35), fill=TESLA_STEEL_LIGHT)
    draw.rectangle((57, 18, 59, 20), fill=TESLA_COPPER)
    draw.rectangle((57, 38, 59, 40), fill=TESLA_COPPER_DEEP)
    draw.point((56, 32), fill=TESLA_ELECTRIC_BLUE)
    draw.point((57, 32), fill=TESLA_ELECTRIC_WHITE)


def _draw_tesla_emitter_left(draw: ImageDraw.ImageDraw) -> None:
    draw.line([(3, 29), (6, 27), (8, 30), (11, 26), (13, 28)], fill=TESLA_ELECTRIC_BLUE, width=2)
    draw.line([(3, 36), (6, 34), (8, 37), (11, 34), (13, 36)], fill=TESLA_ELECTRIC_BLUE, width=2)
    draw.line([(4, 32), (8, 32), (10, 30), (13, 31)], fill=TESLA_ELECTRIC_WHITE, width=1)
    draw.line([(5, 35), (8, 34), (10, 35), (13, 34)], fill=TESLA_ELECTRIC_WHITE, width=1)
    draw.polygon([(10, 27), (12, 24), (17, 24), (19, 27), (19, 38), (17, 41), (12, 41), (10, 38)], fill=TESLA_SHADOW)
    draw.rectangle((12, 26, 17, 39), fill=TESLA_CERAMIC)
    draw.rectangle((13, 28, 16, 37), fill=TESLA_DARK)
    draw.rectangle((11, 28, 18, 30), fill=TESLA_COPPER_DEEP)
    draw.rectangle((11, 31, 18, 33), fill=TESLA_COPPER)
    draw.rectangle((11, 35, 18, 37), fill=TESLA_COPPER_DEEP)
    draw.rectangle((12, 38, 17, 39), fill=TESLA_COPPER)
    draw.polygon([(18, 26), (25, 26), (29, 29), (31, 29), (33, 32), (33, 38), (30, 40), (19, 40)], fill=TESLA_SHADOW)
    draw.rectangle((20, 28, 25, 38), fill=TESLA_STEEL)
    draw.rectangle((22, 29, 24, 37), fill=TESLA_COPPER_DEEP)
    draw.rectangle((25, 30, 28, 38), fill=TESLA_CERAMIC)
    draw.rectangle((29, 31, 32, 37), fill=TESLA_STEEL_LIGHT)
    draw.rectangle((20, 31, 22, 34), fill=TESLA_DARK)
    draw.point((28, 32), fill=TESLA_ELECTRIC_BLUE)
    draw.point((28, 33), fill=TESLA_ELECTRIC_WHITE)


def _draw_tesla_same_arms(draw: ImageDraw.ImageDraw) -> None:
    draw.polygon([(19, 29), (23, 29), (25, 32), (23, 35), (19, 34)], fill=TESLA_SHADOW)
    draw.rectangle((20, 30, 22, 33), fill=TESLA_STEEL_LIGHT)
    draw.polygon([(33, 30), (38, 30), (40, 34), (38, 37), (33, 36)], fill=TESLA_SHADOW)
    draw.rectangle((35, 31, 38, 35), fill=TESLA_STEEL_LIGHT)
    draw.polygon([(38, 34), (43, 36), (44, 41), (42, 45), (38, 43), (36, 38)], fill=TESLA_SHADOW)
    draw.polygon([(39, 36), (42, 37), (43, 41), (41, 43), (38, 41), (37, 38)], fill=TESLA_STEEL)


def build_tesla_same_layers() -> tuple[Image.Image, Image.Image]:
    """Reproduce the user-approved screen-left Tesla back/front pixels."""
    back = new_layer()
    back_draw = ImageDraw.Draw(back)
    _draw_tesla_pack(back_draw)
    back_draw.line([(51, 38), (48, 41), (45, 42), (43, 39), (42, 35)], fill=TESLA_SHADOW, width=5)
    back_draw.line([(51, 38), (48, 39), (46, 40), (44, 38), (43, 35)], fill=TESLA_COPPER_DEEP, width=2)

    front = new_layer()
    front_draw = ImageDraw.Draw(front)
    _draw_tesla_emitter_left(front_draw)
    _draw_tesla_same_arms(front_draw)
    assert_binary_alpha(back)
    assert_binary_alpha(front)
    return back, front


def _without_colors(image: Image.Image, colors: tuple[tuple[int, int, int, int], ...]) -> Image.Image:
    result = image.copy()
    pixels = result.load()
    for y in range(result.height):
        for x in range(result.width):
            if pixels[x, y] in colors:
                pixels[x, y] = (0, 0, 0, 0)
    return result


def _draw_rifle_cross_arms(draw: ImageDraw.ImageDraw) -> None:
    # Body remains screen-left while both hands reconnect across the chest to a
    # screen-right carbine. These are not the mirrored same-pose forearms.
    draw.polygon(
        [(16, 36), (16, 32), (19, 29), (22, 29), (26, 31), (31, 32), (32, 35), (29, 37), (24, 35), (21, 33), (20, 37)],
        fill=ARMOR_MID,
    )
    draw.polygon([(18, 34), (18, 32), (20, 30), (23, 31), (27, 33), (30, 33), (30, 35), (26, 35), (22, 33), (21, 35)], fill=ARMOR_DEEP)
    draw.rectangle((28, 31, 32, 35), fill=ARMOR_DEEP)
    draw.rectangle((29, 32, 31, 34), fill=ARMOR_EDGE)
    draw.polygon([(38, 39), (37, 35), (38, 32), (41, 29), (45, 29), (47, 32), (46, 35), (43, 37), (41, 40)], fill=ARMOR_MID)
    draw.rectangle((42, 30, 46, 34), fill=ARMOR_DEEP)
    draw.rectangle((43, 31, 45, 33), fill=ARMOR_EDGE)


def _draw_tesla_cross_arms(draw: ImageDraw.ImageDraw) -> None:
    # The emitter is heavier than the rifle: one arm braces across the chest
    # while the second supports the lower right housing in front of the pack.
    draw.polygon(
        [(16, 37), (16, 32), (19, 29), (23, 29), (27, 31), (33, 32), (35, 35), (34, 39), (30, 40), (25, 36), (21, 34), (20, 38)],
        fill=ARMOR_MID,
    )
    draw.polygon([(18, 35), (18, 32), (20, 30), (23, 31), (27, 33), (32, 33), (33, 36), (31, 38), (27, 35), (22, 33), (21, 36)], fill=ARMOR_DEEP)
    draw.rectangle((30, 32, 35, 36), fill=ARMOR_DEEP)
    draw.rectangle((31, 33, 34, 35), fill=ARMOR_EDGE)
    draw.polygon([(38, 41), (37, 37), (39, 33), (42, 31), (46, 32), (48, 35), (47, 39), (44, 41), (41, 40)], fill=ARMOR_MID)
    draw.rectangle((42, 32, 47, 36), fill=ARMOR_DEEP)
    draw.rectangle((43, 33, 46, 35), fill=ARMOR_EDGE)


def build_cross_layers(
    equipment: str,
    same_back: Image.Image,
    same_front: Image.Image,
) -> tuple[Image.Image, Image.Image]:
    """Build body-left/aim-right layers without moving Tesla's body-local pack."""
    if equipment == "rifle":
        cross_back = new_layer()
        cross_draw = ImageDraw.Draw(cross_back)
        cross_draw.line([(25, 31), (20, 27), (17, 26)], fill=RIFLE_DEEP, width=2)
        cross_draw.line([(24, 30), (20, 27), (17, 26)], fill=RIFLE_MID, width=1)
        cross_draw.polygon([(16, 25), (14, 25), (10, 27), (9, 28), (9, 30), (10, 31), (12, 32), (16, 27)], fill=RIFLE_DEEP)
        cross_draw.polygon([(15, 26), (14, 26), (10, 28), (10, 29), (11, 30), (12, 31), (15, 27)], fill=RIFLE_MID)
        cross_draw.line([(16, 25), (14, 25), (10, 27), (9, 28)], fill=RIFLE_EDGE, width=1)
        rifle_weapon_only = _without_colors(
            same_front,
            (ARMOR_DEEP, ARMOR_MID, ARMOR_EDGE),
        )
        cross_front = ImageOps.mirror(rifle_weapon_only)
        _draw_rifle_cross_arms(ImageDraw.Draw(cross_front))
    elif equipment == "tesla":
        cross_back = new_layer()
        cross_draw = ImageDraw.Draw(cross_back)
        _draw_tesla_pack(cross_draw)
        cross_draw.line([(51, 38), (49, 41), (45, 42), (42, 40), (39, 37)], fill=TESLA_SHADOW, width=5)
        cross_draw.line([(51, 38), (49, 40), (45, 40), (42, 39), (39, 37)], fill=TESLA_COPPER_DEEP, width=2)
        tesla_emitter_only = new_layer()
        _draw_tesla_emitter_left(ImageDraw.Draw(tesla_emitter_only))
        cross_front = ImageOps.mirror(tesla_emitter_only)
        _draw_tesla_cross_arms(ImageDraw.Draw(cross_front))
    else:
        raise ValueError(f"unsupported equipment pose: {equipment}")
    assert_binary_alpha(cross_back)
    assert_binary_alpha(cross_front)
    return cross_back, cross_front


def build_pose_sheet(layer: Image.Image) -> Image.Image:
    assert_binary_alpha(layer)
    sheet = Image.new("RGBA", (320, 64), (0, 0, 0, 0))
    for index, (offset_x, offset_y) in enumerate(POSE_FRAME_OFFSETS):
        sheet.alpha_composite(layer, dest=(index * 64 + offset_x, offset_y))
    assert_pose_sheet(sheet)
    return sheet


def _rotate_connector_point(
    point: tuple[int, int],
    pivot: tuple[int, int],
    angle: float,
) -> tuple[int, int]:
    local_x = point[0] - pivot[0]
    local_y = point[1] - pivot[1]
    cos = math.cos(angle)
    sin = math.sin(angle)
    return (
        round(CORE_WORLD_PIVOT[0] + local_x * cos - local_y * sin),
        round(CORE_WORLD_PIVOT[1] + local_x * sin + local_y * cos),
    )


def _draw_baked_connector_arm(
    draw: ImageDraw.ImageDraw,
    socket: tuple[int, int],
    equipment_point: tuple[int, int],
) -> None:
    draw.line((socket, equipment_point), fill=ARMOR_DEEP, width=5)
    draw.line((socket, equipment_point), fill=ARMOR_MID, width=3)
    draw.point(socket, fill=ARMOR_EDGE)
    draw.point(equipment_point, fill=ARMOR_EDGE)


def _draw_baked_tesla_cable(
    draw: ImageDraw.ImageDraw,
    port: tuple[int, int],
    cable_point: tuple[int, int],
) -> None:
    loose_point = (
        round((port[0] + cable_point[0]) / 2),
        round((port[1] + cable_point[1]) / 2 + 6),
    )
    draw.line((port, loose_point, cable_point), fill=TESLA_SHADOW, width=5)
    draw.line((port, loose_point, cable_point), fill=TESLA_COPPER_DEEP, width=2)


def build_connector_sheets(
    equipment: str,
    sockets: tuple[dict[str, int | str], ...] | None = None,
) -> tuple[Image.Image, Image.Image]:
    """Bake body-socket connectors for eight aim sectors and five walk frames."""
    if equipment not in EQUIPMENT_CONNECTOR_POINTS:
        raise ValueError(f"unsupported equipment connector: {equipment}")
    sockets = load_body_sockets() if sockets is None else sockets
    if len(sockets) != CONNECTOR_FRAME_COUNT:
        raise ValueError("equipment connectors require five body socket frames")

    points = EQUIPMENT_CONNECTOR_POINTS[equipment]
    back_sheet = Image.new("RGBA", CONNECTOR_SHEET_SIZE, (0, 0, 0, 0))
    front_sheet = Image.new("RGBA", CONNECTOR_SHEET_SIZE, (0, 0, 0, 0))
    for direction in range(CONNECTOR_DIRECTION_COUNT):
        angle = direction * math.tau / CONNECTOR_DIRECTION_COUNT
        grip = _rotate_connector_point(points["grip"], points["pivot"], angle)
        support = _rotate_connector_point(points["support"], points["pivot"], angle)
        cable = (
            _rotate_connector_point(points["cable"], points["pivot"], angle)
            if points["cable"] is not None
            else None
        )
        for frame, socket in enumerate(sockets):
            back = new_layer()
            front = new_layer()
            _draw_baked_connector_arm(
                ImageDraw.Draw(back),
                (socket["supportX"], socket["supportY"]),
                support,
            )
            _draw_baked_connector_arm(
                ImageDraw.Draw(front),
                (socket["gripX"], socket["gripY"]),
                grip,
            )
            if cable is not None:
                _draw_baked_tesla_cable(
                    ImageDraw.Draw(back),
                    points["power_port"],
                    cable,
                )
            back_sheet.alpha_composite(back, dest=(frame * 64, direction * 64))
            front_sheet.alpha_composite(front, dest=(frame * 64, direction * 64))
    assert_connector_sheet(back_sheet)
    assert_connector_sheet(front_sheet)
    return back_sheet, front_sheet


def _transform_equipment_point(
    point: tuple[int, int],
    pivot: tuple[int, int],
    angle: float,
    world_pivot: tuple[float, float],
) -> tuple[int, int]:
    local_x = point[0] - pivot[0]
    local_y = point[1] - pivot[1]
    cos = math.cos(angle)
    sin = math.sin(angle)
    return (
        round(world_pivot[0] + local_x * cos - local_y * sin),
        round(world_pivot[1] + local_x * sin + local_y * cos),
    )


def _rotate_core_to_pose(
    core: Image.Image,
    pivot: tuple[int, int],
    angle: float,
    world_pivot: tuple[float, float],
) -> Image.Image:
    """Nearest-neighbour pixel rotation around the equipment grip pivot."""
    assert_binary_alpha(core)
    result = new_layer()
    source = core.load()
    destination = result.load()
    cos = math.cos(angle)
    sin = math.sin(angle)
    for y in range(64):
        for x in range(64):
            world_x = x - world_pivot[0]
            world_y = y - world_pivot[1]
            source_x = round(pivot[0] + world_x * cos + world_y * sin)
            source_y = round(pivot[1] - world_x * sin + world_y * cos)
            if 0 <= source_x < 64 and 0 <= source_y < 64:
                pixel = source[source_x, source_y]
                if pixel[3] != 0:
                    destination[x, y] = pixel
    assert_binary_alpha(result)
    return result


def _draw_jointed_pose_arm(
    draw: ImageDraw.ImageDraw,
    socket: tuple[int, int],
    equipment_point: tuple[int, int],
    bend: int,
) -> None:
    delta_x = equipment_point[0] - socket[0]
    delta_y = equipment_point[1] - socket[1]
    length = max(1.0, math.hypot(delta_x, delta_y))
    elbow = (
        round((socket[0] + equipment_point[0]) / 2 - delta_y / length * bend),
        round((socket[1] + equipment_point[1]) / 2 + delta_x / length * bend),
    )
    path = (socket, elbow, equipment_point)
    draw.line(path, fill=ARMOR_DEEP, width=5, joint="curve")
    draw.line(path, fill=ARMOR_MID, width=3, joint="curve")
    draw.rectangle(
        (equipment_point[0] - 2, equipment_point[1] - 2, equipment_point[0] + 2, equipment_point[1] + 2),
        fill=ARMOR_DEEP,
    )
    draw.rectangle(
        (equipment_point[0] - 1, equipment_point[1] - 1, equipment_point[0] + 1, equipment_point[1] + 1),
        fill=ARMOR_EDGE,
    )
    draw.point(socket, fill=ARMOR_EDGE)


def build_complete_aim_pose_sheets(
    equipment: str,
    sockets: tuple[dict[str, int | str], ...] | None = None,
) -> tuple[Image.Image, Image.Image, Image.Image, Image.Image]:
    """Bake weapon, hands and forearms as one 16-direction presentation pose."""
    if equipment not in EQUIPMENT_CONNECTOR_POINTS:
        raise ValueError(f"unsupported complete equipment pose: {equipment}")
    sockets = load_body_sockets() if sockets is None else sockets
    if len(sockets) != AIM_FRAME_COUNT:
        raise ValueError("complete equipment poses require five body socket frames")

    if equipment == "rifle":
        core = build_foundation_rifle_core_positive_x()
    else:
        core = build_tesla_emitter_core_positive_x()
    points = EQUIPMENT_CONNECTOR_POINTS[equipment]
    recoil_pixels = EQUIPMENT_RECOIL_PIXELS[equipment]
    sheets = [
        Image.new("RGBA", AIM_SHEET_SIZE, (0, 0, 0, 0))
        for _ in range(4)
    ]

    for direction in range(AIM_DIRECTION_COUNT):
        angle = direction * math.tau / AIM_DIRECTION_COUNT
        cos = math.cos(angle)
        sin = math.sin(angle)
        for recoil_index, recoil in enumerate((0, recoil_pixels)):
            world_pivot = (
                CORE_WORLD_PIVOT[0] - cos * recoil,
                CORE_WORLD_PIVOT[1] - sin * recoil,
            )
            rotated_core = _rotate_core_to_pose(core, points["pivot"], angle, world_pivot)
            grip = _transform_equipment_point(points["grip"], points["pivot"], angle, world_pivot)
            support = _transform_equipment_point(points["support"], points["pivot"], angle, world_pivot)
            cable = (
                _transform_equipment_point(points["cable"], points["pivot"], angle, world_pivot)
                if points["cable"] is not None
                else None
            )
            for frame, socket in enumerate(sockets):
                back = new_layer()
                front = rotated_core.copy()
                _draw_jointed_pose_arm(
                    ImageDraw.Draw(back),
                    (socket["supportX"], socket["supportY"]),
                    support,
                    3,
                )
                _draw_jointed_pose_arm(
                    ImageDraw.Draw(front),
                    (socket["gripX"], socket["gripY"]),
                    grip,
                    -3,
                )
                if cable is not None:
                    _draw_baked_tesla_cable(
                        ImageDraw.Draw(back),
                        points["power_port"],
                        cable,
                    )
                offset = (frame * 64, direction * 64)
                sheet_offset = recoil_index * 2
                sheets[sheet_offset].alpha_composite(back, dest=offset)
                sheets[sheet_offset + 1].alpha_composite(front, dest=offset)

    for sheet in sheets:
        assert_aim_pose_sheet(sheet)
    return tuple(sheets)


def build_foundation_rifle_core_positive_x() -> Image.Image:
    """Compose the approved A same-pose weapon pixels, remove arms, and mirror."""
    same_back, same_front = build_foundation_rifle_same_layers()
    weapon_front = _without_colors(same_front, (ARMOR_DEEP, ARMOR_MID, ARMOR_EDGE))
    positive_x = ImageOps.mirror(Image.alpha_composite(same_back, weapon_front))
    assert_binary_alpha(positive_x)
    return positive_x


def build_tesla_emitter_core_positive_x() -> Image.Image:
    """Mirror the approved emitter exactly; do not append an alternate mast."""
    emitter_left = new_layer()
    _draw_tesla_emitter_left(ImageDraw.Draw(emitter_left))
    positive_x = ImageOps.mirror(emitter_left)
    assert_binary_alpha(positive_x)
    return positive_x


def build_tesla_power_module_body_local() -> Image.Image:
    """Keep the approved pack pixels in their body-local 64px coordinates."""
    module = new_layer()
    _draw_tesla_pack(ImageDraw.Draw(module))
    assert_binary_alpha(module)
    return module


def build_icon(primary: Image.Image, secondary: Image.Image | None = None) -> Image.Image:
    canvas = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    layers = [primary] if secondary is None else [secondary, primary]
    for layer in layers:
        assert_binary_alpha(layer)
        scaled = layer.resize((96, 96), Image.Resampling.NEAREST)
        canvas.alpha_composite(scaled)
    return canvas


def _write_temporary(destination: Path, payload: Image.Image | bytes) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    descriptor, filename = tempfile.mkstemp(prefix=f".{destination.stem}-", suffix=".tmp", dir=destination.parent)
    os.close(descriptor)
    temporary = Path(filename)
    try:
        if isinstance(payload, bytes):
            temporary.write_bytes(payload)
        else:
            payload.save(temporary, format="PNG", compress_level=9)
        return temporary
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise


def save_outputs_atomically(outputs: dict[Path, Image.Image | bytes], replace=os.replace) -> None:
    temporary_paths: dict[Path, Path] = {}
    originals: dict[Path, bytes | None] = {}
    replaced: list[Path] = []
    try:
        for destination, payload in outputs.items():
            if isinstance(payload, Image.Image):
                if destination.name.endswith("icon.png"):
                    if payload.mode != "RGBA" or payload.size != (96, 96):
                        raise ValueError("icons must be 96x96 RGBA")
                elif payload.size == AIM_SHEET_SIZE:
                    assert_aim_pose_sheet(payload)
                elif payload.size == CONNECTOR_SHEET_SIZE:
                    assert_connector_sheet(payload)
                elif payload.size == (320, 64):
                    assert_pose_sheet(payload)
                else:
                    assert_binary_alpha(payload)
            temporary_paths[destination] = _write_temporary(destination, payload)
        originals = {destination: destination.read_bytes() if destination.exists() else None for destination in outputs}
        for destination, temporary in temporary_paths.items():
            replace(temporary, destination)
            replaced.append(destination)
    except Exception:
        for destination in reversed(replaced):
            original = originals[destination]
            if original is None:
                destination.unlink(missing_ok=True)
                continue
            rollback = _write_temporary(destination, original)
            os.replace(rollback, destination)
        raise
    finally:
        for temporary in temporary_paths.values():
            temporary.unlink(missing_ok=True)


def build_outputs(source_body: Path, public_root: Path, replace=os.replace) -> dict[Path, Image.Image | bytes]:
    body_bytes = verify_locked_body(source_body)
    rifle = build_foundation_rifle_core_positive_x()
    tesla = build_tesla_emitter_core_positive_x()
    module = build_tesla_power_module_body_local()
    rifle_same_back, rifle_same_front = build_foundation_rifle_same_layers()
    rifle_cross_back, rifle_cross_front = build_cross_layers(
        "rifle", rifle_same_back, rifle_same_front
    )
    tesla_same_back, tesla_same_front = build_tesla_same_layers()
    tesla_cross_back, tesla_cross_front = build_cross_layers(
        "tesla", tesla_same_back, tesla_same_front
    )
    sockets = load_body_sockets()
    rifle_connector_back, rifle_connector_front = build_connector_sheets("rifle", sockets)
    tesla_connector_back, tesla_connector_front = build_connector_sheets("tesla", sockets)
    rifle_aim_sheets = build_complete_aim_pose_sheets("rifle", sockets)
    tesla_aim_sheets = build_complete_aim_pose_sheets("tesla", sockets)
    pose_sheets = tuple(build_pose_sheet(layer) for layer in (
        rifle_same_back,
        rifle_same_front,
        rifle_cross_back,
        rifle_cross_front,
        tesla_same_back,
        tesla_same_front,
        tesla_cross_back,
        tesla_cross_front,
    ))
    rifle_icon_layer = Image.alpha_composite(rifle_same_back, rifle_same_front)
    tesla_icon_layer = Image.alpha_composite(tesla_same_back, tesla_same_front)
    outputs: dict[Path, Image.Image | bytes] = {
        public_root / BODY_PATH: body_bytes,
        public_root / RUNTIME_LAYER_PATHS[0]: rifle,
        public_root / RUNTIME_LAYER_PATHS[1]: tesla,
        public_root / RUNTIME_LAYER_PATHS[2]: module,
        **{
            public_root / relative: sheet
            for relative, sheet in zip(POSE_SHEET_PATHS, pose_sheets, strict=True)
        },
        **{
            public_root / relative: sheet
            for relative, sheet in zip(
                CONNECTOR_SHEET_PATHS,
                (
                    rifle_connector_back,
                    rifle_connector_front,
                    tesla_connector_back,
                    tesla_connector_front,
                ),
                strict=True,
            )
        },
        **{
            public_root / relative: sheet
            for relative, sheet in zip(
                AIM_POSE_SHEET_PATHS,
                (*rifle_aim_sheets, *tesla_aim_sheets),
                strict=True,
            )
        },
        public_root / ICON_PATHS[0]: build_icon(rifle_icon_layer),
        public_root / ICON_PATHS[1]: build_icon(tesla_icon_layer),
    }
    save_outputs_atomically(outputs, replace=replace)
    return outputs


def main() -> int:
    source = PUBLIC_ROOT / "characters/player-response-operative-breacher-sample.png"
    build_outputs(source, PUBLIC_ROOT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
