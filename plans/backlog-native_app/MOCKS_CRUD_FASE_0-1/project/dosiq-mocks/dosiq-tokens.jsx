// dosiq-tokens.jsx
// Design tokens para o app nativo Dosiq, derivados das 3 screens MVP
// (Hoje / Tratamentos / Estoque). Teal como cor primária; surfaces brancos
// sobre fundo cinza-claro; badges suaves com par fg/bg em mesmo hue.

const DOSIQ = {
  font: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Liberation Mono", "Courier New", monospace',
  },
  color: {
    // surfaces
    bg: '#f4f5f7',          // page background (cinza muito claro)
    bgSubtle: '#fafbfc',
    surface: '#ffffff',
    surfaceMuted: '#f8fafc',
    overlay: 'rgba(15, 23, 42, 0.45)',

    // ink (text)
    ink: '#0f172a',          // primary text
    inkSoft: '#1f2937',
    inkMuted: '#475569',     // secondary text
    inkSubtle: '#94a3b8',    // tertiary, captions
    inkInverse: '#ffffff',

    // borders
    border: '#e2e8f0',
    borderSoft: '#eef2f6',
    borderStrong: '#cbd5e1',

    // primary — teal (cor da identidade da app)
    primary: '#0f766e',
    primaryHover: '#115e59',
    primaryPressed: '#0d5d56',
    primarySoft: '#ccfbf1',
    primarySoftFg: '#0f766e',
    primaryBg: '#ecfdf5',

    // status
    success: '#15803d',
    successSoft: '#dcfce7',
    successSoftFg: '#15803d',

    warning: '#b45309',
    warningSoft: '#fef3c7',
    warningSoftFg: '#b45309',
    warningSurface: '#fffbeb',  // bg do card "3 PENDÊNCIAS"
    warningEdge: '#fcd34d',     // borda amarela do mesmo card

    danger: '#b91c1c',
    dangerSoft: '#fee2e2',
    dangerSoftFg: '#b91c1c',

    info: '#1d4ed8',
    infoSoft: '#dbeafe',
    infoSoftFg: '#1d4ed8',
    infoRing: '#3b82f6',        // anel do "86% Adesão"

    // amber filled CTA ("Confirmar agora")
    amber: '#f59e0b',
    amberPressed: '#d97706',
    amberFg: '#1f2937',
  },
  space: { 1:4, 2:8, 3:12, 4:16, 5:20, 6:24, 7:28, 8:32, 10:40, 12:48 },
  radius: { sm:8, md:12, lg:16, xl:20, pill: 999 },
  shadow: {
    card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.04)',
    raised: '0 4px 12px rgba(15,23,42,0.06), 0 2px 6px rgba(15,23,42,0.04)',
    sheet: '0 -12px 32px rgba(15,23,42,0.18)',
    fab: '0 8px 24px rgba(15,118,110,0.35), 0 2px 6px rgba(15,118,110,0.2)',
  },
  // text scale (mobile, in px)
  type: {
    display: { size: 28, weight: 700, lh: 1.15, ls: '-0.02em' },
    titleXL: { size: 26, weight: 700, lh: 1.2,  ls: '-0.02em' },
    titleLG: { size: 20, weight: 700, lh: 1.25, ls: '-0.015em' },
    titleMD: { size: 17, weight: 600, lh: 1.3,  ls: '-0.01em' },
    body:    { size: 15, weight: 400, lh: 1.4,  ls: '0' },
    bodyStr: { size: 15, weight: 600, lh: 1.4,  ls: '0' },
    label:   { size: 13, weight: 500, lh: 1.3,  ls: '0' },
    caption: { size: 12, weight: 500, lh: 1.3,  ls: '0.01em' },
    eyebrow: { size: 11, weight: 700, lh: 1.2,  ls: '0.08em', uppercase: true },
  },
};

window.DOSIQ = DOSIQ;
