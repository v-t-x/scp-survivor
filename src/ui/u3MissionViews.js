import { BALANCE } from "../config/balance.js";
import { getHudPresentation } from "./hudPresentation.js";
import {
  createU3Header,
  createU3Button,
  createU3Overlay,
  u3Element
} from "./u3DomOverlay.js";
import { createU3Illustration } from "./u3Illustrations.js";
import { SITE_CODE, SITE_CHANNELS } from "./siteIdentity.js";

export const U3_MISSION_STYLES = `
.scp-u3 .u3-mission-panel { display:flex; flex-direction:column; gap:12px; }
.scp-u3 .u3-surface-wear { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; opacity:.66; }
.scp-u3 .u3-button > .u3-surface-wear { inset:2px; width:calc(100% - 4px); height:calc(100% - 4px); opacity:.64; }
.scp-u3.u3-pause .u3-mission-panel { gap:10px; }
.scp-u3.u3-pause .u3-header { gap:13px; }
.scp-u3.u3-pause .u3-heading h2 { font-size:30px; }
.scp-u3 .u3-pause-device { position:relative; flex:1 1 0; min-height:0; display:grid; grid-template-columns:minmax(0,1fr) 86px; gap:8px; padding:7px 10px; background-image:linear-gradient(#789a8710 1px,transparent 1px),linear-gradient(90deg,#789a8710 1px,transparent 1px),linear-gradient(110deg,#13211ff2,#081315f5); background-size:8px 8px,8px 8px,auto; }
.scp-u3 .u3-pause-device::after { content:""; position:absolute; inset:7px; pointer-events:none; background:linear-gradient(#a3b7a990,#a3b7a990) 0 0/13px 1px no-repeat,linear-gradient(#a3b7a990,#a3b7a990) 0 0/1px 11px no-repeat,linear-gradient(#829a8970,#829a8970) 100% 100%/13px 1px no-repeat,linear-gradient(#829a8970,#829a8970) 100% 100%/1px 11px no-repeat; }
.scp-u3 .u3-pause-rows { margin:0; min-width:0; display:grid; grid-template-rows:1.2fr 1fr 1.2fr; }
.scp-u3 .u3-pause-row { min-height:0; display:grid; grid-template-columns:98px minmax(0,1fr); align-items:center; gap:10px; border-bottom:1px solid #718c7e65; padding:4px 4px; }
.scp-u3 .u3-pause-row:last-child { border-bottom:0; }
.scp-u3 .u3-pause-row dt,.scp-u3 .u3-pause-row dd { margin:0; }
.scp-u3 .u3-pause-row dt { color:#e0e8df; font-size:17px; font-weight:700; padding-right:8px; border-right:1px solid #a1b0a880; }
.scp-u3 .u3-pause-row dd { min-width:0; font-size:17px; font-weight:700; line-height:1.28; overflow-wrap:anywhere; }
.scp-u3 .u3-pause-row:last-child dd { font-size:15px; }
.scp-u3 .u3-pause-row:nth-child(2) dd { font-size:21px; font-variant-numeric:tabular-nums; }
.scp-u3 .u3-pause-row dd[data-tone="contained"] { font-size:18px; }
.scp-u3 .u3-pause-row dd[data-tone="warning"] { color:#edd084; }
.scp-u3 .u3-pause-row dd[data-tone="danger"] { color:#f58a78; }
.scp-u3 .u3-pause-context { display:block; margin-top:3px; color:var(--u3-muted); font-size:10px; font-weight:400; line-height:1.3; }
.scp-u3 .u3-pause-signal { display:flex; flex-direction:column; justify-content:center; align-items:center; color:#849f94; font:9px/1.5 Consolas,monospace; letter-spacing:.3px; }
.scp-u3 .u3-pause-icon { width:70px; height:70px; margin-bottom:10px; border:4px dashed #8eafa177; border-radius:50%; position:relative; box-shadow:0 0 0 1px #77998925,inset 0 0 12px #67988512; }
.scp-u3 .u3-pause-icon::after { content:"Ⅱ"; position:absolute; inset:10px; display:grid; place-items:center; color:#abc3b7; font:bold 33px/1 Consolas,monospace; }
.scp-u3 .u3-pause-actions { flex:none; display:flex; flex-direction:column; align-items:stretch; gap:10px; padding:0 4px; }
.scp-u3 .u3-pause-primary { min-height:56px; padding-top:5px; padding-bottom:5px; border-color:#a2c6aa; background-color:#40594e; font-size:24px; letter-spacing:4px; }
.scp-u3 .u3-pause-play { position:absolute; left:45px; width:0; height:0; border-top:9px solid transparent; border-bottom:9px solid transparent; border-left:14px solid #efefe3; filter:drop-shadow(0 2px 1px #000); }
.scp-u3 .u3-pause-key { position:absolute; right:24px; padding:2px 8px; border:1px solid #a0b6a7; border-radius:3px; box-shadow:0 0 0 2px #152820,inset 0 1px 1px #9eaf9477; color:#b4c9ba; background:#162820aa; font:700 16px/1.5 Consolas,monospace; letter-spacing:0; }
.scp-u3 .u3-pause-secondary { width:330px; min-height:42px; align-self:center; padding-top:2px; padding-bottom:2px; color:#ef8980; border-color:#9f564f; background-color:#302c2c; font-size:19px; }
.scp-u3 .u3-pause-stop { position:absolute; left:18px; width:9px; height:9px; border:1px solid #c9847a; border-radius:50%; background:#a8554d; box-shadow:0 0 5px #f1746f33,inset 0 1px 1px #ffb5a077; }
.scp-u3 .u3-result-button { width:300px; min-height:48px; margin:0 auto; padding-top:4px; padding-bottom:4px; font-size:20px; letter-spacing:3px; }
.scp-u3 .u3-victory-layout { flex:1; display:grid; grid-template-columns:220px minmax(0,1fr); grid-template-rows:minmax(0,1fr) 49px; gap:12px 14px; min-height:0; }
.scp-u3 .u3-victory-device { position:relative; padding:13px 13px 11px 24px; display:flex; flex-direction:column; align-items:center; text-align:center; min-height:0; }
.scp-u3 .u3-victory-device::before { content:""; position:absolute; top:18px; bottom:18px; left:11px; width:9px; background:repeating-linear-gradient(180deg,#9cb5a676 0 1px,transparent 1px 8px); opacity:.7; }
.scp-u3 .u3-victory-layout .u3-victory-device { grid-row:1 / 3; }
.scp-u3 .u3-victory-nameplate { display:flex; gap:8px; width:100%; align-items:center; border-bottom:1px solid #71877980; padding-bottom:8px; }
.scp-u3 .u3-victory-nameplate .u3-seal { width:71px; height:66px; padding:4px; color:#e3e1c7; background:none; border:0; box-shadow:none; }
.scp-u3 .u3-victory-nameplate .u3-seal small { display:none; }
.scp-u3 .u3-victory-nameplate .u3-seal::before { display:none; }
.scp-u3 .u3-victory-code { min-width:0; color:#a3b6ab; font:10px/1.35 Consolas,monospace; letter-spacing:.5px; white-space:pre-line; text-align:left; }
.scp-u3 .u3-victory-subject { align-self:stretch; margin:7px 0 0; padding-bottom:6px; border-bottom:1px solid #6d83777c; color:#e5e4cb; font:800 33px/1.15 Consolas,"Microsoft YaHei",sans-serif; letter-spacing:1px; }
.scp-u3 .u3-containment-diagram { flex:1 1 0; width:100%; min-height:100px; position:relative; margin:5px 0; }
.scp-u3 .u3-containment-diagram .u3-illustration { width:100%; height:100%; filter:brightness(1.35) contrast(1.2) saturate(.25); mix-blend-mode:lighten; }
.scp-u3 .u3-victory-status-label { color:#dde4d7; font-size:15px; letter-spacing:2px; }
.scp-u3 .u3-victory-status-label::before { content:""; display:inline-block; width:10px; height:10px; margin-right:10px; border-radius:50%; background:#a5e8b5; box-shadow:0 0 9px #99efaa33; }
.scp-u3 .u3-victory-state { width:100%; color:var(--u3-green); font-size:34px; line-height:1.3; font-weight:800; letter-spacing:5px; text-shadow:0 1px 8px #6cee931a; }
.scp-u3 .u3-victory-complete { width:100%; margin-top:10px; border-top:1px solid #8ba29188; border-bottom:1px solid #8ba29155; padding:7px 0; font-size:14px; letter-spacing:2px; }
.scp-u3 .u3-victory-paper { position:relative; padding:16px 23px 13px; display:flex; flex-direction:column; min-height:0; }
.scp-u3 .u3-paper-clamp { position:absolute; top:38%; width:15px; height:62px; background:linear-gradient(90deg,#14201e,#566860 45%,#24342f 65%,#0c1614); border:2px solid #0c1512; box-shadow:0 0 0 1px #9baca0,inset 0 0 0 1px #7a8b8077,0 2px 3px #0007; }
.scp-u3 .u3-paper-clamp::before,.scp-u3 .u3-paper-clamp::after { content:""; position:absolute; left:3px; width:4px; height:4px; background:#0d1712; border:1px solid #98a898; border-radius:50%; }
.scp-u3 .u3-paper-clamp::before { top:5px; } .scp-u3 .u3-paper-clamp::after { bottom:5px; }
.scp-u3 .u3-paper-clamp-left { left:-9px; } .scp-u3 .u3-paper-clamp-right { right:-9px; }
.scp-u3 .u3-report-code { font:10px/1.4 Consolas,monospace; letter-spacing:1px; border-bottom:3px double #565d55; padding-bottom:7px; }
.scp-u3 .u3-victory-paper h2 { margin:13px 0 0; font-size:37px; line-height:1.3; font-weight:900; letter-spacing:2px; }
.scp-u3 .u3-report-subtitle { margin-top:2px; font-size:19px; font-weight:700; }
.scp-u3 .u3-victory-stamp { position:absolute; right:18px; top:80px; color:#286146; font-size:25px; letter-spacing:4px; border-width:4px; padding:7px 13px; opacity:.96; mask-image:radial-gradient(ellipse 9px 1.2px at 15% 7%,transparent 45%,#000 65%),radial-gradient(ellipse 5px 1px at 84% 92%,transparent 45%,#000 65%),linear-gradient(114deg,#000 0 39.2%,transparent 39.2% 39.65%,#000 39.65%); mask-composite:intersect; }
.scp-u3 .u3-victory-stats { margin:28px 0 0; border:1px solid #777b6c; }
.scp-u3 .u3-victory-stats .u3-stat { display:grid; grid-template-columns:1.15fr 1fr; border-bottom:1px solid #929583; padding:5px 13px; }
.scp-u3 .u3-victory-stats .u3-stat:last-child { border-bottom:0; }
.scp-u3 .u3-victory-stats .u3-stat-label { font-size:16px; line-height:1.3; font-weight:700; }
.scp-u3 .u3-victory-stats .u3-stat-value { padding-left:15px; border-left:1px solid #959887; font-size:18px; line-height:1.15; font-weight:700; font-variant-numeric:tabular-nums; }
.scp-u3 .u3-report-footer { display:flex; justify-content:space-between; align-items:end; gap:15px; margin-top:auto; padding-top:15px; color:#626457; font:9px/1.4 Consolas,"Microsoft YaHei",monospace; letter-spacing:1px; white-space:pre-line; }
.scp-u3 .u3-report-footer > :first-child { padding-left:10px; border-left:2px solid #878b79; }
.scp-u3 .u3-report-footer > :last-child { padding-bottom:3px; border-bottom:3px double #838776; text-align:left; }
.scp-u3 .u3-victory-layout > .u3-result-button { grid-column:2; width:300px; margin:0 auto; }
.scp-u3 .u3-failure-shell { flex:1; display:grid; grid-template-columns:86px minmax(0,1fr); gap:9px; min-height:0; }
.scp-u3 .u3-incident-rail { position:relative; overflow:hidden; padding:12px 8px 46px; color:#f49783; background-color:#8f3028; background-image:linear-gradient(135deg,#e47e623d,transparent 20%,#25141070 92%),var(--u3-steel,none); background-size:auto,220px; background-blend-mode:normal,soft-light; border:2px solid #572522; box-shadow:inset 0 0 0 1px #db846b77,inset 0 0 18px #361816ad,0 0 0 2px #0a1210; display:flex; flex-direction:column; justify-content:space-between; text-align:left; clip-path:polygon(7px 0,calc(100% - 7px) 0,100% 7px,100% calc(100% - 7px),calc(100% - 7px) 100%,7px 100%,0 calc(100% - 7px),0 7px); }
.scp-u3 .u3-incident-rail::after { content:""; position:absolute; left:0; right:0; bottom:0; height:33px; background:repeating-linear-gradient(135deg,#e05b4666 0 13px,#341b1a77 13px 26px); border-top:1px solid #742e2966; }
.scp-u3 .u3-incident-rail > .u3-surface-wear { opacity:.66; }
.scp-u3 .u3-incident-rail > :not(.u3-surface-wear) { position:relative; z-index:1; }
.scp-u3 .u3-incident-seal { position:relative; color:#170d0b; width:calc(100% + 12px); margin:-8px -6px 0; height:96px; display:flex; flex-direction:column; align-items:center; justify-content:center; font:900 8px/1.1 Consolas,monospace; white-space:pre-line; text-align:center; background:linear-gradient(145deg,#dd796654,#b44d3c50); border:1px solid #db826568; box-shadow:inset 0 0 12px #59281d50; }
.scp-u3 .u3-incident-seal .u3-seal { width:63px; height:63px; flex-shrink:0; border:0; color:#140e0c; background:none; box-shadow:none; padding:0; }
.scp-u3 .u3-incident-seal .u3-seal small { display:none; }
.scp-u3 .u3-incident-seal .u3-seal::before,.scp-u3 .u3-incident-seal .u3-seal::after { display:none; }
.scp-u3 .u3-incident-seal::after { content:""; position:absolute; inset:4px; pointer-events:none; background:radial-gradient(circle at 0 0,#241310 0 2px,#e79b7644 2px 3px,transparent 3px),radial-gradient(circle at 100% 0,#241310 0 2px,#e79b7644 2px 3px,transparent 3px),radial-gradient(circle at 0 100%,#241310 0 2px,#e79b7644 2px 3px,transparent 3px),radial-gradient(circle at 100% 100%,#241310 0 2px,#e79b7644 2px 3px,transparent 3px); }
.scp-u3 .u3-incident-rail small { white-space:pre-line; overflow-wrap:anywhere; font:11px/1.5 Consolas,"Microsoft YaHei",monospace; letter-spacing:.5px; }
.scp-u3 .u3-incident-cost { padding-top:9px; border-top:2px solid #d6776766; }
.scp-u3 .u3-failure-terminal { padding:10px 13px; display:grid; grid-template-rows:19px 54px minmax(100px,1fr) 77px 48px; gap:9px; min-width:0; min-height:0; }
.scp-u3 .u3-failure-meta { display:flex; justify-content:space-between; align-items:center; color:#adbbb1; font:10px/1.3 Consolas,monospace; letter-spacing:.5px; }
.scp-u3 .u3-failure-meta > :last-child { color:#a3afa7; font-size:9px; }
.scp-u3 .u3-failure-meta > :last-child::before { content:""; display:inline-block; width:6px; height:6px; margin-right:6px; background:#ff7069; border-radius:50%; box-shadow:0 0 6px #df544d70; }
.scp-u3 .u3-interruption-wave { position:relative; width:100%; height:54px; border-top:1px solid #70807445; overflow:hidden; }
.scp-u3 .u3-interruption-wave .u3-illustration { width:100%; height:100%; }
.scp-u3 .u3-wave-status { position:absolute; right:4px; bottom:4px; padding-left:8px; color:#a1aea6; background:#0c1613; white-space:pre-line; font:9px/1.3 Consolas,monospace; letter-spacing:.4px; }
.scp-u3 .u3-failure-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.scp-u3 .u3-failure-heading h2 { margin:0; color:#ff655c; font-size:56px; font-weight:900; line-height:1.05; letter-spacing:5px; text-shadow:0 2px 0 #642d26,0 0 16px #bc312d10; }
.scp-u3 .u3-failure-subtitle { color:#ef7770; font-size:21px; font-weight:700; letter-spacing:2px; line-height:1.4; }
.scp-u3 .u3-failure-next { margin-top:4px; color:#d3d9cf; font-size:15px; letter-spacing:1px; }
.scp-u3 .u3-failure-stamp { flex:none; color:#ef544c; font-size:22px; margin:8px 4px 0 0; padding:7px 14px; border-width:4px; letter-spacing:4px; transform:rotate(-13deg); }
.scp-u3 .u3-failure-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); padding:10px 0; border:1px solid #728174a8; box-shadow:inset 0 0 0 4px #101a17,inset 0 0 0 5px #6f807459,0 0 0 2px #050c0b; background:linear-gradient(90deg,#13201b66,#08141199); }
.scp-u3 .u3-failure-stats .u3-stat { min-width:0; padding:0 5px; border-right:1px solid #64776a99; text-align:center; }
.scp-u3 .u3-failure-stats .u3-stat:last-child { border-right:0; }
.scp-u3 .u3-failure-stats .u3-stat-label { display:block; color:#e2e6d9; font-size:14px; }
.scp-u3 .u3-failure-stats .u3-stat-value { display:block; margin-top:1px; font:700 28px/1.2 Consolas,"Microsoft YaHei",monospace; color:#f1ead5; font-variant-numeric:tabular-nums; }
.scp-u3 .u3-failure-terminal > .u3-result-button { width:292px; }
`;
export function createU3PauseModel(scene) {
  const objective = "重新收容 SCP-049";
  const phase = scene.getPhaseHudState?.();
  let missionContext = scene.survivalPhaseEnded
    ? "等待 SCP-049 收容接触"
    : "维持生存 // 等待收容窗口";
  if (phase?.missionDetail) {
    missionContext = phase.missionDetail;
  } else if (phase?.phaseLabel) {
    missionContext = phase.nextNodeSeconds > 0
      ? `${phase.phaseLabel} // 下一节点 ${phase.nextNodeSeconds} 秒`
      : phase.phaseLabel;
  }

  let facility = scene._hudPresentation?.facility;
  if (!facility?.title || !facility?.detail) {
    const event = scene.activeFacilityEvent;
    const configured = event?.type ? BALANCE.facility.events[event.type] : null;
    facility = getHudPresentation({
      bossPhaseActive: scene.bossPhaseActive === true,
      activeFacilityEvent: event
        ? { ...event, warning: event.warning ?? configured?.warning }
        : null
    }).facility;
  }

  const elapsedTime = formatMissionClock(scene.getFinalSurvivalTimeSeconds());
  const hasFacilityWarning = facility.expanded === true
    && facility.detail
    && facility.detail !== SITE_CHANNELS.containmentSystem;

  return {
    objective,
    missionContext,
    elapsedTime,
    facilityStatus: hasFacilityWarning ? `${facility.title} // ${facility.detail}` : facility.title,
    facilityTone: facility.tone ?? (hasFacilityWarning ? "warning" : "contained")
  };
}

