// Original code-native technical artwork for U3. Diagram lines carry no new weapon specification.
const SVG_NS = 'http://www.w3.org/2000/svg';
let nextDiagram = 0;
const ammunitionArt = new URL('./assets/u3-ammunition-v2.png', import.meta.url).href;
const vitalsArt = new URL('./assets/u3-vitals-v2.png', import.meta.url).href;
const containmentArt = new URL('./assets/u3-containment-v2.png', import.meta.url).href;
// Existing approved U1 artwork, reused only in the read-only technical display.
const rifleArt = '/assets/art/u1/weapon-rifle-hero.png';
const teslaArt = '/assets/art/u1/weapon-tesla-hero.png';

function cadenceMonitor(kind, timing) {
  const before = Number(timing?.beforeMs);
  const after = Number(timing?.afterMs);
  const ratio = before > 0 && after > 0 ? Math.min(1, after / before) : 1;
  // Both traces share the same time scale; near a cap the actual shorter gap is
  // smaller, and a capped card has identical traces. No invented attack bonus.
  const trace = (y, spacing, color, interval) => {
    const points = [];
    for (let x = 132; x < 229; x += spacing) {
      points.push(`H${x.toFixed(2)}V${y-12}h2.8V${y}`);
    }
    return `<path data-cadence-interval="${Number.isFinite(interval) ? interval : ''}" data-cadence-spacing="${spacing}" d="M128 ${y}${points.join(' ')}H234" fill="none" stroke="${color}" stroke-width="1.4" stroke-linejoin="round"/>`;
  };
  const electric = kind === 'teslaCadence';
  return `<g data-u3-cadence-fallback="" visibility="hidden" transform="translate(5 36) scale(.46)">${electric ? tesla() : rifle()}</g>
    <image data-u3-cadence-weapon="" href="${electric ? teslaArt : rifleArt}" x="0" y="14" width="116" height="87" preserveAspectRatio="xMidYMid meet" style="filter:grayscale(.8) brightness(1.4) contrast(1.04)"/>
    <path d="M115 10V110" stroke="#586e63"/>
    <path d="M12 91H103M12 88V94M103 88V94" fill="none" stroke="#83998a" stroke-width=".6" opacity=".6"/>
    <text x="57" y="108" font-size="10" text-anchor="middle" fill="#8aa497">${electric ? '电击节奏' : '射击节奏'}</text>
    <text x="129" y="23" font-size="12" fill="#bccbc3">当前</text>
    ${trace(49, 28, '#bac8c0', before)}
    <path d="M180 56V66M176 62L180 67L184 62" stroke="#8ba597" stroke-width="1.2" fill="none"/>
    <text x="129" y="83" font-size="12" fill="#b9f2c6">强化后</text>
    ${trace(106, 28 * Math.max(.2, ratio), '#aef0bf', after)}`;
}

function rifle() {
  return `<g fill="#69827b22" stroke="#aac5b8" stroke-width="1.1" stroke-linejoin="round">
    <path d="M18 57H51L62 45H113V51H156V58H211V64H158V69H104L97 77H66L51 70H18Z"/>
    <path d="M23 59H45V68H23ZM67 48H107V65H67ZM82 45V35H101V45M87 38H97M103 67L110 86H94L85 68M70 68L65 83H54L60 68M111 53H159M124 53V65M133 53V65M142 53V65M151 53V65M190 55V68M206 56V66M213 59H229V63H213"/>
    <path d="M51 48H57V72M110 42H116V49M91 50V64M97 50V64M73 57H83" stroke="#dfefde"/>
    <path d="M18 28H216M18 24V33M216 24V33M8 43V88M4 43H12M4 88H12" opacity=".35"/>
    <path d="M22 95H228M36 91V99M212 91V99" opacity=".25" stroke-dasharray="2 3"/>
    <circle cx="72" cy="58" r="2"/><circle cx="104" cy="58" r="2"/>
  </g>`;
}

