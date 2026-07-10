// Game-wide constants shared across modules.

export const DEBUG_MODE = true;

// Viewport (canvas) size — HUD and overlays are laid out in this space.
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// World (playfield) size — larger than the viewport so the camera can follow
// the player and there is room to kite. Gameplay entities live in world space.
export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1920;

// Spatial grid used to accelerate nearest-enemy queries. Cell size is a balance
// between bucket count and per-query cells scanned; STRIDE just packs (cx, cy)
// into one numeric Map key and only needs to exceed the max cell index.
export const ENEMY_GRID_CELL_SIZE = 160;
export const ENEMY_GRID_STRIDE = 100000;
