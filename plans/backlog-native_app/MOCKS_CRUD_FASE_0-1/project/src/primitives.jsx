// Primitives — reusable atoms matching the Therapeutic Sanctuary spec.

const { SANCTUARY: SX, TYPE: TY } = window;

// Status pill for stock — semantic calendar icons per spec §5a
function StockPill({ status, days }) {
  const cfg = {
    high:     { bg: '#eef3fb', fg: '#005db6', label: 'Estoque bom',    icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z M9 13l2 2 4-4' },
    normal:   { bg: '#ecfdf5', fg: '#0d9488', label: 'Normal',         icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z M9 14l2 2 4-4' },
    low:      { bg: '#fef3c7', fg: '#904d00', label: 'Repor em breve', icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z M12 11v3 M12 17h.01' },
    critical: { bg: '#fee2e2', fg: '#ba1a1a', label: 'Crítico',        icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z M9 13l6 6M15 13l-6 6' },
  }[status] || { bg: '#f1f4f9', fg: '#44474e', label: '—', icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z' };

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px 5px 8px', borderRadius: 9999,
      background: cfg.bg, fontFamily: TY.body, fontSize: 12.5,
      fontWeight: 500, color: cfg.fg, whiteSpace: 'nowrap',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={cfg.icon}/>
      </svg>
      <span>{cfg.label}{days != null ? ` · ${days}d` : ''}</span>
    </div>
  );
}

// Adherence label — human language verdict (Dona Maria)
function AdherenceLabel({ score }) {
  let cfg;
  if (score >= 90) cfg = { bg: '#ecfdf5', fg: '#0d7968', text: 'Tratamento em dia' };
  else if (score >= 70) cfg = { bg: '#f1f4f9', fg: '#44474e', text: 'Algumas doses perdidas' };
  else if (score >= 50) cfg = { bg: '#fef3c7', fg: '#904d00', text: 'Tratamento em risco' };
  else cfg = { bg: '#fee2e2', fg: '#ba1a1a', text: 'Muitas doses perdidas' };
  return (
    <span style={{
      display: 'inline-flex', padding: '4px 10px', borderRadius: 9999,
      background: cfg.bg, color: cfg.fg, fontFamily: TY.body,
      fontSize: 12, fontWeight: 500, letterSpacing: 0.05,
    }}>{cfg.text}</span>
  );
}

// Ring gauge — 12pt stroke per spec §5
function RingGauge({ value = 0, size = 124, stroke = 12, accent, trackColor, centerTop, centerBottom }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c * (1 - pct / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor || '#d6e3ff'} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={accent || SX.accents.emerald.fixed} strokeWidth={stroke} fill="none"
                strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <div style={{ fontFamily: TY.display, fontWeight: 700, fontSize: size * 0.22, color: SX.onSurface, lineHeight: 1 }}>
          {centerTop ?? `${Math.round(pct)}%`}
        </div>
        <div style={{ fontFamily: TY.body, fontSize: 11, color: SX.onSurfaceVar, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {centerBottom ?? 'Adesão'}
        </div>
      </div>
    </div>
  );
}

// Primary CTA — 64px, gradient primary → primary_container
function PrimaryCTA({ children, accent, onClick, tall = true, icon }) {
  const a = accent || SX.accents.emerald;
  return (
    <button onClick={onClick} style={{
      height: tall ? 64 : 52, width: '100%',
      border: 'none', cursor: 'pointer',
      borderRadius: 16,
      background: `linear-gradient(135deg, ${a.base} 0%, ${a.dark} 100%)`,
      color: a.on || '#fff',
      fontFamily: TY.body, fontSize: tall ? 17 : 15, fontWeight: 600, letterSpacing: 0.1,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: `0 10px 24px ${a.base}33`,
    }}>
      {icon}
      {children}
    </button>
  );
}

// Card w/ ambient shadow — no borders
function SanctuaryCard({ children, level = 2, pad = 20, style = {}, onClick }) {
  const bg = level === 2 ? SX.surfaceContainerLowest
           : level === 1 ? SX.surfaceContainerLow
           : SX.surface;
  return (
    <div onClick={onClick} style={{
      background: bg, borderRadius: 20, padding: pad,
      boxShadow: level === 2 ? SX.shadow : 'none',
      ...style,
    }}>{children}</div>
  );
}

// Progress bar (stock/refill) — 8px, rounded-full
function ProgressBar({ value = 0, threshold = 20, accent }) {
  const low = value < threshold;
  const a = accent || SX.accents.emerald;
  return (
    <div style={{ height: 8, background: SX.surfaceContainerLow, borderRadius: 9999, overflow: 'hidden' }}>
      <div style={{
        width: `${Math.max(3, Math.min(100, value))}%`,
        height: '100%',
        background: low ? SX.error : a.base,
        borderRadius: 9999,
        transition: 'width 400ms ease',
      }}/>
    </div>
  );
}

// Pill (for dose badges, medicine concentration)
function ConcentrationPill({ children }) {
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 8px', borderRadius: 6,
      background: SX.surfaceContainerLow, color: SX.onSurfaceVar,
      fontFamily: TY.mono, fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
    }}>{children}</span>
  );
}

// Leading icon bubble (secondary_fixed circle per spec)
function IconBubble({ children, size = 44, tone = 'secondary' }) {
  const bg = tone === 'primary' ? SX.accents.emerald.bg
           : tone === 'warm' ? '#fff3e0'
           : SX.secondaryFixed;
  const fg = tone === 'primary' ? SX.accents.emerald.dark
           : tone === 'warm' ? SX.tertiaryDeep
           : SX.secondary;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{children}</div>
  );
}

Object.assign(window, {
  StockPill, AdherenceLabel, RingGauge, PrimaryCTA, SanctuaryCard,
  ProgressBar, ConcentrationPill, IconBubble,
});
