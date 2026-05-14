// variation-b.jsx — Ousada
// Central como hub rico, header com resumo "hoje", canais como cards
// expansíveis com preview, setup do Telegram em stepper visual.

const cardB = { background: '#fff', borderRadius: 20, boxShadow: T.ambientShadow };

// ─────────── B1: Perfil — entry point com badge sutil ───────────
const B_Profile = () => (
  <Phone>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, margin: '8px 0 22px', letterSpacing: -0.5 }}>Perfil</h1>

      {/* User card hero */}
      <div style={{ ...cardB, padding: 20, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, borderRadius: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.primaryGradient, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, boxShadow: T.primaryGradientShadow }}>R</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>review@coelho.me</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success }} />
            <span style={{ fontSize: 12, color: T.onSurfaceMuted }}>Plano ativo · 4 medicamentos</span>
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: T.onSurfaceMuted, marginBottom: 12, paddingLeft: 4, letterSpacing: 1.2 }}>AJUSTES</div>

      {/* Notificações — único item, com sub-info */}
      <button style={{ ...cardB, padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, width: '100%', border: 'none', textAlign: 'left', borderRadius: 18 }}>
        <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, background: T.secondaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={22} color={T.secondary} />
          <span style={{ position: 'absolute', top: -3, right: -3, background: T.error, color: '#fff', borderRadius: 999, height: 18, minWidth: 18, padding: '0 5px', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #fff' }}>1</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Notificações</div>
          <div style={{ fontSize: 13, color: T.onSurfaceMuted, marginTop: 2 }}>1 aviso novo · push ativo</div>
        </div>
        <Icon name="chevron" size={18} color={T.onSurfaceFaint} />
      </button>

      {[
        { l: 'Privacidade & dados', i: 'shield' },
        { l: 'Sobre o Dosiq', i: 'info' },
      ].map(it => (
        <div key={it.l} style={{ ...cardB, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, borderRadius: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: T.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={it.i} size={20} color={T.onSurfaceMuted} />
          </div>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{it.l}</span>
          <Icon name="chevron" size={18} color={T.onSurfaceFaint} />
        </div>
      ))}

      <button style={{ marginTop: 18, width: '100%', padding: '16px', border: 'none', background: 'transparent', color: T.error, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600 }}>Sair da conta</button>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

// ─────────── B2: Central — hub com resumo hero + tabs + agrupamento ───────────
const B_Center = () => {
  const [tab, setTab] = React.useState('avisos');
  return (
    <Phone bg={T.surface}>
      {/* Header colapsável */}
      <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} />
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={22} color={T.onSurface} />
        </button>
      </div>

      {/* Hero: resumo da semana */}
      <div style={{ padding: '4px 20px 18px' }}>
        <div style={{ fontSize: 13, color: T.onSurfaceMuted, fontWeight: 500, marginBottom: 4 }}>Avisos</div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700, margin: '0 0 14px', letterSpacing: -0.5, lineHeight: 1.15 }}>
          1 lembrete<br/>
          <span style={{ color: T.onSurfaceMuted, fontWeight: 600 }}>esperando você</span>
        </h1>
        <div style={{ display: 'flex', gap: 16 }}>
          <SummaryStat n="3" label="hoje" />
          <SummaryStat n="12" label="esta semana" />
          <SummaryStat n="98%" label="adesão" tone="primary" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 20px', gap: 24, borderBottom: `1px solid ${T.ghostBorder}` }}>
        {[['avisos', 'Avisos', 1], ['silenciados', 'Silenciados', 0]].map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            background: 'transparent', border: 'none', padding: '12px 0',
            fontFamily: T.fontBody, fontSize: 14, fontWeight: 600,
            color: tab === k ? T.onSurface : T.onSurfaceMuted,
            borderBottom: `2px solid ${tab === k ? T.primary : 'transparent'}`,
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: -1,
          }}>{l}{n > 0 && <span style={{ background: tab === k ? T.primary : T.surfaceLow, color: tab === k ? '#fff' : T.onSurfaceMuted, fontSize: 11, padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>{n}</span>}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>
        <DayHeader label="Agora há pouco" actionLabel="Marcar todos como lidos" />
        <BItem when="14:00" title="Ciclo 21" body="Hora da pílula. Não esquece, tá?" kind="dose" pulse />

        <DayHeader label="Hoje · mais cedo" />
        <BItem when="08:30" title="Metformina · 500mg" body="Você registrou junto com café. Ótimo!" kind="ok" />
        <BItem when="06:00" title="Estoque baixo" body="Metformina termina em 6 dias." kind="stock" cta="Comprar" />

        <DayHeader label="Ontem" />
        <BItem when="22:30" title="Tratamento em dia 💚" body="Você completou todas as doses de quinta. Continue assim!" kind="cheer" />
      </div>
      <BottomNav />
      <HomeIndicator />
    </Phone>
  );
};

const SummaryStat = ({ n, label, tone }) => (
  <div style={{ flex: 1, background: '#fff', padding: '12px 14px', borderRadius: 14, boxShadow: T.ambientShadowSm }}>
    <div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: tone === 'primary' ? T.primary : T.onSurface, lineHeight: 1 }}>{n}</div>
    <div style={{ fontSize: 11, color: T.onSurfaceMuted, marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

const DayHeader = ({ label, actionLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 10px' }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: T.onSurfaceFaint }}>{label.toUpperCase()}</div>
    {actionLabel && <button style={{ background: 'transparent', border: 'none', fontSize: 12, fontWeight: 600, color: T.primary, fontFamily: T.fontBody }}>{actionLabel}</button>}
  </div>
);

const BItem = ({ when, title, body, kind, pulse, cta }) => {
  const palette = {
    dose:  { bg: T.secondaryFixed, fg: T.secondary, icon: 'clock' },
    stock: { bg: '#ffe5b4',         fg: '#7a4a00',  icon: 'package' },
    ok:    { bg: '#cfeeea',         fg: T.primary,  icon: 'check' },
    cheer: { bg: T.tertiary,        fg: T.tertiaryDeep, icon: 'heart' },
  }[kind];
  return (
    <div style={{ ...cardB, padding: 16, marginBottom: 10, display: 'flex', gap: 12, position: 'relative', borderRadius: 18 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={palette.icon} size={20} color={palette.fg} />
        </div>
        {pulse && <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: `2px solid ${T.error}`, animation: 'dpulse 2s ease-in-out infinite' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <strong style={{ fontSize: 15, fontWeight: 700 }}>{title}</strong>
          <span style={{ fontSize: 12, color: T.onSurfaceFaint, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{when}</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '4px 0 0', color: T.onSurfaceMuted }}>{body}</p>
        {kind === 'dose' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={{ flex: 1, background: T.primaryGradient, color: '#fff', border: 'none', padding: '12px', borderRadius: 14, fontFamily: T.fontBody, fontWeight: 700, fontSize: 14, boxShadow: T.primaryGradientShadow }}>Tomar agora</button>
            <button style={{ background: T.surfaceLow, color: T.onSurface, border: 'none', padding: '12px 14px', borderRadius: 14, fontFamily: T.fontBody, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="snooze" size={16} /> 30min
            </button>
          </div>
        )}
        {cta && kind !== 'dose' && (
          <button style={{ marginTop: 10, background: 'transparent', border: `1.5px solid ${T.ghostBorder}`, color: T.onSurface, padding: '8px 14px', borderRadius: 12, fontFamily: T.fontBody, fontWeight: 600, fontSize: 13 }}>{cta} →</button>
        )}
      </div>
    </div>
  );
};

// inject keyframe for pulse
if (typeof document !== 'undefined' && !document.getElementById('dosiq-anim-b')) {
  const s = document.createElement('style');
  s.id = 'dosiq-anim-b';
  s.textContent = `@keyframes dpulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:0;transform:scale(1.25)} }`;
  document.head.appendChild(s);
}

// ─────────── B3: Preferências — canais expansíveis com preview ───────────
const B_Prefs = () => {
  const [enabled, setEnabled] = React.useState(true);
  const [tgExpanded, setTg] = React.useState(true);
  return (
    <Phone>
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center' }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} />
        </button>
      </div>
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: 13, color: T.onSurfaceMuted, fontWeight: 500, marginBottom: 4 }}>Avisos · Preferências</div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.4, lineHeight: 1.15 }}>Como avisar você?</h1>
        <p style={{ fontSize: 14, color: T.onSurfaceMuted, margin: 0 }}>Escolha um ou mais canais. A gente nunca duplica.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {/* Master */}
        <div style={{ padding: '14px 18px', borderRadius: 18, background: enabled ? T.primaryFixed : T.surfaceLow, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Icon name={enabled ? 'bell' : 'bell-off'} size={22} color={enabled ? T.primary : T.onSurfaceMuted} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: enabled ? T.primary : T.onSurface }}>{enabled ? 'Avisos ligados' : 'Avisos pausados'}</div>
            <div style={{ fontSize: 12, color: enabled ? '#0a3d36' : T.onSurfaceMuted, marginTop: 2 }}>{enabled ? 'Você recebe lembretes nos canais ativos' : 'Reative para não perder doses'}</div>
          </div>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4, letterSpacing: 1.2 }}>CANAIS</div>

        {/* App push (ativo) */}
        <ChannelCard
          icon="smartphone" iconBg={T.secondaryFixed} iconFg={T.secondary}
          name="App (push)" status="conectado" statusTone="success"
          desc="Notificação no aparelho onde você instalou o Dosiq."
          on={true}
        />

        {/* Telegram (expandido + setup) */}
        <ChannelCard
          icon="plane" iconBg="#cfeaf6" iconFg="#1c7eb0"
          name="Telegram" status="desconectado" statusTone="muted"
          desc="Receba e responda no chat do bot @dosiq_bot."
          on={false}
          expanded={tgExpanded}
          onToggleExpand={() => setTg(e => !e)}
          extra={(
            <div style={{ marginTop: 14, padding: '14px 14px', borderRadius: 14, background: T.surfaceLow, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.ambientShadowSm }}>
                <Icon name="link" size={18} color={T.primary} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Vincule sua conta</div>
                <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 2 }}>Leva 30 segundos. Bot nunca pede senha.</div>
              </div>
              <button style={{ background: T.primaryGradient, color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 999, fontFamily: T.fontBody, fontWeight: 700, fontSize: 13, boxShadow: T.primaryGradientShadow, flexShrink: 0 }}>Conectar</button>
            </div>
          )}
        />

        {/* Email */}
        <ChannelCard
          icon="mail" iconBg={T.tertiary} iconFg={T.tertiaryDeep}
          name="Email" status="resumo diário" statusTone="muted"
          desc="Um único email por dia com o que aconteceu."
          on={false}
        />

        <div style={{ fontSize: 11, fontWeight: 700, color: T.onSurfaceMuted, margin: '24px 0 10px', paddingLeft: 4, letterSpacing: 1.2 }}>QUANDO AVISAR</div>
        <div style={{ ...cardB, padding: '4px 0', borderRadius: 18 }}>
          <RowSetting icon="moon" title="Não perturbe" desc="22:00 – 07:00" trail={<Toggle on={true} />} />
          <div style={{ height: 1, background: T.ghostBorder, margin: '0 18px' }} />
          <RowSetting icon="coffee" title="Lembretes inteligentes" desc="Reagrupa doses próximas" trail={<Toggle on={true} />} />
        </div>
      </div>
      <BottomNav />
      <HomeIndicator />
    </Phone>
  );
};

