// variation-a.jsx — Conservadora
// IA reorganizada: Perfil → Notificações (1 item) → Central → ⚙️ Preferências → Telegram setup
// Mantém vocabulário visual do app atual, aplicando Sanctuary tokens corretamente.

const card = { background: '#fff', borderRadius: 16, boxShadow: T.ambientShadow };

// ─────────── A1: Perfil — UM único item de notificações ───────────
const A_Profile = () => (
  <Phone>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, margin: '8px 0 24px', letterSpacing: -0.5 }}>Perfil</h1>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>Minha Conta</div>
      <div style={{ ...card, padding: '16px 18px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <span style={{ color: T.onSurfaceMuted, fontSize: 14 }}>Email</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>review@coelho.me</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0 4px' }}>
          <span style={{ color: T.onSurfaceMuted, fontSize: 14 }}>Plano</span>
          <span style={{ color: T.primary, fontWeight: 600, fontSize: 14 }}>Ativo</span>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>Avisos & lembretes</div>
      <div style={{ ...card, padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.secondaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bell" size={22} color={T.secondary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Notificações</div>
          <div style={{ fontSize: 13, color: T.onSurfaceMuted, marginTop: 2 }}>Avisos, preferências e canais</div>
        </div>
        <div style={{ background: T.error, color: '#fff', borderRadius: 999, height: 22, minWidth: 22, padding: '0 7px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
        <Icon name="chevron" size={18} color={T.onSurfaceFaint} />
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurfaceMuted, margin: '24px 0 10px', paddingLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>Outros</div>
      {['Privacidade & dados', 'Sobre o Dosiq', 'Sair da conta'].map(l => (
        <div key={l} style={{ ...card, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{l}</span>
          <Icon name="chevron" size={16} color={T.onSurfaceFaint} />
        </div>
      ))}
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

// ─────────── A2: Central de Avisos (hub) ───────────
const A_Center = () => {
  const items = [
    { id: 1, when: 'agora', title: 'Ciclo 21', body: 'Está na hora de tomar 1× de Ciclo 21.', kind: 'dose', unread: true, action: 'Registrar dose' },
    { id: 2, when: 'há 2h', title: 'Estoque baixo', body: 'Metformina termina em 6 dias. Hora de repor.', kind: 'stock', unread: false, action: 'Ver estoque' },
    { id: 3, when: 'ontem', title: 'Tratamento em dia', body: 'Você completou todas as doses de quinta. Continue assim 💚', kind: 'cheer', unread: false },
  ];
  const filters = ['Todos', 'Não lidos', 'Doses', 'Estoque'];
  const [active, setActive] = React.useState('Todos');

  return (
    <Phone>
      {/* Header com back + ⚙️ */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} />
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="checkAll" size={22} color={T.onSurfaceMuted} />
        </button>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={22} color={T.onSurfaceMuted} />
        </button>
      </div>

      <div style={{ padding: '0 20px 12px' }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 30, fontWeight: 700, margin: '4px 0 6px', letterSpacing: -0.5 }}>Avisos</h1>
        <p style={{ fontSize: 14, color: T.onSurfaceMuted, margin: 0 }}>1 lembrete pendente — registre quando tomar.</p>
      </div>

      {/* Filtros */}
      <div style={{ padding: '4px 16px 12px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {filters.map(f => {
          const sel = f === active;
          return (
            <button key={f} onClick={() => setActive(f)} style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none',
              fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
              background: sel ? T.onSurface : '#fff',
              color: sel ? '#fff' : T.onSurface,
              boxShadow: sel ? 'none' : T.ambientShadowSm,
            }}>{f}</button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 16px 24px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: T.onSurfaceFaint, padding: '8px 4px 10px' }}>HOJE</div>
        {items.slice(0, 2).map(it => <CenterItem key={it.id} {...it} />)}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: T.onSurfaceFaint, padding: '20px 4px 10px' }}>ONTEM</div>
        {items.slice(2).map(it => <CenterItem key={it.id} {...it} />)}
      </div>
      <BottomNav />
      <HomeIndicator />
    </Phone>
  );
};

const CenterItem = ({ when, title, body, kind, unread, action }) => {
  const palette = {
    dose:  { bg: T.secondaryFixed, fg: T.secondary, icon: 'clock' },
    stock: { bg: '#ffe5b4',         fg: '#7a4a00',  icon: 'package' },
    cheer: { bg: '#cfeeea',         fg: T.primary,  icon: 'heart' },
  }[kind];
  return (
    <div style={{ ...card, padding: 16, marginBottom: 10, display: 'flex', gap: 12, position: 'relative' }}>
      {unread && <div style={{ position: 'absolute', top: 16, right: 16, width: 8, height: 8, borderRadius: '50%', background: T.error }} />}
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: palette.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={palette.icon} size={20} color={palette.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <strong style={{ fontSize: 15, fontWeight: 700 }}>{title}</strong>
          <span style={{ fontSize: 12, color: T.onSurfaceFaint, flexShrink: 0 }}>{when}</span>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '4px 0 0', color: T.onSurface }}>{body}</p>
        {action && (
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <button style={{ background: T.primaryGradient, color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 12, fontFamily: T.fontBody, fontWeight: 600, fontSize: 13, boxShadow: T.primaryGradientShadow }}>{action}</button>
            <button style={{ background: 'transparent', color: T.onSurfaceMuted, border: 'none', padding: '10px 4px', fontFamily: T.fontBody, fontWeight: 600, fontSize: 13 }}>Adiar 30min</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────── A3: Preferências (canais) ───────────
const A_Prefs = () => {
  const [enabled, setEnabled] = React.useState(true);
  const channels = [
    { key: 'app', label: 'App (push)', desc: 'Notificação no celular', icon: 'smartphone', on: true, status: null },
    { key: 'tg',  label: 'Telegram',   desc: 'Alertas pelo bot @dosiq_bot', icon: 'plane',     on: false, status: 'Desconectado' },
    { key: 'email', label: 'Email',    desc: 'Resumo diário em review@coelho.me', icon: 'mail', on: false, status: null },
  ];
  return (
    <Phone>
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center' }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="back" size={22} />
        </button>
      </div>
      <div style={{ padding: '4px 20px 16px' }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, margin: '6px 0 6px', letterSpacing: -0.4 }}>Preferências</h1>
        <p style={{ fontSize: 14, color: T.onSurfaceMuted, margin: 0 }}>Escolha onde e quando ser avisado.</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px' }}>
        {/* Master switch */}
        <div style={{ ...card, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: enabled ? T.secondaryFixed : T.surfaceLow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={enabled ? 'bell' : 'bell-off'} size={20} color={enabled ? T.secondary : T.onSurfaceMuted} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Notificações ativas</div>
            <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 2 }}>Você recebe lembretes de doses</div>
          </div>
          <Toggle on={enabled} onChange={setEnabled} />
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4, letterSpacing: 0.3, textTransform: 'uppercase' }}>Canais</div>
        {channels.map(c => (
          <div key={c.key} style={{ ...card, padding: '16px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.secondaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={c.icon} size={20} color={T.secondary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{c.label}</span>
                {c.status && (
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: T.onSurfaceMuted, background: T.surfaceLow, padding: '2px 8px', borderRadius: 999 }}>{c.status.toUpperCase()}</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: T.onSurfaceMuted, marginTop: 2 }}>{c.desc}</div>
            </div>
            {c.key === 'tg' && !c.on
              ? <Icon name="chevron" size={18} color={T.onSurfaceFaint} />
              : <Toggle on={c.on} />}
          </div>
        ))}

        <div style={{ ...card, padding: '14px 18px', marginTop: 18, background: T.surfaceLow, boxShadow: 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Icon name="info" size={18} color={T.onSurfaceMuted} />
          <p style={{ fontSize: 12, lineHeight: 1.5, color: T.onSurfaceMuted, margin: 0 }}>Ao menos um canal precisa estar ativo para receber lembretes de dose.</p>
        </div>
      </div>
      <BottomNav />
      <HomeIndicator />
    </Phone>
  );
};

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

// ─────────── A4: Setup Telegram ───────────
const A_Telegram = () => (
  <Phone>
    <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center' }}>
      <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="back" size={22} />
      </button>
    </div>

    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 16px' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: T.secondaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon name="plane" size={26} color={T.secondary} />
      </div>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: -0.3 }}>Conectar ao Telegram</h1>
      <p style={{ fontSize: 14, color: T.onSurfaceMuted, lineHeight: 1.5, margin: '0 0 24px' }}>Receba lembretes e registre doses direto pelo chat. Vai levar uns 30 segundos.</p>

      <div style={{ ...card, padding: 20, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.onSurfaceMuted, fontWeight: 600, letterSpacing: 0.5, marginBottom: 14 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</span>
          ABRA O BOT NO TELEGRAM
        </div>
        <button style={{ width: '100%', height: 56, background: T.primaryGradient, color: '#fff', border: 'none', borderRadius: 16, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700, boxShadow: T.primaryGradientShadow, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Icon name="plane" size={20} color="#fff" /> Abrir @dosiq_bot
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.onSurfaceMuted, fontWeight: 600, letterSpacing: 0.5, margin: '24px 0 14px' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: T.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</span>
          ENVIE ESTE CÓDIGO NO CHAT
        </div>
        <div style={{ background: T.onSurface, borderRadius: 14, padding: '20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 4 }}>SEU CÓDIGO</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>/start 7CEDD9</div>
          </div>
          <button style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Icon name="copy" size={18} color="#fff" />
          </button>
        </div>
        <button style={{ background: 'transparent', border: 'none', color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, padding: '14px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="refresh" size={14} color={T.onSurfaceMuted} /> Gerar novo código
        </button>
      </div>

      <div style={{ ...card, padding: '14px 16px', boxShadow: 'none', background: T.surfaceLow, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="shield" size={18} color={T.primary} />
        <p style={{ fontSize: 12, lineHeight: 1.5, color: T.onSurfaceMuted, margin: 0 }}>O bot nunca pede sua senha. O código é temporário e só serve para vincular sua conta.</p>
      </div>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

Object.assign(window, { A_Profile, A_Center, A_Prefs, A_Telegram });