function formatMissionClock(secondsValue) {
  const seconds = Math.max(0, Math.floor(Number(secondsValue) || 0));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function createU3ResultModel(scene, type, {
  finalTime = scene.getFinalSurvivalTimeSeconds()
} = {}) {
  const victory = type === "victory";
  return {
    type: victory ? "victory" : "failure",
    tone: victory ? "success" : "danger",
    heading: victory ? "重新收容确认" : "行动终止",
    subtitle: victory ? "SCP-049 已重新收容" : "事故记录已封存",
    stats: [
      ["生存时间", formatMissionClock(finalTime)],
      ["击杀", `${scene.killCount}`],
      ["当局学分", `+${scene.lastRunCreditsEarned ?? 0}`],
      ["累计学分", `${scene.meta.credits}`]
    ]
  };
}

function appendStats(document, host, stats) {
  for (const [label, value] of stats) {
    const stat = u3Element(document, "div", "u3-stat");
    stat.append(
      u3Element(document, "span", "u3-stat-label", label === "击杀" ? "击杀数" : label),
      u3Element(document, "span", "u3-stat-value", value)
    );
    host.append(stat);
  }
}

// Sparse local wear keeps the machinery legible without adding a repeated frame
// or baking any labels into the artwork. These SVGs carry no game state.
function createMissionWear(document, kind) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "u3-surface-wear");
  svg.setAttribute("viewBox", kind === "rail" ? "0 0 86 400" : "0 0 300 60");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  if (kind === "rail") {
    svg.innerHTML = '<g fill="#301917" opacity=".48"><path d="M5 110L15 103L19 108L28 107L29 122L19 132L10 129L5 143Z"/><path d="M54 248L62 243L68 248L70 263L64 275L69 284L61 290L57 279L59 265L51 258Z"/><path d="M25 319L33 313L42 318L46 330L41 337L31 334L27 342L23 331Z"/><path d="M3 214L10 215L9 233L4 239Z"/></g><g fill="#aea393" opacity=".62"><path d="M0 32L3 31L4 40L1 44L3 47L0 54Z"/><path d="M84 76L79 79L81 87L77 92L81 96L86 94Z"/><path d="M0 172L4 174L2 179L5 188L1 190L3 196L0 204Z"/><path d="M85 277L81 279L83 286L79 291L81 299L86 296Z"/><path d="M12 398L17 394L24 396L28 394L31 400Z"/></g><g fill="none" stroke-linecap="round"><path d="M9 58L15 70L12 76L18 83L17 94M14 72L22 71L28 77M71 128L66 137L70 144L63 151L65 163M67 137L58 135M77 295L69 302L72 312L66 319" stroke="#351c17" stroke-width="1" opacity=".72"/><path d="M8 59L14 70M70 129L65 137M75 295L68 302M2 225L8 220M78 53L83 49" stroke="#d0896b" stroke-width=".6" opacity=".65"/><path d="M14 151L23 149L36 151L43 150M15 153L24 152M53 333L71 330" stroke="#361a15" stroke-width="2" opacity=".32"/><path d="M14 154L24 153M56 333L71 331" stroke="#c2775d" stroke-width=".6" opacity=".48"/></g>';
  } else {
    svg.innerHTML = '<g fill="none" stroke-linecap="round"><path d="M12 2H35M46 2H61M213 2H233M263 58H283" stroke="#c2c5b7" stroke-width="1.4" opacity=".6"/><path d="M20 3H31M216 3H229M265 57H276" stroke="#080e0d" stroke-width=".7" opacity=".7"/><path d="M74 8L86 6M77 11L82 10M230 48L242 45M238 51L251 48M11 26L16 24" stroke="#b7bcaf" stroke-width=".6" opacity=".48"/><path d="M130 6L138 5M252 35L257 33M44 53L56 52" stroke="#0d1514" stroke-width=".8" opacity=".6"/></g><g fill="#aeb4a4" opacity=".58"><path d="M2 9L4 8L3 13L5 14L2 17Z"/><path d="M295 49L298 45L298 51L295 53Z"/></g>';
  }
  return svg;
}

