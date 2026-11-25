/**
 * Build the Claude theme stylesheet and the Client module that mounts it.
 *
 * Palette: claude.ai's surface ladder (bg-100 #faf9f5 / bg-200 #f0eee6 /
 * bg-300 #e8e6dc, dark #262624 / #1f1e1d / #30302e) cross-checked against the
 * open-claude-ui design-system tokens (github.com/Caho1/open-claude-ui, MIT)
 * for ramps, radii, elevation and type.
 *
 * Component layer: DSH exposes stable data hooks on the pieces that carry
 * Claude's shape language (`[data-composer-card]`, `[data-message-bubble]`);
 * the remaining selectors use class-name stems, which survive minification but
 * may need a refresh after a DSH redesign.
 *
 * Output: theme.css (readable reference) and client.js (shipped, embeds the CSS).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// Wide-table section; kept as one template literal so the CSS text above stays literal.
const TABLE_SECTION = `/* Wide tables. DSH breaks any table of four or more columns out of the column
   to the transcript edges (.md-table-wide). That breakout re-declares the
   wrapper's geometry AFTER this sheet in the cascade — module CSS is appended
   to <head> at runtime, so it always lands later — and it is not !important.
   With a narrower table above it in the same message, the wide one is sized
   against the scroller rather than the column, so it comes out indented by its
   own alignment padding: its left edge lands mid-column, past the running
   text, which reads as a table shoved off to the right with its first columns
   cut away.
   Pin the breakout to the column instead: the table fills the column and wraps,
   the frame is drawn on the <table> so a table still too wide keeps a visible
   edge while it scrolls, and native tables (3 columns or fewer) keep the
   host's look: centred when they fit, their own scrollbar when they do not. */
[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
):not([class*='_tableScroll'] [class*='_tableScroll']) {
  box-sizing: border-box !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  padding-left: 0 !important;
  padding-bottom: 0 !important;
  overflow-x: auto !important;
  overscroll-behavior-x: contain;
}

[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
):not([class*='_tableScroll'] [class*='_tableScroll']) > table {
  width: 100% !important;
  max-width: 100% !important;
}

/* Once a managed table wraps, cells get the transcript's own side insets, may
   wrap anywhere, and the hairlines move to the cells: nothing paints over the
   table's rounded frame. */
[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
):not([class*='_tableScroll'] [class*='_tableScroll']) :is(th, td) {
  padding-right: 16px;
  padding-left: 16px;
  max-width: none;
  overflow-wrap: anywhere;
  border: 0;
}

[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
):not([class*='_tableScroll'] [class*='_tableScroll']) > table {
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
}

[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
) :is(th, td):not(:first-child) {
  border-left: 1px solid var(--dsw-alias-border-l1);
}

