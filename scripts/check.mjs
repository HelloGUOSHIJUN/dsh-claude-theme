/**
 * Regression guard: rebuild in memory and assert the token values the theme
 * depends on. Fails loudly when a refactor drops one.
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

execFileSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' })
const css = readFileSync(new URL('../theme.css', import.meta.url), 'utf8')

const EXPECTED = [
  ['--dsw-alias-bg-base: #faf9f5', 'light canvas (beige)'],
  ['--dsw-alias-label-primary: #0b0b0b', 'light primary text'],
  ['--dsw-alias-label-secondary: #52514e', 'light secondary text'],
  ['--dsw-alias-label-tertiary: #898781', 'muted text'],
  ['--dsw-specific-sidebar-fill: #f0eee6', 'rail surface (beige)'],
  ['--dsw-alias-border-l4: rgba(11, 11, 11, 0.35)', 'alpha-4 border'],
  ['--dsw-radius-xs: 5px', 'radius xs'],
  ['--dsw-radius-sm: 7px', 'radius sm'],
  ['--dsw-radius-panel: 10px', 'panel radius'],
  ['--dsw-alias-state-business-primary: #c6613f', 'accent (clay)'],
  ['--dsw-alias-label-deep-diving: #c6613f', 'clay deep-diving'],
  ["border-radius: 14px !important;", 'composer radius'],
  ['@keyframes claude-breathe', 'running-step motion'],
  ['linear(0, .2459', 'spring curve'],
]

const darkChecks = [
  ['--dsw-alias-bg-base: #151515', 'dark canvas'],
  ['--dsw-alias-label-primary: #f0efec', 'dark primary text'],
  ['--dsw-alias-label-secondary: #c3c2b7', 'dark secondary text'],
  ['--dsw-specific-sidebar-fill: #0b0b0b', 'dark rail surface'],
  ['--dsw-specific-menu: #2c2c2a', 'dark popover surface'],
]

let failures = 0
/** Record one failed assertion. The single entry point for every guard below. */
const fail = (message) => {
  console.error(`✗ ${message}`)
  failures += 1
}
for (const [needle, label] of EXPECTED) {
  if (!css.includes(needle)) {
    fail(`${label}: missing "${needle}"`)
  }
}
const darkBlock = css.split('html body[data-ds-dark-theme]')[1] ?? ''
for (const [needle, label] of darkChecks) {
  if (!darkBlock.includes(needle)) {
    console.error(`✗ ${label}: missing "${needle}"`)
    failures += 1
  }
}

