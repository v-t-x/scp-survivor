const SVG_NS = "http://www.w3.org/2000/svg";

function hasOverlay(scene) {
  return scene.isPaused === true || scene.isLevelUpActive === true
    || scene.buildPanel?.visible === true
    || [scene.pauseOverlay, scene.levelUpOverlay, scene.resultOverlay]
      .some((overlay) => overlay?.visible === true);
}

function inheritedVisibility(label) {
  let alpha = 1;
  for (let object = label; object; object = object.parentContainer) {
    if (object.visible === false || object.active === false) return 0;
    alpha *= Number.isFinite(object.alpha) ? object.alpha : 1;
  }
  return Math.max(0, Math.min(1, alpha));
}

function combinedMatrix(world, camera) {
  const c = camera ?? { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  return [
    c.a * world.a + c.c * world.b,
    c.b * world.a + c.d * world.b,
    c.a * world.c + c.c * world.d,
    c.b * world.c + c.d * world.d,
    c.a * world.e + c.c * world.f + (c.e ?? c.tx ?? 0),
    c.b * world.e + c.d * world.f + (c.f ?? c.ty ?? 0)
  ];
}

// The existing Phaser Text objects remain the state/measurement source and
// fallback renderer. Only their normal combat glyphs use native screen pixels.
export function createHudTextOverlay(scene, labels) {
  const canvas = scene.game?.canvas;
  const document = canvas?.ownerDocument;
  const events = scene.game?.events;
  if (!document?.createElementNS || !document.body || !canvas?.getBoundingClientRect
    || !events?.on || !events?.off) return null;

  let root;
  let nativeActive = false;
  let destroyed = false;
  const entries = [];
  const rootAttributes = {};

  function attribute(node, cache, key, value) {
    const serialized = String(value);
    if (cache[key] !== serialized) {
      node.setAttribute(key, serialized);
      cache[key] = serialized;
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    nativeActive = false;
    events.off("prerender", sync);
    events.off("postrender", syncAfterRender);
    scene.events?.off?.("shutdown", destroy);
    scene.events?.off?.("destroy", destroy);
    for (const entry of entries) {
      for (const key of ["renderWebGL", "renderCanvas"]) {
        if (entry.label[key] !== entry.wrappers[key]) continue;
        if (entry.owned[key]) entry.label[key] = entry.originals[key];
        else delete entry.label[key];
      }
    }
    root?.remove();
  }

  function syncLabels() {
    const camera = scene.cameras?.main;
    for (const entry of entries) {
      const { label, node, cache } = entry;
      const alpha = inheritedVisibility(label) * (camera?.alpha ?? 1);
      attribute(node, cache, "opacity", alpha);
      if (alpha <= 0) continue;
      const style = label.style ?? {};
      const matrix = combinedMatrix(label.getWorldTransformMatrix(), camera?.matrix);
      attribute(node, cache, "transform", "matrix(" + matrix.join(" ") + ")");
      const x = -(label.displayOriginX ?? 0) + (label.padding?.left ?? 0);
      const y = -(label.displayOriginY ?? 0) + (label.padding?.top ?? 0)
        + (style.metrics?.ascent ?? Number.parseFloat(style.fontSize) ?? 0);
      attribute(node, cache, "x", x);
      attribute(node, cache, "y", y);
      attribute(node, cache, "fill", style.color ?? "#e5e8e4");
      attribute(node, cache, "font-family", style.fontFamily ?? "sans-serif");
      attribute(node, cache, "font-size", style.fontSize ?? "14px");
      attribute(node, cache, "font-weight", /bold|[5-9]00/.exec(style.fontStyle ?? "")?.[0] ?? "normal");
      attribute(node, cache, "font-style", /italic/.test(style.fontStyle ?? "") ? "italic" : "normal");
      const value = String(label.text ?? "");
      if (entry.text !== value) {
        // HUD labels are single-line; textContent keeps user-facing strings literal.
        node.textContent = value;
        entry.text = value;
      }
    }
  }

  function sync() {
    if (destroyed) return;
    try {
      if (root.isConnected === false) { destroy(); return; }
      const bounds = canvas.getBoundingClientRect();
      nativeActive = scene.isMissionActive === true && scene.isGameOver !== true
        && !hasOverlay(scene) && bounds.width > 0 && bounds.height > 0;
      root.style.display = nativeActive ? "block" : "none";
      if (!nativeActive) return;
      attribute(root, rootAttributes, "viewBox", "0 0 " + canvas.width + " " + canvas.height);
      root.style.left = bounds.left + "px";
      root.style.top = bounds.top + "px";
      root.style.width = bounds.width + "px";
      root.style.height = bounds.height + "px";
      syncLabels();
    } catch {
      // A browser/DOM failure must leave the already-working canvas HUD usable.
      destroy();
    }
  }

  function syncAfterRender() {
    if (!nativeActive || destroyed) return;
    try {
      // Camera shake is finalized during camera.preRender(), after game prerender.
      syncLabels();
    } catch {
      destroy();
    }
  }

  try {
    root = document.createElementNS(SVG_NS, "svg");
    root.setAttribute("data-scp-hud-text", "");
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("focusable", "false");
    Object.assign(root.style, {
      position: "fixed", pointerEvents: "none", userSelect: "none",
      overflow: "hidden", zIndex: "1", display: "none"
    });
    for (const label of labels) {
      const node = document.createElementNS(SVG_NS, "text");
      node.setAttribute("xml:space", "preserve");
      const entry = { label, node, cache: {}, originals: {}, wrappers: {}, owned: {} };
      entries.push(entry);
      root.appendChild(node);
      for (const key of ["renderWebGL", "renderCanvas"]) {
        entry.originals[key] = label[key];
        entry.owned[key] = Object.hasOwn(label, key);
        if (typeof label[key] !== "function") continue;
        const wrapper = function (...args) {
          if (!nativeActive) return entry.originals[key].apply(this, args);
        };
        entry.wrappers[key] = wrapper;
        label[key] = wrapper;
      }
    }
    document.body.appendChild(root);
    events.on("prerender", sync);
    events.on("postrender", syncAfterRender);
    scene.events?.once?.("shutdown", destroy);
    scene.events?.once?.("destroy", destroy);
    return { destroy };
  } catch {
    destroy();
    return null;
  }
}