[data-conversation-content] [class*='_tableScroll']:is(
  .md-table-wide,
  :has(> table > thead > tr > th:nth-child(4))
) :is(thead th, tbody tr + tr > td) {
  border-top: 1px solid var(--dsw-alias-border-l1);
}
`


// ---------------------------------------------------------------------------
// Claude surface ladder
// light: page #faf9f5 · rail #f0eee6 · border #e8e6dc · card #ffffff
// dark:  page #262624 · rail #1f1e1d · border #3a3a36 · card #30302e
// ---------------------------------------------------------------------------
const STATIC = {
  // Warm neutral ladder (Claude grayscale ramp).
  '--dsw-static-neutral-bluish-00': '#ffffff',
  '--dsw-static-neutral-bluish-50': '#fcfcfb',
  '--dsw-static-neutral-bluish-55': '#faf9f5',
  '--dsw-static-neutral-bluish-60': '#f5f4ef',
  '--dsw-static-neutral-bluish-75': '#f0eee6',
  '--dsw-static-neutral-bluish-90': '#ebe9e1',
  '--dsw-static-neutral-bluish-100': '#e8e6dc',
  '--dsw-static-neutral-bluish-150': '#e1dfd5',
  '--dsw-static-neutral-bluish-200': '#d8d6cc',
  '--dsw-static-neutral-bluish-300': '#c9c7bd',
  '--dsw-static-neutral-bluish-310': '#bfbdb3',
  '--dsw-static-neutral-bluish-400': '#a5a49a',
  '--dsw-static-neutral-bluish-500': '#898781',
  '--dsw-static-neutral-bluish-600': '#6d6b67',
  '--dsw-static-neutral-bluish-700': '#52514e',
  '--dsw-static-neutral-bluish-750': '#3f3e3b',
  '--dsw-static-neutral-bluish-800': '#35342f',
  '--dsw-static-neutral-bluish-850': '#30302e',
  '--dsw-static-neutral-bluish-875': '#2b2b28',
  '--dsw-static-neutral-bluish-900': '#262624',
  '--dsw-static-neutral-bluish-950': '#1f1e1d',
  '--dsw-static-neutral-bluish-1000': '#1a1a19',

  '--dsw-static-neutral-00': '#ffffff',
  '--dsw-static-neutral-50': '#fcfcfb',
  '--dsw-static-neutral-100': '#f5f4ef',
  '--dsw-static-neutral-150': '#f0eee6',
  '--dsw-static-neutral-200': '#ebe9e1',
  '--dsw-static-neutral-250': '#e8e6dc',
  '--dsw-static-neutral-300': '#d8d6cc',
  '--dsw-static-neutral-400': '#a5a49a',
  '--dsw-static-neutral-500': '#898781',
  '--dsw-static-neutral-550': '#6d6b67',
  '--dsw-static-neutral-600': '#52514e',
  '--dsw-static-neutral-700': '#3f3e3b',
  '--dsw-static-neutral-800': '#30302e',
  '--dsw-static-neutral-850': '#262624',
  '--dsw-static-neutral-900': '#1a1a19',
  '--dsw-static-neutral-1000': '#000000',

  '--dsw-static-blue-50': '#eef4fd',
  '--dsw-static-blue-50p': '#edf3fd',
  '--dsw-static-blue-75': '#e3eefb',
  '--dsw-static-blue-100': '#dcebfb',
  '--dsw-static-blue-300': '#a7cbf4',
  '--dsw-static-blue-400': '#6da7ec',
  '--dsw-static-blue-450': '#3f8ce0',
  '--dsw-static-blue-500': '#2a78d6',
  '--dsw-static-blue-600': '#1f60b0',
  '--dsw-static-blue-800': '#123e78',
  '--dsw-static-blue-900': '#0d366b',
  '--dsw-static-blue-950': '#062346',

  '--dsw-static-deepseek-50': '#eef4fd',
  '--dsw-static-deepseek-100': '#dcebfb',
  '--dsw-static-deepseek-200': '#cde2fb',
  '--dsw-static-deepseek-300': '#a7cbf4',
  '--dsw-static-deepseek-400': '#6da7ec',
  '--dsw-static-deepseek-450': '#3f8ce0',
  '--dsw-static-deepseek-500': '#2a78d6',
  '--dsw-static-deepseek-600': '#1f60b0',
  '--dsw-static-deepseek-700-delete': '#184f95',
  '--dsw-static-deepseek-800': '#123e78',
  '--dsw-static-deepseek-900': '#0d366b',

  '--dsw-static-amber-100': '#fbf3ef',
  '--dsw-static-amber-400': '#ec835a',
  '--dsw-static-amber-500': '#dd8629',
  '--dsw-static-amber-600': '#c6613f',
  '--dsw-static-amber-900': '#3a1f16',

  '--dsw-static-red-50': '#fdf2f0',
  '--dsw-static-red-100': '#fae1dd',
  '--dsw-static-red-400': '#e5796f',
  '--dsw-static-red-500': '#d8493f',
  '--dsw-static-red-600': '#b42318',
  '--dsw-static-red-900': '#4a100c',
  '--dsw-static-red-400-a12': 'rgba(229, 121, 111, 0.12)',
  '--dsw-static-red-600-a08': 'rgba(180, 35, 24, 0.08)',

  '--dsw-static-green-100': '#e6f4ec',
  '--dsw-static-green-400': '#4fae7c',
  '--dsw-static-green-500': '#2e7d4f',
  '--dsw-static-green-900': '#12351f',
  '--dsw-static-green-500-a08': 'rgba(46, 125, 79, 0.08)',
  '--dsw-static-green-500-a12': 'rgba(46, 125, 79, 0.12)',

  '--dsw-static-violet-400': '#a394f0',
  '--dsw-static-violet-600': '#6b5bd2',
}

const LIGHT = {
  '--dsw-alias-bg-base': '#faf9f5',
  '--dsw-alias-bg-document-preview': '#f3f1ea',
  '--dsw-alias-bg-document-selection': 'color-mix(in srgb, #2a78d6 30%, transparent)',
  '--dsw-alias-label-document-preview': '#525252',
  '--dsw-alias-bg-layer-1': '#ffffff',
  '--dsw-alias-bg-layer-2': '#ffffff',
  '--dsw-alias-bg-layer-3': '#ffffff',
  '--dsw-alias-bg-mask-1': 'rgba(11, 11, 11, 0.26)',
  '--dsw-alias-bg-mask-2': 'rgba(11, 11, 11, 0.12)',
  '--dsw-alias-bg-mask-3': 'rgba(11, 11, 11, 0.48)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
  '--dsw-alias-bg-mask-drop': 'rgba(252, 252, 251, 0.72)',
  '--dsw-alias-bg-module-platform': '#f3f0e9',
  '--dsw-alias-bg-multi-select': '#f3f0e9',
  '--dsw-alias-bg-overlay': '#efede4',
  '--dsw-alias-bg-skeleton': 'rgba(11, 11, 11, 0.05)',
  '--dsw-alias-border-l1': 'rgba(11, 11, 11, 0.05)',
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(11, 11, 11, 0.1)',
  '--dsw-alias-border-l2': 'rgba(11, 11, 11, 0.1)',
  '--dsw-alias-border-l3': 'rgba(11, 11, 11, 0.2)',
  '--dsw-alias-border-l4': 'rgba(11, 11, 11, 0.35)',
  '--dsw-alias-border-selected': '#a3a3a3',
  '--dsw-alias-brand-primary-invert': '#ffffff',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': '#d97757',
  '--dsw-alias-brand-primary': '#0b0b0b',
  '--dsw-alias-brand-text': '#151515',
  '--dsw-alias-button-contrast-fill': '#151515',
  '--dsw-alias-button-elevated-fill': '#ffffff',
  '--dsw-alias-button-floating-fill': '#ffffff',
  '--dsw-alias-button-floating-hover': '#f5f5f3',
  '--dsw-alias-button-ghost-active-border': '#a3a3a3',
  '--dsw-alias-button-ghost-active-fill': '#f0efec',
  '--dsw-alias-button-ghost-active-hover': '#e7e6e1',
  '--dsw-alias-button-info-fill': '#0b0b0b',
  '--dsw-alias-button-info-hover': '#2c2c2a',
  '--dsw-alias-button-primary-dimmed': '#d4d4d4',
  '--dsw-alias-button-primary-fill': '#0b0b0b',
  '--dsw-alias-button-primary-hover': '#2c2c2a',
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(31, 31, 31, 0.36)',
  '--dsw-alias-button-tool-bar-fill': 'rgba(84, 84, 84, 0.5)',
  '--dsw-alias-button-tool-bar-hover': 'rgba(84, 84, 84, 0.6)',
  '--dsw-alias-card-fill': '#ffffff',
  '--dsw-alias-card-fill-hover': '#f7f5ef',
  '--dsw-alias-card-tile-fill': 'color-mix(in srgb, #ffffff 60%, transparent)',
  '--dsw-alias-chart-messages': '#2a78d6',
  '--dsw-alias-chart-system': '#898781',
  '--dsw-alias-chart-tools': '#a394f0',
  '--dsw-alias-hovercard-bg': '#20201f',
  '--dsw-alias-hovercard-label-primary': '#f5f4ef',
  '--dsw-alias-hovercard-label-secondary': '#d4d4d4',
  '--dsw-alias-hovercard-label-tertiary': '#a3a3a3',
  '--dsw-alias-hovercard-state-done': '#a394f0',
  '--dsw-alias-hovercard-state-error': '#e5796f',
  '--dsw-alias-illustration-background': '#f5f5f3',
  '--dsw-alias-illustration-backing': '#e7e6e1',
  '--dsw-alias-illustration-detail': '#c3c2b7',
  '--dsw-alias-illustration-surface': '#f0efec',
  '--dsw-alias-interactive-bg-active': 'rgba(11, 11, 11, 0.1)',
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(198, 97, 63, 0.1)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(180, 35, 24, 0.06)',
  '--dsw-alias-interactive-bg-hover-solid': '#f0eee6',
  '--dsw-alias-interactive-bg-hover': 'rgba(11, 11, 11, 0.05)',
  '--dsw-alias-settings-card-fill': '#ffffff',
  '--dsw-alias-settings-card-stroke': 'rgba(11, 11, 11, 0.1)',
  '--dsw-alias-label-caption': '#898781',
  '--dsw-alias-label-deep-diving': '#c6613f',
  '--dsw-alias-label-deep-diving-shimmer': '#d97757',
  '--dsw-alias-label-dimmed': '#c3c2b7',
  '--dsw-alias-label-on-color': '#ffffff',
  '--dsw-alias-label-primary-bluish': '#151515',
  '--dsw-alias-label-primary-dimmed': '#151515',
  '--dsw-alias-label-primary-foreground': '#ffffff',
  '--dsw-alias-label-primary-inverted': '#ffffff',
  '--dsw-alias-label-primary': '#0b0b0b',
  '--dsw-alias-label-secondary': '#52514e',
  '--dsw-alias-label-shimmer': 'color-mix(in srgb, #151515 30%, transparent)',
  '--dsw-alias-label-tertiary': '#898781',
  '--dsw-alias-menu-icon': '#525252',
  '--dsw-alias-link': '#c6613f',
  '--dsw-alias-markdown-citation': '#f5f5f3',
  '--dsw-alias-markdown-code-block-banner': '#e7e6e1',
  '--dsw-alias-markdown-code-block': '#f3f1ea',
  '--dsw-alias-markdown-code-segment-selected': '#ffffff',
  '--dsw-alias-markdown-code-segment-unselected': '#f3f1ea',
  '--dsw-alias-markdown-inline-code': '#f0eee6',
  '--dsw-alias-markdown-placeholder': '#e7e6e1',
  '--dsw-alias-markdown-tag': '#f0eee6',
  '--dsw-alias-scrollbar-bg-l1': '#d4d4d4',
  '--dsw-alias-scrollbar-bg-l2': '#d4d4d4',
  '--dsw-alias-scrollbar-hover-l1': '#b4b3a8',
  '--dsw-alias-scrollbar-hover-l2': '#b4b3a8',
  '--dsw-alias-state-business-primary': '#c6613f',
  '--dsw-alias-state-business-tertiary': 'rgba(198, 97, 63, 0.12)',
  '--dsw-alias-code-diff-added': 'rgba(46, 125, 79, 0.08)',
  '--dsw-alias-code-diff-deleted': 'rgba(180, 35, 24, 0.08)',
  '--dsw-alias-file-diff-added-bg': '#eaf5ee',
  '--dsw-alias-file-diff-added-gutter': '#f1f8f3',
  '--dsw-alias-file-diff-added-marker': '#2e7d4f',
  '--dsw-alias-file-diff-deleted-bg': '#fbebe8',
  '--dsw-alias-file-diff-deleted-gutter': '#fdf1ef',
  '--dsw-alias-file-diff-deleted-marker': '#b42318',
  '--dsw-alias-state-done-primary': '#6b5bd2',
  '--dsw-alias-state-error-primary': '#b42318',
  '--dsw-alias-state-error-secondary': '#d8493f',
  '--dsw-alias-state-idle-primary': '#d4d4d4',
  '--dsw-alias-state-success-primary': '#2e7d4f',
  '--dsw-alias-state-success-secondary': '#4fae7c',
  '--dsw-alias-state-success-tertiary': '#e6f4ec',
  '--dsw-alias-state-warn-label': '#c6613f',
  '--dsw-alias-state-warn-primary': '#dd8629',
  '--dsw-alias-state-warn-secondary': '#ec835a',
  '--dsw-alias-state-warn-tertiary': '#fbf3ef',
  '--dsw-alias-switch-thumb': '#ffffff',
  '--dsw-alias-toast-action': '#d97757',
  '--dsw-alias-toast-bg': '#20201f',
  '--dsw-alias-toast-label': '#f5f4ef',
  '--dsw-alias-tooltip-bg': '#20201f',
  '--dsw-alias-tooltip-label': '#f5f4ef',
  '--dsw-alias-trajectory-accent': '#2a78d6',
  '--dsw-alias-turn-trigger-bg': '#f5f5f3',
  '--dsw-alias-turn-trigger-bg-hover': 'rgba(11, 11, 11, 0.06)',
  '--dsw-specific-bubble': 'rgba(11, 11, 11, 0.05)',
  '--dsw-specific-bubble-highlight': 'rgba(11, 11, 11, 0.08)',
  '--dsw-specific-file-upload-track': 'rgba(11, 11, 11, 0.08)',
  '--dsw-specific-guide-hero': '#e7e6e1',
  '--dsw-specific-sidebar-right-flash': '#d97757',
  '--dsw-specific-input-major': '#ffffff',
  '--dsw-specific-login-input': '#f7f5ef',
  '--dsw-alias-menu-group-header-fill': 'rgba(247, 247, 245, 0.96)',
  '--dsw-specific-menu': '#ffffff',
  '--dsw-specific-selector': '#f0eee6',
  '--dsw-specific-sidebar-fill': '#f0eee6',
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(198, 97, 63, 0.1)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(198, 97, 63, 0.1)',
  '--dsw-specific-tip': '#f7f5ef',
  '--dsw-focus-ring-color': '#c6613f',
  '--dsw-menu-backdrop-filter': 'blur(24px) saturate(140%)',
}

const DARK = {
  '--dsw-alias-bg-base': '#151515',
  '--dsw-alias-bg-document-preview': '#1a1a19',
  '--dsw-alias-bg-document-selection': 'color-mix(in srgb, #6da7ec 30%, transparent)',
  '--dsw-alias-label-document-preview': '#a3a3a3',
  '--dsw-alias-bg-layer-1': '#1a1a19',
  '--dsw-alias-bg-layer-2': '#20201f',
  '--dsw-alias-bg-layer-3': '#20201f',
  '--dsw-alias-bg-mask-1': 'rgba(0, 0, 0, 0.5)',
  '--dsw-alias-bg-mask-2': 'rgba(0, 0, 0, 0.2)',
  '--dsw-alias-bg-mask-3': 'rgba(0, 0, 0, 0.48)',
  '--dsw-alias-bg-mask-photo': 'rgba(0, 0, 0, 0.88)',
  '--dsw-alias-bg-mask-drop': 'rgba(21, 21, 21, 0.72)',
  '--dsw-alias-bg-module-platform': '#20201f',
  '--dsw-alias-bg-multi-select': '#20201f',
  '--dsw-alias-bg-overlay': '#262624',
  '--dsw-alias-bg-skeleton': 'rgba(255, 255, 255, 0.075)',
  '--dsw-alias-border-inverted2': 'rgba(245, 245, 245, 0.08)',
  '--dsw-alias-border-inverted': 'rgba(245, 245, 245, 0.06)',
  '--dsw-alias-border-l1': 'rgba(255, 255, 255, 0.05)',
  '--dsw-alias-border-l2-darkmode-thin': 'rgba(255, 255, 255, 0.09)',
  '--dsw-alias-border-l2': 'rgba(255, 255, 255, 0.1)',
  '--dsw-alias-border-l3': 'rgba(255, 255, 255, 0.2)',
  '--dsw-alias-border-l4': 'rgba(255, 255, 255, 0.35)',
  '--dsw-alias-border-selected': '#898781',
  '--dsw-alias-brand-primary-invert': '#151515',
  '--dsw-alias-brand-primary-new-colorprimary-new-color': '#d97757',
  '--dsw-alias-brand-primary': '#f0efec',
  '--dsw-alias-brand-text': '#f5f4ef',
  '--dsw-alias-button-contrast-fill': '#f5f4ef',
  '--dsw-alias-button-elevated-fill': '#20201f',
  '--dsw-alias-button-floating-fill': '#20201f',
  '--dsw-alias-button-floating-hover': '#262624',
  '--dsw-alias-button-ghost-active-border': '#6d6b67',
  '--dsw-alias-button-ghost-active-fill': '#262624',
  '--dsw-alias-button-ghost-active-hover': '#2c2c2a',
  '--dsw-alias-button-info-fill': '#f0efec',
  '--dsw-alias-button-info-hover': '#ffffff',
  '--dsw-alias-button-primary-dimmed': '#2c2c2a',
  '--dsw-alias-button-primary-fill': '#f0efec',
  '--dsw-alias-button-primary-hover': '#ffffff',
  '--dsw-alias-button-tool-bar-fill-invisible': 'rgba(31, 31, 31, 0.36)',
  '--dsw-alias-button-tool-bar-fill': 'rgba(84, 84, 84, 0.5)',
  '--dsw-alias-button-tool-bar-hover': 'rgba(84, 84, 84, 0.6)',
  '--dsw-alias-card-fill': '#1a1a19',
  '--dsw-alias-card-fill-hover': '#20201f',
  '--dsw-alias-card-tile-fill': 'color-mix(in srgb, #f5f4ef 5%, transparent)',
  '--dsw-alias-chart-messages': '#6da7ec',
  '--dsw-alias-chart-system': '#898781',
  '--dsw-alias-chart-tools': '#a394f0',
  '--dsw-alias-hovercard-bg': '#20201f',
  '--dsw-alias-hovercard-label-primary': '#f5f4ef',
  '--dsw-alias-hovercard-label-secondary': '#a3a3a3',
  '--dsw-alias-hovercard-label-tertiary': '#898781',
  '--dsw-alias-hovercard-state-done': '#a394f0',
  '--dsw-alias-hovercard-state-error': '#e5796f',
  '--dsw-alias-illustration-background': '#1a1a19',
  '--dsw-alias-illustration-backing': '#262624',
  '--dsw-alias-illustration-detail': '#52514e',
  '--dsw-alias-illustration-surface': '#20201f',
  '--dsw-alias-interactive-bg-active': 'rgba(245, 245, 245, 0.12)',
  '--dsw-alias-interactive-bg-hover-accent': 'rgba(217, 119, 87, 0.16)',
  '--dsw-alias-interactive-bg-hover-danger': 'rgba(229, 121, 111, 0.16)',
  '--dsw-alias-interactive-bg-hover-solid': '#262624',
  '--dsw-alias-interactive-bg-hover': 'rgba(245, 245, 245, 0.07)',
  '--dsw-alias-settings-card-fill': '#1a1a19',
  '--dsw-alias-settings-card-stroke': 'rgba(255, 255, 255, 0.1)',
  '--dsw-alias-label-caption': '#8a8a8a',
  '--dsw-alias-label-deep-diving': '#d97757',
  '--dsw-alias-label-deep-diving-shimmer': '#e08264',
  '--dsw-alias-label-dimmed': '#2c2c2a',
  '--dsw-alias-label-on-color': '#ffffff',
  '--dsw-alias-label-primary-bluish': '#f5f4ef',
  '--dsw-alias-label-primary-dimmed': '#f5f4ef',
  '--dsw-alias-label-primary-foreground': '#151515',
  '--dsw-alias-label-primary-inverted': '#20201f',
  '--dsw-alias-label-primary': '#f0efec',
  '--dsw-alias-label-secondary': '#c3c2b7',
  '--dsw-alias-label-shimmer': 'color-mix(in srgb, #f5f4ef 45%, transparent)',
  '--dsw-alias-label-tertiary': '#898781',
  '--dsw-alias-menu-icon': '#f0efec',
  '--dsw-alias-link': '#e0895f',
  '--dsw-alias-markdown-citation': '#20201f',
  '--dsw-alias-markdown-code-block-banner': '#20201f',
  '--dsw-alias-markdown-code-block': '#0b0b0a',
  '--dsw-alias-markdown-code-segment-selected': '#262624',
  '--dsw-alias-markdown-code-segment-unselected': '#0b0b0a',
  '--dsw-alias-markdown-inline-code': '#20201f',
  '--dsw-alias-markdown-placeholder': '#20201f',
  '--dsw-alias-markdown-tag': '#20201f',
  '--dsw-alias-scrollbar-bg-l1': '#2c2c2a',
  '--dsw-alias-scrollbar-bg-l2': '#2c2c2a',
  '--dsw-alias-scrollbar-hover-l1': '#52514e',
  '--dsw-alias-scrollbar-hover-l2': '#52514e',
  '--dsw-alias-state-business-primary': '#d97757',
  '--dsw-alias-state-business-tertiary': 'rgba(217, 119, 87, 0.16)',
  '--dsw-alias-code-diff-added': 'rgba(79, 174, 124, 0.12)',
  '--dsw-alias-code-diff-deleted': 'rgba(229, 121, 111, 0.12)',
  '--dsw-alias-file-diff-added-bg': '#1b2b21',
  '--dsw-alias-file-diff-added-gutter': '#16241b',
  '--dsw-alias-file-diff-added-marker': '#4fae7c',
  '--dsw-alias-file-diff-deleted-bg': '#33191a',
  '--dsw-alias-file-diff-deleted-gutter': '#271314',
  '--dsw-alias-file-diff-deleted-marker': '#e5796f',
  '--dsw-alias-state-done-primary': '#a394f0',
  '--dsw-alias-state-error-primary': '#e5796f',
  '--dsw-alias-state-error-secondary': '#e5796f',
  '--dsw-alias-state-idle-primary': '#52514e',
  '--dsw-alias-state-success-primary': '#4fae7c',
  '--dsw-alias-state-success-secondary': '#4fae7c',
  '--dsw-alias-state-success-tertiary': '#12351f',
  '--dsw-alias-state-warn-label': '#e0894f',
  '--dsw-alias-state-warn-primary': '#dd8629',
  '--dsw-alias-state-warn-secondary': '#ec835a',
  '--dsw-alias-state-warn-tertiary': '#3a1f16',
  '--dsw-alias-switch-thumb': '#a3a3a3',
  '--dsw-alias-toast-action': '#d97757',
  '--dsw-alias-toast-bg': '#20201f',
  '--dsw-alias-toast-label': '#f5f4ef',
  '--dsw-alias-tooltip-bg': '#20201f',
  '--dsw-alias-tooltip-label': '#f5f4ef',
  '--dsw-alias-trajectory-accent': '#6da7ec',
  '--dsw-alias-turn-trigger-bg': 'rgba(245, 245, 245, 0.07)',
  '--dsw-alias-turn-trigger-bg-hover': 'rgba(245, 245, 245, 0.12)',
  '--dsw-specific-bubble': 'rgba(245, 245, 245, 0.06)',
  '--dsw-specific-bubble-highlight': 'rgba(245, 245, 245, 0.1)',
  '--dsw-specific-file-upload-track': 'rgba(0, 0, 0, 0.08)',
  '--dsw-specific-guide-hero': '#262624',
  '--dsw-specific-sidebar-right-flash': '#d97757',
  '--dsw-specific-input-major': '#20201f',
  '--dsw-specific-login-input': '#151515',
  '--dsw-alias-menu-group-header-fill': 'rgba(32, 32, 30, 0.96)',
  '--dsw-specific-menu': '#2c2c2a',
  '--dsw-specific-selector': '#20201f',
  '--dsw-specific-sidebar-fill': '#0b0b0b',
  '--dsw-specific-sidebar-nav-item-active-accent': '#20201f',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(217, 119, 87, 0.14)',
  '--dsw-specific-tip': '#20201f',
  '--dsw-focus-ring-color': '#d97757',
}

// macOS: Claude's rail is flat warm paper, so the vibrancy wash and glass are
// pinned to the rail colour instead of the desktop behind the window.
const PLATFORM_LIGHT = {
  '--dsw-specific-sidebar-glass-collapsed-fill': 'transparent',
  '--dsw-specific-sidebar-glass-collapsed-hover': 'rgba(31, 30, 29, 0.06)',
  '--dsw-specific-sidebar-glass-fill': '#f0eee6',
  '--dsw-specific-sidebar-glass-hover': 'rgba(31, 30, 29, 0.05)',
  '--dsw-specific-sidebar-tint': '#f0eee6',
  '--dsw-specific-sidebar-wash-top': 'transparent',
  '--dsw-specific-sidebar-wash-top-clear': 'transparent',
  '--dsw-specific-sidebar-wash-bottom': 'transparent',
  '--dsw-specific-sidebar-wash-bottom-clear': 'transparent',
  '--dsw-specific-menu': 'rgba(255, 255, 255, 0.96)',
}

const PLATFORM_DARK = {
  '--dsw-specific-sidebar-glass-collapsed-fill': 'rgba(240, 239, 236, 0.06)',
  '--dsw-specific-sidebar-glass-collapsed-hover': 'rgba(240, 239, 236, 0.1)',
  '--dsw-specific-sidebar-glass-fill': '#0b0b0b',
  '--dsw-specific-sidebar-glass-hover': 'rgba(240, 239, 236, 0.08)',
  '--dsw-specific-sidebar-tint': '#0b0b0b',
  '--dsw-specific-sidebar-wash-top': 'transparent',
  '--dsw-specific-sidebar-wash-top-clear': 'transparent',
  '--dsw-specific-sidebar-wash-bottom': 'transparent',
  '--dsw-specific-sidebar-wash-bottom-clear': 'transparent',
  '--dsw-specific-menu': 'rgba(48, 48, 46, 0.96)',
}

// Claude's compact geometry and calm, warm elevation.
const GEOMETRY = {
  '--dsw-radius-xs': '5px',
  '--dsw-radius-sm': '7px',
  '--dsw-radius-md': '8px',
  '--dsw-radius-lg': '10px',
  '--dsw-radius-xl': '18px',
  '--dsw-radius-panel': '10px',
  '--dsw-shadow-lv1': '0 1px 2px hsl(from #0b0b0b h s l / 6%), 0 2px 8px hsl(from #0b0b0b h s l / 8%)',
  '--dsw-shadow-lv1-blur': '0 4px 12px rgba(0, 0, 0, 0.05)',
  '--dsw-shadow-lv2': '0 2px 4px hsl(from #0b0b0b h s l / 7%), 0 6px 16px hsl(from #0b0b0b h s l / 8%)',
  '--dsw-shadow-lv3': '0 4px 8px hsl(from #0b0b0b h s l / 8%), 0 12px 28px -2px hsl(from #0b0b0b h s l / 8%)',
}

const GEOMETRY_DARK = {
  '--dsw-shadow-lv1': '0 1px 2px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.24)',
  '--dsw-shadow-lv1-blur': '0 4px 12px rgba(0, 0, 0, 0.28)',
  '--dsw-shadow-lv2': '0 2px 4px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.24)',
  '--dsw-shadow-lv3': '0 4px 8px rgba(0, 0, 0, 0.5), 0 16px 36px -2px rgba(0, 0, 0, 0.4)',
}

// Type scale: Claude reads at the user's size with a ~1.6 line-height and
// 600-weight headings. The calc() chain keeps the content-size setting intact.
const d = 'var(--dsh-content-font-delta)'
const ds = 'var(--dsh-content-font-delta-secondary, 0px)'
const bodySize = 'var(--dsh-content-font-size, 14px)'
const sec = 'var(--dsh-content-font-size-secondary, 13px)'
const fam = 'var(--dsw-font-family)'

const FONTS = {
  '--dsw-font-markdown-h1': `600 calc(20px + ${d}) / calc(27px + ${d}) ${fam}`,
  '--dsw-font-markdown-h1-font-weight': '600',
  '--dsw-font-markdown-h1-line-height': `calc(27px + ${d})`,
  '--dsw-font-markdown-h2': `600 calc(18px + ${d}) / calc(25px + ${d}) ${fam}`,
  '--dsw-font-markdown-h2-font-weight': '600',
  '--dsw-font-markdown-h2-line-height': `calc(25px + ${d})`,
  '--dsw-font-markdown-h3': `600 calc(17px + ${d}) / calc(23px + ${d}) ${fam}`,
  '--dsw-font-markdown-h3-font-weight': '600',
  '--dsw-font-markdown-h3-line-height': `calc(23px + ${d})`,
  '--dsw-font-markdown-h4': `600 ${bodySize} / calc(22px + ${d}) ${fam}`,
  '--dsw-font-markdown-h4-font-weight': '600',
  '--dsw-font-markdown-h4-line-height': `calc(22px + ${d})`,
  '--dsw-font-markdown-base': `${bodySize} / calc(21px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-line-height': `calc(21px + ${d})`,
  '--dsw-font-markdown-base-strong': `600 ${bodySize} / calc(21px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-strong-line-height': `calc(21px + ${d})`,
  '--dsw-font-markdown-base-italic': `italic ${bodySize} / calc(21px + ${d}) ${fam}`,
  '--dsw-font-markdown-base-italic-line-height': `calc(21px + ${d})`,
  '--dsw-font-markdown-table': `${sec} / calc(19px + ${ds}) ${fam}`,
  '--dsw-font-markdown-table-line-height': `calc(19px + ${ds})`,
  '--dsw-font-markdown-table-head': `500 ${sec} / calc(19px + ${ds}) ${fam}`,
  '--dsw-font-markdown-table-head-line-height': `calc(19px + ${ds})`,
  '--dsw-font-markdown-small': `12px / 18px ${fam}`,
  '--dsw-font-markdown-small-line-height': '18px',
  '--dsw-font-markdown-small-strong': `600 12px / 18px ${fam}`,
  '--dsw-font-markdown-small-strong-line-height': '18px',
}

const declarations = (map, indent = '  ') =>
  Object.entries(map).map(([k, v]) => `${indent}${k}: ${v} !important;`).join('\n')

const css = `/* ==========================================================================
   Claude theme for DeepSeek Harness — generated, do not edit by hand.
   Source: scripts/build.mjs · palette from claude.ai surfaces + open-claude-ui (MIT)
   ========================================================================== */

/* Warm neutral ramps, Claude blue accents, clay brand flashes. */
html body {
${declarations(STATIC)}
}

/* Light surfaces, text, borders, states. */
html body {
${declarations(LIGHT)}
${declarations(GEOMETRY)}
}

/* Type scale lives on the root, not on body: the --dsw-font-markdown-* values
   below resolve --dsh-content-font-size, and a body-local definition would make
   them reference themselves (a cycle the browser drops as invalid). */
html {
  --dsh-content-font-size: calc(17px + var(--dsh-content-font-delta, 0px)) !important;
  --dsh-content-font-size-secondary: calc(13px + var(--dsh-content-font-delta, 0px)) !important;
}

/* Typography tokens resolve the root size above, so they stay on body. */
html body {
${declarations(FONTS)}
}

/* Dark surfaces keep every token on the same warm ramp. */
html body[data-ds-dark-theme] {
${declarations(DARK)}
${declarations(GEOMETRY_DARK)}
}

/* macOS vibrancy: a flat warm rail, not a blue glass wash. */
html[data-platform='darwin'] body {
${declarations(PLATFORM_LIGHT)}
}

html[data-platform='darwin'] body[data-ds-dark-theme] {
${declarations(PLATFORM_DARK)}
}

/* --------------------------------------------------------------------------
   Composer: Claude's floating card — 16px corners, one hairline, calm shadow.
   -------------------------------------------------------------------------- */
[data-composer-card] {
  border-radius: 14px !important;
  background-color: var(--dsw-specific-input-major) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.035), inset 0 0 0 1px var(--dsw-alias-border-l2) !important;
}

