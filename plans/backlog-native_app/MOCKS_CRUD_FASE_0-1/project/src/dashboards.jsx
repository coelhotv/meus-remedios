// Three variations of the Today / Dashboard screen.
// A) Fita do Dia — vertical timeline ribbon
// B) Santuário — hero priority card + stacked tiers
// C) Diário Terapêutico — editorial journal layout

const { SANCTUARY: S, TYPE: T } = window;
const {
  StockPill, AdherenceLabel, RingGauge, PrimaryCTA, SanctuaryCard,
  ProgressBar, ConcentrationPill, IconBubble,
} = window;

// ─── mock data ───────────────────────────────────────────────────
const MOCK_DAY = {
  greeting: 'Bom dia, Sofia',
  date: 'terça, 19 de abril',
  score: 86,
  streak: 12,
  expected: 6,
  taken: 4,
  priority: {
    name: 'Losartana',
    concentration: '50mg',
    qty: 1,
    time: '08:00',
    status: 'now', // now | late
    window: 'agora',
  },
  timeline: [
    { time: '07:30', name: 'Metformina', conc: '500mg', qty: '1 comprimido', state: 'taken', takenAt: '07:28' },
    { time: '08:00', name: 'Losartana',  conc: '50mg',  qty: '1 comprimido', state: 'now' },
    { time: '12:00', name: 'Sertralina', conc: '50mg',  qty: '1 comprimido', state: 'upcoming' },
    { time: '13:00', name: 'Metformina', conc: '500mg', qty: '1 comprimido', state: 'upcoming' },
    { time: '20:00', name: 'Losartana',  conc: '50mg',  qty: '1 comprimido', state: 'upcoming' },
    { time: '22:00', name: 'Rosuvastatina', conc: '10mg', qty: '1 comprimido', state: 'upcoming' },
  ],
  stockAlerts: [
    { name: 'Sertralina', days: 5, status: 'critical' },
  ],
};

// ─── VARIATION A: Fita do Dia ────────────────────────────────────
// Metaphor: the day is a vertical ribbon; each dose is a station.
// The "now" station blooms outward as a hero card; past/future stations collapse to minimal rows.
// Novel: continuous connecting rail visualizes drug presence across the day.

function VariationA({ accent }) {
  const a = accent;
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      {/* Hero greeting — asymmetric, pushed left */}
      <div style={{ padding: '24px 20px 12px' }}>
        <div style={{ fontFamily: T.body, fontSize: 12, color: S.onSurfaceMuted, letterSpacing: 1, textTransform: 'uppercase' }}>
          {MOCK_DAY.date}
        </div>
        <div style={{ fontFamily: T.display, fontSize: 32, fontWeight: 700, color: S.onSurface, lineHeight: 1.1, marginTop: 4, letterSpacing: -0.5 }}>
          {MOCK_DAY.greeting}
        </div>
      </div>

      {/* Summary strip — day progress as fill */}
      <div style={{ padding: '4px 20px 20px' }}>
        <SanctuaryCard level={2} pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: T.body, fontSize: 13, color: S.onSurfaceVar }}>Doses do dia</div>
              <div style={{ fontFamily: T.display, fontSize: 24, fontWeight: 700, color: S.onSurface, marginTop: 2 }}>
                {MOCK_DAY.taken}<span style={{ color: S.onSurfaceMuted, fontWeight: 500 }}> / {MOCK_DAY.expected}</span>
              </div>
            </div>
            <AdherenceLabel score={MOCK_DAY.score}/>
          </div>
          <ProgressBar value={(MOCK_DAY.taken/MOCK_DAY.expected)*100} accent={a}/>
        </SanctuaryCard>
      </div>

      {/* The Ribbon — vertical timeline */}
      <div style={{ padding: '0 20px', position: 'relative' }}>
        <div style={{ fontFamily: T.body, fontSize: 13, fontWeight: 500, color: S.onSurfaceVar, marginBottom: 12, letterSpacing: 0.3 }}>
          Hoje, do seu jeito
        </div>
        <div style={{ position: 'relative', paddingLeft: 56 }}>
          {/* The rail */}
          <div style={{
            position: 'absolute', left: 38, top: 8, bottom: 8, width: 2,
            background: `linear-gradient(to bottom, ${a.fixed} 0%, ${a.fixed} ${(MOCK_DAY.taken/MOCK_DAY.expected)*100}%, ${S.surfaceContainerLow} ${(MOCK_DAY.taken/MOCK_DAY.expected)*100}%, ${S.surfaceContainerLow} 100%)`,
            borderRadius: 2,
          }}/>
          {MOCK_DAY.timeline.map((d, i) => <RibbonStation key={i} dose={d} accent={a}/> )}
        </div>
      </div>
    </div>
  );
}

