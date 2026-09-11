import { UPGRADE_DEFINITIONS } from "../config/upgrades.js";
import { BALANCE } from "../config/balance.js";
import {
  isPlayerUpgradeVisible,
  PLAYER_WEAPON_ALLOWLIST
} from "../config/playerWeaponAvailability.js";
import {
  createU3Header,
  createU3Overlay,
  u3Element
} from "./u3DomOverlay.js";
import { createU3Glyph, createU3Illustration } from "./u3Illustrations.js";

const U3_BUILD_STYLES = `
.scp-u3.u3-build .u3-panel { display:flex; flex-direction:column; gap:7px; }
.scp-u3.u3-build .u3-build-host { display:flex; flex:1; min-height:0; flex-direction:column; gap:7px; }
.scp-u3.u3-build .u3-header-status { white-space:pre-line; min-width:177px; font-size:12px; color:var(--u3-text); }
.scp-u3.u3-build .u3-header-status::after { width:112px; }
.scp-u3.u3-build .u3-build-main { display:grid; grid-template-columns:minmax(0,47fr) minmax(0,53fr); gap:8px; min-height:0; flex:1; }
.scp-u3.u3-build .u3-build-section { display:flex; flex-direction:column; min-width:0; min-height:0; overflow:hidden; }
.scp-u3.u3-build .u3-build-section > .u3-section-title { height:26px; line-height:1.1; flex:none; }
.scp-u3.u3-build .u3-build-weapons { display:flex; flex:1; min-height:0; flex-direction:column; gap:4px; padding:3px; overflow-y:auto; overscroll-behavior:contain; }
.scp-u3.u3-build .u3-build-weapon { position:relative; display:grid; gap:4px 8px; padding:6px 8px; border:1px solid #424d48; background:linear-gradient(105deg,#1b2321,#0a1112); box-shadow:inset 0 0 14px #0009; }
.scp-u3.u3-build .u3-build-weapon.is-primary { flex:1 1 auto; grid-template-columns:1fr; grid-template-rows:auto minmax(88px,1fr) auto; min-height:184px; padding:2px 7px; row-gap:2px; }
.scp-u3.u3-build .u3-build-weapon.is-secondary { display:block; flex:0 0 auto; min-height:36px; padding:2px 7px; }
.scp-u3.u3-build .u3-build-weapon.is-active { border-color:#6b7971; box-shadow:inset 3px 0 0 #78c990,inset 0 0 14px #0009,0 0 7px #73d69618; }
.scp-u3.u3-build .u3-build-weapon.is-locked { opacity:.48; filter:saturate(.45); }
.scp-u3.u3-build .u3-build-weapon-head { line-height:1.1; grid-column:1/-1; display:flex; align-items:baseline; gap:7px; padding:2px 4px 3px; background:linear-gradient(90deg,#26312dc4,transparent); box-shadow:inset 0 -1px #202b28; }
.scp-u3.u3-build .u3-build-weapon.is-secondary .u3-build-weapon-head { padding-bottom:1px; line-height:1.05; }
.scp-u3.u3-build .u3-build-weapon-name { min-width:0; flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-size:15px; font-weight:700; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-weapon-name { font-size:18px; }
.scp-u3.u3-build .u3-build-weapon.is-secondary .u3-build-weapon-name { font-size:13px; }
.scp-u3.u3-build .u3-build-badge { color:var(--u3-gold); font:11px Consolas,"Microsoft YaHei",monospace; white-space:nowrap; }
.scp-u3.u3-build .u3-build-weapon.is-secondary .u3-build-badge { font-size:10px; }
.scp-u3.u3-build .u3-build-diagram { height:38px; border:2px solid #293430; background:#060d0e; box-shadow:0 0 0 1px #56635c,inset 0 0 16px #000; overflow:hidden; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-diagram { height:auto; min-height:0; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-diagram .u3-illustration { transform:scale(1.18); transform-origin:center; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-diagram .u3-illustration image { filter:grayscale(.9) brightness(1.65) contrast(1.05); mix-blend-mode:screen; }
.scp-u3.u3-build .u3-build-metrics { display:grid; grid-template-columns:1fr 1fr; gap:3px 7px; align-content:center; }
.scp-u3.u3-build .u3-build-metric { min-width:0; border:1px solid #2d3935; background:linear-gradient(105deg,#18211f,#0b1213); box-shadow:inset 0 1px #52605944,inset 0 0 7px #0007; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-metrics { grid-template-columns:repeat(2,1fr); gap:3px 6px; }
.scp-u3.u3-build .u3-build-metric-label { display:block; color:var(--u3-muted); font-size:11px; }
.scp-u3.u3-build .u3-build-metric .u3-value { display:block; font:700 12px/1.2 Consolas,"Microsoft YaHei",monospace; white-space:nowrap; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-metric { display:grid; grid-template-columns:1fr auto; align-items:baseline; padding:1px 5px; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-metric-label { font-size:11px; }
.scp-u3.u3-build .u3-build-weapon.is-primary .u3-build-metric .u3-value { font-size:18px; line-height:1.05; }
.scp-u3.u3-build .u3-build-weapon-summary { margin-top:2px; color:var(--u3-muted); font:10.5px/1.25 Consolas,"Microsoft YaHei",monospace; white-space:normal; }
.scp-u3.u3-build .u3-build-scroll { position:relative; height:100%; padding:6px 8px 26px; overscroll-behavior:contain; }
.scp-u3.u3-build .u3-build-right { display:flex; flex-direction:column; min-height:0; }
.scp-u3.u3-build .u3-build-right > .u3-section-title { flex:none; }
.scp-u3.u3-build .u3-build-right > .u3-build-scroll { flex:1; height:auto; }
.scp-u3.u3-build .u3-build-scroll:focus-visible { outline:1px solid var(--u3-gold); outline-offset:-2px; }
.scp-u3.u3-build .u3-build-right > .u3-section-title::after { content:"↕ 可滚动"; float:right; color:var(--u3-gold); font:10px/1.8 Consolas,"Microsoft YaHei",monospace; }
.scp-u3.u3-build .u3-build-scroll-cue { position:static; margin:3px 0 0; padding:2px 8px; color:var(--u3-gold); font:10px Consolas,"Microsoft YaHei",monospace; text-align:center; letter-spacing:1px; pointer-events:none; }
.scp-u3.u3-build .u3-build-upgrade-group + .u3-build-upgrade-group { margin-top:7px; }
.scp-u3.u3-build .u3-build-upgrade-list { display:grid; gap:2px; padding:1px; }
.scp-u3.u3-build .u3-build-upgrade { display:grid; grid-template-columns:36px minmax(0,1fr); grid-template-rows:auto auto; column-gap:7px; row-gap:0; align-items:center; min-height:42px; padding:2px 7px; border:1px solid #49544f; background:linear-gradient(100deg,#202a27,#0a1112); box-shadow:inset 0 1px #67746d44,inset 0 -1px #050a0b; }
.scp-u3.u3-build .u3-build-upgrade.is-applied { border-color:#76857d; background:linear-gradient(100deg,#2a3833,#0e1717); box-shadow:inset 3px 0 0 var(--u3-green),inset 0 1px #84958b55,inset 0 0 14px #0006; }
.scp-u3.u3-build .u3-build-upgrade.is-inactive { opacity:.42; filter:saturate(.55); }
.scp-u3.u3-build .u3-build-upgrade-icon { grid-row:1/3; width:36px; height:36px; overflow:hidden; border:1px solid #4d5a54; background:#091110; box-shadow:inset 0 0 7px #000; }
.scp-u3.u3-build .u3-build-upgrade-heading { display:flex; min-width:0; align-items:baseline; justify-content:space-between; gap:8px; line-height:1.15; }
.scp-u3.u3-build .u3-build-upgrade-name { min-width:0; overflow:hidden; font-size:13.5px; font-weight:700; line-height:1.15; white-space:nowrap; text-overflow:ellipsis; }
.scp-u3.u3-build .u3-build-upgrade-count { color:var(--u3-gold); font-size:12px; line-height:1.15; white-space:nowrap; }
.scp-u3.u3-build .u3-build-upgrade-reading { display:flex; min-width:0; align-items:baseline; justify-content:space-between; gap:8px; padding-top:1px; border-top:1px solid #35413d; }
.scp-u3.u3-build .u3-build-upgrade-owner { min-width:0; overflow:hidden; color:var(--u3-muted); font:10.5px/1.15 Consolas,"Microsoft YaHei",monospace; white-space:nowrap; text-overflow:ellipsis; }
.scp-u3.u3-build .u3-build-upgrade .u3-value { text-align:right; font:700 14.5px/1.15 Consolas,"Microsoft YaHei",monospace; white-space:nowrap; }
.scp-u3.u3-build .u3-build-operator { display:grid; grid-template-columns:minmax(142px,1.15fr) minmax(126px,1fr) minmax(108px,.86fr); gap:1px; padding:5px; min-height:59px; }
.scp-u3.u3-build .u3-build-operator-group { flex:none; margin:0; }
.scp-u3.u3-build .u3-build-operator-group .u3-section-title { height:27px; padding-top:2px; padding-bottom:2px; }
.scp-u3.u3-build .u3-build-operator-cell { display:grid; grid-template-columns:34px minmax(0,1fr); grid-template-rows:auto auto; column-gap:3px; align-content:center; padding:3px 4px; border-right:1px solid #40564e; }
.scp-u3.u3-build .u3-build-operator-cell:last-child { border-right:0; }
.scp-u3.u3-build .u3-build-operator-icon { grid-row:1/3; width:34px; height:38px; align-self:center; overflow:hidden; opacity:.9; }
.scp-u3.u3-build .u3-build-operator-cell span { display:block; color:var(--u3-muted); font-size:11.5px; white-space:nowrap; }
.scp-u3.u3-build .u3-build-operator-cell strong { color:var(--u3-green); font:700 20px/1 Consolas,"Microsoft YaHei",monospace; letter-spacing:-.5px; white-space:nowrap; }
.scp-u3.u3-build .u3-build-mutations { display:grid; grid-template-columns:108px 1fr 1fr; gap:8px; height:76px; flex:none; padding:5px 7px; align-items:stretch; }
.scp-u3.u3-build .u3-build-mutation-title { align-self:center; padding-left:10px; border-left:3px solid var(--u3-green); font-size:16px; font-weight:700; letter-spacing:1px; }
.scp-u3.u3-build .u3-build-mutation { display:grid; grid-template-columns:76px 1fr; gap:8px; min-width:0; padding:3px 7px; border-left:1px solid #4b635a; }
.scp-u3.u3-build .u3-build-mutation.is-inactive { border-left-color:#42544d; }
.scp-u3.u3-build .u3-build-mutation.is-inactive b { color:#819089; }
.scp-u3.u3-build .u3-build-mutation.is-inactive .u3-build-mutation-art { opacity:.68; }
.scp-u3.u3-build .u3-build-mutation.is-inactive p,.scp-u3.u3-build .u3-build-mutation.is-inactive .u3-build-mutation-facts { color:#8c9b94; }
.scp-u3.u3-build .u3-build-mutation-art { min-width:0; overflow:hidden; }
.scp-u3.u3-build .u3-build-mutation-copy { min-width:0; align-self:center; }
.scp-u3.u3-build .u3-build-mutation-copy strong { display:inline; font-size:14px; }
.scp-u3.u3-build .u3-build-mutation-copy b { margin-left:5px; color:var(--u3-green); font-size:10px; white-space:nowrap; }
.scp-u3.u3-build .u3-build-mutation-copy p { margin:2px 0 0; color:var(--u3-muted); font-size:11px; line-height:1.3; white-space:normal; }
.scp-u3.u3-build .u3-build-mutation-facts { display:flex; flex-wrap:wrap; gap:2px 7px; margin-top:3px; color:var(--u3-gold); font:10px/1.25 Consolas,"Microsoft YaHei",monospace; }
.scp-u3.u3-build .u3-build-mutation-facts span { white-space:nowrap; }
`;

