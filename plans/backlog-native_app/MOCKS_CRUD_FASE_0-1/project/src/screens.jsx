// Supporting screens: Stock, Medicine Detail, Register Dose, Treatments, Calendar.
// Shared across all three dashboard variations.

const { SANCTUARY: S, TYPE: T } = window;
const {
  StockPill, AdherenceLabel, RingGauge, PrimaryCTA, SanctuaryCard,
  ProgressBar, ConcentrationPill, IconBubble,
} = window;

// ─── Shared section header ─────────────────────────────────────
function SectionHeader({ title, subtitle, trailing }) {
  return (
    <div style={{ padding: '24px 20px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 700, color: S.onSurface, letterSpacing: -0.4, lineHeight: 1.1 }}>
            {title}
          </div>
          {subtitle && <div style={{ fontFamily: T.body, fontSize: 13.5, color: S.onSurfaceVar, marginTop: 4 }}>{subtitle}</div>}
        </div>
        {trailing}
      </div>
    </div>
  );
}

// Small header "add" button per spec
function HeaderAddButton({ accent }) {
  return (
    <button style={{
      width: 44, height: 44, borderRadius: 14, border: 'none',
      background: accent.base, color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 6px 16px ${accent.base}40`,
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14"/>
      </svg>
    </button>
  );
}

// ─── SCREEN: Stock (Estoque) ───────────────────────────────────
const MOCK_STOCK = [
  { name: 'Metformina',    conc: '500mg', current: 42, initial: 60, days: 21, status: 'high',     form: 'comprimido' },
  { name: 'Losartana',     conc: '50mg',  current: 18, initial: 30, days: 9,  status: 'normal',   form: 'comprimido' },
  { name: 'Sertralina',    conc: '50mg',  current: 5,  initial: 30, days: 5,  status: 'critical', form: 'comprimido' },
  { name: 'Rosuvastatina', conc: '10mg',  current: 8,  initial: 30, days: 8,  status: 'low',      form: 'comprimido' },
  { name: 'Vitamina D',    conc: '2000UI',current: 28, initial: 30, days: 28, status: 'high',     form: 'gotas' },
];

function ScreenEstoque({ accent }) {
  const critical = MOCK_STOCK.filter(m => m.status === 'critical' || m.status === 'low');
  const rest = MOCK_STOCK.filter(m => m.status !== 'critical' && m.status !== 'low');
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      <SectionHeader title="Estoque" subtitle="5 medicamentos em casa" trailing={<HeaderAddButton accent={accent}/>}/>

      {/* Alert banner */}
      {critical.length > 0 && (
        <div style={{ padding: '0 20px 16px' }}>
          <SanctuaryCard level={2} pad={16} style={{ background: '#fff3f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IconBubble tone="warm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4M12 17h.01"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </IconBubble>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.body, fontSize: 14.5, fontWeight: 600, color: S.onSurface }}>
                  {critical.length} medicamentos precisam de atenção
                </div>
                <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceVar, marginTop: 2 }}>
                  Planeje a reposição esta semana
                </div>
              </div>
            </div>
          </SanctuaryCard>
        </div>
      )}

      {critical.length > 0 && (
        <>
          <div style={{ padding: '4px 20px 8px', fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Precisa de atenção
          </div>
          <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {critical.map((m, i) => <StockRow key={i} m={m} accent={accent}/>)}
          </div>
        </>
      )}

      <div style={{ padding: '4px 20px 8px', fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        Tudo certo
      </div>
      <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rest.map((m, i) => <StockRow key={i} m={m} accent={accent}/>)}
      </div>
    </div>
  );
}

function StockRow({ m, accent }) {
  const pct = (m.current / m.initial) * 100;
  return (
    <SanctuaryCard level={2} pad={16}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <IconBubble tone={m.status === 'critical' || m.status === 'low' ? 'warm' : 'secondary'}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.5 4.5a4.5 4.5 0 119 0v6a4.5 4.5 0 11-9 0zM10.5 13.5a4.5 4.5 0 11-9 0v-6a4.5 4.5 0 119 0z"/>
          </svg>
        </IconBubble>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontFamily: T.body, fontSize: 16.5, fontWeight: 600, color: S.onSurface }}>{m.name}</div>
            <ConcentrationPill>{m.conc}</ConcentrationPill>
          </div>
          <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 2 }}>
            {m.current} {m.form}s · {m.days} dias restantes
          </div>
        </div>
        <StockPill status={m.status}/>
      </div>
      <ProgressBar value={pct} threshold={25} accent={accent}/>
    </SanctuaryCard>
  );
}

// ─── SCREEN: Medicine Detail ───────────────────────────────────
function ScreenDetail({ accent }) {
  const med = {
    name: 'Losartana', conc: '50mg', form: 'Comprimido',
    purpose: 'Controle de pressão arterial',
    prescriber: 'Dra. Ana Ribeiro — Cardiologia',
    schedule: '08:00 e 20:00, todos os dias',
    stock: { current: 18, initial: 30, days: 9, status: 'normal' },
    adherence: 92,
    notes: 'Tomar sempre com água. Evite suco de toranja.',
  };
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      {/* Hero block */}
      <div style={{
        padding: '28px 20px 28px',
        background: `linear-gradient(180deg, ${accent.bg} 0%, ${S.surface} 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: S.surfaceContainerLowest, boxShadow: S.shadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent.dark, flexShrink: 0,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 4.5a4.5 4.5 0 119 0v6a4.5 4.5 0 11-9 0zM10.5 13.5a4.5 4.5 0 11-9 0v-6a4.5 4.5 0 119 0z"/>
            </svg>
          </div>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 700, color: S.onSurface, letterSpacing: -0.4 }}>
                {med.name}
              </div>
              <ConcentrationPill>{med.conc}</ConcentrationPill>
            </div>
            <div style={{ fontFamily: T.body, fontSize: 13.5, color: S.onSurfaceVar, marginTop: 4 }}>
              {med.form} · {med.purpose}
            </div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SanctuaryCard>
          <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Esquema
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconBubble tone="secondary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v5l3 2"/>
              </svg>
            </IconBubble>
            <div style={{ fontFamily: T.body, fontSize: 15.5, color: S.onSurface, fontWeight: 500 }}>{med.schedule}</div>
          </div>
        </SanctuaryCard>

        <SanctuaryCard>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <RingGauge value={med.adherence} accent={accent.base} trackColor={S.surfaceContainerLow} size={88} stroke={9}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                Adesão 30 dias
              </div>
              <AdherenceLabel score={med.adherence}/>
              <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceVar, marginTop: 8 }}>
                Últimas 4 doses perdidas no fim de semana
              </div>
            </div>
          </div>
        </SanctuaryCard>

        <SanctuaryCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Estoque
            </div>
            <StockPill status={med.stock.status}/>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
            <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 700, color: S.onSurface }}>{med.stock.current}</div>
            <div style={{ fontFamily: T.body, fontSize: 14, color: S.onSurfaceMuted }}>comprimidos · {med.stock.days} dias</div>
          </div>
          <ProgressBar value={(med.stock.current/med.stock.initial)*100} accent={accent}/>
        </SanctuaryCard>

        <SanctuaryCard>
          <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Receita
          </div>
          <div style={{ fontFamily: T.body, fontSize: 14.5, color: S.onSurface, lineHeight: 1.5 }}>{med.prescriber}</div>
          <div style={{ fontFamily: T.body, fontSize: 13, color: S.onSurfaceVar, marginTop: 10, lineHeight: 1.5 }}>
            {med.notes}
          </div>
        </SanctuaryCard>
      </div>
    </div>
  );
}