function missionController(overlay, { kind, tone, model, actions }) {
  let destroyed = false;
  return {
    mode: "u3",
    kind,
    tone,
    model,
    root: overlay.root,
    panel: overlay.panel,
    container: overlay.container,
    content: overlay.panel,
    objects: [],
    actions,
    restartButton: actions.restart,
    resumeButton: actions.resume,
    quitButton: actions.quit,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const action of Object.values(actions)) action?.destroy?.();
      overlay.destroy();
    }
  };
}

export function createU3PauseView(scene, { onResume, onQuit, onFailure } = {}) {
  const model = createU3PauseModel(scene);
  const overlay = createU3Overlay(scene, {
    kind: "pause",
    width: 580,
    height: 410,
    className: "u3-pause",
    styles: U3_MISSION_STYLES,
    onFailure
  });
  if (!overlay) return null;

  const actions = {};
  try {
    overlay.panel.className += " u3-mission-panel";
    const header = createU3Header(overlay.document, {
      eyebrow: SITE_CHANNELS.missionControl,
      title: "行动暂停",
      subtitle: "任务时序冻结",
      status: `${SITE_CODE}\nPAUSED`
    });
    header.children[0].append(createMissionWear(overlay.document, "plate"));
    overlay.panel.append(header);

    const device = u3Element(overlay.document, "div", "u3-pause-device u3-inset");
    const rows = u3Element(overlay.document, "dl", "u3-pause-rows");
    for (const [label, value] of [
      ["当前任务", model.objective],
      ["运行时间", model.elapsedTime],
      ["设施状态", model.facilityStatus]
    ]) {
      const row = u3Element(overlay.document, "div", "u3-pause-row");
      const valueNode = u3Element(
        overlay.document,
        "dd",
        label === "设施状态" ? "u3-value" : "",
        value
      );
      if (label === "设施状态") valueNode.setAttribute("data-tone", model.facilityTone);
      if (label === "当前任务" && model.missionContext) {
        valueNode.append(u3Element(overlay.document, "small", "u3-pause-context", model.missionContext));
      }
      row.append(u3Element(overlay.document, "dt", "", label), valueNode);
      rows.append(row);
    }
    const signal = u3Element(overlay.document, "div", "u3-pause-signal");
    signal.append(
      u3Element(overlay.document, "div", "u3-pause-icon"),
      u3Element(overlay.document, "span", "", "SYSTEM PAUSED")
    );
    device.append(rows, signal);
    overlay.panel.append(device);

    actions.resume = createU3Button(overlay.document, {
      text: "继续行动",
      className: "u3-pause-primary",
      onActivate: onResume
    });
    actions.quit = createU3Button(overlay.document, {
      text: "返回标题",
      className: "u3-pause-secondary",
      onActivate: onQuit
    });
    const playIcon = u3Element(overlay.document, "span", "u3-pause-play");
    const keycap = u3Element(overlay.document, "kbd", "u3-pause-key", "ESC");
    const stopLight = u3Element(overlay.document, "span", "u3-pause-stop");
    for (const decoration of [playIcon, keycap, stopLight]) decoration.setAttribute("aria-hidden", "true");
    actions.resume.element.append(createMissionWear(overlay.document, "button"), playIcon, keycap);
    actions.quit.element.append(createMissionWear(overlay.document, "button"), stopLight);
    const actionRow = u3Element(overlay.document, "div", "u3-pause-actions");
    actionRow.setAttribute("aria-orientation", "vertical");
    actionRow.append(actions.resume.element, actions.quit.element);
    overlay.panel.append(actionRow);
    return missionController(overlay, { kind: "pause", tone: "standard", model, actions });
  } catch (error) {
    for (const action of Object.values(actions)) action?.destroy?.();
    overlay.destroy();
    throw error;
  }
}