const UPGRADE_ILLUSTRATIONS = Object.freeze({
  damage: "damage",
  attackSpeed: "cadence",
  moveSpeed: "movement",
  maxHealth: "health",
  projectileCount: "projectiles",
  penetration: "penetration",
  pickupRadius: "pickup",
  emergencyHeal: "heal",
  teslaChains: "chains",
  teslaCooldown: "cadence"
});

const OPERATOR_ILLUSTRATIONS = Object.freeze({
  health: "health",
  maxHealth: "health",
  moveSpeed: "movement",
  pickupRadius: "pickup"
});

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function integer(value) {
  return Math.max(0, Math.trunc(finite(value)));
}

function fixed(value, digits = 0) {
  return finite(value).toFixed(digits);
}

function upgradeValue(scene, key) {
  const selectedWeapon = scene.weapons?.[scene.selectedWeaponId];
  const values = {
    damage: () => fixed(selectedWeapon?.damage, 1),
    attackSpeed: () => `${fixed(selectedWeapon?.cooldownMs)} ms`,
    moveSpeed: () => `${fixed(scene.playerMoveSpeed)} px/s`,
    maxHealth: () => `${fixed(scene.maxHealth)} HP`,
    projectileCount: () => String(integer(scene.projectileCount)),
    penetration: () => String(integer(scene.bulletPenetration)),
    pickupRadius: () => `${fixed(scene.pickupRadius)} px`,
    emergencyHeal: () => `${fixed(scene.health)} / ${fixed(scene.maxHealth)} HP`,
    teslaChains: () => `${integer(scene.weapons?.tesla?.chainTargets)} 个目标`,
    teslaCooldown: () => `${fixed(scene.weapons?.tesla?.cooldownMs)} ms`
  };
  return values[key]?.() ?? "—";
}

