import {
  createU3Button,
  createU3Header,
  createU3Overlay,
  u3Element
} from "./u3DomOverlay.js";
import { createU3Illustration } from "./u3Illustrations.js";
import { createU3UpgradeDeck } from "./u3UpgradeModel.js";

export const U3_UPGRADE_STYLES = `
.scp-u3.u3-upgrade .u3-panel { display:flex; flex-direction:column; gap:9px; padding:17px 21px 16px; }
.scp-u3 .u3-upgrade-weapon { font-size:13px; letter-spacing:.7px; }
.scp-u3 .u3-upgrade-pending { display:block; color:var(--u3-text); margin-top:2px; }
.scp-u3 .u3-upgrade-grid { flex:1; min-height:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:11px; }
.scp-u3 .u3-upgrade-card { min-width:0; min-height:0; height:100%; padding:2px; gap:0; display:flex; flex-direction:column; justify-content:flex-start; align-items:stretch; overflow:hidden; text-align:left; letter-spacing:0; border:8px solid #546367; border-image:var(--u3-rim) 14 stretch; border-radius:0; background:linear-gradient(125deg,#2b3a40cc,#111c22e3 52%,#1e2c30d9),var(--u3-steel); background-size:auto,350px; background-clip:padding-box; box-shadow:0 3px 5px #000b; }
.scp-u3 .u3-upgrade-card:hover:not(:disabled),.scp-u3 .u3-upgrade-card:focus-visible,.scp-u3 .u3-upgrade-card[data-state="hover"],.scp-u3 .u3-upgrade-card[data-state="focus"] { border-image-source:var(--u3-rim-focus); color:var(--u3-text); outline:none; filter:brightness(1.05); }
.scp-u3.u3-frame-ready .u3-upgrade-card:hover:not(:disabled),.scp-u3.u3-frame-ready .u3-upgrade-card:focus-visible,.scp-u3.u3-frame-ready .u3-upgrade-card[data-state="hover"],.scp-u3.u3-frame-ready .u3-upgrade-card[data-state="focus"] { border-image-source:var(--u3-rim-focus); outline:none; }
.scp-u3 .u3-upgrade-card[data-state="pressed"] { border-color:#9eab9e; filter:brightness(.82); transform:translateY(1px); }
.scp-u3 .u3-upgrade-card[data-state="selected"] { border-image-source:var(--u3-rim-selected); color:var(--u3-text); filter:none; box-shadow:0 0 15px #91eeb13d; }
.scp-u3.u3-frame-ready .u3-upgrade-card[data-state="selected"] { outline:none; }
.scp-u3 .u3-upgrade-card:disabled { border-color:#4d5b55; opacity:.52; }
.scp-u3 .u3-upgrade-card::before,.scp-u3 .u3-upgrade-card::after { display:none; }
.scp-u3 .u3-upgrade-card[data-state="selected"]:disabled { border-image-source:var(--u3-rim-selected); color:var(--u3-text); opacity:1; filter:none; box-shadow:0 0 15px #91eeb13d; }
.scp-u3 .u3-upgrade-card-head { flex:none; min-height:33px; padding:1px 7px; display:grid; grid-template-columns:1fr auto; column-gap:5px; background:linear-gradient(110deg,#34434abb,#1a292bdc),var(--u3-steel); background-size:auto,350px; border-bottom:1px solid #82909288; }
.scp-u3 .u3-upgrade-card-title { font-size:18px; font-weight:700; line-height:1.15; letter-spacing:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.scp-u3 .u3-upgrade-card-index { color:var(--u3-muted); font:10px/1.5 Consolas,monospace; }
.scp-u3 .u3-upgrade-category { grid-column:1/-1; color:#8d9f9f; font:9px/1 Consolas,"Microsoft YaHei",monospace; letter-spacing:.5px; }
.scp-u3 .u3-upgrade-visual { flex:none; height:98px; margin:4px 1px 4px; border:1px solid #71848780; background:#0a151a; overflow:hidden; box-shadow:inset 0 0 8px #000,0 0 0 1px #060d11; }
.scp-u3 .u3-upgrade-card.has-long-description .u3-upgrade-visual { height:48px; }
.scp-u3 .u3-upgrade-card.is-mutation .u3-upgrade-visual { height:66px; }
.scp-u3 .u3-upgrade-benefit { flex:none; min-height:62px; padding:0 5px; display:grid; place-content:center; text-align:center; }
.scp-u3 .u3-upgrade-benefit-label { color:#e2e8df; font-size:14px; line-height:1.15; letter-spacing:.5px; }
.scp-u3 .u3-upgrade-benefit-value { color:var(--u3-green); font:700 45px/1 Bahnschrift,Consolas,"Microsoft YaHei",monospace; letter-spacing:1px; text-shadow:0 0 9px #7ee8a533,0 2px #071812; }
.scp-u3 .u3-upgrade-description { flex:1; min-height:32px; margin:0; padding:1px 5px 3px; color:#e0e5dc; font-size:13px; font-weight:400; line-height:1.2; text-align:center; white-space:pre-line; }
.scp-u3 .u3-upgrade-card.has-long-description .u3-upgrade-description { font-size:12px; line-height:1.25; }
.scp-u3 .u3-upgrade-card.has-long-description .u3-upgrade-benefit { min-height:56px; }
.scp-u3 .u3-upgrade-card.has-long-description .u3-upgrade-benefit-value,.scp-u3 .u3-upgrade-card.is-mutation .u3-upgrade-benefit-value { font-size:34px; }
.scp-u3 .u3-upgrade-comparisons { flex:none; margin:0 3px 3px; padding:5px 2px 2px; border-top:1px solid #8e9b8b9e; display:grid; gap:3px; }
.scp-u3 .u3-upgrade-comparison { display:flex; justify-content:center; align-items:baseline; gap:9px; color:#d0d9d4; font:13px/1.25 Consolas,"Microsoft YaHei",monospace; }
.scp-u3 .u3-upgrade-before-after { color:var(--u3-text); font-size:14px; white-space:nowrap; }
.scp-u3 .u3-upgrade-before-after strong { color:var(--u3-green); font-size:15px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-description { padding-top:3px; line-height:1.5; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-benefit-label { font-size:14px; letter-spacing:1px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-benefit-value small { font-size:29px; letter-spacing:0; margin-left:2px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-comparison { gap:9px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-comparison-label { color:#a9b8b2; font-size:13px; letter-spacing:1px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-before-after { font-size:16px; letter-spacing:.4px; }
.scp-u3 .u3-upgrade-card.is-cadence .u3-upgrade-before-after strong { font-size:18px; }
.scp-u3 .u3-upgrade-risk { margin:-2px 8px 7px; padding:3px 5px; color:var(--u3-red); border:1px solid #b658505e; font:10px/1.3 Consolas,"Microsoft YaHei",monospace; text-align:center; letter-spacing:.4px; }
.scp-u3 .u3-upgrade-status { position:absolute; right:8px; bottom:6px; color:var(--u3-muted); font:8px/1 Consolas,"Microsoft YaHei",monospace; }
.scp-u3 .u3-upgrade-footer { min-height:43px; display:grid; grid-template-columns:1fr 1fr; gap:24px; padding:0 107px; align-items:center; }
.scp-u3 .u3-upgrade-footer .u3-button { min-height:43px; padding:4px 8px 4px 29px; font-size:18px; letter-spacing:.3px; }
.scp-u3 .u3-upgrade-footer .u3-button::before { width:19px; height:24px; left:6px; top:4px; border:0; font-size:24px; line-height:24px; opacity:1; }
.scp-u3 .u3-upgrade-footer .u3-button:first-child::before { content:"⟳"; }
.scp-u3 .u3-upgrade-footer .u3-button:last-child::before { content:"»"; }
.scp-u3 .u3-upgrade-skip-note { position:absolute; right:28px; bottom:7px; color:var(--u3-muted); font:8px/1.2 Consolas,"Microsoft YaHei",monospace; }
`;