function createVictoryContent(document, model, restartElement) {
  const layout = u3Element(document, "div", "u3-victory-layout");
  const device = u3Element(document, "aside", "u3-victory-device u3-inset");
  const nameplate = u3Element(document, "div", "u3-victory-nameplate");
  nameplate.append(
    createU3Header(document, { title: "" }).children[0],
    u3Element(document, "div", "u3-victory-code", `${SITE_CODE}\n\nSECURE\nCONTAIN\nPROTECT`)
  );
  const diagram = u3Element(document, "div", "u3-containment-diagram");
  diagram.append(createU3Illustration(document, "containment"));
  device.append(
    nameplate,
    u3Element(document, "h3", "u3-victory-subject", "SCP-049"),
    diagram,
    u3Element(document, "div", "u3-victory-status-label", "收容状态"),
    u3Element(document, "div", "u3-victory-state", "已恢复"),
    u3Element(document, "div", "u3-victory-complete", "行动记录完成")
  );

  const paper = u3Element(document, "article", "u3-victory-paper u3-paper");
  paper.append(
    u3Element(document, "div", "u3-report-code", `${SITE_CODE} / RECONTAINMENT REPORT`),
    u3Element(document, "h2", "", model.heading),
    u3Element(document, "div", "u3-report-subtitle", model.subtitle),
    u3Element(document, "div", "u3-victory-stamp u3-stamp", "收容恢复")
  );
  for (const side of ["left", "right"]) {
    const clamp = u3Element(document, "span", `u3-paper-clamp u3-paper-clamp-${side}`);
    clamp.setAttribute("aria-hidden", "true");
    paper.append(clamp);
  }
  const stats = u3Element(document, "div", "u3-victory-stats");
  appendStats(document, stats, model.stats);
  const footer = u3Element(document, "footer", "u3-report-footer");
  footer.append(
    u3Element(document, "span", "", "更安全的世界\nSCP FOUNDATION\nSECURE. CONTAIN. PROTECT."),
    u3Element(document, "span", "", "A SAFER WORLD\nTHROUGH CONTAINMENT")
  );
  paper.append(stats, footer);
  layout.append(device, paper, restartElement);
  return layout;
}