function protocolOwner(upgrade) {
  if (upgrade.kind === "generic") return "行动员 / 通用强化";
  if (upgrade.weaponId === "pistol") return "收容突击步枪";
  if (upgrade.weaponId === "tesla") return "特斯拉发射器";
  return "当前武器";
}

function createUpgradeRow(scene, upgrade) {
  const count = integer(scene.upgradeLevels?.[upgrade.key]);
  return {
    key: upgrade.key,
    name: upgrade.name,
    description: upgrade.description,
    count,
    state: count > 0 ? "applied" : "inactive",
    value: upgradeValue(scene, upgrade.key),
    owner: protocolOwner(upgrade)
  };
}

function createWeaponModel(scene, id) {
  const weapon = scene.weapons?.[id] ?? {};
  const unlocked = weapon.unlocked === true;
  const selected = id === scene.selectedWeaponId;
  const common = {
    id,
    name: weapon.name ?? (id === "pistol" ? "基金会收容突击步枪" : "特斯拉收容发射器"),
    illustration: id === "pistol" ? "rifle" : "tesla",
    unlocked,
    selected,
    state: unlocked ? (selected ? "active" : "unlocked") : "locked",
    totalLevel: integer(weapon.currentLevel)
  };

  if (id === "pistol") {
    return {
      ...common,
      metrics: [
        { label: "单发伤害", value: fixed(weapon.damage, 1) },
        { label: "攻击间隔", value: `${fixed(weapon.cooldownMs)} ms` },
        { label: "弹丸数量", value: String(integer(scene.projectileCount)) },
        { label: "穿透数量", value: String(integer(scene.bulletPenetration)) }
      ]
    };
  }

  return {
    ...common,
    metrics: [
      { label: "每跳伤害", value: fixed(weapon.damage, 1) },
      { label: "结算间隔", value: `${fixed(weapon.cooldownMs)} ms` },
      { label: "链击目标", value: String(integer(weapon.chainTargets)) },
      { label: "作用范围", value: `${fixed(weapon.range)} px` }
    ]
  };
}