function tesla() {
  return `<g stroke="#a6d2c9" stroke-width="1.1" stroke-linejoin="round" fill="#729e9930">
    <path d="M20 62L39 49H88V42H119V49H159L171 57H192V68H159L148 76H78L60 69H20ZM82 76L91 94H108L101 75M23 52H45V71H23M69 51H76V71M100 46V74M112 46V74"/>
    <path d="M129 46V78M135 43V81M141 43V81M147 46V78M177 47V77M183 43V81M190 48V76"/>
    <path d="M189 60L202 52L198 62L211 57L207 67L224 58M190 65L202 72L212 69L225 74" fill="none" stroke="#b8faf2" stroke-width="1.7"/>
    <path d="M32 28H198M32 25V32M198 25V32M34 103H209" opacity=".3"/>
    <circle cx="92" cy="61" r="5" fill="#86ded254"/><circle cx="92" cy="61" r="2" fill="#b1f5db"/>
  </g>`;
}

function bullet(x, cut = false) {
  return `<g transform="translate(${x} 0)"><path d="M0 93V49L5 35L10 17L15 35L20 49V93Z" fill="url(#metal)" stroke="#dfcc8e" stroke-width="1.1"/>
    <path d="M0 57H20M0 53H20M0 85H20M0 89H20" stroke="#61583c"/>
    ${cut ? '<path d="M5 80V49L10 29L15 49V80Z" fill="#18221c" stroke="#f1d991"/><path d="M6 59L14 63L6 67L14 71L6 75L14 79M8 56L13 54M9 51L12 49" stroke="#bd9c53"/>' : '<path d="M5 45V81M14 38V48" stroke="#f8e4a766"/>'}</g>`;
}

function human() {
  return `<g stroke="#a6c6b2" fill="none" stroke-width=".85" opacity=".8">
    <path d="M93 17L100 13H110L117 17L121 29L117 40L112 45V51L134 58L144 77L149 110H135L128 82L124 107H87L84 83L77 110H63L70 77L81 58L99 51V44L92 37L89 26Z"/>
    <path d="M98 19H113M94 25H118M94 32H118M97 38H114M100 44H111M104 15V52M88 58L101 66L110 66L126 58M83 65L98 75L112 75L132 65M83 73L98 83L113 83L133 73M87 84L100 91L115 90L127 82M88 94L101 100L117 98L124 91M99 54V107M110 53V106M78 70L85 73M75 79L82 82M72 90L79 93M70 101L76 104M135 72L140 70M137 81L143 79M140 92L146 90M142 101L148 100"/>
    <path d="M111 64C112 56 122 56 121 65C120 70 114 75 111 79C108 75 102 70 101 65C100 57 109 56 111 64Z" fill="#a8e8b9" stroke="none"/>
  </g><path d="M141 79H151L155 74L160 88L166 57L172 92L178 77H187L191 69L196 81H226" fill="none" stroke="#a5efb8" stroke-width="1.6"/>
  <path d="M201 24H212M207 18V30" stroke="#b6f1c6" stroke-width="5"/><path d="M24 89H50M24 96H44M24 102H39" stroke="#96d5ae" stroke-width="2"/>`;
}

function field() {
  return `<g stroke="#9ad9c0" fill="none" stroke-width="1.1"><ellipse cx="121" cy="60" rx="98" ry="37" opacity=".3"/><ellipse cx="121" cy="60" rx="72" ry="43" opacity=".55"/><ellipse cx="121" cy="60" rx="43" ry="48" opacity=".4"/>
  <ellipse cx="121" cy="60" rx="17" ry="47" opacity=".5"/><circle cx="121" cy="60" r="24" stroke-dasharray="2 3"/><circle cx="121" cy="60" r="10" stroke-width="2"/>
  <path d="M118 40L111 60H123L118 80L133 55H121L126 40" fill="#a2e6ce66"/><path d="M17 60H74M168 60H229" stroke-dasharray="2 4"/></g>`;
}