function createFailureContent(document, model, restartElement) {
  const shell = u3Element(document, "div", "u3-failure-shell");
  const rail = u3Element(document, "aside", "u3-incident-rail");
  const seal = u3Element(document, "div", "u3-incident-seal");
  seal.append(
    createU3Header(document, { title: "" }).children[0],
    u3Element(document, "span", "", "SCP FOUNDATION")
  );
  rail.append(
    createMissionWear(document, "rail"),
    seal,
    u3Element(document, "small", "", "INCIDENT\nRESPONSE"),
    u3Element(document, "small", "u3-incident-cost", "失控的异常\n带来真实的代价")
  );
  const terminal = u3Element(document, "section", "u3-failure-terminal u3-inset");
  const meta = u3Element(document, "div", "u3-failure-meta");
  meta.append(
    u3Element(document, "span", "", `${SITE_CODE} / INCIDENT REPORT`),
    u3Element(document, "span", "", "CONTAINMENT BREACH")
  );
  const wave = u3Element(document, "div", "u3-interruption-wave");
  const waveform = createU3Illustration(document, "interruption");
  waveform.setAttribute("preserveAspectRatio", "none");
  wave.append(waveform, u3Element(document, "span", "u3-wave-status", `SIGNAL LOST\nAT ${model.stats[0][1]}`));
  const heading = u3Element(document, "div", "u3-failure-heading");
  const copy = u3Element(document, "div");
  copy.append(
    u3Element(document, "h2", "", model.heading),
    u3Element(document, "div", "u3-failure-subtitle", model.subtitle),
    u3Element(document, "div", "u3-failure-next", "等待重新部署")
  );
  heading.append(copy, u3Element(document, "div", "u3-failure-stamp u3-stamp", "行动中断"));
  const stats = u3Element(document, "div", "u3-failure-stats");
  appendStats(document, stats, model.stats);
  terminal.append(meta, wave, heading, stats, restartElement);
  shell.append(rail, terminal);
  return shell;
}

export function createU3ResultView(scene, { type, onRestart, onFailure, model } = {}) {
  const resultModel = model ?? createU3ResultModel(scene, type);
  const overlay = createU3Overlay(scene, {
    kind: resultModel.type,
    width: 790,
    height: 452,
    className: `u3-result u3-${resultModel.type}`,
    styles: U3_MISSION_STYLES,
    onFailure
  });
  if (!overlay) return null;

  const actions = {};
  try {
    overlay.panel.className += " u3-mission-panel";
    actions.restart = createU3Button(overlay.document, {
      text: "返回行动准备",
      className: "u3-result-button",
      onActivate: onRestart
    });
    if (resultModel.type === "victory") {
      overlay.panel.append(createVictoryContent(overlay.document, resultModel, actions.restart.element));
    } else {
      overlay.panel.append(createFailureContent(overlay.document, resultModel, actions.restart.element));
    }
    return missionController(overlay, {
      kind: resultModel.type,
      tone: resultModel.tone,
      model: resultModel,
      actions
    });
  } catch (error) {
    for (const action of Object.values(actions)) action?.destroy?.();
    overlay.destroy();
    throw error;
  }
}