export function createU3BuildModel(scene) {
  const visibleUpgrades = UPGRADE_DEFINITIONS.filter(isPlayerUpgradeVisible);
  return {
    selectedWeaponId: scene.selectedWeaponId ?? null,
    weapons: PLAYER_WEAPON_ALLOWLIST.map((weaponId) => createWeaponModel(scene, weaponId)),
    genericUpgrades: visibleUpgrades
      .filter(({ kind, isMutation }) => kind === "generic" && isMutation !== true)
      .map((upgrade) => createUpgradeRow(scene, upgrade)),
    weaponProtocols: visibleUpgrades
      .filter(({ kind, isMutation }) => kind === "weapon" && isMutation !== true)
      .map((upgrade) => createUpgradeRow(scene, upgrade)),
    operator: [
      { key: "health", label: "当前生命", value: `${fixed(scene.health)} / ${fixed(scene.maxHealth)}` },
      { key: "maxHealth", label: "生命上限", value: fixed(scene.maxHealth) },
      { key: "moveSpeed", label: "移动速度", value: `${fixed(scene.playerMoveSpeed)} px/s` },
      { key: "pickupRadius", label: "拾取半径", value: `${fixed(scene.pickupRadius)} px` }
    ],
    mutations: visibleUpgrades
      .filter(({ isMutation }) => isMutation === true)
      .map((upgrade) => {
        const active = scene.weaponMutations?.[upgrade.key] === true;
        return {
          key: upgrade.key,
          name: upgrade.name,
          description: upgrade.description.replace(/^【质变】/, ""),
          illustration: upgrade.key === "pistolBoomerang" ? "boomerang" : "field",
          weaponId: upgrade.weaponId,
          state: active ? "active" : "inactive",
          count: active ? 1 : 0,
          levelLabel: `本局质变 ${active ? 1 : 0} / 1`,
          facts: upgrade.key === "pistolBoomerang"
            ? [
                `回程速度 x${BALANCE.weaponUpgrades.boomerangReturnSpeedMultiplier.toFixed(2)}`,
                `触发射程 ${fixed(scene.weapons?.pistol?.range)} px`
              ]
            : [
                `半径 ${fixed(BALANCE.weaponUpgrades.teslaFieldRadius)} px`,
                `周期 ${fixed(BALANCE.weaponUpgrades.teslaFieldTickMs)} ms`,
                `当前脉冲伤害 ${Math.max(1, Math.round(
                  finite(scene.weapons?.tesla?.damage) * BALANCE.weaponUpgrades.teslaFieldDamageMultiplier
                ))}`
              ]
        };
      })
  };
}