body[data-ds-dark-theme] [data-composer-card] {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 0 0 1px var(--dsw-alias-border-l2) !important;
}

/* CDS composer states: hover lifts the ring to border-strong, focus-within adds
   the outer ring as well. */
[data-composer-card]:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(11, 11, 11, 0.2) !important;
}

[data-composer-card]:focus-within {
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.08),
    inset 0 0 0 1px rgba(11, 11, 11, 0.2),
    0 0 0 1px rgba(11, 11, 11, 0.2) !important;
}

body[data-ds-dark-theme] [data-composer-card]:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
}

body[data-ds-dark-theme] [data-composer-card]:focus-within {
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.65),
    inset 0 0 0 1px rgba(255, 255, 255, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.22) !important;
}

/* Send: an ink disc in light, a cream disc in dark — never a saturated blue. */
[data-composer-card] [class$='_primary'] {
  background-color: var(--dsw-alias-brand-primary-new-colorprimary-new-color) !important;
  color: #ffffff !important;
}

[data-composer-card] [class$='_primary']:hover:not(:disabled) {
  background-color: #d97757 !important;
}

/* Claude's send row is quieter than the input itself. */
[data-composer-card] textarea::placeholder,
[data-composer-input] {
  color: var(--dsw-alias-label-primary);
}