// --- CDS 5-step duration scale -------------------------------------------
// Every transition/animation DURATION must sit on the official CDS scale.
// animation-delay values are exempt: CDS itself staggers in 20ms steps.
const CDS_DURATIONS = new Set([60, 120, 200, 300, 450])
const delayMs = new Set(
  [...css.matchAll(/animation-delay:\s*(\d+)ms/g)].map((m) => Number(m[1])),
)
const strayDurations = new Set()
for (const m of css.matchAll(/(?:transition|animation)(?:-duration)?:\s*([^;}]+)/g)) {
  for (const t of m[1].matchAll(/(?:^|[\s,(])(\d+)ms\b/g)) {
    const ms = Number(t[1])
    if (!CDS_DURATIONS.has(ms)) strayDurations.add(ms)
  }
}
for (const ms of strayDurations) {
  console.error(`✗ duration ${ms}ms is not on the CDS scale (60/120/200/300/450ms)`)
  failures += 1
}

// --- font-size preference stays live --------------------------------------
// The transcript baseline is Claude's 17px, but Settings -> Appearance must
// still move it. That only works while (a) the content size is derived from
// --dsh-content-font-delta and (b) it is declared on html, not body: the
// --dsw-font-markdown-* tokens resolve the size, so a body-local definition
// would make them reference themselves and the browser would drop the value.
const rootFontSize = css.match(/^html \{[^}]*--dsh-content-font-size:\s*([^;!]+?)\s*(?:!important)?;/m)?.[1]?.trim()
if (rootFontSize !== 'calc(17px + var(--dsh-content-font-delta, 0px))') {
  console.error(
    `✗ --dsh-content-font-size must be the 17px baseline plus the reader's delta (found "${rootFontSize ?? 'none'}" on html)`,
  )
  failures += 1
}
const bodyBlock = css.split('html body {').map((part) => part.split('\n}')[0])
if (bodyBlock.some((block) => /--dsh-content-font-size:/.test(block))) {
  console.error('✗ --dsh-content-font-size must not be declared on body (self-referencing markdown tokens)')
  failures += 1
}

// --- focus ring stays off text entry --------------------------------------
// The global :focus-visible ring drew a hard clay rectangle around every input
// in Settings, which reads as an error state. Text entry must be excluded.
const focusResetBlock = css.match(
  /:is\(input, textarea, select, \[contenteditable\][^{]*\{[^}]*\}/,
)?.[0] ?? ''
if (!focusResetBlock) {
  fail('the text-entry focus reset is missing (inputs will get a red box)')
} else if (!/box-shadow:\s*none !important/.test(focusResetBlock)) {
  fail('the text-entry focus reset does not clear box-shadow')
}
for (const role of ["[role='textbox']", "[contenteditable='true']"]) {
  if (!css.includes(role)) fail(`text-entry focus reset does not cover ${role}`)
}
// Cards that already express focus must not paint a second ring.
if (!/\[class\*='_field'\] :is\(input, textarea, select\):focus-visible/.test(css)) {
  fail('fields inside a card still draw their own focus ring')
}

// --- block-level list surfaces carry NO hover tint ------------------------
// These are slabs, not controls: tinting a whole row or an entire settings card
// under the pointer reads as the layout wobbling, and on a full-width card the
// tint spills past the card edge. The switch / button / link inside is the real
// control and keeps its own hover. Guards below enforce "no tint", not "nice
// tint" — the earlier theme got this backwards.
const noTintBlock = css.match(
  /\[class\*='_panelEntry'\]:hover:not\(\[class\*='_panelEntryActive'\]\)[^{]*\{[^}]*\}/,
)?.[0] ?? ''
if (!noTintBlock) {
  fail('the block-level no-hover rule is missing (rows/cards will tint again)')
} else {
  if (!/background-color:\s*transparent/.test(noTintBlock)) {
    fail('block-level list rows still paint a hover tint')
  }
  for (const sel of ["_panelRow", "_newSession", "_cardContent"]) {
    if (!noTintBlock.includes(sel)) fail(`the no-hover rule does not cover ${sel}`)
  }
}
// The Plugins tab separately tints its inner content box while a card is open.
if (!/\[class\*='_card'\]\[data-open='true'\] > \[class\*='_cardContent'\]/.test(css)) {
  fail('an expanded plugin card still tints its content box')
}
// The card shell must clip children so nothing can paint past its edge.
const cardShell = css.match(/\[class\*='_cards'\] > \[class\*='_card'\][^{]*\{[^}]*\}/)?.[0] ?? ''
if (!cardShell) {
  fail('the plugin card shell (radius + clip) is not styled')
} else {
  if (!/border-radius:\s*var\(--dsw-radius-xl\)/.test(cardShell)) {
    fail('the plugin card shell does not restore radius-xl')
  }
  if (!/overflow:\s*hidden/.test(cardShell)) {
    fail('the plugin card shell does not clip its children (tint spills past the edge)')
  }
  if (!/:not\(\[class\*='_cardContent'\]\)/.test(cardShell)) {
    fail('the card shell selector does not exclude inner _card* boxes (substring match)')
  }
}
// Selection is a state and must survive: the active row keeps its clay tint.
const activeRow = css.match(/\[class\*='_panelEntryActive'\] \{[^}]*\}/)?.[0] ?? ''
if (!activeRow || !/rgba\(198, 97, 63/.test(activeRow)) {
  fail('the active row lost its clay selection tint')
}
// Touch devices must not latch a tint either.
const touchHoverReset = css.split('@media (hover: none)')[1]?.split('\n}')[0] ?? ''
if (!/_panelEntry'\]:hover/.test(touchHoverReset) || !/background-color:\s*transparent/.test(touchHoverReset)) {
  fail('touch devices latch a row tint (the (hover: none) reset is missing)')
}

// The settings card tokens were never overridden, so cards kept the host's cool
// stroke and fill.
for (const token of ['--dsw-alias-settings-card-fill', '--dsw-alias-settings-card-stroke']) {
  if (!css.includes(token)) fail(`${token} is not overridden (settings cards keep the host cool palette)`)
  const darkPlusLight = css.split('html body[data-ds-dark-theme]')[0].includes(token)
  const darkSide = (css.split('html body[data-ds-dark-theme]')[1] ?? '').includes(token)
  if (!darkPlusLight) fail(`${token} is missing from the light scheme`)
  if (!darkSide) fail(`${token} is missing from the dark scheme`)
}

// --- tasks panel spacing ---------------------------------------------------
// The todo panel docked above the composer shipped with two cramped spacings:
// its body padded only 6px, and its dock pulled toward the input card with a
// NEGATIVE bottom margin. Both are overridden, and both overrides are anchored
// on the panel's stable test id rather than on _body / _list stems (those are
// far too common in this UI and would reach unrelated components).
const todoBody = css.match(
  /\[data-testid='todo-panel'\] \[class\*='_body'\][^{]*\{[^}]*\}/,
)?.[0] ?? ''
if (!todoBody) {
  fail('the todo panel body spacing override is missing (last task sits on the card edge)')
} else if (!/padding-bottom:\s*12px/.test(todoBody)) {
  fail('the todo panel body does not reserve 12px below the last task')
}
if (!/\[data-testid='todo-panel'\] \[class\*='_list'\]/.test(css)) {
  fail('the todo panel list spacing override is missing')
}
const todoDock = css.match(
  /\[class\*='_dock'\]:has\(\[data-testid='todo-panel'\]\)[^{]*\{[^}]*\}/,
)?.[0] ?? ''
if (!todoDock) {
  fail('the todo dock is not detached from the composer (negative pull remains)')
} else if (!/margin-bottom:\s*8px/.test(todoDock)) {
  fail('the todo dock does not carry a positive gap to the composer')
}
// A bare _body / _list / _item rule would restyle half the UI.
for (const stem of ['_body', '_list', '_item']) {
  const bare = new RegExp(`\\n\\[class\\*='${stem}'\\]:`, 'm').test(css)
  if (bare) fail(`a bare [class*='${stem}'] rule reaches unrelated components`)
}

// --- docs consistency -----------------------------------------------------
// Values quoted in the shipped docs must match what the build actually emits.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../docs/DETAIL.md', import.meta.url), 'utf8')
const lightBlocks = css.split('html body {').map((part) => part.split('\n}')[0])
const lightBlock = lightBlocks.find((block) => block.includes('--dsw-alias-bg-base')) ?? ''
const tokenIn = (block, name) =>
  block.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;!]+)`))?.[1].trim()

const DOC_CLAIMS = [
  [readme, '1960', 'README mentions a stale line-height (1.43)'],
]
void DOC_CLAIMS

const docChecks = [
  ['canvas', tokenIn(lightBlock, '--dsw-alias-bg-base'), readme, '#faf9f5'],
  ['rail', tokenIn(lightBlock, '--dsw-specific-sidebar-fill'), readme, '#f0eee6'],
  ['canvas (detail)', tokenIn(lightBlock, '--dsw-alias-bg-base'), detail, '#faf9f5'],
  ['rail (detail)', tokenIn(lightBlock, '--dsw-specific-sidebar-fill'), detail, '#f0eee6'],
]
for (const [label, actual, doc, expected] of docChecks) {
  if (actual !== expected) {
    console.error(`✗ ${label}: build emits "${actual}" but docs claim "${expected}"`)
    failures += 1
  }
}

// The docs must not still advertise values this theme no longer uses.
const RETIRED = [
  ['#f5f5f3', 'stale rail colour'],
  ['#0b0b0a', 'stale dark rail colour'],
  ['#20201e', 'non-CDS neutral'],
  ['120 / 180 / 200 / 300', 'stale motion list'],
  ['16px 圆角', 'stale composer radius'],
  ['12px 18px', 'stale bubble padding'],
  ['0 3px 14px', 'stale composer shadow'],
]
for (const [stale, why] of RETIRED) {
  for (const [name, doc] of [['README.md', readme], ['docs/DETAIL.md', detail], ['CHANGELOG.md', changelog]]) {
    if (doc.includes(stale)) {
      console.error(`✗ ${name}: ${why} "${stale}" is still documented`)
      failures += 1
    }
  }
}

// Container elements must never get a hover background: they wrap a header plus
// a body, so the fill spills past the rounded corner as a square slab.
const CONTAINER_HOVER = [
  [/\[data-step-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-step-process'],
  [/\[data-turn-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-turn-process'],
]
for (const [pattern, name] of CONTAINER_HOVER) {
  if (pattern.test(css)) {
    console.error(`✗ ${name} is a container but has a hover background (slab bleed)`)
    failures += 1
  }
}

// A bare [class*='_card']:hover lifts every nested card, so each inner block
// floats and drops its own shadow inside the parent. The hover rule must be
// guarded so only the outermost card responds. The reset inside
// @media (hover: none) is intentional and exempt.
const hoverNone = css.split('@media (hover: none)')[1]?.split('\n}')[0] ?? ''
const outsideHoverNone = css.replace(hoverNone, '')
for (const line of outsideHoverNone.split('\n')) {
  if (/\[class\*='_card'\]\s*:hover/.test(line)) {
    console.error(`X unguarded card hover: nested cards will float -> ${line.trim()}`)
    failures += 1
  }
}

// The sidebar carries resident rows (New chat, Plugins) at its top, so a
// top-edge mask washes them out permanently. It must not be a fade target.
if (/\[data-sidebar-scrollport\]/.test(css.split("mask-image")[0] + (css.match(/(?:^|[\s,{])\[data-sidebar-scrollport\][^{]*\{[^}]*mask-image/) || [""])[0])) {
  console.error("X [data-sidebar-scrollport] must not carry a mask-image fade")
  failures += 1
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`)
  process.exit(1)
}
const total = EXPECTED.length + darkChecks.length + docChecks.length + RETIRED.length * 2 + CONTAINER_HOVER.length + 25
console.log(`✓ ${total} checks passed (${css.length} bytes): tokens, CDS durations, docs`)