function comparisonRow(document, value, cadence = false) {
  const row = u3Element(document, "div", "u3-upgrade-comparison");
  row.appendChild(u3Element(document, "span", "u3-upgrade-comparison-label", cadence ? "间隔" : value.label));
  const values = u3Element(document, "span", "u3-upgrade-before-after");
  values.appendChild(u3Element(document, "span", "", value.before));
  values.appendChild(u3Element(document, "span", "", " → "));
  values.appendChild(u3Element(document, "strong", "", value.after));
  if (value.unit) values.appendChild(u3Element(document, "span", "", ` ${value.unit}`));
  row.appendChild(values);
  return row;
}

function wireCardStates(controller) {
  const { element } = controller;
  let selected = false;
  let locked = element.disabled;
  const originalSetState = controller.setState;
  const originalDisable = controller.disableInteractive;
  controller.setState = (state) => {
    selected = state === "selected";
    originalSetState(state);
    if (locked) element.disabled = true;
  };
  controller.disableInteractive = () => {
    locked = true;
    originalDisable();
  };
  controller.hitArea.disableInteractive = () => {
    locked = true;
    element.disabled = true;
  };
  const state = (next) => {
    if (!element.disabled && !selected) originalSetState(next);
  };
  element.addEventListener("pointerenter", () => state("hover"));
  element.addEventListener("pointerleave", () => state("idle"));
  element.addEventListener("focus", () => state("focus"));
  element.addEventListener("blur", () => state("idle"));
  element.addEventListener("pointerdown", () => state("pressed"));
  element.addEventListener("pointerup", () => state("hover"));
  return controller;
}

