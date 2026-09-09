import { TEXTURES } from "../assets/manifest.js";
import { BALANCE } from "../config/balance.js";
import { META_PERKS } from "../config/meta.js";
import {
  isPlayerWeaponAllowed,
  PLAYER_WEAPON_ALLOWLIST
} from "../config/playerWeaponAvailability.js";
import { SITE_CODE } from "./siteIdentity.js";

const ARMORY_WEAPON_METADATA = Object.freeze({
  pistol: Object.freeze({
    textureKey: TEXTURES.weaponPistolIcon,
    role: "可靠的中远距离单体武器",
    stats: () => [
      { label: "伤害", value: `${BALANCE.weapons.pistol.baseDamage}` },
      { label: "冷却", value: `${BALANCE.weapons.pistol.baseCooldownMs} ms` },
      { label: "射程", value: `${BALANCE.weapons.pistol.range}` }
    ]
  }),
  tesla: Object.freeze({
    textureKey: TEXTURES.weaponTeslaIcon,
    role: "持续锁定目标并传导链式电击",
    stats: () => [
      { label: "每跳伤害", value: `${BALANCE.weapons.tesla.baseDamage}` },
      { label: "伤害间隔", value: `${BALANCE.weapons.tesla.baseCooldownMs} ms` },
      { label: "链击", value: `${BALANCE.weapons.tesla.baseChainTargets}` }
    ]
  })
});

const ARMORY_HERO_TEXTURES = Object.freeze({
  pistol: TEXTURES.u1RifleHero,
  tesla: TEXTURES.u1TeslaHero
});

const PERK_TEXTURES = Object.freeze({
  startMaxHealth: Object.freeze({
    textureKey: TEXTURES.u1PerkArmor,
    fallbackTextureKey: TEXTURES.upgradeMaxHealth
  }),
  startMoveSpeed: Object.freeze({
    textureKey: TEXTURES.u1PerkMobility,
    fallbackTextureKey: TEXTURES.upgradeMoveSpeed
  }),
  startDamage: Object.freeze({
    textureKey: TEXTURES.u1PerkArmoryAuth,
    fallbackTextureKey: TEXTURES.upgradeDamage
  }),
  startPickupRadius: Object.freeze({
    textureKey: TEXTURES.u1PerkRecoveryBeacon,
    fallbackTextureKey: TEXTURES.upgradePickupRadius
  })
});

const U1_STATE_FRAMES = Object.freeze({
  check: "status-check",
  unlock: "status-unlock",
  lock: "status-lock",
  forward: "action-forward",
  purchase: "action-purchase",
  authorized: "stamp-authorized",
  warningLamp: "lamp-warning",
  containedLamp: "lamp-contained"
});

const U1_STATE_ATLAS = Object.freeze({
  textureKey: TEXTURES.u1StateParts,
  frames: U1_STATE_FRAMES
});