function addText(document, parent, className, text) {
  const node = u3Element(document, "span", className, text);
  parent.appendChild(node);
  return node;
}

function renderWeapon(document, weapon, primary = false) {
  const card = u3Element(
    document,
    "article",
    `u3-build-weapon is-${weapon.state}${primary ? " is-primary" : " is-secondary"}`
  );
  const head = u3Element(document, "div", "u3-build-weapon-head");
  addText(document, head, "u3-build-weapon-name", weapon.name);
  addText(
    document,
    head,
    "u3-build-badge",
    primary
      ? `● 武器总等级 ${weapon.totalLevel}`
      : `${weapon.unlocked ? "备用" : "未解锁"} · 总等级 ${weapon.totalLevel}`
  );
  const diagram = u3Element(document, "div", "u3-build-diagram");
  diagram.appendChild(createU3Illustration(document, weapon.illustration));
  const metrics = u3Element(document, "div", "u3-build-metrics");
  for (const metric of weapon.metrics) {
    const row = u3Element(document, "div", "u3-build-metric");
    addText(document, row, "u3-build-metric-label", metric.label);
    addText(document, row, "u3-value", metric.value);
    metrics.appendChild(row);
  }
  if (primary) {
    card.append(head, diagram, metrics);
  } else {
    const compactLabels = weapon.id === "tesla"
      ? ["每跳", "间隔", "链击", "范围"]
      : ["伤害", "间隔", "弹丸", "穿透"];
    const summary = weapon.metrics
      .map(({ value }, index) => `${compactLabels[index]} ${value}`)
      .join(" · ");
    card.append(head, u3Element(document, "div", "u3-build-weapon-summary", summary));
  }
  return card;
}

