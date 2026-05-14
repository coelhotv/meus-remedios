// dosiq-primitives.jsx
// Reusable mobile UI primitives that match the Dosiq MVP visual language.
// Stick to: white surfaces over #f4f5f7 bg, teal primary, soft badges,
// rounded-xl cards, generous spacing, and bold-but-readable type.

const { DOSIQ } = window;
const {
  IconChevronRight, IconChevronDown, IconChevronUp, IconPlus, IconSearch,
  IconCheck, IconAlert, IconArrowLeft, IconCalendar, IconPill, IconBox,
  IconUser, IconClose, IconTrash, IconEdit, IconMore,
} = window.DosiqIcons;

// ─── Type helpers ────────────────────────────────────────────────────────────
const T = ({ variant = 'body', color, weight, children, style = {}, ...rest }) => {
  const s = DOSIQ.type[variant] || DOSIQ.type.body;
  return (
    <span style={{
      fontFamily: DOSIQ.font.sans,
      fontSize: s.size,
      fontWeight: weight || s.weight,
      lineHeight: s.lh,
      letterSpacing: s.ls,
      textTransform: s.uppercase ? 'uppercase' : 'none',
      color: color || DOSIQ.color.ink,
      ...style,
    }} {...rest}>{children}</span>
  );
};

// ─── Device-screen wrapper ──────────────────────────────────────────────────
// Renders an inner column with the proper page bg + optional bottom tab bar.
const DosiqScreen = ({ children, withTabs = true, activeTab = 'tratamentos', scroll = true, padBottom = 0 }) => (
  <div style={{
    width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
    background: DOSIQ.color.bg, fontFamily: DOSIQ.font.sans,
    color: DOSIQ.color.ink, position: 'relative',
  }}>
    <div style={{
      flex: 1, minHeight: 0, overflow: scroll ? 'auto' : 'hidden',
      paddingBottom: padBottom,
    }}>
      {children}
    </div>
    {withTabs && <DosiqTabBar active={activeTab} />}
  </div>
);

// ─── App bar (with back + title) ────────────────────────────────────────────
const DosiqAppBar = ({ title, onBack, trailing }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 4,
    padding: '8px 8px 8px 4px',
    background: DOSIQ.color.bg,
  }}>
    <button style={iconBtn} aria-label="Voltar">
      <IconArrowLeft s={22} c={DOSIQ.color.ink} sw={2} />
    </button>
    <div style={{ flex: 1, minWidth: 0 }}>
      <T variant="titleMD" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</T>
    </div>
    {trailing}
  </div>
);

// ─── Large display header (used on root screens) ────────────────────────────
const DosiqLargeHeader = ({ title, subtitle, trailing }) => (
  <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <T variant="titleXL" style={{ display: 'block' }}>{title}</T>
      {subtitle && (
        <T variant="body" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 4 }}>{subtitle}</T>
      )}
    </div>
    {trailing}
  </div>
);

const iconBtn = {
  width: 40, height: 40, borderRadius: 999, background: 'transparent',
  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, cursor: 'pointer', flexShrink: 0,
};

// ─── Card / Section ─────────────────────────────────────────────────────────
const DosiqCard = ({ children, style = {}, onPress }) => (
  <div style={{
    background: DOSIQ.color.surface,
    borderRadius: DOSIQ.radius.lg,
    boxShadow: DOSIQ.shadow.card,
    overflow: 'hidden',
    ...style,
  }}>{children}</div>
);

const DosiqSection = ({ title, action, children, style = {} }) => (
  <div style={{ ...style }}>
    {(title || action) && (
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 20px 8px', gap: 12,
      }}>
        {title && <T variant="eyebrow" color={DOSIQ.color.inkSubtle}>{title}</T>}
        {action}
      </div>
    )}
    {children}
  </div>
);

// ─── Badge (soft, paired fg/bg) ─────────────────────────────────────────────
const VARIANTS = {
  primary: { bg: DOSIQ.color.primarySoft, fg: DOSIQ.color.primarySoftFg },
  success: { bg: DOSIQ.color.successSoft, fg: DOSIQ.color.successSoftFg },
  warning: { bg: DOSIQ.color.warningSoft, fg: DOSIQ.color.warningSoftFg },
  danger:  { bg: DOSIQ.color.dangerSoft,  fg: DOSIQ.color.dangerSoftFg },
  info:    { bg: DOSIQ.color.infoSoft,    fg: DOSIQ.color.infoSoftFg },
  neutral: { bg: '#f1f5f9', fg: DOSIQ.color.inkMuted },
};
const DosiqBadge = ({ variant = 'neutral', icon, children, style = {} }) => {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: v.bg, color: v.fg,
      borderRadius: 999, padding: '4px 10px',
      fontFamily: DOSIQ.font.sans,
      fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
      textTransform: 'uppercase', whiteSpace: 'nowrap',
      ...style,
    }}>
      {icon}
      {children}
    </span>
  );
};

