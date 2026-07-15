import { TEXTURES } from "../assets/manifest.js";

const WEAPON_ICONS = Object.freeze({
  pistol: TEXTURES.weaponPistolIcon,
  shotgun: TEXTURES.weaponBreacherIcon,
  tesla: TEXTURES.weaponTeslaIcon
});

const TIMELINE_HUD_REGION_KEYS = Object.freeze([
  "mission",
  "vitals",
  "weapon",
  "facility"
]);

export function selectTimelineHudContainers(containers = {}) {
  return Object.freeze(
    TIMELINE_HUD_REGION_KEYS.map((regionKey) => containers[regionKey])
  );
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clampRatio(value) {
  return Math.min(1, Math.max(0, finiteNumber(value)));
}

function ratio(current, total) {
  const safeTotal = finiteNumber(total);
  if (safeTotal <= 0) {
    return 0;
  }
  return clampRatio(finiteNumber(current) / safeTotal);
}

function pulseAlpha(elapsedSurvivalMs) {
  const elapsedMs = Math.max(0, finiteNumber(elapsedSurvivalMs));
  return clampRatio(0.8 + Math.sin(elapsedMs * 0.012) * 0.2);
}

function secondsText(milliseconds) {
  return `${(Math.max(0, finiteNumber(milliseconds)) / 1000).toFixed(1)}秒`;
}

function cooldownProgress(remainingMs, durationMs) {
  const safeRemainingMs = Math.max(0, finiteNumber(remainingMs));
  if (safeRemainingMs <= 0) {
    return 1;
  }
  const safeDurationMs = finiteNumber(durationMs);
  if (safeDurationMs <= 0) {
    return 0;
  }
  return clampRatio(1 - safeRemainingMs / safeDurationMs);
}

function weaponLevel(weapon) {
  return Math.max(0, Math.floor(finiteNumber(weapon?.currentLevel ?? weapon?.level)));
}

function getDashPresentation(state) {
  const elapsedMs = finiteNumber(state.elapsedSurvivalMs);
  const readyAtMs = finiteNumber(state.dashReadyAtMs);
  const remainingMs = Math.max(0, readyAtMs - elapsedMs);
  const ready = remainingMs <= 0;
  const progress = ready
    ? 1
    : cooldownProgress(remainingMs, state.dashCooldownMs);

  return Object.freeze({
    ready,
    text: ready ? "闪避 就绪" : `闪避 冷却 ${secondsText(remainingMs)}`,
    ratio: progress
  });
}

function getWeaponPresentation(state) {
  const weaponId = state.selectedWeaponId;
  const weapon = state.weapon;
  const elapsedMs = finiteNumber(state.elapsedSurvivalMs);
  const dash = getDashPresentation(state);
  const base = {
    iconKey: WEAPON_ICONS[weaponId] ?? null,
    name: weapon?.name ?? (weaponId ? "未识别武器" : "未装备"),
    detail: weaponId ? "状态不可用" : "等待装备",
    statusText: "状态不可用",
    statusRatio: 0,
    statusTone: "neutral",
    dashReady: dash.ready,
    dashText: dash.text,
    dashRatio: dash.ratio
  };

  if (!weapon || !WEAPON_ICONS[weaponId]) {
    return Object.freeze(base);
  }

  const level = weaponLevel(weapon);
  if (weaponId === "pistol") {
    const cooldownMs = finiteNumber(weapon.cooldownMs);
    return Object.freeze({
      ...base,
      detail: `等级 ${level} · 伤害 ${finiteNumber(weapon.damage).toFixed(1)}`,
      statusText: cooldownMs > 0
        ? `射速 ${(1000 / cooldownMs).toFixed(2)}/秒`
        : "射速 --",
      statusRatio: cooldownMs > 0 ? 1 : 0,
      statusTone: cooldownMs > 0 ? "contained" : "neutral"
    });
  }

  if (weaponId === "shotgun") {
    const shells = finiteNumber(weapon.currentShells);
    const magazineSize = finiteNumber(weapon.magazineSize);
    const reloading = weapon.isReloading === true;
    const reloadRemainingMs = Math.max(
      0,
      finiteNumber(weapon.reloadEndAtMs) - elapsedMs
    );
    const statusRatio = reloading
      ? cooldownProgress(reloadRemainingMs, weapon.reloadDurationMs)
      : ratio(shells, magazineSize);
    return Object.freeze({
      ...base,
      detail: `等级 ${level} · 弹丸 ${Math.max(0, Math.floor(finiteNumber(weapon.pelletCount)))}`,
      statusText: reloading
        ? `装填 ${secondsText(reloadRemainingMs)}`
        : `弹药 ${Math.max(0, Math.floor(shells))} / ${Math.max(0, Math.floor(magazineSize))}`,
      statusRatio,
      statusTone: reloading || shells <= 0 ? "warning" : "contained"
    });
  }

  const cooldownMs = finiteNumber(weapon.cooldownMs);
  const cooldownRemainingMs = Math.max(
    0,
    finiteNumber(weapon.nextAttackAtMs) - elapsedMs
  );
  return Object.freeze({
    ...base,
    detail: `等级 ${level} · 链击 ${Math.max(0, Math.floor(finiteNumber(weapon.chainTargets)))}`,
    statusText: cooldownRemainingMs > 0
      ? `放电冷却 ${secondsText(cooldownRemainingMs)}`
      : "放电 就绪",
    statusRatio: cooldownRemainingMs <= 0
      ? 1
      : cooldownProgress(cooldownRemainingMs, cooldownMs),
    statusTone: cooldownRemainingMs > 0 ? "warning" : "contained"
  });
}

function getFacilityPresentation(state) {
  if (state.bossPhaseActive === true) {
    return Object.freeze({
      expanded: true,
      title: "终局收容",
      detail: "SCP-049 已突破收容",
      tone: "danger"
    });
  }

  const event = state.activeFacilityEvent;
  if (event?.type === "powerOutage") {
    return Object.freeze({
      expanded: true,
      title: "设施断电",
      detail: event.warning ?? "电力系统不稳定，应急照明即将失效。",
      tone: "warning"
    });
  }
  if (event?.type) {
    return Object.freeze({
      expanded: true,
      title: event.name ?? "设施异常",
      detail: event.warning ?? "异常状态处理中",
      tone: "warning"
    });
  }
  return Object.freeze({
    expanded: false,
    title: "设施稳定",
    detail: "SITE-CN // 收容系统在线",
    tone: "contained"
  });
}

function getSystemPresentation(state, critical) {
  const muted = state.soundMuted === true;
  const paused = state.isPaused === true;
  const hasFacilityWarning = state.activeFacilityEvent?.type != null;
  const tone = state.bossPhaseActive === true || critical
    ? "danger"
    : paused || muted || hasFacilityWarning
      ? "warning"
      : "normal";

  return Object.freeze({
    muteLabel: muted ? "音频：静音 (M)" : "音频：开启 (M)",
    muted,
    pauseLabel: paused ? "继续 (ESC)" : "暂停 (ESC)",
    paused,
    tone
  });
}

function getPickupPresentation(state) {
  return Object.freeze({
    radius: Math.max(0, finiteNumber(state.pickupRadius)),
    buildPanelVisible: state.buildPanelVisible === true,
    nowMs: Math.max(0, finiteNumber(state.elapsedSurvivalMs))
  });
}

export function getHudPresentation(state = {}) {
  const healthRatio = ratio(state.health, state.maxHealth);
  const xpRatio = ratio(state.currentXp, state.xpToNextLevel);
  const bossHealthRatio = clampRatio(state.bossHealthRatio);
  const missionActive = state.isMissionActive === true;
  const nextNodeSeconds = Math.max(
    0,
    Math.ceil(finiteNumber(state.nextNodeSeconds))
  );
  const kills = Math.max(0, Math.floor(finiteNumber(state.killCount)));
  const critical = healthRatio < 0.35;
  const bossActive = state.bossPhaseActive === true;
  const missionDetail = !missionActive
    ? "尚未开始"
    : state.missionDetail
      ?? (state.bossPhaseActive === true
        ? `终局：收容 SCP-049 · Boss 生命 ${Math.round(bossHealthRatio * 100)}%`
        : `下一节点 ${nextNodeSeconds}秒`);

  return Object.freeze({
    mission: Object.freeze({
      active: missionActive,
      title: missionActive ? (state.phaseLabel || "任务进行中") : "等待任务",
      detail: missionDetail,
      kills,
      killsText: `击杀 ${kills}`,
      bossHealthRatio,
      bossActive
    }),
    vitals: Object.freeze({
      healthText: `${Math.max(0, Math.floor(finiteNumber(state.health)))} / ${Math.max(0, Math.floor(finiteNumber(state.maxHealth)))}`,
      healthRatio,
      critical,
      levelText: `等级 ${Math.max(0, Math.floor(finiteNumber(state.level)))}`,
      xpText: `${Math.max(0, Math.floor(finiteNumber(state.currentXp)))} / ${Math.max(0, Math.floor(finiteNumber(state.xpToNextLevel)))}`,
      xpRatio,
      pulseAlpha: pulseAlpha(state.elapsedSurvivalMs)
    }),
    weapon: getWeaponPresentation(state),
    facility: getFacilityPresentation(state),
    system: getSystemPresentation(state, critical),
    pickup: getPickupPresentation(state)
  });
}