function boomerang() {
  return `<g fill="none" stroke="#a4d8bb" stroke-width="1.5"><path d="M65 45C97 9 199 24 198 61C197 106 88 100 60 77" stroke-dasharray="5 4"/><path d="M59 77L72 77L65 88M198 58L190 48M198 58L207 49"/>
  <path d="M28 52H62L85 61L62 70H28Z" fill="#a0bba733"/><path d="M36 52V70M44 52V70M62 52V70"/><path d="M51 34L45 38M29 33L23 37M17 62H7" opacity=".45"/></g>`;
}

function containment() {
  return `<g fill="none" stroke="#b1c5ae" stroke-width=".9"><path d="M66 13H174V107H66ZM74 20H166V99H74ZM83 29H157V91H83ZM70 6V16M169 6V16M58 23H69M171 23H184M57 98H69M171 98H184"/>
  <path d="M108 30H131L141 44V88H99V44ZM111 36H130L135 46V83H105V46ZM67 53H51V74H66M174 53H189V74H174M46 57H55V69H46M185 57H194V69H185"/>
  <path d="M79 14V106M161 14V106M67 25H174M66 95H174M99 50H140M99 80H140M118 37V82M124 37V82" opacity=".5"/>
  ${[21,99].map(y => [70,169].map(x=>`<circle cx="${x}" cy="${y}" r="2"/>`).join('')).join('')}
  <path d="M32 107H208M33 9V108M207 9V108" opacity=".4" stroke-dasharray="2 3"/>
  ${[43,48,53,58,63,68,73,78,83,88].map(y=>`<path d="M91 ${y}H98M141 ${y}H149M45 ${y}H54M185 ${y}H195" stroke-width=".5"/>`).join('')}
  <path d="M111 36L107 42V83L113 90H128L135 82V44L128 36ZM103 42L100 48V84L106 91M139 41L144 47V84L137 92M115 32V88M128 33V88M87 16L81 10H62V26M156 15L162 10H180V28M64 108H79L88 102M154 101L161 109H179M66 20L79 29M165 21L154 30M68 100L82 91M166 101L154 91" stroke-width=".5"/>
  <path d="M72 4V117M167 4V117M36 29H204M36 92H204" opacity=".35" stroke-dasharray="1 3"/>
  ${[21,99].map(y=>[70,169].map(x=>`<circle cx="${x}" cy="${y}" r="3.8" stroke-width=".5"/>`).join('')).join('')}
  <path d="M120 0V12M116 5L120 0L124 5M120 109V120M116 115L120 120L124 115" stroke-width=".6"/></g>`;
}