const ChannelCard = ({ icon, iconBg, iconFg, name, status, statusTone, desc, on, expanded, onToggleExpand, extra }) => {
  const statusColor = statusTone === 'success' ? T.success : T.onSurfaceMuted;
  return (
    <div style={{ ...cardB, padding: 18, marginBottom: 10, borderRadius: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color={iconFg} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{name}</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: statusColor, background: statusTone === 'success' ? '#cfeeea' : T.surfaceLow, padding: '2px 8px', borderRadius: 999 }}>{status}</span>
          </div>
          <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 4, lineHeight: 1.4 }}>{desc}</div>
        </div>
        {on
          ? <Toggle on={on} />
          : <button onClick={onToggleExpand} style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: T.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={expanded ? 'chevron-down' : 'chevron'} size={16} color={T.onSurfaceMuted} />
            </button>}
      </div>
      {extra && expanded && extra}
    </div>
  );
};

const RowSetting = ({ icon, title, desc, trail }) => (
  <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
    <Icon name={icon} size={20} color={T.onSurfaceMuted} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 2 }}>{desc}</div>
    </div>
    {trail}
  </div>
);

// Toggle reutilizável (mesma lógica de A)
const Toggle = ({ on, onChange }) => (
  <button onClick={() => onChange && onChange(!on)} style={{
    width: 48, height: 28, borderRadius: 999, border: 'none',
    background: on ? T.primaryGradient : T.surfaceLow,
    boxShadow: on ? T.primaryGradientShadow : `inset 0 0 0 1px ${T.ghostBorder}`,
    position: 'relative', flexShrink: 0,
    transition: 'background 200ms',
  }}>
    <div style={{
      position: 'absolute', top: 3, left: on ? 23 : 3, width: 22, height: 22,
      borderRadius: '50%', background: '#fff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      transition: 'left 200ms ease-out',
    }} />
  </button>
);

