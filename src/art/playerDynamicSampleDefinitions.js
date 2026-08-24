import { TEXTURES } from "../assets/manifest.js";
import {
  PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS
} from "./playerTwoDirectionQualitySampleSockets.js";

const WALK_FRAMES = Object.freeze([1, 2, 3, 4]);

function freezeSockets(sockets) {
  return Object.freeze(sockets.map((socket) => Object.freeze({ ...socket })));
}

function createDefinition({
  mode,
  textureKey,
  frameDurationsMs,
  settle,
  sockets
}) {
  if (
    !settle
    || !Number.isInteger(settle.frame)
    || !WALK_FRAMES.includes(settle.frame)
  ) {
    return null;
  }
  return Object.freeze({
    mode,
    textureKey,
    idleFrame: 0,
    walkFrames: Object.freeze([...WALK_FRAMES]),
    frameDurationsMs: Object.freeze([...frameDurationsMs]),
    settle: Object.freeze({
      frame: settle.frame,
      durationMs: settle.durationMs,
      overshootPx: settle.overshootPx
    }),
    sockets: freezeSockets(sockets)
  });
}

const BREACHER_SAMPLE_INPUT = Object.freeze({
  textureKey: TEXTURES.playerResponseOperativeBreacherSampleSheet,
  frameDurationsMs: Object.freeze([110, 90, 110, 90]),
  settle: Object.freeze({ frame: 2, durationMs: 90, overshootPx: 0 }),
  sockets: freezeSockets([
    { index: 0, gripX: 21, gripY: 31, supportX: 36, supportY: 33, equipmentLayer: "front" },
    { index: 1, gripX: 20, gripY: 30, supportX: 35, supportY: 32, equipmentLayer: "front" },
    { index: 2, gripX: 22, gripY: 32, supportX: 37, supportY: 34, equipmentLayer: "front" },
    { index: 3, gripX: 20, gripY: 31, supportX: 34, supportY: 33, equipmentLayer: "front" },
    { index: 4, gripX: 22, gripY: 30, supportX: 36, supportY: 32, equipmentLayer: "front" }
  ])
});

const DEFINITIONS = Object.freeze({
  "sample-a": createDefinition({
    mode: "sample-a",
    ...BREACHER_SAMPLE_INPUT
  }),
  "two-direction": createDefinition({
    mode: "two-direction",
    textureKey: BREACHER_SAMPLE_INPUT.textureKey,
    frameDurationsMs: [105, 85, 105, 85],
    settle: { frame: 2, durationMs: 100, overshootPx: 0 },
    sockets: PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS
  }),
  "sample-b": createDefinition({
    mode: "sample-b",
    textureKey: TEXTURES.playerResponseOperativeCbrnSampleSheet,
    frameDurationsMs: [150, 130, 150, 130],
    settle: { frame: 2, durationMs: 180, overshootPx: 1 },
    sockets: [
      { index: 0, gripX: 18, gripY: 32, supportX: 41, supportY: 34, equipmentLayer: "front" },
      { index: 1, gripX: 17, gripY: 31, supportX: 40, supportY: 33, equipmentLayer: "front" },
      { index: 2, gripX: 19, gripY: 34, supportX: 42, supportY: 36, equipmentLayer: "front" },
      { index: 3, gripX: 17, gripY: 33, supportX: 39, supportY: 35, equipmentLayer: "front" },
      { index: 4, gripX: 19, gripY: 31, supportX: 41, supportY: 33, equipmentLayer: "front" }
    ]
  })
});

export function getPlayerDynamicSampleDefinition(mode) {
  return DEFINITIONS[mode] ?? null;
}