// ─── SCREEN: Register Dose (Registrar dose) ────────────────────
function ScreenRegister({ accent }) {
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      <SectionHeader title="Registrar dose" subtitle="Como correu sua dose das 08:00?"/>

      <div style={{ padding: '0 20px' }}>
        {/* Medicine summary pre-filled */}
        <SanctuaryCard style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: accent.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: accent.dark,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.5 4.5a4.5 4.5 0 119 0v6a4.5 4.5 0 11-9 0zM10.5 13.5a4.5 4.5 0 11-9 0v-6a4.5 4.5 0 119 0z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontFamily: T.body, fontSize: 17, fontWeight: 600, color: S.onSurface }}>Losartana</div>
                <ConcentrationPill>50mg</ConcentrationPill>
              </div>
              <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 2 }}>1 comprimido · 08:00</div>
            </div>
          </div>
        </SanctuaryCard>

        {/* Big choice buttons */}
        <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase', padding: '8px 4px 12px' }}>
          Você tomou?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChoiceButton selected accent={accent}
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent.dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>}
            title="Sim, no horário" subtitle="08:00"/>
          <ChoiceButton
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.onSurfaceVar} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
            title="Em outro horário" subtitle="Ajustar o momento da tomada"/>
          <ChoiceButton
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.error} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>}
            title="Não tomei" subtitle="Conte o que aconteceu (opcional)"/>
        </div>

        <div style={{ padding: '24px 0' }}>
          <PrimaryCTA accent={accent}>Confirmar tomada</PrimaryCTA>
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({ icon, title, subtitle, selected, accent }) {
  return (
    <button style={{
      width: '100%', padding: '16px 18px', borderRadius: 18,
      background: selected ? accent.bg : S.surfaceContainerLowest,
      border: 'none', cursor: 'pointer',
      boxShadow: selected ? 'none' : S.shadow,
      display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
      outline: selected ? `2px solid ${accent.base}` : 'none',
      outlineOffset: -2,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: selected ? '#fff' : S.surfaceContainerLow,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.body, fontSize: 16, fontWeight: 600, color: S.onSurface }}>{title}</div>
        <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceVar, marginTop: 2 }}>{subtitle}</div>
      </div>
      {selected && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%', background: accent.base,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
        </div>
      )}
    </button>
  );
}