function renderUpgradeGroup(document, title, upgrades) {
  const group = u3Element(document, "section", "u3-build-upgrade-group");
  if (title) group.appendChild(u3Element(document, "h3", "u3-section-title", title));
  const list = u3Element(document, "div", "u3-build-upgrade-list");
  for (const upgrade of upgrades) {
    const row = u3Element(
      document,
      "div",
      `u3-build-upgrade ${upgrade.state === "inactive" ? "is-inactive" : "is-applied"}`
    );
    row.dataset.upgradeKey = upgrade.key;
    const icon = u3Element(document, "div", "u3-build-upgrade-icon");
    icon.appendChild(createU3Glyph(
      document,
      UPGRADE_ILLUSTRATIONS[upgrade.key] ?? "containment"
    ));
    const heading = u3Element(document, "div", "u3-build-upgrade-heading");
    heading.append(
      u3Element(document, "div", "u3-build-upgrade-name", upgrade.name),
      u3Element(document, "span", "u3-build-upgrade-count", `强化 ${upgrade.count} 次`)
    );
    const reading = u3Element(document, "div", "u3-build-upgrade-reading");
    reading.append(
      u3Element(document, "span", "u3-build-upgrade-owner", upgrade.owner),
      u3Element(document, "span", "u3-value", upgrade.value)
    );
    row.append(
      icon,
      heading,
      reading
    );
    list.appendChild(row);
  }
  group.appendChild(list);
  return group;
}

function renderOperator(document, operator) {
  const section = u3Element(document, "section", "u3-build-upgrade-group u3-build-operator-group");
  section.appendChild(u3Element(document, "h3", "u3-section-title", "行动员状态"));
  const cells = u3Element(document, "div", "u3-build-operator u3-inset");
  for (const item of operator.filter(({ key }) => key !== "maxHealth")) {
    const cell = u3Element(document, "div", "u3-build-operator-cell");
    const icon = u3Element(document, "div", "u3-build-operator-icon");
    icon.appendChild(createU3Glyph(
      document,
      OPERATOR_ILLUSTRATIONS[item.key] ?? "containment"
    ));
    cell.append(
      icon,
      u3Element(document, "span", "", item.label),
      u3Element(document, "strong", "", item.value)
    );
    cells.appendChild(cell);
  }
  section.appendChild(cells);
  return section;
}

function renderMutation(document, mutation) {
  const node = u3Element(document, "article", `u3-build-mutation is-${mutation.state}`);
  const art = u3Element(document, "div", "u3-build-mutation-art");
  art.appendChild(createU3Illustration(document, mutation.illustration));
  const copy = u3Element(document, "div", "u3-build-mutation-copy");
  copy.append(
    u3Element(document, "strong", "", mutation.name),
    u3Element(
      document,
      "b",
      "",
      `${mutation.state === "active" ? "已激活" : "未激活"} · ${mutation.levelLabel}`
    ),
    u3Element(document, "p", "", mutation.description)
  );
  const facts = u3Element(document, "div", "u3-build-mutation-facts");
  for (const fact of mutation.facts) facts.appendChild(u3Element(document, "span", "", fact));
  copy.appendChild(facts);
  node.append(art, copy);
  return node;
}

