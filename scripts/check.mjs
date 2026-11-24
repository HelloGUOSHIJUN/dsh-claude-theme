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
for (const [needle, label] of EXPECTED) {
  if (!css.includes(needle)) {
    console.error(`✗ ${label}: missing "${needle}"`)
    failures += 1
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
const total = EXPECTED.length + darkChecks.length + docChecks.length + RETIRED.length * 2 + CONTAINER_HOVER.length + 2
console.log(`✓ ${total} checks passed (${css.length} bytes): tokens, CDS durations, docs`)