/* --------------------------------------------------------------------------
   User message: a warm rounded pill, 18px corners, generous padding.
   -------------------------------------------------------------------------- */
[data-message-bubble] {
  border-radius: 18px !important;
  padding: 12px 16px !important;
  background-color: var(--dsw-specific-bubble) !important;
  line-height: 1.6 !important;
}

/* --------------------------------------------------------------------------
   Rail and frame: one warm surface, no vertical rules, flat paper.
   -------------------------------------------------------------------------- */
[class$='_centerCol'] {
  border-left: 0 !important;
}

/* Rail: Claude's serif rail type. The plugin entries live beside the rail root,
   so the following-sibling branch is included as well. */
[class*='_root']:has([class*='_newSession']),
[class*='_root']:has([class*='_newSession']) ~ * {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', serif !important;
  font-size: 17px !important;
  font-weight: 400 !important;
  color: var(--dsw-alias-label-primary) !important;
}

/* The wordmark row is removed on request; the rail opens with New chat. */
[class*='_logoRow'] {
  display: none !important;
}

/* The account chip sits centred at the foot of the rail. */
[class*='_footArea'] {
  align-items: center !important;
}

/* The three section-header actions (search / filter / new workspace) keep their
   own colour. */
body [class*='_root']:has([class*='_newSession']) :is([class*='_regionArea'], [class*='_region']) > :first-child svg,
body [class*='_root']:has([class*='_newSession']) :is([class*='_regionArea'], [class*='_region']) > :first-child svg *,
body [class*='_root']:has([class*='_newSession']) ~ * :is([class*='_regionArea'], [class*='_region']) > :first-child svg {
  color: var(--dsw-alias-label-secondary) !important;
  stroke: currentColor;
}

