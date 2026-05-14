// Sanctuary Terapêutico — design tokens grounded in the actual monorepo.
// Pulled from shared/styles/tokens.js (mobile) + DESIGN-SYSTEM.md semantics.
// We reconcile the two: mobile uses Emerald #14b8a6 + Deep Blue #005db6; the
// spec describes a Verde Saúde primary. We expose both via the `accent` tweak.

const SANCTUARY = {
  // Surface tiers (No-Line Rule)
  surface:              '#f8fafb',  // Level 0 — screen bg
  surfaceContainerLow:  '#f1f4f9',  // Level 1 — subtle sections
  surfaceContainerLowest:'#ffffff', // Level 2 — active cards
  surfaceBlush:         '#f5f0ec',  // warm neutral alt for "editorial" variant

  // Primary — user can tweak between three calibrations
  accents: {
    emerald: { base: '#14b8a6', dark: '#0d9488', fixed: '#90f4e3', bg: '#ecfdf5', on: '#ffffff' },
    teal:    { base: '#006a5e', dark: '#00473f', fixed: '#90f4e3', bg: '#e4f5f1', on: '#ffffff' },
    blue:    { base: '#005db6', dark: '#003f7a', fixed: '#d6e3ff', bg: '#eef3fb', on: '#ffffff' },
  },

  secondary:      '#005db6',
  secondaryFixed: '#d6e3ff',

  tertiary:       '#ffdea8',
  tertiaryDeep:   '#904d00',

  error:          '#ba1a1a',
  errorBg:        '#fee2e2',

  success:        '#4fb3a4',
  warning:        '#f59e0b',
  warningBg:      '#fef3c7',

  // Text — never pure black
  onSurface:      '#191c1d',
  onSurfaceVar:   '#44474e',
  onSurfaceMuted: '#71777f',
  outlineVariant: 'rgba(113, 119, 127, 0.15)',

  // Ambient shadow (24px blur / 4% opacity)
  shadow: '0 8px 24px rgba(25, 28, 29, 0.04)',
  shadowLg: '0 12px 32px rgba(25, 28, 29, 0.06)',
};

const TYPE = {
  display: "'Public Sans', 'SF Pro Display', system-ui, sans-serif",
  body:    "'Lexend', 'SF Pro Text', system-ui, sans-serif",
  mono:    "'SF Mono', ui-monospace, monospace",
};

window.SANCTUARY = SANCTUARY;
window.TYPE = TYPE;