// ─── Dosage pill (e.g. "50mg") ──────────────────────────────────────────────
const DosiqDosagePill = ({ children, style = {} }) => (
  <span style={{
    display: 'inline-block', background: '#eef2f6', color: DOSIQ.color.inkSoft,
    fontFamily: DOSIQ.font.sans, fontSize: 13, fontWeight: 600,
    padding: '3px 9px', borderRadius: 6, lineHeight: 1.3,
    ...style,
  }}>{children}</span>
);

// ─── Button ─────────────────────────────────────────────────────────────────
const DosiqButton = ({
  variant = 'primary', size = 'md', icon, iconRight, children,
  block = false, style = {},
}) => {
  const variants = {
    primary:    { bg: DOSIQ.color.primary,  fg: '#fff', bd: 'transparent' },
    secondary:  { bg: '#fff', fg: DOSIQ.color.primary, bd: DOSIQ.color.primary },
    amber:      { bg: DOSIQ.color.amber, fg: DOSIQ.color.amberFg, bd: 'transparent' },
    ghost:      { bg: 'transparent', fg: DOSIQ.color.primary, bd: 'transparent' },
    danger:     { bg: DOSIQ.color.danger, fg: '#fff', bd: 'transparent' },
    dangerSoft: { bg: DOSIQ.color.dangerSoft, fg: DOSIQ.color.dangerSoftFg, bd: 'transparent' },
    neutral:    { bg: '#fff', fg: DOSIQ.color.ink, bd: DOSIQ.color.border },
  };
  const v = variants[variant];
  const sizes = {
    sm: { h: 36, px: 14, fs: 13 },
    md: { h: 48, px: 18, fs: 15 },
    lg: { h: 56, px: 22, fs: 16 },
  };
  const z = sizes[size];
  return (
    <button style={{
      height: z.h, padding: `0 ${z.px}px`,
      background: v.bg, color: v.fg,
      border: `1.5px solid ${v.bd}`,
      borderRadius: DOSIQ.radius.lg,
      fontFamily: DOSIQ.font.sans,
      fontSize: z.fs, fontWeight: 700,
      letterSpacing: '-0.005em',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, cursor: 'pointer',
      width: block ? '100%' : 'auto',
      ...style,
    }}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  );
};

// ─── Bottom tab bar (4 tabs) ────────────────────────────────────────────────
const TABS = [
  { key: 'hoje', label: 'Hoje', icon: IconCalendar },
  { key: 'tratamentos', label: 'Tratamentos', icon: IconPill },
  { key: 'estoque', label: 'Estoque', icon: IconBox },
  { key: 'perfil', label: 'Perfil', icon: IconUser },
];
const DosiqTabBar = ({ active = 'tratamentos' }) => (
  <div style={{
    height: 64, paddingTop: 6, paddingBottom: 4,
    background: '#fff', borderTop: `1px solid ${DOSIQ.color.borderSoft}`,
    display: 'flex',
  }}>
    {TABS.map(({ key, label, icon: Icon }) => {
      const isActive = key === active;
      const color = isActive ? DOSIQ.color.primary : DOSIQ.color.inkSubtle;
      return (
        <div key={key} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <Icon s={24} c={color} sw={isActive ? 2.2 : 1.8} />
          <T variant="caption" color={color} weight={isActive ? 600 : 500}>{label}</T>
        </div>
      );
    })}
  </div>
);

// ─── FAB ────────────────────────────────────────────────────────────────────
const DosiqFAB = ({ label, icon, bottom = 88, right = 20, extended = true, onClick }) => (
  <div style={{
    position: 'absolute', right, bottom, zIndex: 5,
    height: 56, padding: extended ? '0 22px 0 18px' : 0, width: extended ? 'auto' : 56,
    minWidth: 56,
    background: DOSIQ.color.primary, color: '#fff',
    borderRadius: 999, boxShadow: DOSIQ.shadow.fab,
    display: 'flex', alignItems: 'center', gap: 10,
    fontFamily: DOSIQ.font.sans, fontWeight: 700, fontSize: 15,
    justifyContent: 'center',
  }}>
    {icon || <IconPlus s={22} c="#fff" sw={2.4} />}
    {extended && <span>{label}</span>}
  </div>
);

// ─── Form field (label + input wrapper) ─────────────────────────────────────
const DosiqLabel = ({ children, required, hint }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
    <T variant="label" color={DOSIQ.color.inkMuted}>{children}</T>
    {required && <T variant="caption" color={DOSIQ.color.danger}>*</T>}
    {hint && <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ marginLeft: 'auto' }}>{hint}</T>}
  </div>
);