/* The selected session row takes the same clay tint as the other selections. */
[class*='_panelEntryActive'] {
  background-color: rgba(198, 97, 63, 0.1) !important;
}

body[data-ds-dark-theme] [class*='_panelEntryActive'] {
  background-color: rgba(217, 119, 87, 0.14) !important;
}

/* List surfaces (Plugins, Settings, session lists) carry NO hover tint.
   These are block-level slabs: a whole row or an entire settings card changes
   colour under the pointer, which reads as the layout wobbling rather than as
   feedback, and on a full-width card the tint spills past the card edge. The
   row is not the control — the switch, button or link inside it is — so the
   hover affordance belongs on those, and they keep it through their own styles.

   This also covers the host's two hover sources here: the flat
   interactivity tint on rows, and the tint the Plugins tab paints on its
   inner [_cardContent] box. */
[class*='_panelEntry']:hover:not([class*='_panelEntryActive']),
[class*='_panelRow']:hover,
[class*='_newSession']:hover,
[class*='_cardContent']:hover,
[class*='_card'][data-open='true'] > [class*='_cardContent'] {
  background-color: transparent !important;
}

/* Safety net for the same surfaces: the plugins tab re-injects its own
   stylesheet into <head> AFTER this theme mounts, so a same-specificity rule can
   lose the ordering race. Adding the element type raises specificity, which
   makes the suppression independent of injection order. */
button[class*='_cardContent']:hover,
button[class*='_cardContent']:focus,
a[class*='_panelEntry']:hover:not([class*='_panelEntryActive']),
div[class*='_panelRow']:hover,
button[class*='_newSession']:hover {
  background-color: transparent !important;
  background-image: none !important;
}

/* Selected and expanded rows still need to read as selected — but as a state,
   not as a hover. (_panelEntryActive keeps the clay tint defined above.) */
[class*='_card'][data-open='true'] {
  background-color: var(--dsw-alias-settings-card-fill) !important;
}

/* The Plugins card keeps its own 18px corners and clips its children, so an
   expanded card's inner box can never paint outside the card edge. */
[class*='_cards'] > [class*='_card']:not([class*='_cardContent']):not([class*='_cardMainRow']):not([class*='_cardTitle']) {
  border-radius: var(--dsw-radius-xl) !important;
  overflow: hidden !important;
}

/* Rail iconography takes the clay accent as well. */
[class*='_root']:has([class*='_newSession']) svg,
[class*='_root']:has([class*='_newSession']) ~ * svg {
  color: var(--dsw-alias-brand-primary-new-colorprimary-new-color) !important;
  stroke: currentColor;
}

/* A flat warm rail instead of vibrancy glass over the desktop. */
/* Status pills read as quiet helper text, not a second toolbar. */
[data-composer-stat] {
  display: none !important;
}

/* Tasks panel (the live todo list docked above the composer).
   Two spacings are too tight in the shipped layout:
   1. Its body pads 6px top/bottom, so the last task sits almost on the card's
      bottom edge — Claude's cards breathe with 12px.
   2. Its dock pulls toward the composer with a NEGATIVE bottom margin
      (calc(0px - stack-gap - 3px)), cramming the panel against the input card.

   The panel carries a stable hook — [data-testid='todo-panel'] — so every rule
   below is scoped to it. Do NOT anchor on _body / _list / _item: those stems are
   extremely common in this UI and would reach unrelated components. */
/* Breathing room inside the panel; bottom stays a touch looser so the last
   task never sits on the card edge. */
[data-testid='todo-panel'] [class*='_body'] {
  padding-top: 10px !important;
  padding-bottom: 12px !important;
}

[data-testid='todo-panel'] [class*='_list'] {
  gap: 10px !important;
}

/* The dock wrapping the panel: replace the negative pull with a real gap so
   the panel and the input card read as two objects. */
[class*='_dock']:has([data-testid='todo-panel']) {
  margin-bottom: 8px !important;
}

/* --------------------------------------------------------------------------
   Code and attachment surfaces: CDS uses a 12px rounded sandbox with a hairline
   and a quiet banner; attachment cards sit on the card surface.
   -------------------------------------------------------------------------- */
/* The host code block is a 12px sandbox, but its stylesheet is appended to
   <head> at runtime, i.e. AFTER this one, and its <pre> rule is wrapped in
   :where() so it counts as specificity 0,1,0 against our 0,2,0 — an override
   without !important loses to it. The frame therefore restates the host's own
   spacing and geometry: 16px padding, word wrapping, and the 10px bottom
   corners on the <pre> itself (the banner is the box's top edge). */
[data-conversation-content] :is(.md-code-block > [data-code-block-content], .md-code-block:not(.md-code-block .md-code-block)) > pre {
  font: var(--dsw-font-markdown-code-block) !important;
  padding: 6px 22px 20px !important;
  margin: 0 !important;
  overflow-x: auto !important;
  white-space: pre-wrap !important;
  word-break: break-all !important;
  background: var(--dsw-alias-markdown-code-block) !important;
  border-radius: 0 0 12px 12px !important;
}

/* The banner is the code box's own top edge (the body is display:contents), so
   it carries both corners; the host stylesheet, appended after this one, only
   rounds it when its own variable is present. */
[data-conversation-content] .md-code-block > pre {
  border-radius: 0 0 12px 12px !important;
}

[data-conversation-content] .md-code-block[data-code-wrap='false'] > [data-code-block-content] > pre {
  white-space: pre !important;
  overflow-wrap: normal !important;
}

/* Direct children only: the body also shows code through nested renderers
   (the preview card embeds a full markdown tree), and those keep their own
   surface. */
[data-conversation-content] > .md-code-block,
[data-conversation-content] .md-code-block:not(.md-code-block .md-code-block) {
  border: 1px solid var(--dsw-alias-border-l2) !important;
  border-radius: 12px !important;
  background: var(--dsw-alias-markdown-code-block) !important;
  box-shadow: none !important;
  /* The host's code body is display:contents, so the <pre> starts and ends the
     box. Clipping the wrapper squares off the <pre>'s rounded bottom corners:
     leave the corners to the <pre> and only paint the frame. */
  overflow: visible !important;
}

[data-conversation-content] > .md-code-block > pre,
[data-conversation-content] .md-code-block:not(.md-code-block .md-code-block) > pre {
  border-radius: 0 0 12px 12px !important;
}

/* Wrapped in :where() so the same properties below stay the last word. */
:where([data-code-block-banner]) {
  font-size: 12px !important;
  color: var(--dsw-alias-label-tertiary) !important;
  border-bottom: 1px solid var(--dsw-alias-border-l1) !important;
}