function createCard(document, model, index, upgrade, onSelect) {
  let controller;
  controller = wireCardStates(createU3Button(document, {
    text: "",
    className: `u3-upgrade-card${model.cadence ? " is-cadence" : ""}${model.isMutation ? " is-mutation" : ""}${model.description.length > 40 ? " has-long-description" : ""}`,
    disabled: model.disabled,
    onActivate: () => onSelect(upgrade, controller)
  }));
  const { element } = controller;
  element.setAttribute("aria-label", `${model.title}，${model.benefitLabel}${model.benefitValue}，${model.comparison.before} 到 ${model.comparison.after}${model.comparison.unit}`);
  element.textContent = "";

  const head = u3Element(document, "div", "u3-upgrade-card-head");
  head.appendChild(u3Element(document, "div", "u3-upgrade-card-title", model.title));
  head.appendChild(u3Element(document, "div", "u3-upgrade-card-index", String(index + 1).padStart(2, "0")));
  head.appendChild(u3Element(document, "div", "u3-upgrade-category", `${model.categoryLabel} // ${model.levelLabel}`));
  const visual = u3Element(document, "div", "u3-upgrade-visual");
  visual.appendChild(createU3Illustration(document, model.illustrationKind, { cadence: model.cadence }));
  const benefit = u3Element(document, "div", "u3-upgrade-benefit");
  benefit.appendChild(u3Element(document, "div", "u3-upgrade-benefit-label", model.benefitLabel));
  const benefitValue = u3Element(document, "div", "u3-upgrade-benefit-value");
  if (model.cadence && model.benefitValue.endsWith("%")) {
    benefitValue.appendChild(u3Element(document, "span", "", model.benefitValue.slice(0, -1).replace("-", "−")));
    benefitValue.appendChild(u3Element(document, "small", "", "%"));
  } else benefitValue.textContent = model.benefitValue;
  benefit.appendChild(benefitValue);
  const description = u3Element(document, "p", "u3-upgrade-description", model.description.length <= 40 ? model.description.replace("，", "，\n") : model.description);
  const comparisons = u3Element(document, "div", "u3-upgrade-comparisons");
  comparisons.appendChild(comparisonRow(document, model.comparison, !!model.cadence));
  for (const secondary of model.secondaryComparisons) comparisons.appendChild(comparisonRow(document, secondary));
  element.append(head, visual, benefit, description, comparisons);
  if (model.riskLabel) element.appendChild(u3Element(document, "div", "u3-upgrade-risk", model.riskLabel));
  if (model.disabled) element.appendChild(u3Element(document, "div", "u3-upgrade-status", model.statusLabel));
  return controller;
}