const inputStyle = (focused, error) => ({
  width: '100%', height: 50, padding: '0 14px',
  background: '#fff',
  border: `1.5px solid ${error ? DOSIQ.color.danger : focused ? DOSIQ.color.primary : DOSIQ.color.border}`,
  borderRadius: DOSIQ.radius.md,
  fontFamily: DOSIQ.font.sans, fontSize: 15, fontWeight: 500,
  color: DOSIQ.color.ink, outline: 'none', boxSizing: 'border-box',
});

const DosiqInput = ({ value, placeholder, focused, error, icon, suffix, trailing }) => (
  <div style={{ position: 'relative' }}>
    <div style={{
      ...inputStyle(focused, error),
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {icon}
      <span style={{
        flex: 1, color: value ? DOSIQ.color.ink : DOSIQ.color.inkSubtle,
        fontWeight: value ? 500 : 400,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{value || placeholder}</span>
      {suffix && <T variant="body" color={DOSIQ.color.inkMuted} style={{ flexShrink: 0 }}>{suffix}</T>}
      {trailing}
    </div>
  </div>
);

const DosiqSelect = ({ value, placeholder, focused, error }) => (
  <DosiqInput value={value} placeholder={placeholder} focused={focused} error={error}
    trailing={<IconChevronDown s={18} c={DOSIQ.color.inkMuted} />} />
);

const DosiqField = ({ label, required, hint, error, errorText, children }) => (
  <div>
    <DosiqLabel required={required} hint={hint}>{label}</DosiqLabel>
    {children}
    {error && errorText && (
      <T variant="caption" color={DOSIQ.color.danger} style={{ display: 'block', marginTop: 6 }}>{errorText}</T>
    )}
  </div>
);

// ─── Bottom sheet (modal) ──────────────────────────────────────────────────
const DosiqBottomSheet = ({ children, title, peek = 'half', onClose }) => (
  <div style={{
    position: 'absolute', inset: 0, zIndex: 20,
    background: DOSIQ.color.overlay,
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  }}>
    <div style={{
      background: '#fff', borderRadius: '24px 24px 0 0',
      boxShadow: DOSIQ.shadow.sheet, maxHeight: '85%',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#cbd5e1' }} />
      </div>
      {title && (
        <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <T variant="titleLG" style={{ flex: 1 }}>{title}</T>
          {onClose && <button style={iconBtn} aria-label="Fechar"><IconClose s={20} c={DOSIQ.color.inkMuted}/></button>}
        </div>
      )}
      {children}
    </div>
  </div>
);

// ─── Subtle striped placeholder ─────────────────────────────────────────────
const DosiqStripe = ({ width = '100%', height = 80, label, style = {} }) => (
  <div style={{
    width, height,
    background: `repeating-linear-gradient(
      135deg, #eef2f6 0 8px, #f6f8fa 8px 16px)`,
    borderRadius: DOSIQ.radius.md,
    border: `1px dashed ${DOSIQ.color.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    ...style,
  }}>
    {label && (
      <span style={{
        fontFamily: DOSIQ.font.mono, fontSize: 11, fontWeight: 500,
        color: DOSIQ.color.inkSubtle, letterSpacing: '0.04em',
      }}>{label}</span>
    )}
  </div>
);

// ─── Detail row (label : value) ─────────────────────────────────────────────
const DosiqDetailRow = ({ label, value, valueColor, divider = true }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 16,
    padding: '14px 16px',
    borderBottom: divider ? `1px solid ${DOSIQ.color.borderSoft}` : 'none',
  }}>
    <T variant="body" color={DOSIQ.color.inkMuted}>{label}</T>
    <T variant="bodyStr" color={valueColor || DOSIQ.color.ink} style={{ marginLeft: 'auto', textAlign: 'right' }}>
      {value}
    </T>
  </div>
);

// ─── Generic medicine list item card ────────────────────────────────────────
const DosiqMedicineRow = ({ icon, iconBg = '#ecfdf5', title, subtitle, badge, trailing, onPress }) => (
  <div style={{
    background: '#fff', borderRadius: DOSIQ.radius.lg,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: DOSIQ.shadow.card,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: iconBg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <T variant="titleMD" style={{
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180,
        }}>{title}</T>
        {badge && <DosiqDosagePill>{badge}</DosiqDosagePill>}
      </div>
      {subtitle && (
        <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ display: 'block', marginTop: 3 }}>{subtitle}</T>
      )}
    </div>
    {trailing || <IconChevronRight s={18} c={DOSIQ.color.inkSubtle} />}
  </div>
);

Object.assign(window, {
  T, DosiqScreen, DosiqAppBar, DosiqLargeHeader, DosiqCard, DosiqSection,
  DosiqBadge, DosiqDosagePill, DosiqButton, DosiqTabBar, DosiqFAB,
  DosiqLabel, DosiqInput, DosiqSelect, DosiqField, DosiqBottomSheet,
  DosiqStripe, DosiqDetailRow, DosiqMedicineRow, iconBtn,
});