[class*='_fileCard'] {
  border: 1px solid var(--dsw-alias-border-l2) !important;
  border-radius: 10px !important;
  background: var(--dsw-alias-bg-layer-1) !important;
}

/* Presenter attachment card (the file a turn hands back): the host draws a
   hairline .5px border at radius-lg with a value-sized split button pinned to
   the right, where the two halves round differently from the card. Claude's
   card: flat 10px corners, a sand tile for the glyph, and one compact,
   square-cornered split control whose divider is a straight hairline. */
[data-presented-file] {
  border: 1px solid var(--dsw-alias-border-l2) !important;
  border-radius: 10px !important;
  background: var(--dsw-alias-bg-layer-1) !important;
}

[data-presented-file] [class*='_fileIcon'] {
  border-radius: 8px !important;
  background: var(--dsw-alias-markdown-code-block) !important;
  color: var(--dsw-alias-border-primary-new-colorprimary-new-color, #c6613f) !important;
}

[data-presented-files-row] [class*='_split'] {
  box-sizing: border-box;
  height: 30px !important;
  border: 1px solid var(--dsw-alias-border-l3) !important;
  border-radius: 8px !important;
  overflow: visible !important;
  background: var(--dsw-alias-bg-layer-1) !important;
}

/* Both halves sit square inside the control; the 8px radius lives on the outer
   box, so the divider between them is a straight vertical line. The divider is
   drawn on the chevron half and spans the control's full height. */
[data-presented-files-row] [class*='_split'] > * {
  border-radius: 0 !important;
  min-height: 28px;
  justify-content: center;
}

[data-presented-files-row] [class*='_split'] > :first-child {
  padding-inline: 10px !important;
}

[data-presented-files-row] [class*='_split'] > :last-child {
  position: relative;
  padding-inline: 6px !important;
  border-left: 1px solid var(--dsw-alias-border-l2) !important;
}


/* ==========================================================================
   Batch 2 — typography, markdown, actions, overlays, rail finish
   ========================================================================== */

/* 3 · Markdown rhythm: 12px paragraph steps, 6px list steps, hairline rules. */
/* One vertical rhythm for the whole transcript: 12px between text blocks,
   24/8 around headings, 6px between list items. */
[data-conversation-content] p {
  margin: 0 0 12px;
}

[data-conversation-content] ul,
[data-conversation-content] ol {
  margin: 12px 0;
  padding-left: 22px;
}

[data-conversation-content] h1,
[data-conversation-content] h2,
[data-conversation-content] h3 {
  margin: 24px 0 8px;
}

[data-conversation-content] h4,
[data-conversation-content] h5,
[data-conversation-content] h6 {
  margin: 20px 0 6px;
}

[data-conversation-content] > :first-child,
[data-conversation-content] > * > :first-child {
  margin-top: 0;
}

[data-conversation-content] :is(p, ul, ol, blockquote, table, pre, hr):last-child {
  margin-bottom: 0;
}

[data-conversation-content] li + li {
  margin-top: 6px;
}

[data-conversation-content] blockquote {
  margin: 12px 0;
  padding-left: 14px;
  border-left: 2px solid var(--dsw-alias-border-l3);
  color: var(--dsw-alias-label-secondary);
}

[data-conversation-content] hr {
  margin: 20px 0;
  border: 0;
  border-top: 1px solid var(--dsw-alias-border-l2);
}

[data-conversation-content] a {
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}

/* Links read in clay: the link token is the brand's terra cotta, and the file
   mention (the inline link to a file, e.g. 清单同步为 中文文献…md) carries the
   same colour with its glyph. The host's own dotted underline on hover stays. */
[data-conversation-content] :is(a, [class*='_fileLink'], [class*='_fileMention'], [class*='_fileMention'] *) {
  color: var(--dsw-alias-brand-primary-new-colorprimary-new-color) !important;
}

[data-conversation-content] :not(pre) > code {
  border-radius: 4px;
}

/* Tables render inside a scroll wrapper; the rhythm has to live on the wrapper. */
[data-conversation-content] [class*='_tableScroll'] {
  margin: 12px 0 !important;
}

${TABLE_SECTION}
[data-conversation-content] th,
[data-conversation-content] td {
  padding: 8px 14px;
  vertical-align: top;
}

[data-conversation-content] th {
  font-weight: 500;
  color: var(--dsw-alias-label-secondary);
}

[data-conversation-content] th:first-child,
[data-conversation-content] td:first-child {
  padding-left: 16px;
}

[data-conversation-content] th:last-child,
[data-conversation-content] td:last-child {
  padding-right: 16px;
}

/* Tooltips in the message action row flip upward: the primitive lays them out
   below the button, where the sticky composer covers them. */
[class*='_actions'] [role='tooltip'],
[class*='_actions'] [data-side='bottom'],
[data-conversation-content] [role='tooltip'][data-side='bottom'] {
  transform: translateY(calc(-100% - 34px)) !important;
}

/* 4 · Message actions: quiet 28px ghost buttons. */
[data-conversation-content] [class*='_actions'] {
  gap: 2px;
  opacity: 0.8;
}

[data-conversation-content] [class*='_actions'] button {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

/* 5 · Composer controls: CDS ghost buttons inside the card. */
[data-composer-card] :is([class*='_tools'], [class*='_standardControls'], [class*='_trailing']) button {
  border-radius: 8px;
}

/* 6 · Overlay surfaces: CDS menu material — white, hairline, 10px corners. */
[role='menu'],
[role='dialog'],
[role='listbox'],
[role='tooltip'] {
  border-radius: 12px;
}


/* CDS dual-ring popover: a 1px outer ring in light, a chamfer highlight inset
   in dark, plus the two-layer diffusion. */
[role='menu'] {
  border: 0;
  box-shadow:
    0 0 0 1px var(--dsw-alias-border-l2),
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08);
}

body[data-ds-dark-theme] [role='menu'] {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    0 8px 28px rgba(0, 0, 0, 0.65),
    0 2px 8px rgba(0, 0, 0, 0.45);
}

[role='menuitem'] {
  border-radius: 6px;
  min-height: 28px;
}

/* 7 · Motion: CDS timings (60/120/200/300ms) on the swift curve, instead of the
   single 200ms ease-in-out the host ships. */
body {
  --ds-transition-duration: 0.2s;
  --ds-transition-duration-fast: 0.12s;
  --ds-transition-duration-slow: 0.3s;
  --ds-ease-in-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dsw-focus-ring-width: 1.5px;
}


/* ==========================================================================
   Batch 3 — focus ring, hero pills, hover elevation, code banner, controls
   ========================================================================== */

/* 1 · CDS focus: a 1.5px ring on DISCRETE controls only (buttons, links, tabs,
   menu items). Text entry is excluded below: a full clay rectangle around a
   one-line field reads as an error state, not as focus. */
:focus-visible {
  outline: none !important;
  box-shadow:
    inset 0 0 0 1px var(--dsw-alias-bg-base),
    0 0 0 1.5px #c6613f,
    0 0 6px 1px rgba(217, 119, 87, 0.25) !important;
}

body[data-ds-dark-theme] :focus-visible {
  box-shadow:
    inset 0 0 0 1px #0b0b0b,
    0 0 0 1.5px #d97757,
    0 0 6px 1px rgba(217, 119, 87, 0.3) !important;
}

/* Text entry keeps the native caret and the field's own border. Painting the
   clay ring here drew a hard red box around every input in Settings. */
:is(input, textarea, select, [contenteditable], [contenteditable] *):focus-visible,
[role='textbox']:focus-visible,
[contenteditable='true']:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* Fields that sit inside a card already get their focus from the card. */
[class*='_field'] :is(input, textarea, select):focus-visible,
[class*='_input'] :is(input, textarea, select):focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

/* The composer card already shows its focus through :focus-within; the inner
   editable must not paint a second ring. */
[data-composer-card] :focus-visible,
[data-composer-card] :read-write:focus-visible,
[data-composer-input]:focus-visible {
  box-shadow: none !important;
  outline: none !important;
}

/* 3 · Empty-state suggestions read as CDS pills. */
[class*='_heroWorkspaceRow'] button,
[data-slot='conversation.hero.options'] button {
  border-radius: 999px !important;
  min-height: 32px !important;
  padding: 6px 14px !important;
  border: 1px solid var(--dsw-alias-border-l2) !important;
  background: var(--dsw-alias-bg-layer-1) !important;
  font-size: 13px !important;
}

[class*='_heroWorkspaceRow'] button:hover,
[data-slot='conversation.hero.options'] button:hover {
  background: var(--dsw-alias-card-fill-hover) !important;
  border-color: var(--dsw-alias-border-l3) !important;
}

/* 4 · Panel hover elevation: hairline strengthens, shadow lifts. */
[class*='_fileCard']:hover {
  border-color: var(--dsw-alias-border-l3) !important;
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.09) !important;
}

body[data-ds-dark-theme] [class*='_fileCard']:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6) !important;
}

