// before.jsx — recriação fiel das 4 telas atuais para comparação

const BeforeProfile = () => (
  <Phone>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, margin: '8px 0 24px', letterSpacing: -0.5 }}>Perfil</h1>

      <div style={{ fontSize: 15, fontWeight: 500, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4 }}>Minha Conta</div>
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 24, boxShadow: T.ambientShadowSm }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
          <span style={{ color: T.onSurfaceMuted }}>Email</span>
          <span style={{ fontWeight: 600 }}>review@coelho.me</span>
        </div>
        <div style={{ height: 1, background: T.ghostBorder, margin: '6px 0' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
          <span style={{ color: T.onSurfaceMuted }}>Status</span>
          <span style={{ color: T.success, fontWeight: 600 }}>Ativo</span>
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 500, color: T.onSurfaceMuted, marginBottom: 10, paddingLeft: 4 }}>Notificações</div>
      {['Preferências de Notificação', 'Central de Avisos'].map((label, i) => (
        <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px', marginBottom: 12, boxShadow: T.ambientShadowSm, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="bell" color={T.secondary} size={22} />
          <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{label}</span>
          {i === 1 && <span style={{ background: '#ba1a1a', color: '#fff', borderRadius: 999, width: 22, height: 22, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>}
          <Icon name="chevron" size={16} color={T.onSurfaceFaint} />
        </div>
      ))}

      <div style={{ fontSize: 15, fontWeight: 500, color: T.onSurfaceMuted, margin: '24px 0 10px', paddingLeft: 4 }}>Bot Telegram</div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, boxShadow: T.ambientShadowSm }}>
        <span style={{ display: 'inline-block', background: T.surfaceLow, padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: T.onSurfaceMuted, marginBottom: 10 }}>DESCONECTADO</span>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: T.onSurface, margin: '0 0 12px' }}>Receba alertas de remédios e gerencie doses pelo Telegram.</p>
        <div style={{ height: 1, background: T.ghostBorder, marginBottom: 12 }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: T.secondary, fontWeight: 600, fontSize: 14 }}>
          <span>Configurar Vínculo</span><Icon name="arrow" size={16} color={T.secondary} />
        </div>
      </div>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

const BeforePrefs = () => (
  <Phone>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
      <div style={{ color: T.secondary, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>← Voltar</div>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, margin: '4px 0 16px' }}>Preferências de Notificação</h1>
      <div style={{ height: 1, background: T.ghostBorder, marginBottom: 20 }}/>
      <div style={{ background: '#e9f7f1', borderLeft: `4px solid ${T.success}`, padding: '12px 14px', borderRadius: 6, color: T.success, fontWeight: 500, fontSize: 14, marginBottom: 24 }}>✓ Notificações habilitadas</div>
      <div style={{ fontSize: 14, color: T.onSurface, marginBottom: 12 }}>Escolha como receber notificações</div>
      {[{ l: 'Telegram', i: 'plane', sel: false }, { l: 'App (push nativo)', i: 'smartphone', sel: true }, { l: 'Ambos', i: 'spark', sel: false }].map(o => (
        <div key={o.l} style={{
          background: o.sel ? T.secondary : '#fff', color: o.sel ? '#fff' : T.onSurface,
          padding: '14px', borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontWeight: 600, fontSize: 15, boxShadow: T.ambientShadowSm,
        }}>
          <Icon name={o.i} size={20} color={o.sel ? '#fff' : T.onSurface} />
          <span>{o.l}</span>
        </div>
      ))}
      <div style={{ marginTop: 18, padding: 14, borderRadius: 8, background: '#fff', border: `1.5px solid ${T.error}`, color: T.error, fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <Icon name="bell-off" size={20} color={T.error} /> Desativar notificações
      </div>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

const BeforeTelegram = () => (
  <Phone>
    <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px' }}>
      <div style={{ color: T.secondary, fontSize: 14, fontWeight: 500, marginBottom: 4 }}>← Voltar</div>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, margin: '4px 0 12px' }}>Integração Telegram</h1>
      <div style={{ height: 1, background: T.ghostBorder, marginBottom: 16 }}/>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: T.onSurface, marginBottom: 20 }}>Vincule sua conta para receber avisos de doses e gerenciar seu estoque diretamente pelo Telegram.</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: T.ambientShadowSm }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Próximo Passo:</h3>
        <p style={{ fontSize: 13, color: T.onSurface, margin: '0 0 14px', lineHeight: 1.5 }}>Abra o nosso bot no Telegram e envie o comando abaixo:</p>
        <div style={{ background: '#0a0a0a', color: '#fff', padding: '18px 14px', borderRadius: 10, textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 6 }}>COMANDO:</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 700 }}>/start 7CEDD9</div>
        </div>
        <div style={{ background: T.secondary, color: '#fff', padding: '14px', borderRadius: 8, textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Abrir Bot no Telegram</div>
        <div style={{ textAlign: 'center', color: T.onSurface, fontSize: 13, padding: 8 }}>Gerar novo código</div>
      </div>
      <div style={{ background: T.surfaceLow, padding: 14, borderRadius: 8, marginTop: 12, fontSize: 12, color: T.onSurfaceMuted, lineHeight: 1.5 }}>
        <strong style={{ color: T.onSurface }}>Nota de privacidade:</strong><br/>O bot nunca pedirá sua senha. O vínculo é feito através de um token temporário.
      </div>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

const BeforeCenter = () => (
  <Phone>
    <div style={{ padding: '8px 20px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: T.ambientShadowSm }}>
        <Icon name="back" size={18} />
      </div>
      <h1 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, margin: 0 }}>Central de Avisos</h1>
    </div>
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: T.onSurfaceFaint, marginBottom: 12 }}>HOJE</div>
      <div style={{ display: 'flex', gap: 12, padding: '4px 0' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#d8eee9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="clock" size={18} color={T.primary} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <strong style={{ fontSize: 15, fontWeight: 700 }}>Ciclo 21</strong>
            <span style={{ fontSize: 12, color: T.onSurfaceFaint }}>há 14min</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: '4px 0 8px', color: T.onSurface }}>Está na hora de tomar 1x de Ciclo 21. Não deixe para depois!</p>
          <div style={{ textAlign: 'right', color: T.secondary, fontWeight: 600, fontSize: 14 }}>Registrar dose ›</div>
        </div>
      </div>
    </div>
    <BottomNav />
    <HomeIndicator />
  </Phone>
);

Object.assign(window, { BeforeProfile, BeforePrefs, BeforeTelegram, BeforeCenter });
