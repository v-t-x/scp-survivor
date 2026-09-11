import { u3RimSource } from './u3FrameArt.js';
// U3-local equipment finishes. No selectors target the U1/U2 canvas or menus.
export const U3_MATERIAL_CSS = `
.scp-u3 { --u3-rim:${u3RimSource()}; --u3-rim-focus:${u3RimSource('focus')}; --u3-rim-selected:${u3RimSource('selected')}; --u3-text:#eef0e7; --u3-muted:#a6b6b6; --u3-green:#a5e8bb; --u3-gold:#efd187; --u3-red:#ef6e64; color:var(--u3-text); font-family:"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif; font-size:14px; line-height:1.4; text-align:left; }
.scp-u3, .scp-u3 * { box-sizing:border-box; }
.scp-u3 button { font:inherit; color:inherit; }
.scp-u3 .u3-stage { width:960px; height:540px; position:absolute; left:0; top:0; transform-origin:0 0; background:rgba(3,9,10,.65); }
.scp-u3 .u3-panel { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); padding:19px 23px; isolation:isolate; background-color:#354441; background-image:linear-gradient(120deg,#63716d55,transparent 18%,#0c181b50 55%,#62716d22),var(--u3-steel,none); background-size:auto,390px; border:2px solid #63716d; border-radius:2px; clip-path:polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px); box-shadow:inset 0 0 0 2px #111d1e,inset 0 0 0 4px #485953,inset 0 0 0 6px #293b37,inset 0 1px 0 7px #9eaca04d; }
.scp-u3 .u3-panel::before { content:""; position:absolute; z-index:-1; inset:14px; background-color:#111c1d; background-image:linear-gradient(145deg,#131e1fee,#0b1617e8),var(--u3-steel,none); background-size:auto,340px; border:1px solid #0a1112; clip-path:polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px); box-shadow:0 0 0 2px #6a7b73,inset 0 0 0 2px #344540,inset 0 0 14px #000b; }
.scp-u3 .u3-panel::after { content:""; position:absolute; bottom:23px; right:29px; width:35px; height:20px; z-index:-1; background:radial-gradient(circle,#020808 1px,#506059 1.5px,transparent 2px) 0 0 / 6px 6px; opacity:.7; pointer-events:none; }
.scp-u3.u3-frame-ready .u3-panel { background-image:linear-gradient(#16232b38,#13232c38),var(--u3-frame); background-size:100% 100%; border-color:transparent; clip-path:polygon(16px 0,calc(100% - 16px) 0,100% 16px,100% calc(100% - 16px),calc(100% - 16px) 100%,16px 100%,0 calc(100% - 16px),0 16px); box-shadow:none; }
.scp-u3.u3-frame-ready .u3-panel::before { background:none; border:0; box-shadow:none; }
.scp-u3.u3-frame-ready .u3-panel::after,.scp-u3.u3-frame-ready .u3-panel > .u3-screw { display:none; }
.scp-u3 .u3-screw { position:absolute; width:10px; height:10px; border-radius:50%; background:radial-gradient(circle at 35% 30%,#c6cab3,#738073 40%,#171f1b 70%); border:1px solid #0b1010; box-shadow:0 1px 0 #b7c0ac77,0 0 0 2px #273330; pointer-events:none; }
.scp-u3 .u3-screw::after { content:""; position:absolute; top:4px; left:1px; right:1px; height:1px; background:#070d0b; transform:rotate(-36deg); }
.scp-u3 .u3-header { height:76px; flex-shrink:0; display:flex; align-items:center; gap:15px; border:5px solid #48555a; border-image:var(--u3-rim) 14 stretch; padding:0 12px 0 0; background:linear-gradient(110deg,#263239b8,#0b1418e0 65%),var(--u3-steel); background-size:auto,440px; box-shadow:0 2px 4px #0008; }
.scp-u3 .u3-seal { position:relative; width:73px; height:62px; flex-shrink:0; color:#0e1818; background:linear-gradient(135deg,#b6c4c080,#8dabad30),var(--u3-steel); background-size:auto,145px; border:2px solid #1e2a29; clip-path:polygon(4px 0,calc(100% - 4px) 0,100% 4px,100% calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,0 calc(100% - 4px),0 4px); box-shadow:inset 0 0 0 1px #a2b0a0,inset 0 0 0 3px #4d655b,0 2px 3px #000; padding:4px 11px 9px; }
.scp-u3 .u3-seal::before { content:""; position:absolute; inset:4px; background:radial-gradient(circle at 2px 2px,#0b1515 1px,#b7c1ac 1.5px,#324841 2px,transparent 2.5px),radial-gradient(circle at calc(100% - 2px) 2px,#0b1515 1px,#b7c1ac 1.5px,#324841 2px,transparent 2.5px),radial-gradient(circle at 2px calc(100% - 2px),#0b1515 1px,#b7c1ac 1.5px,#324841 2px,transparent 2.5px),radial-gradient(circle at calc(100% - 2px) calc(100% - 2px),#0b1515 1px,#b7c1ac 1.5px,#324841 2px,transparent 2.5px); pointer-events:none; }
.scp-u3 .u3-seal::after { content:"SCP FOUNDATION"; position:absolute; bottom:3px; left:0; right:0; text-align:center; font:700 5.5px/1 Consolas,monospace; letter-spacing:.35px; }
.scp-u3 .u3-seal svg { width:100%; height:100%; display:block; }
.scp-u3 .u3-heading { flex:1; min-width:0; }
.scp-u3 .u3-eyebrow { font-family:Consolas,"Microsoft YaHei",monospace; color:var(--u3-muted); font-size:9px; letter-spacing:1px; }
.scp-u3 .u3-heading h2 { margin:0; font-size:29px; letter-spacing:3px; font-weight:800; line-height:1.27; text-shadow:0 2px 0 #000; }
.scp-u3 .u3-subtitle { font-size:14px; letter-spacing:.5px; margin-top:1px; }
.scp-u3 .u3-header-status { color:var(--u3-muted); font:10px/1.7 Consolas,"Microsoft YaHei",monospace; text-align:right; min-width:92px; }
.scp-u3 .u3-header-status::before { content:""; display:inline-block; width:6px; height:6px; margin-right:7px; border-radius:50%; background:var(--u3-green); box-shadow:0 0 8px #95ffba66; }
.scp-u3 .u3-header-status::after { content:""; display:block; margin:7px 0 0 auto; width:72px; height:9px; opacity:.3; background:repeating-linear-gradient(90deg,#a5b2a5 0 2px,transparent 2px 4px,#a5b2a5 4px 5px,transparent 5px 8px); }
.scp-u3 .u3-inset { position:relative; border:5px solid #45545a; border-image:var(--u3-rim) 14 stretch; background:linear-gradient(120deg,#233035ce,#0b1418e6 60%),var(--u3-steel); background-size:auto,360px; box-shadow:0 2px 4px #0008; }
.scp-u3 .u3-section-title { margin:0; font-weight:700; font-size:17px; letter-spacing:1px; padding:3px 9px; border-left:2px solid var(--u3-green); border-bottom:1px solid #75818566; background:linear-gradient(110deg,#38464dc9,#152126dd),var(--u3-steel); background-size:auto,360px; text-shadow:0 1px 1px #000; }
.scp-u3 .u3-muted { color:var(--u3-muted); }
.scp-u3 .u3-value { color:var(--u3-green); font-variant-numeric:tabular-nums; font-weight:700; }
.scp-u3 .u3-button { position:relative; display:flex; justify-content:center; align-items:center; gap:9px; min-height:43px; padding:6px 18px; border:5px solid #59676d; border-image:var(--u3-rim) 14 stretch; border-radius:2px; background-color:#263239; background-image:linear-gradient(115deg,#4454589c,#0c171dcc),var(--u3-steel,none); background-size:auto,370px; box-shadow:0 3px 5px #000b; color:var(--u3-text); font-weight:700; font-size:18px; letter-spacing:1px; text-shadow:0 1px 2px #000; cursor:pointer; transition:filter 90ms,transform 65ms; }
.scp-u3 .u3-button::before,.scp-u3 .u3-button::after { content:""; position:absolute; width:4px; height:4px; border:1px solid #afbcaa; border-radius:50%; top:6px; opacity:.6; }
.scp-u3 .u3-button::before { left:6px; } .scp-u3 .u3-button::after { right:6px; }
.scp-u3 .u3-button:hover:not(:disabled),.scp-u3 .u3-button:focus-visible,.scp-u3 .u3-button[data-state="hover"] { border-image-source:var(--u3-rim-focus); outline:none; color:#ffedbc; filter:brightness(1.08); }
.scp-u3 .u3-button:active:not(:disabled),.scp-u3 .u3-button[data-state="pressed"] { transform:translateY(1px); filter:brightness(.85); box-shadow:0 0 0 2px #080d0b,inset 0 2px 6px #000; }
.scp-u3 .u3-button[data-state="selected"] { border-image-source:var(--u3-rim-selected); box-shadow:0 0 13px #9efab94d; }
.scp-u3 .u3-button:disabled { cursor:default; color:#91a097; border-color:#4e6257; filter:saturate(.25); opacity:.55; }
.scp-u3 .u3-paper { color:#131b18; background-color:#e7e4d7; background-image:var(--u3-paper,none),radial-gradient(ellipse at 45% 35%,#f3f1e8cc,transparent 75%); background-size:100% 100%; border:1px solid #aca997; box-shadow:0 0 0 3px #0a1212,0 2px 0 4px #61716680,inset 0 0 26px #6b604533; }
.scp-u3 .u3-stamp { display:inline-block; border:3px double currentColor; padding:5px 13px; font-size:21px; letter-spacing:5px; font-weight:bold; transform:rotate(-12deg); opacity:.86; }
.scp-u3 .u3-illustration { width:100%; height:100%; display:block; color:#abd8c1; }
.scp-u3 .u3-header,.scp-u3 .u3-inset,.scp-u3 .u3-button { background-clip:padding-box; }
.scp-u3 .u3-scroll { overflow:auto; min-height:0; scrollbar-width:thin; scrollbar-color:#6c8875 #13201b; }
.scp-u3 ::-webkit-scrollbar { width:5px; height:5px; } .scp-u3 ::-webkit-scrollbar-thumb { background:#6c8875; } .scp-u3 ::-webkit-scrollbar-track { background:#13201b; }
@media (prefers-reduced-motion:reduce) { .scp-u3 * { transition:none !important; animation:none !important; } }
`;