/* 5 · Drop target glow: clay inset halo while files hover the composer. */
[class*='_drop']:not([class*='_dropdown']),
[class*='_dragOverlay'] {
  box-shadow: inset 0 0 24px -2px rgba(217, 119, 87, 0.2), inset 0 0 0 2px #d97757 !important;
}

/* 6 · Control heights follow the CDS 24/28/32 ladder. */
[data-composer-card] button {
  min-height: 28px;
  border-radius: 8px;
  font-size: 13px;
}

/* 7 · Code banner: 32px strip, 11px language label. The code block box is
   display:contents around the banner, so the banner is the box's own top edge:
   without the bottom hairline the header band bleeds into the code surface. */
[data-code-block-banner] {
  box-sizing: border-box !important;
  height: 32px !important;
  min-height: 32px !important;
  padding: 0 10px !important;
  font-size: 11px !important;
  line-height: 18px !important;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--dsw-alias-border-l1) !important;
}

/* Serif everywhere: Chinese from Songti, Latin and digits from the same face
   first (Songti carries a serif Latin set), then Georgia / Times. Code keeps
   the monospace stack through --ds-font-family-code.

   The body size is Claude's 17px baseline PLUS whatever the reader picked in
   Settings -> Appearance; it is set on the root, next to the token block, so
   the --dsw-font-markdown-* values resolve it instead of shadowing it. */
body {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', Georgia, 'Times New Roman', serif !important;
  --dsw-font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', Georgia, 'Times New Roman', serif !important;
  font-variant-numeric: lining-nums tabular-nums;
  font-weight: 500;
  -webkit-text-stroke: 0.12px currentColor;
}

/* Thinking / tool process blocks: read as body text, not as a grey caption. */
[data-step-process-body],
[data-step-process-content],
[data-turn-process],
[data-turn-process-messages],
[data-turn-process-body] {
  color: var(--dsw-alias-label-primary) !important;
}

[data-step-process-body] :is(p, li, span, code),
[data-step-process-content] :is(p, li, span, code),
[data-step-process-body] .md-code-block,
[data-step-process-body] .md-code-block pre,
[data-step-process-body] .md-code-block code,
[data-step-process-body] .md-code-block span,
[data-turn-process] .md-code-block,
[data-turn-process] .md-code-block pre,
[data-turn-process] .md-code-block code,
[data-turn-process] .md-code-block span {
  color: var(--dsw-alias-label-primary) !important;
}

/* CDS round-out: jump-to-latest disc, toast pill, dialog corners.
   The host's button is a 34px disc on the floating-fill surface. Keep the
   button exactly as shipped (hit area and face), only adding the hairline
   ring and the rounded shape; anything else here fights a control this theme
   has no reason to resize. */
[class*='_toBottom']:not([class*='_toBottomSlot']) {
  corner-shape: round;
  border-radius: 999px !important;
}

[class*='_toast'] {
  border-radius: 8px !important;
  font-size: 12px !important;
  line-height: 18px !important;
  min-height: 36px !important;
}

[role='dialog'] {
  border-radius: 16px !important;
}