// ─────────── B4: Setup Telegram — stepper visual ───────────
const B_Telegram = () => {
  const [step, setStep] = React.useState(2); // 1 abrir, 2 enviar código, 3 confirmado
  return (
    <Phone>
      <div style={{ padding: '8px 16px 0', display: 'flex', alignItems: 'center' }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 20px' }}>
        <div style={{ fontSize: 13, color: T.onSurfaceMuted, fontWeight: 500, marginBottom: 4 }}>Avisos · Preferências · Telegram</div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.4, lineHeight: 1.15 }}>Conectar ao Telegram</h1>
        <p style={{ fontSize: 14, color: T.onSurfaceMuted, margin: '0 0 22px' }}>Três passinhos. A gente avisa quando vincular.</p>

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map(n => (
            <React.Fragment key={n}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: n < step ? T.primaryGradient : n === step ? '#fff' : T.surfaceLow,
                border: n === step ? `2px solid ${T.primary}` : 'none',
                color: n < step ? '#fff' : n === step ? T.primary : T.onSurfaceFaint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, fontFamily: T.fontBody,
                boxShadow: n <= step ? T.ambientShadowSm : 'none',
              }}>{n < step ? <Icon name="check" size={14} color="#fff" strokeWidth={3} /> : n}</div>
              {n < 3 && <div style={{ flex: 1, height: 2, background: n < step ? T.primary : T.ghostBorder, borderRadius: 1 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 (done) */}
        <StepCard done title="Abrir o bot" desc="Você abriu @dosiq_bot no Telegram. ✓" />

        {/* Step 2 (active) */}
        <div style={{ ...cardB, padding: 20, marginBottom: 12, borderRadius: 20, border: `2px solid ${T.primaryFixed}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.primary, letterSpacing: 1.2 }}>PASSO 2 · ATIVO</span>
            <span style={{ flex: 1 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.onSurfaceMuted }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, animation: 'dpulse 1.5s ease-in-out infinite' }} />
              aguardando…
            </span>
          </div>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Cole este código no chat</h3>
          <p style={{ fontSize: 13, color: T.onSurfaceMuted, lineHeight: 1.5, margin: '0 0 16px' }}>Toque para copiar, depois cole na conversa com o bot.</p>

          <button style={{ width: '100%', background: T.onSurface, borderRadius: 14, padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: 'none' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 4 }}>SEU CÓDIGO</div>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>/start 7CEDD9</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="copy" size={16} color="#fff" />
            </div>
          </button>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button style={{ flex: 1, background: 'transparent', border: `1.5px solid ${T.ghostBorder}`, padding: '12px', borderRadius: 12, fontFamily: T.fontBody, fontWeight: 600, fontSize: 13, color: T.onSurface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="qr" size={16} /> Usar QR
            </button>
            <button style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px', fontFamily: T.fontBody, fontWeight: 600, fontSize: 13, color: T.onSurfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Icon name="refresh" size={14} /> Novo código
            </button>
          </div>
        </div>

        {/* Step 3 (locked) */}
        <StepCard pending title="Pronto!" desc="Vamos confirmar e mandar uma mensagem teste." />

        <div style={{ marginTop: 18, padding: '14px 16px', borderRadius: 14, background: T.surfaceLow, display: 'flex', gap: 12 }}>
          <Icon name="shield" size={18} color={T.primary} />
          <p style={{ fontSize: 12, lineHeight: 1.5, color: T.onSurfaceMuted, margin: 0 }}>Vínculo é por token temporário. Você desconecta a qualquer hora pelas Preferências.</p>
        </div>
      </div>
      <HomeIndicator />
    </Phone>
  );
};

const StepCard = ({ done, pending, title, desc }) => (
  <div style={{
    padding: '14px 18px', marginBottom: 12, borderRadius: 16,
    background: done ? '#cfeeea' : pending ? T.surfaceLow : '#fff',
    display: 'flex', alignItems: 'center', gap: 14,
    opacity: pending ? 0.6 : 1,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: done ? T.primary : '#fff',
      color: done ? '#fff' : T.onSurfaceFaint,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700,
      boxShadow: done ? 'none' : `inset 0 0 0 1.5px ${T.ghostBorder}`,
    }}>
      {done ? <Icon name="check" size={16} color="#fff" strokeWidth={3} /> : pending ? '3' : '1'}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: done ? T.primary : T.onSurface }}>{title}</div>
      <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 2 }}>{desc}</div>
    </div>
  </div>
);

Object.assign(window, { B_Profile, B_Center, B_Prefs, B_Telegram });