function toDisplayCredits(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function freezeList(values) {
  return Object.freeze(values.map((value) => Object.freeze(value)));
}

function getStoreVisualState({ state, cost, missingCredits }) {
  if (state === "owned") {
    return Object.freeze({
      priceLabel: `总价 ${cost}`,
      shortfallLabel: null,
      detailLabel: `总价 ${cost}`,
      actionKind: "stamp",
      interactive: false,
      tone: "contained",
      statusSymbol: "check"
    });
  }
  if (state === "available") {
    return Object.freeze({
      priceLabel: `总价 ${cost}`,
      shortfallLabel: null,
      detailLabel: `总价 ${cost}`,
      actionKind: "button",
      interactive: true,
      tone: "warning",
      statusSymbol: "unlock"
    });
  }
  return Object.freeze({
    priceLabel: `总价 ${cost}`,
    shortfallLabel: `还需 ${missingCredits}`,
    detailLabel: `总价 ${cost} · 还需 ${missingCredits}`,
    actionKind: "copy",
    interactive: false,
    tone: "disabled",
    statusSymbol: "lock"
  });
}

export function getPerkStorePresentation(meta = {}) {
  const rawCredits = meta?.credits;
  const creditsValue = toDisplayCredits(rawCredits);
  const items = META_PERKS.map((perk) => {
    const owned = meta?.perks?.[perk.key] === true;
    const affordable = creditsValue >= perk.cost;
    const missingCredits = owned || affordable
      ? 0
      : Math.max(0, perk.cost - creditsValue);
    const state = owned ? "owned" : affordable ? "available" : "insufficient";
    const statusLabel = owned
      ? "已授权"
      : affordable
        ? "可授权"
        : "学分不足";
    const actionLabel = owned
      ? "已授权"
      : affordable
        ? `授权 ${perk.cost}`
        : `还需 ${missingCredits} 学分`;

    const visualState = getStoreVisualState({
      state,
      cost: perk.cost,
      missingCredits
    });
    const textures = PERK_TEXTURES[perk.key];

    return {
      key: perk.key,
      name: perk.name,
      description: perk.description,
      cost: perk.cost,
      owned,
      affordable,
      missingCredits,
      state,
      statusLabel,
      actionLabel,
      textureKey: textures.textureKey,
      fallbackTextureKey: textures.fallbackTextureKey,
      stateFrame: U1_STATE_FRAMES[visualState.statusSymbol],
      ...visualState
    };
  });
  const ownedCount = items.filter(({ owned }) => owned).length;

  return Object.freeze({
    creditsValue,
    creditsLabel: `可用学分 // ${creditsValue}`,
    creditsDisplayLabel: `可用学分 ${creditsValue}`,
    ownedCount,
    totalCount: items.length,
    completionState: ownedCount === items.length ? "complete" : "incomplete",
    progressDisplayLabel: `授权进度 ${ownedCount}/${items.length}`,
    chassisTextureKey: TEXTURES.u1QuartermasterChassis,
    chassisFallbackTextureKey: null,
    stateAtlas: U1_STATE_ATLAS,
    items: freezeList(items)
  });
}

export function getArmoryPresentation({
  meta = {},
  pendingSelectedWeaponId = null,
  hoveredWeaponId = null
} = {}) {
  const creditsValue = toDisplayCredits(meta?.credits);
  const selectedWeaponId = isPlayerWeaponAllowed(pendingSelectedWeaponId)
    ? pendingSelectedWeaponId
    : null;
  const ownedCount = META_PERKS.filter(({ key }) => meta?.perks?.[key] === true).length;
  const slots = PLAYER_WEAPON_ALLOWLIST.map((id) => {
    const selected = id === selectedWeaponId;
    const hovered = id === hoveredWeaponId && !selected;

    return {
      id,
      name: BALANCE.weapons[id].name,
      role: ARMORY_WEAPON_METADATA[id].role,
      textureKey: ARMORY_WEAPON_METADATA[id].textureKey,
      heroTextureKey: ARMORY_HERO_TEXTURES[id],
      stats: ARMORY_WEAPON_METADATA[id].stats(),
      selected,
      hovered,
      state: selected ? "selected" : hovered ? "hover" : "idle"
    };
  });

  const frozenSlots = freezeList(slots.map((slot) => ({
    ...slot,
    stats: freezeList(slot.stats)
  })));
  const selectedSlot = frozenSlots.find(({ selected }) => selected) ?? null;
  const showcase = Object.freeze({
    state: selectedSlot ? "selected" : "empty",
    textureKey: selectedSlot ? ARMORY_HERO_TEXTURES[selectedSlot.id] : null,
    fallbackTextureKey: selectedSlot?.textureKey ?? null
  });
  const dossier = Object.freeze({
    state: selectedSlot ? "selected" : "empty",
    name: selectedSlot?.name ?? "",
    statusLabel: selectedSlot ? "已选定" : "未选择",
    stats: selectedSlot?.stats ?? Object.freeze([])
  });
  const deploy = Object.freeze({
    state: selectedSlot ? "armed" : "disabled",
    label: selectedSlot ? "开始任务" : "部署",
    symbol: selectedSlot ? "forward" : "lock"
  });

  return Object.freeze({
    siteCode: SITE_CODE,
    creditsLabel: `可用学分 // ${creditsValue}`,
    perkProgressLabel: `永久授权 // ${ownedCount}/${META_PERKS.length}`,
    creditsDisplayLabel: `可用学分 ${creditsValue}`,
    authorizationEntryLabel: `永久授权 ${ownedCount}/${META_PERKS.length}  >`,
    chassisTextureKey: TEXTURES.u1ArmoryChassis,
    chassisFallbackTextureKey: TEXTURES.armoryRackBackdrop,
    slots: frozenSlots,
    selectedWeaponId,
    canDeploy: selectedWeaponId !== null,
    deployLabel: selectedWeaponId
      ? `开始任务 // ${BALANCE.weapons[selectedWeaponId].name}`
      : "请选择武器",
    showcase,
    dossier,
    deploy
  });
}