/* CDS scroll fade: 28px at both ends instead of the host's 24px. */
[class*='_fadeTop'] {
  mask-image: linear-gradient(#0000 0, #000 28px 100%) !important;
}

[class*='_fadeBottom'] {
  mask-image: linear-gradient(#000 0 calc(100% - 28px), #0000 100%) !important;
}

[class*='_fadeTop'][class*='_fadeBottom'] {
  mask-image: linear-gradient(#0000 0, #000 28px calc(100% - 28px), #0000 100%) !important;
}

/* Every non-code element inherits the serif face, so digits in status labels
   fall back to Songti instead of the component's own system stack. */
[data-conversation-content] :not(pre, code, kbd, samp):not(:is(pre, code, kbd, samp) *),
[data-composer-card] :not(pre, code, kbd, samp):not(:is(pre, code, kbd, samp) *),
header[data-window-drag] :not(pre, code, kbd, samp):not(:is(pre, code, kbd, samp) *) {
  font-family: inherit !important;
}

/* Terminal and log surfaces keep the code face. */
[class*='_terminal'], [class*='_terminal'] *,
[class*='_logView'], [class*='_logView'] *,
[class*='_logBody'], [class*='_logBody'] * {
  font-family: var(--ds-font-family-code, ui-monospace, Menlo, monospace) !important;
}

/* Process rows (思考 / 运行命令 / 上下文注入) carry a clay icon; the label text
   keeps its normal colour. */
[data-step-process-icon],
[data-step-process] svg,
[data-turn-process] svg,
[data-step-process] > [class*='_leading'],
[data-context-injection-body] svg {
  color: var(--dsw-alias-brand-primary-new-colorprimary-new-color) !important;
  stroke: currentColor;
}

/* 1 · Segmented control: CDS capsule track (999px) with a 2px inset and a
   raised thumb for the selected view. Layout of the header is left native. */
[data-conversation-tabs] {
  display: inline-flex !important;
  align-items: center !important;
  gap: 2px !important;
  min-height: 0 !important;
  padding: 2px !important;
  border-radius: 999px !important;
  background: rgba(0, 0, 0, 0.06) !important;
}

body[data-ds-dark-theme] [data-conversation-tabs] {
  background: rgba(255, 255, 255, 0.08) !important;
}

[data-conversation-tabs] > [role='tab'] {
  min-height: 24px !important;
  margin: 0 !important;
  padding: 3px 12px !important;
  border-radius: 999px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 18px !important;
  color: var(--dsw-alias-label-secondary) !important;
}

[data-conversation-tabs] > [role='tab']::after {
  display: none !important;
}

[data-conversation-tabs] > [role='tab'][aria-selected='true'] {
  background: var(--dsw-alias-bg-layer-1) !important;
  color: var(--dsw-alias-label-primary) !important;
  box-shadow: 0 1px 2px hsl(from #0b0b0b h s l / 8%) !important;
}

body[data-ds-dark-theme] [data-conversation-tabs] > [role='tab'][aria-selected='true'] {
  background: #2c2c2a !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4) !important;
}

@media (prefers-reduced-motion: no-preference) {
  [data-conversation-tabs] > [role='tab'] {
    transition: background-color 120ms var(--claude-spring), color 120ms var(--claude-spring);
  }
}

/* 3 · CDS spring: the 15-stop linear() curve from ClaudeMotionPresets. */
body {
  --claude-spring: linear(0, .2459, .6526, .9468, 1.0764, 1.0915, 1.0585, 1.0219,
    0.9993, .9914, .9921, .9957, .9988, 1.0004, 1);
}

@media (prefers-reduced-motion: no-preference) {
  [data-composer-card] button,
  [class*='_heroWorkspaceRow'] button,
  [class*='_panelRow'],
  [class*='_newSession'] {
    transition-timing-function: var(--claude-spring);
  }

  /* Pill overshoot: chips answer a press with a short overshooting scale.
     Only real controls: "chip" also appears in chipLabel / chipIcon /
     chipCount, and scaling a label inside its chip makes the text jump. */
  :is(button, a, [role='button'], [role='tab'], [role='option']):is([class*='_chip'], [class*='_pill']):active {
    transform: scale(0.94);
    transition: transform 300ms var(--claude-spring);
  }

  /* Reasoning glow: the running step breathes a faint clay halo. */
  [data-chat-running] [data-step-process] {
    box-shadow: 0 0 12px -4px rgba(217, 119, 87, 0.35);
    border-radius: 8px;
    transition: box-shadow 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* 6 · Skeleton dual mode: flat base and a sheen that sweeps at CDS speed. */
body {
  --dsw-alias-bg-skeleton: rgba(11, 11, 11, 0.05) !important;
}

body[data-ds-dark-theme] {
  --dsw-alias-bg-skeleton: rgba(255, 255, 255, 0.075) !important;
}

@media (prefers-reduced-motion: no-preference) {
  [class*='_skeleton'] {
    animation: claude-sheen 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }
}

@keyframes claude-sheen {
  0% { opacity: 0.75; }
  50% { opacity: 1; }
  100% { opacity: 0.75; }
}


/* ==========================================================================
   CDS effects applied to DSH surfaces that have no Claude counterpart
   ========================================================================== */

/* (The old 6px "status dot" pass is gone. [class*='_dot'] also matched the
   step glyph _step_*i3xo (a 16px slot around a check mark), and forcing it to
   6px slashed every completed step's tick down to a dot. The host's StateDot
   is already the CDS dot; it needs no resizing.) */

/* 2 · Staggered entrance (CDS "交错入场"): list rows and menu items cascade in
   by 20ms steps instead of appearing as one block. */
@media (prefers-reduced-motion: no-preference) {
  [role='menuitem'],
  [class*='_panelEntry'],
  [class*='_heroWorkspaceRow'] > * {
    animation: claude-rise 120ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  [role='menuitem']:nth-child(2), [class*='_panelEntry']:nth-child(2) { animation-delay: 20ms; }
  [role='menuitem']:nth-child(3), [class*='_panelEntry']:nth-child(3) { animation-delay: 40ms; }
  [role='menuitem']:nth-child(4), [class*='_panelEntry']:nth-child(4) { animation-delay: 60ms; }
  [role='menuitem']:nth-child(5), [class*='_panelEntry']:nth-child(5) { animation-delay: 80ms; }
  [role='menuitem']:nth-child(6), [class*='_panelEntry']:nth-child(6) { animation-delay: 100ms; }
  [role='menuitem']:nth-child(n + 7), [class*='_panelEntry']:nth-child(n + 7) { animation-delay: 120ms; }
}

/* 3 · Perceptual scroll fade on DSH's own scroll containers (tool output,
   code blocks). Five stops, tuned so the falloff reads smooth.

   Anchored on the host's own markers, not on class substrings: "_scrollRegion"
   also matches the sidebar's layout column (not a scroller) and "_codeBody"
   matches a CSS-only, scrollbar-less container in the tool rows. The sidebar
   is deliberately NOT included either: its top holds the resident New-chat
   row and the Plugins row, so a top-edge fade washes those out permanently. */
[data-conversation-content] [data-terminal][data-body],
[data-step-process] [class*='_bodyScroll'],
[data-turn-process] [class*='_bodyScroll'] {
  --claude-fade: 28px;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    rgb(0 0 0 / 12%) calc(var(--claude-fade) * 0.18),
    rgb(0 0 0 / 38%) calc(var(--claude-fade) * 0.36),
    rgb(0 0 0 / 70%) calc(var(--claude-fade) * 0.58),
    #000 var(--claude-fade),
    #000 calc(100% - var(--claude-fade)),
    rgb(0 0 0 / 70%) calc(100% - var(--claude-fade) * 0.58),
    rgb(0 0 0 / 38%) calc(100% - var(--claude-fade) * 0.36),
    rgb(0 0 0 / 12%) calc(100% - var(--claude-fade) * 0.18),
    transparent 100%
  );
}

/* 4 · Cards answer the pointer with elevation rather than a colour jump. */
@media (prefers-reduced-motion: no-preference) {
  [class*='_card'],
  [class*='_panel']:not([class*='_panelRow']) {
    transition: box-shadow 120ms cubic-bezier(0.16, 1, 0.3, 1),
      border-color 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* [class*=_card] is a SUBSTRING match, so it also selects every inner box of a
   card group (_cardContent, _cardMainRow, _cardTitle, _cardTrailing, ...) — each
   of those class names contains "_card". Lifting on :hover made a card jump and
   drop a shadow under the pointer, which reads as the layout twitching rather
   than as feedback. Block-level surfaces do not lift: they are not controls.
   The interactive bits inside (switch, button, link) keep their own states. */
[class*='_card']:not([class*='_card'] [class*='_card']):hover {
  transform: none;
  box-shadow: none;
}

body[data-ds-dark-theme] [class*='_card']:not([class*='_card'] [class*='_card']):hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.4);
}

/* Message actions: quiet tertiary icons that warm to secondary on hover or
   keyboard focus, over CDS's 120ms curve (single source for colour, opacity and
   the motion list that used to live in two other blocks). */
[data-chat-turn] [class*='_actions'] {
  color: var(--dsw-alias-label-tertiary);
  opacity: 0.8;
}

[data-chat-turn]:hover [class*='_actions'],
[data-chat-turn]:focus-within [class*='_actions'],
[class*='_actions']:hover,
[class*='_actions']:focus-within {
  color: var(--dsw-alias-label-secondary);
}

@media (prefers-reduced-motion: no-preference) {
  [data-chat-turn] [class*='_actions'] {
    transition: color 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* 5 · Tool rows: [data-step-process] / [data-turn-process] are CONTAINERS that
   wrap a header plus a collapsible body. DSH leaves them transparent, and they
   must stay that way: painting a background on the container fills the entire
   box and spills past the rounded corner as a square slab on hover. The rounded
   corner is kept for the running-state halo below. */
[data-step-process],
[data-turn-process] {
  border-radius: 8px;
}


/* ==========================================================================
   Touch and small screens
   ========================================================================== */

/* Hover effects latch on touch devices after a tap; keep the resting state
   clean there and let the active state carry the feedback instead. */
@media (hover: none) {
  [class*='_card']:hover,
  [class*='_fileCard']:hover {
    transform: none;
    box-shadow: none;
  }

  /* Touch taps latch :hover. The message-action row is the one place the
     resting colour must already be readable. */
  [data-chat-turn] [class*='_actions'] {
    color: var(--dsw-alias-label-secondary);
  }

  /* Any surviving tint would stick to whatever was last tapped. Belt and
     braces: the block-level rows are already untinted. */
  [class*='_panelEntry']:hover,
  [class*='_panelRow']:hover,
  [class*='_newSession']:hover,
  [class*='_cardContent']:hover {
    background-color: transparent !important;
    border-radius: var(--dsw-radius-lg) !important;
  }
}

/* Phones: the rail is a drawer, so the serif-lift and the tight transcript
   rhythm stay, but blocks get a little more air for thumb scrolling. */
@media (max-width: 720px) {
  [data-conversation-content] p {
    margin-bottom: 14px;
  }

  [data-conversation-content] :is(ul, ol) {
    margin: 14px 0;
  }

  [data-conversation-content] [class*='_tableScroll'],
  [data-conversation-content] [class*='_fenceSeat'] {
    margin: 14px 0 !important;
  }
}

/* Typographic polish: Noto Serif SC Bold headings (小标宋 weight), tighter
   tracking, balanced wraps. */
h1, h2, h3, h4, h5, h6,
[data-conversation-content] :is(h1, h2, h3, h4, h5, h6) {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', Georgia, serif !important;
  font-weight: 700 !important;
  letter-spacing: -0.006em !important;
  text-wrap: balance;
}

[data-conversation-content] :is(p, li, dd, blockquote) {
  text-wrap: pretty;
}

/* Inline icons sit on the text baseline, nudged down 1/8em per the CDS rule. */
[data-conversation-content] :is(p, li, dd, blockquote) svg,
[data-conversation-content] :is(p, li, dd, blockquote) img {
  vertical-align: -0.125em;
}

/* Paper selection wash and typographic rendering. */
::selection {
  background-color: rgba(198, 97, 63, 0.22);
  color: inherit;
}

body[data-ds-dark-theme] ::selection {
  background-color: rgba(217, 119, 87, 0.3);
}

html {
  background-color: var(--dsw-alias-bg-base);
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  --dsh-boot-bg: var(--dsw-alias-bg-base);
}

::placeholder {
  color: var(--dsw-alias-label-tertiary);
}

textarea,
input {
  caret-color: var(--dsw-alias-label-primary);
}

@media (prefers-reduced-motion: no-preference) {
  [data-message-bubble],
  [data-composer-card] {
    transition: background-color 120ms cubic-bezier(0.2, 0, 0, 1), box-shadow 120ms cubic-bezier(0.2, 0, 0, 1);
  }

  /* New turns rise in; streaming turns are exempt so tokens never flash. */
  [data-chat-turn] {
    animation: claude-rise 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  [data-chat-turn][data-streaming] {
    animation: none;
  }

  [class*='_panelEntry'],
  [class*='_panelRow'],
  [role='menuitem'],
  [data-composer-card] button,
  [class*='_toBottom']:not([class*='_toBottomSlot']) {
    transition: background-color 120ms cubic-bezier(0.16, 1, 0.3, 1),
      color 120ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 120ms cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  [data-composer-card] button:active:not(:disabled) {
    transform: scale(0.96);
  }

  /* Cards lift a hair on hover. */
  [class*='_fileCard'] {
    transition: transform 120ms cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 120ms cubic-bezier(0.16, 1, 0.3, 1),
      border-color 120ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  [class*='_fileCard']:hover {
    transform: translateY(-1px);
  }

  /* Rail rows answer a press. */
  [class*='_panelRow']:active,
  [class*='_newSession']:active {
    transform: scale(0.985);
  }

  /* The running step breathes instead of spinning. */
  [data-chat-running] [data-step-process] svg {
    animation: claude-breathe 1.9s ease-in-out infinite;
  }
}

/* CDS 4.4212 documents the action-row reveal with @starting-style: the first
   frame after the row becomes hovered starts low and transparent. */
@starting-style {
  [data-chat-turn]:hover [class*='_actions'],
  [data-chat-turn]:focus-within [class*='_actions'] {
    opacity: 0.4;
    transform: translateY(2px);
  }
}

@keyframes claude-rise {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}

@keyframes claude-breathe {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`

const client = `/* Claude theme for DeepSeek Harness — generated by scripts/build.mjs. */
window.__ModuleLoader__.load({
  id: 'dsh-theme-claude',
  factory() {
    const CSS = ${JSON.stringify(css)}
    return {
      apply(ctx) {
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = 'dsh-theme-claude'
          tag.dataset.pluginCss = 'dsh-theme-claude/claude-theme.css'
          tag.textContent = CSS
          document.head.appendChild(tag)
          return () => { tag.remove() }
        }, 'claude-theme: stylesheet')
      },
    }
  },
})
`

writeFileSync(join(root, 'theme.css'), css)
writeFileSync(join(root, 'client.js'), client)
console.log(`theme.css ${css.length} bytes · client.js ${client.length} bytes`)