function contents(kind, options) {
  switch (kind) {
    case 'damage': return `${bullet(65)}${bullet(108,true)}${bullet(160,true)}<path d="M167 38H195M174 59H211M174 82H198" stroke="#c9b780" opacity=".65"/>`;
    case 'health': case 'heal': return human();
    case 'cadence': case 'teslaCadence': return cadenceMonitor(kind, options?.cadence);
    case 'teslaDamage': return `<image href="${teslaArt}" x="55" y="-23" width="177" height="126" preserveAspectRatio="xMidYMid meet"/><g fill="none" stroke="#a6edce" stroke-width="1.2"><circle cx="32" cy="47" r="21" stroke-dasharray="3 2"/><circle cx="32" cy="47" r="9"/><path d="M55 41L47 30L44 43L35 33L32 46L22 38L15 54M59 49L46 56L43 49L32 62M18 92H71L77 84L84 105L91 77L98 99L105 92H138L143 86L149 99L155 84L161 94H225"/><path d="M13 108H226M122 19H207M122 15V23M207 15V23" opacity=".35"/></g><text x="14" y="20" font-size="9">电弧输出</text>`;
    case 'rifle': return rifle();
    case 'tesla': return tesla();
    case 'field': return field();
    case 'boomerang': return boomerang();
    case 'containment': return containment();
    case 'interruption': return `<path d="M5 42V57H17L19 49L21 61L24 35L27 65L30 56H48L51 48L54 63L57 52H72L75 54L79 64L84 47L88 60H107L111 57H132L136 63H156L161 64H198V82H235" fill="none" stroke="#fc746d" stroke-width="1.8"/><path d="M4 60H68M80 57H111M91 64H164M112 54H151M126 68H175M161 62H194M169 72H198M199 83H237" stroke="#df514b" opacity=".8" stroke-width="1.6" stroke-dasharray="2 3 5 1"/>${Array.from({length:42},(_,i)=>{const x=66+i*3.1,y=58+(i%7-3)*3;return `<rect x="${x}" y="${y}" width="${2+i%4}" height="${i%3===0?4:2.5}" fill="#ff625b" opacity="${.55+i%4*.14}"/>`;}).join('')}`;
    case 'chains': return `<g stroke="#9be1d8" fill="#46716855">${[[40,60],[111,32],[120,92],[197,49]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="13"/><circle cx="${x}" cy="${y}" r="4" fill="#b8f1dc"/>`).join('')}<path d="M54 57L75 37L74 47L96 34M57 65L74 78L86 73L108 87M126 34L150 46L148 40L183 48M133 87L157 76L155 67L184 53" fill="none" stroke-width="2"/></g>`;
    case 'movement': return `<g fill="none" stroke="#b0e4bd" stroke-width="5" stroke-linecap="round"><circle cx="136" cy="22" r="8" fill="#acd7b5" stroke="none"/><path d="M123 41L144 50L158 37M126 40L111 61L133 71L146 101M129 64L109 92L83 98M116 41L99 47L91 65"/></g><path d="M38 38H91M27 59H72M32 79H81" stroke="#8aa999" stroke-width="2"/>`;
    case 'projectiles': return `${bullet(51)}${bullet(109)}${bullet(167)}<path d="M25 99H207" stroke="#d0c49166"/>`;
    case 'penetration': return `<g stroke="#abddbb" fill="none"><path d="M23 60H214" stroke-width="2"/><path d="M197 54L215 60L197 66"/><path d="M33 53H65L81 60L65 67H33Z" fill="#c1bd8355"/>${[106,145,184].map(x=>`<path d="M${x} 26V46M${x} 74V98" stroke-width="6" opacity=".65"/><circle cx="${x}" cy="60" r="12" stroke-dasharray="2 3"/>`).join('')}</g>`;
    case 'pickup': return `<g fill="none" stroke="#aed4b9"><circle cx="120" cy="60" r="18"/><circle cx="120" cy="60" r="38" stroke-dasharray="3 4"/><ellipse cx="120" cy="60" rx="88" ry="48" opacity=".4"/><path d="M62 60H85M155 60H179M79 55L85 60L79 65M161 55L155 60L161 65"/>${[[37,34],[182,87],[209,43]].map(([x,y])=>`<path d="M${x} ${y-6}l5 6l-5 6l-5 -6Z" fill="#a0dbb5"/>`).join('')}</g>`;
    default: return field();
  }
}

// Compact glyphs have their own framing so small status cells do not shrink a
// complete technical monitor into an unreadable miniature.
export function createU3Glyph(document, kind) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('class', 'u3-illustration u3-glyph');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  let art;
  if (kind === 'health' || kind === 'heal') art = '<path d="M20 34C16 29 5 22 5 13C5 4 17 4 20 12C23 4 35 4 35 13C35 22 24 29 20 34Z" fill="currentColor"/>';
  else if (kind === 'movement') art = '<circle cx="25" cy="7" r="4" fill="currentColor"/><path d="M20 14L15 23L23 26L28 36M19 15L27 20L33 15M19 15L11 17L7 24M19 24L13 34L5 36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
  else if (kind === 'pickup') art = '<path d="M7 8H14V24C14 33 26 33 26 24V8H33V24C33 42 7 42 7 24Z" fill="currentColor"/><path d="M7 16H14M26 16H33" stroke="#162a21" stroke-width="2"/><path d="M10 2V5M20 1V6M30 2V5" stroke="currentColor" stroke-width="2"/>';
  else if (kind === 'cadence') art = '<path d="M8 12A15 15 0 1 1 7 29" fill="none" stroke="currentColor" stroke-width="3"/><path d="M2 8L12 10L6 18Z" fill="currentColor"/><path d="M20 10V21L15 25" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="21" r="2" fill="currentColor"/>';
  else if (['damage','projectiles','penetration'].includes(kind)) art = [7,17,27].map((x,i)=>`<path d="M${x} 33V15L${x+3} ${6+i*2}L${x+6} 15V33Z" fill="#c2ad71" stroke="#f5e4a7" stroke-width=".6"/><path d="M${x} 18H${x+6}M${x} 30H${x+6}" stroke="#4e553d"/><path d="M${x+2} 16V29" stroke="#fff1b966"/>`).join('');
  else if (kind === 'chains') art = '<path d="M8 20L19 8L31 21L19 32Z" fill="none" stroke="currentColor" stroke-width="1.5"/>' + [[8,20],[19,8],[31,21],[19,32]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#142d24" stroke="currentColor" stroke-width="2"/>`).join('');
  else art = '<circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-width="1.5"/><ellipse cx="20" cy="20" rx="7" ry="16" fill="none" stroke="currentColor" stroke-width="1"/><path d="M19 9L13 22H21L18 32L28 17H21L24 9Z" fill="currentColor"/>';
  svg.innerHTML = `<g style="color:#b2d7bc">${art}</g>`;
  return svg;
}