// ─── SCREEN: Treatments (Tratamentos) ─────────────────────────
const MOCK_TREATMENTS = [
  { name: 'Hipertensão',         meds: ['Losartana 50mg'], adherence: 92, color: '#005db6' },
  { name: 'Diabetes tipo 2',     meds: ['Metformina 500mg'], adherence: 88, color: '#0d9488' },
  { name: 'Ansiedade',           meds: ['Sertralina 50mg'], adherence: 76, color: '#904d00' },
  { name: 'Colesterol',          meds: ['Rosuvastatina 10mg'], adherence: 81, color: '#14b8a6' },
];

function ScreenTratamentos({ accent }) {
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      <SectionHeader title="Tratamentos" subtitle="4 condições ativas" trailing={<HeaderAddButton accent={accent}/>}/>

      {/* Overall */}
      <div style={{ padding: '0 20px 16px' }}>
        <SanctuaryCard style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <RingGauge value={86} accent={accent.base} trackColor={S.surfaceContainerLow} size={92} stroke={10}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, color: S.onSurfaceMuted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Adesão geral
            </div>
            <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 600, color: S.onSurface }}>Tratamento em dia</div>
            <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceVar, marginTop: 4 }}>
              12 dias seguidos · melhor marca do mês
            </div>
          </div>
        </SanctuaryCard>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MOCK_TREATMENTS.map((t, i) => (
          <SanctuaryCard key={i} pad={16}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${t.color}18`, color: t.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.body, fontSize: 17, fontWeight: 600, color: S.onSurface }}>{t.name}</div>
                <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 2 }}>{t.meds.join(', ')}</div>
              </div>
              <AdherenceLabel score={t.adherence}/>
            </div>
            <ProgressBar value={t.adherence} accent={accent}/>
          </SanctuaryCard>
        ))}
      </div>
    </div>
  );
}

// ─── Bottom nav (shared) ──────────────────────────────────────
function BottomNav({ current, onNav, accent }) {
  const items = [
    { id: 'home',  label: 'Hoje',        icon: 'M3 12l9-9 9 9v8a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z' },
    { id: 'treat', label: 'Tratamentos', icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z' },
    { id: 'stock', label: 'Estoque',     icon: 'M3 7l9-4 9 4-9 4-9-4z M3 12l9 4 9-4 M3 17l9 4 9-4' },
    { id: 'cal',   label: 'Calendário',  icon: 'M8 2v3M16 2v3M3 9h18M4 6h16v14H4z' },
    { id: 'me',    label: 'Perfil',      icon: 'M20 21a8 8 0 00-16 0 M12 11a4 4 0 100-8 4 4 0 000 8z' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: '8px 12px 28px',
      background: `linear-gradient(180deg, rgba(248,250,251,0) 0%, ${S.surface} 50%)`,
    }}>
      <div style={{
        background: S.surfaceContainerLowest, borderRadius: 28,
        boxShadow: S.shadowLg,
        display: 'flex', padding: 6,
      }}>
        {items.map(it => {
          const active = it.id === current;
          return (
            <button key={it.id} onClick={() => onNav(it.id)} style={{
              flex: 1, background: active ? accent.bg : 'transparent',
              border: 'none', borderRadius: 22, padding: '8px 0 6px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                   stroke={active ? accent.dark : S.onSurfaceMuted}
                   strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={it.icon}/>
              </svg>
              <span style={{
                fontFamily: T.body, fontSize: 10.5, fontWeight: active ? 600 : 500,
                color: active ? accent.dark : S.onSurfaceMuted, letterSpacing: 0.2,
              }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenEstoque, ScreenDetail, ScreenRegister, ScreenTratamentos, BottomNav,
});
