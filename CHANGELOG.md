# Changelog

## 1.0.0

First public release.

### Token layer

- Surfaces: `#faf9f5` canvas / `#f0eee6` rail / `#ffffff` cards; dark `#151515` / `#0b0b0b` / `#1a1a19`–`#20201f`; overlay `#262624`. All 14 official DSH theme tokens are overridden in both themes.
- Text `#0b0b0b` / `#52514e` / `#898781`; borders follow the CDS alpha ramp (5 / 10 / 20 / 35 %, flipping to white in dark).
- Accent roles follow the design system: blue (`#2a78d6` / `#6da7ec`) for focus rings, links and selection; clay (`#c6613f` / `#d97757`) reserved for Claude-initiated actions such as the send disc.
- Radii `5 / 7 / 8 / 10 / 14 / 18px`, with the composer at 14px and the message bubble at 18px.

### Component layer

- Composer card: 14px radius, CDS inset-hairline shadow, 28px controls, clay send disc.
- Message bubble 18px with CDS padding; code blocks 12px with a 32px banner; tables get padding and hairline rows.
- Header: CDS segmented control for the view tabs.
- Rail: Songti serif at 17px/600, flat paper surface, clay iconography.
- Menus, toasts, dialogs, attachment cards and the jump-to-latest disc.

### Motion

- CDS 5-step duration scale (60 / 120 / 200 / 300 / 450ms) on the swift curve.
- 15-stop `linear()` spring token, turn rise-in, running-step breathing, reasoning glow, pill overshoot, skeleton breathing.
- Every animation is wrapped in `prefers-reduced-motion: no-preference`.

### Tooling

- `scripts/build.mjs` is the single source of truth; `theme.css` and `client.js` are generated from it.
- `scripts/check.mjs` guards 40 invariants: token values, the CDS duration scale, documentation consistency, and two container-hover regressions.
- Runtime effects are limited to a single stylesheet injection — no timers or observers.

### Known limitations

- Content font size is pinned to 17px, overriding the Appearance setting.
- The global font stack is serif; this is deliberate but changes reading texture noticeably.
- Component rules match class-name stems; a future DSH redesign may drop individual refinements while the palette keeps working.
- CDS 3.0's `@property`-driven scroll fades, `data-mode` three-state scoping and 55 keyframes are not implemented: they need host container support that DSH does not expose.
