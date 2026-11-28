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
  ['--dsw-alias-label-caption: #898781', 'dark muted matches the light ramp'],
  ['--dsw-alias-markdown-code-block: #0b0b0b', 'dark code surface on the grey ramp'],
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
/**
 * Register one guard and run it. Guards nest into semantic units (one per
 * panel, one per sweep, one per token), which is what the docs count; a sweep
 * that checks twelve markers is one guard, not twelve. Call `entry()` BEFORE
 * the work the guard needs, so `total` stays exact even when an assertion
 * throws.
 */
let total = 0
/** Count one guard now, so a throwing assertion cannot under-report. */
const entry = () => {
  total += 1
}
const guard = (fn) => {
  entry()
  return fn()
}
guard(() => {
  for (const [needle, label] of EXPECTED) {
    if (!css.includes(needle)) fail(`${label}: missing "${needle}"`)
  }
})
const darkBlock = css.split('html body[data-ds-dark-theme]')[1] ?? ''
guard(() => {
  for (const [needle, label] of darkChecks) {
    if (!darkBlock.includes(needle)) fail(`${label}: missing "${needle}"`)
  }
})

// --- CDS 5-step duration scale -------------------------------------------
// Every transition/animation DURATION must sit on the official CDS scale.
// animation-delay values are exempt: CDS itself staggers in 20ms steps.
const CDS_DURATIONS = new Set([60, 120, 200, 300, 450])
const delayMs = new Set(
  [...css.matchAll(/animation-delay:\s*(\d+)ms/g)].map((m) => Number(m[1])),
)
const strayDurations = new Set()
guard(() => {
  for (const m of css.matchAll(/(?:transition|animation)(?:-duration)?:\s*([^;}]+)/g)) {
    for (const t of m[1].matchAll(/(?:^|[\s,(])(\d+)ms\b/g)) {
      const ms = Number(t[1])
      if (!CDS_DURATIONS.has(ms)) strayDurations.add(ms)
    }
  }
  for (const ms of strayDurations) {
    fail(`duration ${ms}ms is not on the CDS scale (60/120/200/300/450ms)`)
  }
})

// --- font-size preference stays live --------------------------------------
// The transcript baseline is Claude's 17px, but Settings -> Appearance must
// still move it. That only works while (a) the content size is derived from
// --dsh-content-font-delta and (b) it is declared on html, not body: the
// --dsw-font-markdown-* tokens resolve the size, so a body-local definition
// would make them reference themselves and the browser would drop the value.
const rootFontSize = css.match(/^html \{[^}]*--dsh-content-font-size:\s*([^;!]+?)\s*(?:!important)?;/m)?.[1]?.trim()
guard(() => {
  if (rootFontSize !== 'calc(17px + var(--dsh-content-font-delta, 0px))') {
    fail(`--dsh-content-font-size must be the 17px baseline plus the reader's delta (found "${rootFontSize ?? 'none'}" on html)`)
  }
})
const bodyBlock = css.split('html body {').map((part) => part.split('\n}')[0])
guard(() => {
  if (bodyBlock.some((block) => /--dsh-content-font-size:/.test(block))) {
    fail('--dsh-content-font-size must not be declared on body (self-referencing markdown tokens)')
  }
})

// --- body leading follows the reader's size -------------------------------
// The transcript baseline is 17px. The host's fixed 21px leading put that at
// 1.24, which reads cramped for CJK prose, and the ratio drifted to 1.21 when
// the reader picked 19px. The leading must come from the size variable, not
// from a px offset that only pretends to scale. Any multiplier at or above
// 1.45 is fine; the guard rejects a fixed px value and a ratio that is too
// tight, so the number stays tunable without reopening the bug.
const rootLeading = css.match(
  /^html \{[^}]*--dsh-content-line-height:\s*calc\(var\(--dsh-content-font-size\)\s*\*\s*([0-9.]+)\)/m,
)?.[1]
guard(() => {
  const ratio = Number(rootLeading)
  if (!rootLeading || Number.isNaN(ratio)) {
    fail('--dsh-content-line-height must be calc(var(--dsh-content-font-size) * <ratio>) on html')
  } else if (ratio < 1.45) {
    fail(`--dsh-content-line-height ratio is ${ratio}; CJK prose needs at least 1.45`)
  }
  for (const token of ['base', 'base-strong', 'base-italic']) {
    const value = css.match(new RegExp(`--dsw-font-markdown-${token}:\\s*([^;]+);`))?.[1] ?? ''
    if (!value.includes('var(--dsh-content-line-height)')) {
      fail(`--dsw-font-markdown-${token} must read --dsh-content-line-height, not a fixed px leading`)
    }
  }
})