export function createU3UpgradeView(scene, {
  choices = [],
  onSelect = () => {},
  onReroll = () => {},
  onSkip = () => {},
  onFailure
} = {}) {
  let overlay = null;
  let destroyed = false;
  let activeChoices = choices;
  const cards = [];
  let reroll = null;
  let skip = null;
  try {
    overlay = createU3Overlay(scene, {
      kind: "upgrade",
      width: 790,
      height: 472,
      className: "u3-upgrade",
      styles: U3_UPGRADE_STYLES,
      onFailure
    });
    if (!overlay) return null;
    const { document, panel } = overlay;
    const header = createU3Header(document, {
      eyebrow: "FIELD AUTHORIZATION // SITE-CN-03",
      title: "现场强化授权",
      status: "授权链路在线"
    });
    const weapon = u3Element(document, "div", "u3-subtitle u3-upgrade-weapon");
    header.children[1].appendChild(weapon);
    const headerStatus = header.children[2];
    headerStatus.textContent = "";
    headerStatus.appendChild(u3Element(document, "span", "", "授权链路在线"));
    const pending = u3Element(document, "span", "u3-upgrade-pending");
    headerStatus.appendChild(pending);
    const grid = u3Element(document, "div", "u3-upgrade-grid");
    const footer = u3Element(document, "footer", "u3-upgrade-footer");
    reroll = createU3Button(document, { text: "", onActivate: onReroll });
    skip = createU3Button(document, { text: "", onActivate: onSkip });
    footer.append(reroll.element, skip.element);
    const skipNote = u3Element(document, "div", "u3-upgrade-skip-note");
    panel.append(header, grid, footer, skipNote);

    function clearCards() {
      for (const card of cards.splice(0)) card.destroy();
    }

    function refresh(nextChoices = activeChoices) {
      if (destroyed) return;
      activeChoices = nextChoices;
      const deck = createU3UpgradeDeck(scene, activeChoices);
      weapon.textContent = deck.weaponLabel;
      pending.textContent = deck.pendingLabel;
      reroll.label.setText(deck.rerollLabel);
      reroll.element.setAttribute("aria-label", deck.rerollLabel);
      reroll.setState(deck.rerollDisabled ? "disabled" : "idle");
      skip.label.setText(deck.skipLabel);
      skip.element.setAttribute("aria-label", deck.skipLabel);
      skipNote.textContent = `当前生命 ${deck.skipComparison.before} → ${deck.skipComparison.after}`;
      clearCards();
      for (let index = 0; index < deck.cards.length; index += 1) {
        const card = createCard(document, deck.cards[index], index, activeChoices[index], onSelect);
        cards.push(card);
        grid.appendChild(card.element);
      }
    }

    function destroy() {
      if (destroyed) return;
      destroyed = true;
      clearCards();
      reroll?.destroy();
      skip?.destroy();
      overlay?.destroy();
    }

    refresh(activeChoices);
    return {
      mode: "u3-upgrade",
      document,
      root: overlay.root,
      panel,
      container: overlay.container,
      header,
      cards,
      reroll,
      skip,
      get choices() { return activeChoices; },
      refresh,
      setVisible: overlay.setVisible,
      sync: overlay.sync,
      destroy
    };
  } catch (error) {
    destroyed = true;
    for (const card of cards.splice(0)) card.destroy();
    reroll?.destroy();
    skip?.destroy();
    overlay?.destroy();
    throw error;
  }
}
