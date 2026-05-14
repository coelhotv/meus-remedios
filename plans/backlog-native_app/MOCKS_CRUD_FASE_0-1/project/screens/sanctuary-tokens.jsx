// sanctuary-tokens.jsx
// Tokens, ícones e primitivos compartilhados entre as variações.
// Todos os valores vêm do DESIGN-SYSTEM.md (Therapeutic Sanctuary).

const T = {
  // Surface tiers (no-line rule)
  surface: '#f8fafb',
  surfaceLow: '#f2f4f5',
  surfaceLowest: '#ffffff',

  // Brand
  primary: '#006a5e',
  primaryContainer: '#008577',
  primaryFixed: '#90f4e3',
  secondary: '#005db6',
  secondaryFixed: '#d6e3ff',
  tertiary: '#ffdea8',
  tertiaryDeep: '#5a3d00',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  success: '#4fb3a4',

  // Text
  onSurface: '#191c1d',
  onSurfaceMuted: 'rgba(25,28,29,0.55)',
  onSurfaceFaint: 'rgba(25,28,29,0.40)',

  // Effects
  ghostBorder: 'rgba(25,28,29,0.08)',
  ambientShadow: '0 24px 24px rgba(25,28,29,0.04)',
  ambientShadowSm: '0 4px 12px rgba(25,28,29,0.04)',
  primaryGradient: 'linear-gradient(135deg, #006a5e 0%, #008577 100%)',
  primaryGradientShadow: '0 8px 24px rgba(0, 106, 94, 0.20)',
  glassBg: 'rgba(248, 250, 251, 0.80)',

  // Type
  fontDisplay: '"Public Sans", -apple-system, system-ui, sans-serif',
  fontBody: 'Lexend, -apple-system, system-ui, sans-serif',
};

// ─────────────────────────────────────────────────────────────
// Ícones (stroke 1.75, 24px). Outlined per design system.
// ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 24, color = 'currentColor', strokeWidth = 1.75 }) => {
  const paths = {
    bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
    'bell-off': 'M3 3l18 18M9.4 5A6 6 0 0 1 18 8c0 4 1 6 2 7M5.5 9.5C5.2 13 3 15 3 17h13M10.3 21a1.94 1.94 0 0 0 3.4 0',
    chevron: 'M9 6l6 6-6 6',
    'chevron-down': 'M6 9l6 6 6-6',
    back: 'M19 12H5M12 19l-7-7 7-7',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    pill: 'M10.5 20.5a7.07 7.07 0 1 1 10-10l-10 10zM8.5 8.5l7 7',
    pillSimple: 'M19 5L5 19M5 5a4.95 4.95 0 0 1 7 7l-7 7a4.95 4.95 0 1 1-7-7L5 5z',
    box: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    check: 'M20 6L9 17l-5-5',
    checkAll: 'M18 6L9.7 14.3 8 12.6m11-6.6l-7 7M5 12l3 3M14 7l3-3',
    plus: 'M12 5v14M5 12h14',
    plane: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    smartphone: 'M5 2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01',
    mail: 'M3 7l9 6 9-6M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    moon: 'M21 13a9 9 0 1 1-9-9 7 7 0 0 0 9 9z',
    package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    qr: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h2M19 14v3M14 19h2v2h-2zM19 21h2v-3M14 17h2',
    copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    spark: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
    paperPlane: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    arrow: 'M5 12h14M12 5l7 7-7 7',
    snooze: 'M6 19v-2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M9 9h6M9 13h6M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0z',
    'alarm-off': 'M2 2l20 20M6.87 6.87A8 8 0 0 0 12 20a7.97 7.97 0 0 0 5.13-1.87M12 4a8 8 0 0 1 7.46 11M5 4l-2 2M19 4l2 2M17 17l3-3M3 14l4-4',
    sun: 'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
    sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    sparkles: 'M12 3l1.5 5L18 9.5 13.5 11 12 16l-1.5-5L6 9.5 10.5 8z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    'check-circle': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
    coffee: 'M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3',
    'volume-off': 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={paths[name] || ''} />
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Status bar e bottom nav (compartilhados)
// ─────────────────────────────────────────────────────────────
const StatusBar = ({ time = '7:43' }) => (
  <div style={{
    height: 28, padding: '0 20px', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    fontFamily: T.fontBody, fontSize: 14, fontWeight: 500,
    color: T.onSurface, flexShrink: 0, background: 'transparent',
  }}>
    <span>{time}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
        <path d="M7.5 2C9.7 2 11.7 2.85 13.2 4.25L14.5 2.95C12.6 1.1 10.15 0 7.5 0S2.4 1.1.5 2.95L1.8 4.25C3.3 2.85 5.3 2 7.5 2zM7.5 6c1.1 0 2.1.45 2.85 1.15L11.65 5.85C10.55 4.7 9.1 4 7.5 4S4.45 4.7 3.35 5.85L4.65 7.15C5.4 6.45 6.4 6 7.5 6z" fill={T.onSurface}/>
        <circle cx="7.5" cy="9.5" r="1.5" fill={T.onSurface}/>
      </svg>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 8h2v3H1zM5 6h2v5H5zM9 4h2v7H9zM13 1h2v10h-2z" fill={T.onSurface}/>
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
        <rect x="0.5" y="1" width="18" height="9" rx="2" stroke={T.onSurface} strokeWidth="1" fill="none"/>
        <rect x="2" y="2.5" width="15" height="6" rx="1" fill={T.onSurface}/>
        <rect x="19.5" y="3.5" width="1.5" height="4" rx="0.5" fill={T.onSurface}/>
      </svg>
    </div>
  </div>
);

const BottomNav = ({ active = 'perfil' }) => {
  const items = [
    { id: 'hoje', label: 'Hoje', icon: 'calendar' },
    { id: 'tratamentos', label: 'Tratamentos', icon: 'pillSimple' },
    { id: 'estoque', label: 'Estoque', icon: 'package' },
    { id: 'perfil', label: 'Perfil', icon: 'user' },
  ];
  return (
    <div style={{
      height: 64, padding: '8px 0 12px', flexShrink: 0,
      background: T.glassBg, backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      fontFamily: T.fontBody, borderTop: `1px solid ${T.ghostBorder}`,
    }}>
      {items.map(it => {
        const isActive = it.id === active;
        return (
          <div key={it.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: isActive ? T.primary : T.onSurfaceFaint,
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 200ms ease-out',
          }}>
            <Icon name={it.icon} size={22} strokeWidth={isActive ? 2 : 1.6} />
            <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 500, letterSpacing: 0.2 }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const HomeIndicator = () => (
  <div style={{ height: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: T.glassBg, flexShrink: 0 }}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.onSurface} strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/></svg>
    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${T.onSurface}` }}/>
    <div style={{ width: 14, height: 14, border: `1.5px solid ${T.onSurface}` }}/>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Phone shell — mantém proporção e fontes consistentes
// ─────────────────────────────────────────────────────────────
const Phone = ({ children, bg = T.surface, time = '7:43' }) => (
  <div style={{
    width: 380, height: 780, display: 'flex', flexDirection: 'column',
    background: bg, fontFamily: T.fontBody, color: T.onSurface,
    overflow: 'hidden', position: 'relative',
  }}>
    <StatusBar time={time} />
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  </div>
);

Object.assign(window, { T, Icon, StatusBar, BottomNav, HomeIndicator, Phone });