// --- skeleton: two clocks, one cascade ------------------------------------
// CDS 3.0 keeps breathe (2s ease-in-out) and the 105° sweep band (2s linear)
// as separate mechanisms; merging them into one animation is the misread v4
// §3.3.4 calls out. Wave mode steps each block 90ms behind the previous one.
// The host nests skeletonRow / skeletonBars / skeletonCard wrappers, so the
// animation must stay on leaf blocks or the opacity dip doubles.
const skeletonBlock = css.split('/* 6 · Skeleton: CDS 3.0')[1]?.split('@keyframes claude-skeleton-sweep')[0] ?? ''
guard(() => {
  if (!skeletonBlock) {
    fail('the skeleton block is missing')
    return
  }
  if (!skeletonBlock.includes('animation: claude-skeleton-breathe 2s ease-in-out infinite;')) {
    fail('skeleton breathe must be 2s ease-in-out')
  }
  if (!skeletonBlock.includes('animation: claude-skeleton-sweep 2s linear infinite;')) {
    fail('skeleton sweep must be its own 2s linear animation')
  }
  if (!skeletonBlock.includes('::after')) {
    fail('skeleton sweep must be a separate ::after band')
  }
  if (!skeletonBlock.includes('linear-gradient(105deg, transparent 35%, var(--claude-skeleton-sheen) 50%, transparent 65%)')) {
    fail('skeleton sweep must use the CDS 105deg gradient')
  }
  if (!skeletonBlock.includes('animation-delay: 90ms')) {
    fail('skeleton wave cascade lost its 90ms step')
  }
  if (!/\[class\*='_skeleton'\]:not\(:has\(\[class\*='_skeleton'\]\)\)/.test(skeletonBlock)) {
    fail('skeleton motion must target leaf blocks only (wrappers would double the dip)')
  }
  if (!/@keyframes claude-skeleton-breathe/.test(css) || !/50%\s*\{\s*opacity:\s*0\.6/.test(css.split('@keyframes claude-skeleton-breathe')[1]?.split('@keyframes claude-skeleton-sweep')[0] ?? '')) {
    fail('skeleton breathe keyframes must dip to 0.6 at 50%')
  }
  if (css.includes('claude-sheen')) {
    fail('the old claude-sheen animation still exists')
  }
})


// --- scroll fade follows the scroll position ------------------------------
// CDS 3.0 animates two @property lengths from the container's own scroll
// timeline: 28px while there is content past that edge, 0 at the edge. A
// constant mask clips the first/last line of a three-line output, which is the
// bug this guard exists to prevent.
const fadeBlock = css.split('/* 3 · Scroll fade')[1]?.split('/* 4 · Cards answer')[0] ?? ''
guard(() => {
  if (!fadeBlock) {
    fail('the scroll fade block is missing')
    return
  }
  for (const name of ['top', 'bottom']) {
    const prop = css.match(new RegExp(`@property --claude-scroll-fade-${name}\\s*\\{[^}]*\\}`))?.[0] ?? ''
    if (!prop.includes("syntax: '<length>'") || !prop.includes('initial-value: 0px')) {
      fail(`--claude-scroll-fade-${name} must be a registered <length> starting at 0`)
    }
  }
  if (!fadeBlock.includes('animation-timeline: scroll(self), scroll(self);')) {
    fail('scroll fade is not driven by the container scroll timeline')
  }
  if (!fadeBlock.includes('animation-range: 0 28px, calc(100% - 28px) 100%;')) {
    fail('scroll fade ranges must pin 28px at each edge')
  }
  for (const name of ['top', 'bottom']) {
    if (!fadeBlock.includes(`var(--claude-scroll-fade-${name})`)) {
      fail(`the mask no longer reads --claude-scroll-fade-${name}`)
    }
  }
  if (fadeBlock.includes('--claude-fade: 28px')) {
    fail('the old constant fade mask is back')
  }
})

// --- segmented control: 1px inset, hairline thumb -------------------------
// CDS puts the thumb 1px inside the track and gives it a 0.5px inset ring plus
// two diffusion shadows; a flat 2px inset with a single shadow reads heavier.
const tabTrack = css.split('[data-conversation-tabs] {')[1]?.split('\n}')[0] ?? ''
const tabSelected = css.split("[data-conversation-tabs] > [role='tab'][aria-selected='true'] {")[1]?.split('\n}')[0] ?? ''
const tabDark = css.split("body[data-ds-dark-theme] [data-conversation-tabs] > [role='tab'][aria-selected='true'] {")[1]?.split('\n}')[0] ?? ''
guard(() => {
  if (!/padding:\s*1px !important/.test(tabTrack)) {
    fail('segmented track must use the CDS 1px inset')
  }
  if (!tabSelected.includes('inset 0 0 0 var(--claude-ring)')) {
    fail('segmented thumb lost its hairline ring')
  }
  if (!tabSelected.includes('0 2px 6px -1px')) {
    fail('segmented thumb lost its second diffusion shadow')
  }
  if (!tabDark.includes('inset 0 0 0 var(--claude-ring)') || !tabDark.includes('0 2px 6px -1px')) {
    fail('segmented thumb lost the dark hairline ring or second shadow')
  }
})

// --- retina hairline -------------------------------------------------------
// CDS ring width is 1px at 1x, 0.5px at 2dppx, 1/3px at 3dppx. Key boxes
// (code blocks, file cards, attachment cards, wide tables, composer, segmented
// thumb) must read the token, so a 1px border never survives on Retina.
guard(() => {
  if (!/html \{\s*--claude-ring: 1px;/.test(css)) {
    fail('--claude-ring must start at 1px on the root')
  }
  if (!/@media[^{]*2dppx[^{]*\{[^}]*--claude-ring: 0\.5px/.test(css)) {
    fail('--claude-ring must drop to 0.5px at 2dppx')
  }
  if (!/3dppx[^{]*\{[^}]*--claude-ring: calc\(1px \/ 3\)/.test(css)) {
    fail('--claude-ring must drop to 1/3px at 3dppx')
  }
  if (!css.includes('inset 0 0 0 var(--claude-ring) var(--dsw-alias-border-l2)')) {
    fail('composer / thumbnail rings do not read --claude-ring')
  }
  if (!/::after \{[^}]*box-shadow: inset 0 0 0 var\(--claude-ring\)/.test(css)) {
    fail('the code/card/table frame lost its overlay hairline')
  }
})

// --- dark typography compensation ----------------------------------------
// White on black irradiates; CDS drops 30-40 wght ticks in dark mode. The
// serif stack has no axis, so the 500 baseline steps to 400. Code must never
// inherit the 0.12px text stroke (it blurs 12px glyphs).
guard(() => {
  if (!/body\[data-ds-dark-theme\] \{\s*font-weight: 400;/.test(css)) {
    fail('dark body weight must drop to 400')
  }
  if (!/pre, code, kbd, samp \{\s*-webkit-text-stroke: 0 !important;/.test(css)) {
    fail('code still inherits the text stroke')
  }
})

// --- one press for every control -----------------------------------------
// CDS squish is 0.975 with the 15-stop spring on release and 60ms ease-out
// while held. The old 0.94 / 0.96 / 0.985 one-offs must not come back.
guard(() => {
  if (!css.includes('--claude-press: 0.975;')) {
    fail('--claude-press must be 0.975')
  }
  if (!css.includes('transform: scale(var(--claude-press));')) {
    fail('controls do not read --claude-press')
  }
  for (const stale of ['scale(0.94)', 'scale(0.96)', 'scale(0.985)']) {
    if (css.includes(stale)) fail(`stale press scale ${stale}`)
  }
  if (!css.includes('transition: transform 60ms ease-out;')) {
    fail('pressed controls must transition in 60ms ease-out')
  }
})

// --- segmented control collapses by container width ----------------------
// CDS switches at 254px (three items) and 180px (two items). DSH tabs have no
// icon to fall back to, so the theme tightens padding instead of hiding text,
// but the container-driven switch must still exist.
guard(() => {
  if (!css.includes('container-type: inline-size;')) {
    fail('the tab row is not a size container')
  }
  for (const width of ['@container (width <= 254px)', '@container (width <= 180px)']) {
    if (!css.includes(width)) fail(`missing ${width}`)
  }
})

// --- menu entrance never changes scroll height ----------------------------
// A translated menu row extends the popup's scrollable overflow for the
// length of the entrance, so a menu whose content fits flashes a scrollbar
// and then widens when it disappears. Even a fade makes the top rows read as
// a flash, so menus have no entrance animation at all; text appears in place.
guard(() => {
  if (!/\[data-menu-phase='enter'\] > \*\s*\{\s*animation: none !important;/.test(css)) {
    fail('menu enter animation is back (the text flashes)')
  }
  if (css.includes('claude-fade-in')) {
    fail('menu rows must not fade in; they open with their text in place')
  }
  if (/\[role='(?:menuitem|menuitemradio|menuitemcheckbox|option)'\][^{}]*\{[^}]*claude-rise/.test(css)) {
    fail('menu rows still rise (the popup scrollbar flashes)')
  }
  if (!css.includes('animation: claude-rise 120ms cubic-bezier(0.22, 1, 0.36, 1) both;')) {
    fail('panel/hero rows lost the rise entrance')
  }
})

// --- model chip matches the permission chip ------------------------------
// The two triggers are siblings in the composer tool row; the host ships
// 400 for the model label and 500 for the permission label. They must read
// as one control family.
guard(() => {
  if (!/\[data-composer-card\] button\[class\*='_trigger'\] \{\s*font-weight: 500;/.test(css)) {
    fail('the model trigger no longer matches the permission trigger weight')
  }
})

// The global :focus-visible ring drew a hard clay rectangle around every input
// in Settings, which reads as an error state. Text entry must be excluded.
const focusResetBlock = css.match(
  /:is\(input, textarea, select, \[contenteditable\][^{]*\{[^}]*\}/,
)?.[0] ?? ''
guard(() => {
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
})

// --- import trigger matches the New session fill -------------------------
// The DeepSeek-import trigger sits as the square twin of New session. It
// always paints the elevated fill, while New session switches to the macOS
// sidebar glass tokens; on darwin the two would read as different materials.
guard(() => {
  if (!/html\[data-platform='darwin'\] body \[class\*='_newSessionRow'\] button\[class\*='_wide'\] \{\s*background: var\(--dsw-specific-sidebar-glass-fill\) !important;/.test(css)) {
    fail('the import trigger no longer matches the New session glass fill')
  }
  if (!/html\[data-platform='darwin'\] body \[class\*='_newSessionRow'\] button\[class\*='_wide'\]:hover,\s*\nhtml:not\(\[data-platform='darwin'\]\) body \[class\*='_newSessionRow'\] button\[class\*='_wide'\]:hover \{\s*background: transparent !important;/.test(css)) {
    fail('the import trigger keeps a hover tint while New session has none')
  }
})

// --- menu rows keep the host's hover fill, not a clay ring ----------------
// DSH moves real focus onto the row under the pointer (the model picker calls
// item.focus() from onMouseMove, and Chromium reports that row as
// :focus-visible). The global ring then follows the cursor as a clay frame
// around whichever model is hovered — in light mode it reads as a red error
// border on the selection list. The host already fills :focus-visible rows with
// the hover wash, so the theme must not paint a second ring there.
const menuFocusReset = css.match(
  /body :is\([^)]*\[role='menuitem'\][^)]*\):focus-visible\s*\{[^}]*\}/,
)?.[0] ?? ''
guard(() => {
  if (!css.includes('0 0 0 1.5px #c6613f')) {
    fail('the discrete-control focus ring disappeared entirely')
  }
  if (!menuFocusReset) {
    fail('the menu-row focus reset is missing (a clay frame follows the pointer in the model picker)')
    return
  }
  if (!/box-shadow:\s*none !important/.test(menuFocusReset)) {
    fail('the menu-row focus reset does not clear box-shadow')
  }
  for (const role of ['menuitemradio', 'menuitemcheckbox', 'option', 'treeitem']) {
    if (!menuFocusReset.includes(`[role='${role}']`)) {
      fail(`the menu-row focus reset does not cover ${role}`)
    }
  }
  const darkRing = css.indexOf('body[data-ds-dark-theme] :focus-visible')
  if (darkRing < 0 || css.indexOf(menuFocusReset) < darkRing) {
    fail('the menu-row focus reset must follow the dark-scheme ring (otherwise the dark ring wins)')
  }
})

// --- block-level list surfaces carry NO hover tint ------------------------
// These are slabs, not controls: tinting a whole row or an entire settings card
// under the pointer reads as the layout wobbling, and on a full-width card the
// tint spills past the card edge. The switch / button / link inside is the real
// control and keeps its own hover. Guards below enforce "no tint", not "nice
// tint" — the earlier theme got this backwards.
const noTintBlock = css.match(
  /\[class\*='_panelEntry'\]:hover:not\(\[class\*='_panelEntryActive'\]\)[^{]*\{[^}]*\}/,
)?.[0] ?? ''
guard(() => {
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
})
guard(() => {
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
})

// The settings card tokens were never overridden, so cards kept the host's cool
// stroke and fill.
guard(() => {
  for (const token of ['--dsw-alias-settings-card-fill', '--dsw-alias-settings-card-stroke']) {
    const darkPlusLight = css.split('html body[data-ds-dark-theme]')[0].includes(token)
    const darkSide = (css.split('html body[data-ds-dark-theme]')[1] ?? '').includes(token)
    if (!css.includes(token)) fail(`${token} is not overridden (settings cards keep the host cool palette)`)
    if (!darkPlusLight) fail(`${token} is missing from the light scheme`)
    if (!darkSide) fail(`${token} is missing from the dark scheme`)
  }
})

// --- tasks panel spacing ---------------------------------------------------
// The todo panel docked above the composer shipped with two cramped spacings:
// its body padded only 6px, and its dock pulled toward the input card with a
// NEGATIVE bottom margin. Both are overridden, and both overrides are anchored
// on the panel's stable test id rather than on _body / _list stems (those are
// far too common in this UI and would reach unrelated components).
const todoBody = css.match(
  /\[data-testid='todo-panel'\] \[class\*='_body'\][^{]*\{[^}]*\}/,
)?.[0] ?? ''
const todoDock = css.match(
  /\[class\*='_dock'\]:has\(\[data-testid='todo-panel'\]\)[^{]*\{[^}]*\}/,
)?.[0] ?? ''
guard(() => {
  if (!todoBody) {
    fail('the todo panel body spacing override is missing (last task sits on the card edge)')
  } else if (!/padding-bottom:\s*12px/.test(todoBody)) {
    fail('the todo panel body does not reserve 12px below the last task')
  }
  if (!/\[data-testid='todo-panel'\] \[class\*='_list'\]/.test(css)) {
    fail('the todo panel list spacing override is missing')
  }
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
})

// --- wide tables stay pinned to the column --------------------------------
// DSH breaks tables of 4+ columns out of the column (.md-table-wide), and its
// own module CSS lands AFTER this sheet, so only !important wins. Without the
// pin, a wide table that follows a narrower one comes out indented by its own
// alignment padding: a table shoved off to the right with the first columns cut.
const wideTables = css.match(
  /\[data-conversation-content\] \[class\*='_tableScroll'\]:is\([^)]*\.md-table-wide[^{]*\{[^}]*\}/g,
) ?? []
guard(() => {
  if (wideTables.length === 0) {
    fail('the wide-table pin is missing (4+ column tables drift right again)')
  } else {
    const pin = wideTables.join('\n')
    for (const decl of ['margin-left: 0 !important', 'padding-left: 0 !important', 'width: 100% !important']) {
      if (!pin.includes(decl)) fail(`the wide-table pin does not carry "${decl}"`)
    }

    // The geometry must beat the host's non-important breakout, and the cells

    // must not clip the wrapper back to the column.
    if (/\[class\*='_tableScroll'\]:is\([^)]*\.md-table-wide[^{]*\{[^}]*overflow-x:\s*hidden/.test(css)) {
        fail('the wide-table wrapper hides its overflow (a too-wide table becomes unreachable)')
      }
    }
})

// The table frame rides on the <table>; cells in a managed table must not paint
// their own outer border, and no rule may clip the frame away.
guard(() => {
  if (/\[data-conversation-content\] \.md-table-wide[^{]*\{[^}]*overflow:\s*hidden/.test(css)) {
    fail('a rule clips managed tables (the rounded frame disappears)')
  }
})

// --- substring selectors stay off non-control surfaces --------------------
// The host's step glyph is `_step_1i3xo_97`; `[class*='_dot']` (no leading
// underscore) matched it and forced every completed step's check mark down to a
// 6px dot. A bare-attribute scan cannot tell the two apart, so the guard is:
// the step glyph and every other non-control must never be selected by a
// substring rule. Concretely (a) the old '_dot' rule must stay gone, (b) chip
// and pill presses stay on real controls, (c) class substrings reach only the
// stems that name the surfaces they were written for.
guard(() => {
  if (/\[class\*='_dot'\](?![^}]*data-state)/.test(css) && /\[class\*='_dot'\]\s*[,{]/.test(css)) {
    fail("a '[class*=…_dot…]' rule is back (it matches the step glyph / plain dots)")
  }
  for (const stem of ['_chip', '_pill']) {
    for (const line of css.split('\n')) {
      if (!line.includes(`[class*='${stem}']`)) continue
      if (/:active/.test(line) && !/button|role='button'|role='tab'/.test(line)) {
        fail(`${stem} press state is not limited to controls: ${line.trim()}`)
      }
      if (/width:|height:|scale/.test(line) && !/:active/.test(line)) {
        fail(`${stem} is resized by a class substring: ${line.trim()}`)
      }
    }
  }
})

// Scroll fades must ride on the host's own markers, never on substrings that
// also name layout columns or CSS-only containers.
guard(() => {
  if (/\[class\*='_scrollRegion'\]/.test(css) || /\[class\*='_codeBody'\]/.test(css)) {
    fail('the scroll fade is back on class substrings (sidebar column / CSS-only code body)')
  }
})

// --- code block keeps its rounded bottom corners --------------------------
// The host's code body is display:contents, so the <pre> ends the box; clipping
// the .md-code-block wrapper squares off its bottom corners.
const codeBlock = css.match(/\n(?:\[data-conversation-content\][^{]*)?\.md-code-block[^{]*\{[^}]*\}/g) ?? []
const clipped = codeBlock.filter((rule) => /overflow:\s*hidden/.test(rule))
guard(() => {
  if (clipped.length > 0) fail('a code-block rule clips its wrapper (square bottom corners)')
})

// --- code block restates the host's <pre> geometry ------------------------
// The host stylesheet is appended to <head> AFTER this one, and its pre rule sits
// inside :where() (specificity 0,1,0). Without an !important restatement the
// theme's code block keeps the host's padding — and the plugin preview's
// 22px-card padding is lost on top of that.
const geometryRule = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(^|\n)([^{}\n@][^{}]*> pre[^{}]*)\{([^}]*)\}/g)]
  .find((rule) => /md-code-block/.test(rule[2]) && /padding:/.test(rule[3]))
guard(() => {
  if (!geometryRule) {
    fail('the code <pre> geometry restatement is missing (host rules win again)')
  } else if (!/padding:[^;]*!important/.test(geometryRule[3])) {
    fail(`the code <pre> geometry restatement is not !important: ${geometryRule[2].trim()}`)
  }
})

// --- one declaration, one rule -------------------------------------------
// Two rules for the same element overwrite each other's properties: the code
// banner's first pass painted a hairline, a later pass ("32px strip") reset
// border-bottom, and the header band bled into the code surface. Fail when a
// selector sets the same property twice without a :where() fallback in front.
// Same selector twice is allowed only as a media-query variant (touch /
// reduced motion) or a deliberate :where() fallback. A duplicate inside the
// base cascade silently resets what the earlier rule set.
const seenDecl = new Map()
// Comments and @keyframes carry braces of their own; blank them before scanning.
// Media and @container blocks are blanked too (same regex handles nesting):
// their rules are deliberate variants, e.g. the touch fallback for the
// message-action colour or the narrow-tab padding.
const blockRe = /@(?:media|container)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g
const cssNoComments = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/@(?:-webkit-)?keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\s*\}/g, '')
  .replace(blockRe, '')
  .replace(/@(?:media|container)[^{]*\{[\s\S]*$/g, '')
guard(() => {
  for (const m of cssNoComments.matchAll(/(^|\n)([^{}\n@][^{}]*?)\{([^}]*)\}/g)) {
    const selector = m[2].trim()
    if (!selector || selector.startsWith(':where(') || /^\d+%$/.test(selector)) continue
    for (const decl of m[3].split(';')) {
      const prop = decl.split(':')[0]?.trim()
      if (!prop) continue
      const key = `${selector}|${prop}`
      if (seenDecl.has(key)) {
        fail(`"${prop}" is declared twice for "${selector}" (the later rule resets the earlier one)`)
      }
      seenDecl.set(key, true)
    }
  }
})

// --- host markers drift --------------------------------------------
// Class stems are hash-suffixed (".md-code-block" is stable, "._step_1i3xo" is
// not). Every hook the component layer leans on must still exist in the host
// bundle, so a DSH upgrade cannot silently turn a rule into dead weight.
const hooks = [
  'data-conversation-content', 'data-composer-card', 'data-code-block-banner',
  'data-conversation-tabs', 'data-composer-stat', 'data-testid="todo-panel"',
  'data-chat-turn', 'data-step-process', 'data-turn-process', 'data-terminal',
  'md-table-wide', '.md-code-block',
]
const host = (() => {
  try { return readFileSync('/Applications/DeepSeek Harness.app/Contents/Resources/app.asar') } catch { return null }
})()
guard(() => {
  if (host === null) {
    console.log('· host bundle not found; skipping hook scan')
    return
  }
  console.log(`· host hook scan: ${hooks.length} markers`)
  const asString = host.toString('latin1')
  for (const hook of hooks) {
    const needle = hook.replace(/'/g, '"')
    if (!asString.includes(needle) && !asString.includes(hook)) {
      fail(`host hook ${hook} is gone from the bundle (a rule anchored on it is dead weight)`)
    }
  }
})

// --- docs consistency -----------------------------------------------------
// Values quoted in the shipped docs must match what the build actually emits.
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
const detail = readFileSync(new URL('../docs/DETAIL.md', import.meta.url), 'utf8')
// RELEASE_NOTES.md is gitignored: a clean checkout (CI) has no copy, so its
// version check is skipped rather than failing the whole suite.
const releaseNotes = (() => {
  try {
    return readFileSync(new URL('../RELEASE_NOTES.md', import.meta.url), 'utf8')
  } catch {
    return null
  }
})()
const handoff = readFileSync(new URL('../HANDOFF.md', import.meta.url), 'utf8')
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const lightBlocks = css.split('html body {').map((part) => part.split('\n}')[0])
const lightBlock = lightBlocks.find((block) => block.includes('--dsw-alias-bg-base')) ?? ''
const tokenIn = (block, name) =>
  block.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*([^;!]+)`))?.[1].trim()

const docChecks = [
  ['canvas', tokenIn(lightBlock, '--dsw-alias-bg-base'), readme, '#faf9f5'],
  ['rail', tokenIn(lightBlock, '--dsw-specific-sidebar-fill'), readme, '#f0eee6'],
  ['canvas (detail)', tokenIn(lightBlock, '--dsw-alias-bg-base'), detail, '#faf9f5'],
  ['rail (detail)', tokenIn(lightBlock, '--dsw-specific-sidebar-fill'), detail, '#f0eee6'],
]
guard(() => {
  for (const [label, actual, doc, expected] of docChecks) {
    if (actual !== expected) {
      fail(`${label}: build emits "${actual}" but docs claim "${expected}"`)
    }
  }
})

// Every user-facing doc must name the version package.json ships. A doc that
// quotes an older release is worse than no version at all: it was 1.0.0 in
// HANDOFF.md long after npm had 1.2.0.
guard(() => {
  const version = pkg.version
  const [major, minor] = version.split('.')
  const changelogTop = new RegExp(`^#{1,3} ${major}\\.${minor}\\.[0-9]+`, 'm')
  const claims = [
    ...(releaseNotes === null
      ? []
      : [['RELEASE_NOTES.md', releaseNotes.match(/dsh-theme-claude [0-9]+\.[0-9]+\.[0-9]+/)?.[0] ?? '']]),
    ['CHANGELOG.md', changelog.match(changelogTop)?.[0] ?? ''],
    ['HANDOFF.md', handoff.match(/dsh-theme-claude@[0-9]+\.[0-9]+\.[0-9]+/)?.[0] ?? ''],
  ]
  for (const [name, found] of claims) {
    if (!found.includes(version)) {
      fail(`${name} names "${found || 'no version'}" but package.json ships ${version}`)
    }
  }
})

// The docs must not still advertise values this theme no longer uses.
const RETIRED = [
  ['#f5f5f3', 'stale rail colour'],
  ['#0b0b0a', 'stale dark rail colour'],
  ['#20201e', 'non-CDS neutral'],
  ['120 / 180 / 200 / 300', 'stale motion list'],
  ['16px 圆角', 'stale composer radius'],
  ['12px 18px', 'stale bubble padding'],
  ['0 3px 14px', 'stale composer shadow'],
  ['字号调节失效', 'stale claim that the font-size setting is dead (unless marked as historical)'],
  ['64 项', 'stale regression-guard count'],
  ['链接蓝', 'stale link colour (links are clay now)'],
]
const scannedDocs = [
  ['README.md', readme],
  ['docs/DETAIL.md', detail],
  ['CHANGELOG.md', changelog],
  ['HANDOFF.md', handoff],
  ...(releaseNotes === null ? [] : [['RELEASE_NOTES.md', releaseNotes]]),
]

guard(() => {
  for (const [stale, why] of RETIRED) {
    for (const [name, doc] of scannedDocs) {
      if (doc.includes(stale)) {
        fail(`${name}: ${why} "${stale}" is still documented`)
      }
    }
  }
})

// Container elements must never get a hover background: they wrap a header plus
// a body, so the fill spills past the rounded corner as a square slab.
const CONTAINER_HOVER = [
  [/\[data-step-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-step-process'],
  [/\[data-turn-process\][^{]*:hover[^{]*\{[^}]*background-color/, 'data-turn-process'],
]
guard(() => {
  for (const [pattern, name] of CONTAINER_HOVER) {
    if (pattern.test(css)) fail(`${name} is a container but has a hover background (slab bleed)`)
  }
})

// A bare [class*='_card']:hover lifts every nested card, so each inner block
// floats and drops its own shadow inside the parent. The hover rule must be
// guarded so only the outermost card responds. The reset inside
// @media (hover: none) is intentional and exempt.
const hoverNone = css.split('@media (hover: none)')[1]?.split('\n}')[0] ?? ''
const outsideHoverNone = css.replace(hoverNone, '')
guard(() => {
  for (const line of outsideHoverNone.split('\n')) {
    if (/\[class\*='_card'\]\s*:hover/.test(line)) {
      fail(`unguarded card hover (nested cards float) -> ${line.trim()}`)
    }
  }
  // A shadow on a _card hover lights up the whole _cards slab: :hover also
  // matches an ancestor while the pointer is over one card. Block-level
  // surfaces stay flat in both schemes.
  for (const m of outsideHoverNone.matchAll(/\[class\*='_card'\][^{]*:hover[^{]*\{([^}]*)\}/g)) {
    const shadow = m[1].match(/box-shadow:\s*([^;}]+)/)?.[1]?.trim()
    if (shadow !== undefined && shadow !== 'none') {
      fail(`card hover paints a box-shadow (${shadow}); the _cards slab lights up under the pointer`)
    }
  }
})

// The sidebar carries resident rows (New chat, Plugins) at its top, so a
// top-edge mask washes them out permanently. It must not be a fade target.
guard(() => {
  if (/\[data-sidebar-scrollport\]/.test(css.split("mask-image")[0] + (css.match(/(?:^|[\s,{])\[data-sidebar-scrollport\][^{]*\{[^}]*mask-image/) || [""])[0])) {
        fail('[data-sidebar-scrollport] must not carry a mask-image fade')
      }
})

// --- popup material follows the warm menu colour -------------------------
// The host's --dsw-menu-surface-fill default is a cool blue-grey (#303136 at
// 64% in dark), so an unthemed popup reads native-blue. It must derive from
// the theme's own menu colour.
guard(() => {
  if (!/--dsw-menu-surface-fill:\s*color-mix\(in srgb, var\(--dsw-specific-menu\)[^;]*!important;/.test(css)) {
    fail('menu surface falls back to the host cool-grey fill (popups read native-blue)')
  }
})

// --- document selection uses the theme wash ------------------------------
// The transcript selection is clay; the document-preview selection token is a
// separate native blue and must follow the same wash.
guard(() => {
  if (!css.includes('--dsw-alias-bg-document-selection: color-mix(in srgb, #c6613f 22%, transparent)')
    || !css.includes('--dsw-alias-bg-document-selection: color-mix(in srgb, #d97757 30%, transparent)')) {
    fail('document-preview selection still uses the native blue')
  }
})

if (failures > 0) {
  console.error(`\n${failures} check(s) failed (of ${total})`)
  process.exit(1)
}
// The count is the number of guards registered above, so it cannot drift from
// the suite again (the docs once quoted 64 long after it had grown to 74).
console.log(`✓ ${total} checks passed (${css.length} bytes): tokens, CDS durations, docs`)