function renderBuildContent(document, host, model) {
  host.replaceChildren();
  const header = createU3Header(document, {
    eyebrow: "SCP FOUNDATION // FIELD TERMINAL",
    title: "当前构筑",
    subtitle: "SITE-CN-03 / OPERATOR LOADOUT",
    status: "行动已暂停\nTAB / ESC 关闭并继续"
  });

  const main = u3Element(document, "div", "u3-build-main");
  const weapons = u3Element(document, "section", "u3-build-section u3-inset");
  weapons.appendChild(u3Element(document, "h3", "u3-section-title", "主武器"));
  const weaponList = u3Element(document, "div", "u3-build-weapons u3-scroll");
  weaponList.setAttribute("tabindex", "0");
  weaponList.setAttribute("aria-label", "武器状态，可滚动查看");
  const primaryWeapon = model.weapons.find(({ selected }) => selected)
    ?? model.weapons.find(({ unlocked }) => unlocked)
    ?? model.weapons[0];
  if (primaryWeapon) weaponList.appendChild(renderWeapon(document, primaryWeapon, true));
  for (const weapon of model.weapons) {
    if (weapon !== primaryWeapon) weaponList.appendChild(renderWeapon(document, weapon, false));
  }
  weapons.appendChild(weaponList);

  const upgrades = u3Element(document, "section", "u3-build-section u3-build-right u3-inset");
  upgrades.appendChild(u3Element(document, "h3", "u3-section-title", "已有强化"));
  const scroll = u3Element(document, "div", "u3-build-scroll u3-scroll");
  scroll.setAttribute("tabindex", "0");
  scroll.setAttribute("aria-label", "已有强化与行动员状态，可滚动查看");
  const applied = [...model.weaponProtocols, ...model.genericUpgrades]
    .filter(({ count }) => count > 0);
  const inactiveGeneric = model.genericUpgrades.filter(({ count }) => count === 0);
  const inactiveProtocols = model.weaponProtocols.filter(({ count }) => count === 0);
  if (applied.length > 0) {
    scroll.appendChild(renderUpgradeGroup(document, "", applied));
  }
  if (inactiveGeneric.length > 0) {
    scroll.appendChild(renderUpgradeGroup(document, "通用强化 · 未激活", inactiveGeneric));
  }
  if (inactiveProtocols.length > 0) {
    scroll.appendChild(renderUpgradeGroup(document, "武器协议 · 未激活", inactiveProtocols));
  }
  scroll.appendChild(
    u3Element(document, "div", "u3-build-scroll-cue", "滚轮 / 方向键  查看全部记录  ▼")
  );
  upgrades.append(scroll, renderOperator(document, model.operator));
  main.append(weapons, upgrades);

  const mutations = u3Element(document, "section", "u3-build-mutations u3-inset");
  mutations.appendChild(u3Element(document, "div", "u3-build-mutation-title", "异常突变"));
  for (const mutation of model.mutations) mutations.appendChild(renderMutation(document, mutation));
  host.append(header, main, mutations);
  return scroll;
}

export function createU3BuildView(scene, { onFailure } = {}) {
  let overlay = null;
  let host = null;
  let destroyed = false;
  let renderedSignature = null;
  let scrollNode = null;
  let requestedVisible = false;
  try {
    overlay = createU3Overlay(scene, {
      kind: "build",
      width: 860,
      height: 480,
      className: "u3-build",
      styles: U3_BUILD_STYLES,
      visible: false,
      onFailure: (error) => onFailure?.(error, { visible: requestedVisible })
    });
    if (!overlay) return null;
    host = u3Element(overlay.document, "div", "u3-build-host");
    overlay.panel.appendChild(host);
    const update = () => {
      if (destroyed) return;
      const model = createU3BuildModel(scene);
      const signature = JSON.stringify(model);
      if (signature === renderedSignature) return;
      const scrollTop = Number.isFinite(scrollNode?.scrollTop) ? scrollNode.scrollTop : 0;
      const restoreFocus = overlay.document.activeElement === scrollNode;
      scrollNode = renderBuildContent(overlay.document, host, model);
      scrollNode.scrollTop = scrollTop;
      if (restoreFocus) scrollNode.focus?.({ preventScroll: true });
      renderedSignature = signature;
    };
    const setVisible = (visible) => {
      requestedVisible = visible === true;
      overlay.setVisible(requestedVisible);
    };
    // hud.toggleBuildPanel() owns pause/visibility toggling and calls
    // the compatibility container directly, so both public paths share tracking.
    overlay.container.setVisible = function setBuildContainerVisible(visible) {
      setVisible(visible);
      return this;
    };
    update();
    return {
      mode: "u3",
      root: overlay.root,
      panel: overlay.panel,
      container: overlay.container,
      objects: [],
      summaryText: null,
      setVisible,
      update,
      destroy() {
        if (destroyed) return;
        destroyed = true;
        overlay.destroy();
      }
    };
  } catch (error) {
    destroyed = true;
    overlay?.destroy?.();
    throw error;
  }
}