export function createU3Illustration(document, kind, options = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const id = `u3-diagram-${++nextDiagram}`;
  const wide = kind === 'rifle' || kind === 'tesla';
  const width = wide ? 320 : 240;
  svg.setAttribute('viewBox', kind === 'containment' ? '42 -3 156 126' : `0 0 ${width} 120`);
  svg.setAttribute('class', 'u3-illustration');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  let art = contents(kind, options).replaceAll('url(#metal)', `url(#${id}-metal)`);
  if (wide) art = `<g opacity=".22" transform="translate(35 0)">${art}</g><image href="${kind==='rifle'?rifleArt:teslaArt}" x="${kind==='rifle'?43.64:59.34}" y="${kind==='rifle'?-26.82:-15}" width="${kind==='rifle'?232.73:202.11}" height="${kind==='rifle'?174.55:151.58}" preserveAspectRatio="xMidYMid meet"/><path d="M16 15H301M16 10V20M301 10V20M16 107H301M26 104V111M287 104V111" stroke="#8ca699" opacity=".6" stroke-width=".7"/><path d="M160 5V114" stroke="#9aab9d" stroke-dasharray="1 5" opacity=".25"/>`;
  if (kind === 'damage' || kind === 'health' || kind === 'heal') art += `<image href="${kind==='damage'?ammunitionArt:vitalsArt}" x="0" y="0" width="240" height="120" preserveAspectRatio="xMidYMid meet"/>`;
  if (kind === 'containment') art += `<image href="${containmentArt}" x="42" y="-3" width="156" height="126" preserveAspectRatio="none"/>`;
  // All markup is local original artwork; game strings and numeric values are rendered separately via textContent.
  svg.innerHTML = `<defs><pattern id="${id}-grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#537665" stroke-width=".4" opacity=".35"/></pattern><linearGradient id="${id}-metal"><stop stop-color="#726640"/><stop offset=".37" stop-color="#e0d398"/><stop offset=".65" stop-color="#9e8c52"/><stop offset="1" stop-color="#54482b"/></linearGradient></defs><rect width="${width}" height="120" fill="#0b1416"/><rect width="${width}" height="120" fill="url(#${id}-grid)"/><g font-family="Microsoft YaHei,sans-serif" font-size="9" fill="#a8bfb2">${art}</g><path d="M4 16V4H17M${width-17} 4H${width-4}V16M${width-4} 104V116H${width-17}M17 116H4V104" stroke="#8ca597" opacity=".7" fill="none"/>`;
  // A failed SVG <image> can paint a large browser broken-image icon. Remove only
  // that decoration so the complete code-native drawing underneath remains visible.
  for (const picture of svg.querySelectorAll?.('image') ?? []) {
    picture.addEventListener('error', () => {
      if (picture.hasAttribute('data-u3-cadence-weapon')) svg.querySelector('[data-u3-cadence-fallback]')?.removeAttribute('visibility');
      picture.remove();
    }, { once:true });
  }
  return svg;
}
