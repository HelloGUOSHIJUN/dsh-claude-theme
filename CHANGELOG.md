# Changelog

## 1.0.0

First public release.

- CDS 4.4212.0 token alignment: surfaces (`#fcfcfb` / `#f9f9f7` / `#ffffff`, dark `#151515` / `#0b0b0b` / `#1a1a19`–`#20201f` / popover `#2c2c2a`), text (`#0b0b0b` / `#52514e` / `#898781`), alpha ramp 5/10/20/35 %, radii 5/7/8/10/14/18.
- Accent roles follow the design system: blue (`#2a78d6` / `#6da7ec`) for focus and selection, clay (`#c6613f` / `#d97757`) reserved for the send action.
- Composer card: 14px radius, CDS inset-hairline shadow, 28px controls, clay send disc.
- Message bubble 18px with CDS padding; code blocks 12px with a 32px banner; tables get padding and hairline rows.
- Header: CDS segmented control for the view tabs.
- Motion: CDS durations on the swift curve, 15-step spring token, turn rise-in, running-step breathing, reasoning glow, pill overshoot, skeleton breathing.
- Rail: Songti serif at 17px/600, flat paper surface, clay iconography.
- Runtime effects removed except a single stylesheet injection (no timers or observers).

Known limitations:

- Content font size is pinned to 17px, overriding the Appearance setting.
- Tooltips inside the message action row can be covered by the sticky composer (host stacking context).
- Component rules match class-name stems; a future DSH redesign may drop individual refinements while the palette keeps working.
