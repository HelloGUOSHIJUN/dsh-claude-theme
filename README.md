# dsh-claude-theme

A Claude-style visual theme for the [DeepSeek Harness](https://github.com/deepseek-ai) Web UI.
It overrides the host's design tokens and restyles several component surfaces.
It does not change conversations, tools, shortcuts, or any agent behaviour.

> **Not purely a recolour.** The theme also makes a few deliberate interface
> changes. Read [Interface changes](#interface-changes) before installing.

_No screenshots are bundled: they would show real conversation titles. Install it
and look at your own UI._

## What it changes

| Layer | Change |
| --- | --- |
| Surfaces | CDS ladder: `#faf9f5` canvas / `#f0eee6` rail / `#ffffff` cards, dark `#151515` / `#0b0b0b` / `#1a1a19`–`#20201f`, popover `#262624` |
| Borders | CDS alpha ramp: 5 / 10 / 20 / 35 % (flips to white in dark) |
| Text | `#0b0b0b` primary, `#52514e` secondary, `#898781` muted (dark: `#f0efec` / `#c3c2b7` / `#898781`) |
| Accent | Blue accent (`#2a78d6` / `#6da7ec`) for focus rings, links and selection; clay brand (`#c6613f` / `#d97757`) reserved for Claude-initiated actions such as the send disc |
| Radii | composer 14px, message bubble 18px, panels & controls 10px, xs/sm 5/7px |
| Elevation | CDS `sm` / `md` / `lg` shadows (`hsl(from gray-900 / 6–8%)`), popover `0 8px 24px / 0 2px 6px`, composer inset-hairline shadow |
| Type | 1.6 line-height, 17px fixed content size, 600-weight headings, Songti serif stack throughout |
| Motion | CDS 5-step durations (60 / 120 / 200 / 300 / 450ms): turn rise-in, control press, rail hover, running-step breathing |
| Components | Composer card, user bubble, code blocks, tables, menus, toasts, dialogs, attachment cards, jump-to-latest disc |

## Interface changes

These go beyond colour. Each one is intentional, and each one is visible.

| Change | What you will notice |
| --- | --- |
| **Serif typography everywhere** | Body text, rail and menus switch to the `Noto Serif SC / Songti SC` stack instead of the host's system sans-serif. This is the single most noticeable change. |
| **Fixed 17px content size** | The **Settings → Appearance** font-size control stops having any effect. |
| **Brand wordmark hidden** | The sidebar brand row is removed; the rail opens directly on New chat. |
| **Composer status line hidden** | `[data-composer-stat]`, the status hint under the input, is not rendered. |
| **View tabs become a capsule** | The conversation view switcher turns from a native tab strip into a 999px segmented capsule. |
| **Message-action tooltips flip upward** | The action-row tooltips open upward so the docked composer no longer covers them. |

To get any of these back, disable the bundle in **Plugins** and reload.

## Install

Inside DeepSeek Harness: **Plugins → Add plugin**, then install `dsh-claude-theme`
from npm (or point it at a local checkout directory). Reload the page once.

From the CLI/runtime side, the same thing is a bundle install:

```yaml
# what the bundle patch inserts
- insert:
    - id: claude-theme
      name: dsh-claude-theme
```

Disable it in **Plugins** to return to the stock UI; nothing else in the app is
touched.

## Compatibility

Built against DeepSeek Harness `0.2.2-rc.5`. Token overrides survive updates;
component-level rules match on class-name stems and stable `data-*` hooks, so a
future redesign may drop individual refinements (the palette and typography keep
working).

Known limits:

- The theme pins the content font size to 17px, so the Appearance setting has no effect (see [Interface changes](#interface-changes)).
- Some DSH surfaces have no Claude counterpart (usage stats, brand blocks); those
  are left native rather than restyled into something they are not.
- `:has()` selectors are used without an `@supports` guard, which can add a small
  amount of style-recalculation cost in very long conversations.
- CDS 3.0's `@property`-driven scroll fades, `data-mode` three-state scoping and
  55 keyframes are **not** implemented: they need host container support that DSH
  does not expose.

## Customize

Everything is generated from `scripts/build.mjs`:

| Want to change | Edit |
| --- | --- |
| Palette / text colours | the `STATIC`, `LIGHT` and `DARK` maps |
| macOS-specific values | the `PLATFORM_LIGHT` / `PLATFORM_DARK` maps |
| Corner radii, shadows | the `GEOMETRY` / `GEOMETRY_DARK` maps |
| Type scale | the `FONTS` map |
| Motion timings | the component rules at the bottom of the CSS template |
| Serif rail, clay accents, component shapes | the component rules at the bottom of the CSS template |

```sh
npm run build   # regenerate theme.css + client.js
npm run check   # assert the token values the theme depends on
```

`npm run check` is the regression guard: it rebuilds and fails if a token the
theme relies on disappears or drifts.

## Troubleshooting

- **The plugin shows 异常 / incompatible.** The bundle declares
  `engines.dsh >=0.2.2-0`; ranges without the `-0` suffix do not match
  prerelease builds such as `0.2.2-rc.5`.
- **Styles are not visible after installing.** The client module mounts at page
  load: reload the page once. Editing the theme in place also needs a reload.
- **Something looks wrong after a DSH upgrade.** Token-level changes keep
  working; component rules keyed on class-name stems may need updating. Run
  `npm run check` to confirm the generated tokens are intact.

## Development

```sh
node scripts/build.mjs     # regenerates theme.css + client.js from the token maps
```

`src` of truth is `scripts/build.mjs`: palette maps, radii, type scale and the
component rules all live there, and the generated `client.js` embeds the CSS so
the browser needs no extra request.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md) for the design-token
attribution and trademark notes.
