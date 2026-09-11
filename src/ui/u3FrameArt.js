// Original U3 vector metalwork. Sliced rails retain their thickness at every DPR.
// This is decoration only; it contains no UI text or interactive areas.
export function u3RimSource(tone = 'steel') {
  const palette = {
    steel: ['#89979a', '#536167', '#263238', '#acb8b5'],
    focus: ['#f1d793', '#ab8a49', '#524027', '#fff0ba'],
    selected: ['#a5dcbd', '#59876e', '#253e34', '#d4f1dc']
  }[tone];
  const [light, mid, dark, edge] = palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs><linearGradient id="rail" x2=".35" y2="1"><stop stop-color="${light}"/><stop offset=".16" stop-color="${mid}"/><stop offset=".6" stop-color="${dark}"/><stop offset="1" stop-color="${mid}"/></linearGradient></defs>
    <path d="M13 1H83L95 13V83L83 95H13L1 83V13Z" fill="#050b0e"/>
    <path d="M13 3H83L93 13V83L83 93H13L3 83V13Z" fill="url(#rail)" stroke="#202b30" stroke-width="1"/>
    <path d="M13 4H82L92 14M4 14L14 4M4 15V81M14 92H82L92 82" fill="none" stroke="${edge}" stroke-opacity=".75" stroke-width=".9"/>
    <path d="M15 8H81L88 15V81L81 88H15L8 81V15Z" fill="#111c20" stroke="#10191c" stroke-width="1.8"/>
    <path d="M16 11H80L85 16V80L80 85H16L11 80V16Z" fill="#0b1417" stroke="${light}" stroke-opacity=".45" stroke-width=".8"/>
    <path d="M8 18L11 15M15 6H20M75 5H80L85 10M91 75V80L87 84M16 90H22M6 74V78" fill="none" stroke="${edge}" stroke-opacity=".65" stroke-width=".7"/>
    <path d="M9 83L13 87M82 8L87 13M4 28H8M87 68H92" fill="none" stroke="#060c0f" stroke-width=".7"/>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