function RibbonStation({ dose, accent }) {
  const a = accent;
  const isTaken = dose.state === 'taken';
  const isNow   = dose.state === 'now';
  const dotColor = isTaken ? a.base : isNow ? a.base : S.surfaceContainerLow;
  const dotRing  = isNow ? `0 0 0 6px ${a.base}22` : 'none';

  return (
    <div style={{ position: 'relative', marginBottom: isNow ? 18 : 10, paddingBottom: isNow ? 0 : 4 }}>
      {/* station dot, positioned over rail */}
      <div style={{
        position: 'absolute', left: -26, top: isNow ? 26 : 14, width: 16, height: 16, borderRadius: '50%',
        background: dotColor,
        boxShadow: dotRing,
        transform: 'translateX(-8px)',
        border: isTaken ? `3px solid ${S.surfaceContainerLowest}` : 'none',
      }}>
        {isTaken && (
          <svg width="16" height="16" viewBox="0 0 16 16" style={{ display: 'block' }}>
            <path d="M4 8l3 3 5-6" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* time label, opposite side */}
      <div style={{
        position: 'absolute', left: -58, top: isNow ? 26 : 14, width: 44,
        fontFamily: T.mono, fontSize: 13, fontWeight: 500,
        color: isTaken ? a.dark : isNow ? S.onSurface : S.onSurfaceMuted,
        textAlign: 'right',
      }}>{dose.time}</div>

      {isNow ? (
        // Bloomed hero card
        <SanctuaryCard level={2} pad={0} style={{ overflow: 'hidden' }}>
          <div style={{
            background: `linear-gradient(135deg, ${a.base} 0%, ${a.dark} 100%)`,
            padding: '20px 20px 22px',
            color: '#fff',
          }}>
            <div style={{ fontFamily: T.body, fontSize: 11.5, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: a.fixed, marginBottom: 10 }}>
              ◉ Agora
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
              <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 700, letterSpacing: -0.3 }}>
                {dose.name}
              </div>
              <ConcentrationPill>{dose.conc}</ConcentrationPill>
            </div>
            <div style={{ fontFamily: T.body, fontSize: 14.5, opacity: 0.85, marginBottom: 16 }}>
              {dose.qty} · agendado para {dose.time}
            </div>
            <button style={{
              width: '100%', height: 52, border: 'none', borderRadius: 12,
              background: '#fff', color: a.dark,
              fontFamily: T.body, fontSize: 16, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a.dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12l5 5L20 6"/>
              </svg>
              Confirmar agora
            </button>
          </div>
        </SanctuaryCard>
      ) : (
        <div style={{
          padding: '10px 14px', borderRadius: 14,
          background: isTaken ? 'transparent' : S.surfaceContainerLowest,
          boxShadow: isTaken ? 'none' : S.shadow,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: T.body, fontSize: 16, fontWeight: 600, color: isTaken ? S.onSurfaceMuted : S.onSurface, textDecoration: isTaken ? 'line-through' : 'none' }}>
                {dose.name}
              </div>
              <ConcentrationPill>{dose.conc}</ConcentrationPill>
            </div>
            <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 2 }}>
              {dose.qty}{isTaken ? ` · tomada às ${dose.takenAt}` : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VARIATION B: Santuário ─────────────────────────────────────
// Metaphor: stacked surface tiers; the priority card is a gradient tablet.
// Novel: adherence ring is co-located with stock ring in a single "health orbit".

function VariationB({ accent }) {
  const a = accent;
  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ padding: '24px 20px 8px' }}>
        <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 700, color: S.onSurface, letterSpacing: -0.4 }}>
          {MOCK_DAY.greeting.split(',')[0]},
        </div>
        <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 400, color: S.onSurfaceVar, letterSpacing: -0.4, marginTop: -2 }}>
          {MOCK_DAY.greeting.split(',')[1].trim()}
        </div>
        <div style={{ fontFamily: T.body, fontSize: 13, color: S.onSurfaceMuted, marginTop: 6 }}>
          {MOCK_DAY.date}
        </div>
      </div>

      {/* Priority hero — gradient tablet */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{
          borderRadius: 24,
          background: `linear-gradient(135deg, ${a.base} 0%, ${a.dark} 100%)`,
          padding: 24, color: '#fff',
          boxShadow: `0 20px 40px ${a.base}33`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* subtle pattern of rings */}
          <svg width="240" height="240" style={{ position: 'absolute', right: -60, top: -60, opacity: 0.08 }}>
            <circle cx="120" cy="120" r="60" stroke="#fff" strokeWidth="2" fill="none"/>
            <circle cx="120" cy="120" r="90" stroke="#fff" strokeWidth="2" fill="none"/>
            <circle cx="120" cy="120" r="30" stroke="#fff" strokeWidth="2" fill="none"/>
          </svg>
          <div style={{ fontFamily: T.body, fontSize: 11.5, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: a.fixed, marginBottom: 12 }}>
            Próxima dose · agora
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: T.display, fontSize: 34, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1 }}>
              {MOCK_DAY.priority.name}
            </div>
            <ConcentrationPill>{MOCK_DAY.priority.concentration}</ConcentrationPill>
          </div>
          <div style={{ fontFamily: T.body, fontSize: 15, opacity: 0.85, marginBottom: 20 }}>
            {MOCK_DAY.priority.qty} comprimido · agendada para {MOCK_DAY.priority.time}
          </div>
          <button style={{
            width: '100%', height: 60, border: 'none', borderRadius: 16,
            background: '#fff', color: a.dark,
            fontFamily: T.body, fontSize: 17, fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a.dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l5 5L20 6"/>
            </svg>
            Confirmar tomada
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontFamily: T.body, fontSize: 13, color: a.fixed, opacity: 0.9 }}>
            Registar horário diferente
          </div>
        </div>
      </div>

      {/* Health orbit — dual-ring card: adherence + day progress */}
      <div style={{ padding: '0 20px 16px' }}>
        <SanctuaryCard level={2} pad={20}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <RingGauge value={MOCK_DAY.score} accent={a.base} trackColor={S.surfaceContainerLow} size={116} stroke={12}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.body, fontSize: 13, color: S.onSurfaceMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                Últimos 7 dias
              </div>
              <AdherenceLabel score={MOCK_DAY.score}/>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: S.tertiary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={S.tertiaryDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 700, color: S.onSurface, lineHeight: 1 }}>
                    {MOCK_DAY.streak} dias seguidos
                  </div>
                  <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 2 }}>
                    Sua sequência de adesão
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SanctuaryCard>
      </div>

      {/* Stock alert inline */}
      {MOCK_DAY.stockAlerts.map((s, i) => (
        <div key={i} style={{ padding: '0 20px 16px' }}>
          <SanctuaryCard level={2} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff8f0' }}>
            <IconBubble tone="warm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={S.tertiaryDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v3M16 2v3M3 9h18M4 6h16v14H4z"/>
                <path d="M9 13l6 6M15 13l-6 6" stroke={S.error}/>
              </svg>
            </IconBubble>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.body, fontSize: 15, fontWeight: 600, color: S.onSurface }}>
                {s.name} acaba em {s.days} dias
              </div>
              <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceVar, marginTop: 2 }}>
                Hora de planejar a próxima compra
              </div>
            </div>
            <svg width="10" height="16" viewBox="0 0 10 16"><path d="M1 1l7 7-7 7" stroke={S.onSurfaceMuted} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
          </SanctuaryCard>
        </div>
      ))}

      {/* Upcoming list — tier: surface_container_low */}
      <div style={{ padding: '4px 20px 20px' }}>
        <div style={{ fontFamily: T.body, fontSize: 13, fontWeight: 500, color: S.onSurfaceVar, marginBottom: 10, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          Ainda hoje
        </div>
        <div style={{ background: S.surfaceContainerLow, borderRadius: 20, padding: 8 }}>
          {MOCK_DAY.timeline.filter(d => d.state === 'upcoming').map((d, i, arr) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 12px',
              marginBottom: i < arr.length - 1 ? 4 : 0,
              background: S.surfaceContainerLowest, borderRadius: 14,
            }}>
              <div style={{
                fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: S.onSurface,
                background: S.surfaceContainerLow, padding: '6px 10px', borderRadius: 8,
                width: 60, textAlign: 'center',
              }}>{d.time}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontFamily: T.body, fontSize: 15.5, fontWeight: 600, color: S.onSurface }}>{d.name}</div>
                  <ConcentrationPill>{d.conc}</ConcentrationPill>
                </div>
                <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 1 }}>{d.qty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VARIATION C: Diário Terapêutico ────────────────────────────
// Metaphor: an editorial journal page. Asymmetric left-aligned headlines,
// breathing white space, tabular "manhã / tarde / noite" sections.
// Novel: dose cards are split into a "take card" that can be pulled upward.

function VariationC({ accent }) {
  const a = accent;
  const sections = [
    { label: 'Manhã', doses: MOCK_DAY.timeline.filter(d => parseInt(d.time) < 12) },
    { label: 'Tarde', doses: MOCK_DAY.timeline.filter(d => { const h = parseInt(d.time); return h >= 12 && h < 18; }) },
    { label: 'Noite', doses: MOCK_DAY.timeline.filter(d => parseInt(d.time) >= 18) },
  ];

  return (
    <div style={{ background: S.surface, minHeight: '100%', paddingBottom: 110 }}>
      {/* Editorial header */}
      <div style={{ padding: '28px 24px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          fontFamily: T.mono, fontSize: 11, color: S.onSurfaceMuted, letterSpacing: 2, textTransform: 'uppercase',
        }}>
          <div style={{ width: 24, height: 1, background: S.onSurfaceMuted }}/>
          <span>Diário · Terça-feira</span>
        </div>
        <div style={{ fontFamily: T.display, fontSize: 44, fontWeight: 700, color: S.onSurface, lineHeight: 0.95, letterSpacing: -1.2, marginBottom: 8 }}>
          19<span style={{ fontWeight: 300 }}>abr</span>
        </div>
        <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 400, color: S.onSurfaceVar, lineHeight: 1.25, marginTop: 10, maxWidth: 260 }}>
          Sua rotina do dia, Sofia.
        </div>
      </div>

      {/* Two-column summary: ring + score copy */}
      <div style={{ padding: '0 24px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <RingGauge value={MOCK_DAY.score} accent={a.base} trackColor={S.secondaryFixed} size={104} stroke={10}
                   centerTop={`${MOCK_DAY.taken}`} centerBottom={`de ${MOCK_DAY.expected}`}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.display, fontSize: 18, fontWeight: 600, color: S.onSurface, lineHeight: 1.2 }}>
            Tratamento em dia
          </div>
          <div style={{ fontFamily: T.body, fontSize: 13, color: S.onSurfaceVar, marginTop: 6, lineHeight: 1.4 }}>
            Faltam <b style={{ color: S.onSurface }}>{MOCK_DAY.expected - MOCK_DAY.taken} doses</b> para completar o dia. Você está há {MOCK_DAY.streak} dias seguidos cuidando de si.
          </div>
        </div>
      </div>

      {/* Take-card (pulled upward, editorial) */}
      <div style={{ padding: '0 24px 24px' }}>
        <div style={{
          borderRadius: 20, background: S.surfaceContainerLowest,
          padding: 0, overflow: 'hidden', boxShadow: S.shadowLg,
        }}>
          <div style={{
            padding: '18px 20px 14px', borderBottom: `1px solid ${S.outlineVariant}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: a.base,
              boxShadow: `0 0 0 4px ${a.base}22`,
            }}/>
            <div style={{ fontFamily: T.body, fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: a.dark }}>
              Próxima agora
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 14, color: S.onSurfaceVar, fontWeight: 500 }}>
              {MOCK_DAY.priority.time}
            </div>
          </div>
          <div style={{ padding: '20px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
              <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 700, color: S.onSurface, letterSpacing: -0.3 }}>
                {MOCK_DAY.priority.name}
              </div>
              <ConcentrationPill>{MOCK_DAY.priority.concentration}</ConcentrationPill>
            </div>
            <div style={{ fontFamily: T.body, fontSize: 14.5, color: S.onSurfaceVar, marginBottom: 16 }}>
              {MOCK_DAY.priority.qty} comprimido, em jejum
            </div>
            <PrimaryCTA accent={a} icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
            }>Confirmar tomada</PrimaryCTA>
          </div>
        </div>
      </div>

      {/* Editorial footnote — Stock alert (Diário treatment) */}
      {MOCK_DAY.stockAlerts.map((s, i) => (
        <div key={i} style={{ padding: '0 24px 28px' }}>
          {/* filete superior — a 2px bar the width of "Nota" */}
          <div style={{ width: 28, height: 2, background: S.error, marginBottom: 10 }}/>
          <div style={{
            fontFamily: T.mono, fontSize: 10.5, fontWeight: 600,
            color: S.error, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
          }}>
            Nota · Estoque
          </div>
          <div style={{
            fontFamily: T.display, fontSize: 22, fontWeight: 600,
            color: S.onSurface, letterSpacing: -0.3, lineHeight: 1.25, marginBottom: 6,
          }}>
            Sua <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{s.name}</span> acaba em {s.days} dias.
          </div>
          <div style={{
            fontFamily: T.body, fontSize: 13.5, color: S.onSurfaceVar,
            lineHeight: 1.55, marginBottom: 12, maxWidth: 300,
          }}>
            Hora de planejar a próxima compra — ainda dá tempo sem correria.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: T.body, fontSize: 13.5, fontWeight: 600, color: a.dark,
              borderBottom: `1.5px solid ${a.dark}`, paddingBottom: 2,
            }}>
              Planejar compra
            </button>
            <button style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: T.body, fontSize: 13.5, fontWeight: 500, color: S.onSurfaceMuted,
            }}>
              Dispensar
            </button>
          </div>
        </div>
      ))}

      {/* Sections — manhã / tarde / noite */}
      {sections.map((sec, si) => (
        <div key={si} style={{ padding: '4px 24px 20px' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10,
          }}>
            <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 600, color: S.onSurface, letterSpacing: 0.3 }}>
              {sec.label}
            </div>
            <div style={{ flex: 1, height: 1, background: S.outlineVariant }}/>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: S.onSurfaceMuted, letterSpacing: 1 }}>
              {sec.doses.length} dose{sec.doses.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sec.doses.map((d, i) => <EditorialRow key={i} dose={d} accent={a}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function EditorialRow({ dose, accent }) {
  const isTaken = dose.state === 'taken';
  const isNow = dose.state === 'now';
  if (isNow) return null; // shown above as take-card
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 0',
      borderBottom: `1px solid ${S.outlineVariant}`,
    }}>
      <div style={{
        fontFamily: T.mono, fontSize: 13, fontWeight: 500,
        color: isTaken ? accent.dark : S.onSurface,
        width: 48,
      }}>{dose.time}</div>
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: isTaken ? accent.base : 'transparent',
        border: isTaken ? 'none' : `2px solid ${S.onSurfaceMuted}`,
        opacity: isTaken ? 1 : 0.5,
      }}/>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <div style={{
            fontFamily: T.display, fontSize: 17, fontWeight: 600,
            color: isTaken ? S.onSurfaceMuted : S.onSurface,
            textDecoration: isTaken ? 'line-through' : 'none',
            letterSpacing: -0.2,
          }}>{dose.name}</div>
          <ConcentrationPill>{dose.conc}</ConcentrationPill>
        </div>
        <div style={{ fontFamily: T.body, fontSize: 12.5, color: S.onSurfaceMuted, marginTop: 1 }}>
          {isTaken ? `Registrada às ${dose.takenAt}` : dose.qty}
        </div>
      </div>
      {!isTaken && (
        <button style={{
          width: 36, height: 36, borderRadius: 12, border: 'none',
          background: accent.bg, color: accent.dark, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent.dark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6"/></svg>
        </button>
      )}
    </div>
  );
}

Object.assign(window, { VariationA, VariationB, VariationC });
