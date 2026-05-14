// app.jsx — Composes all Fase 1 screens into a navigable Design Canvas
// with a Tweaks panel that toggles A/B variations.

const { useState } = React;
const {
  DesignCanvas, DCSection, DCArtboard,
  AndroidDevice, IOSDevice,
  TweaksPanel, TweakSection, TweakRadio, TweakToggle, useTweaks,
  // screens
  TreatmentsEntry, MedicinesEmpty, MedicinesList,
  MedicineDetail, MedicineFormCreate, MedicineFormEdit,
  AnvisaSearchDedicated, AnvisaSearchSheet, DeleteDependencySheet,
  DOSIQ
} = window;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "navStrategy": "compact",
  "anvisaUx": "sheet",
  "showListFab": true,
  "iosParity": true
} /*EDITMODE-END*/;

// Convenience: choose frame based on tweak
const Frame = ({ platform, children }) => platform === 'ios' ?
<IOSDevice width={392} height={836}>{children}</IOSDevice> :
<AndroidDevice width={400} height={836}>{children}</AndroidDevice>;

// Status badge for chosen / archived variants (post-it stuck to the frame).
const StatusBadge = ({ tone, label, icon }) => (
  <div style={{
    position: 'absolute', top: -10, left: 18, zIndex: 30,
    display: 'inline-flex', alignItems: 'center', gap: 6,
    height: 26, padding: '0 12px 0 10px',
    background: tone === 'chosen' ? '#0f766e' : '#94a3b8',
    color: '#fff', borderRadius: 999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
    textTransform: 'uppercase',
    boxShadow: '0 4px 12px rgba(15,23,42,0.18)',
    pointerEvents: 'none',
  }}>
    <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>
    {label}
  </div>
);
const ChosenBadge   = () => <StatusBadge tone="chosen"   icon="✓" label="Escolhida pelo PO" />;
const ArchivedBadge = () => <StatusBadge tone="archived" icon="◦" label="Referência · não seguir" />;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Width/height of each artboard "card" in the canvas. Phone frame is 400 wide
  // + 16 of inner chrome on each side ≈ 432; height 836 + chrome ≈ 868.
  const CARD_W = 436;
  const CARD_H = 870;

  const FrameA = ({ children, screenLabel, status }) =>
  <div data-screen-label={screenLabel} style={{
    width: CARD_W, height: CARD_H,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', position: 'relative'
  }}>
      {status === 'chosen' && <ChosenBadge />}
      {status === 'archived' && <ArchivedBadge />}
      <AndroidDevice width={400} height={836}>{children}</AndroidDevice>
    </div>;

  const FrameI = ({ children, screenLabel, status }) =>
  <div data-screen-label={screenLabel} style={{
    width: CARD_W, height: CARD_H,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', position: 'relative'
  }}>
      {status === 'chosen' && <ChosenBadge />}
      {status === 'archived' && <ArchivedBadge />}
      <IOSDevice width={388} height={836}>{children}</IOSDevice>
    </div>;


  return (
    <>
      <DesignCanvas>
        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="entry"
          title="0 · Entrada via Tratamentos"
          subtitle="DECIDIDO → A (link compacto no topo). Mantenho B como referência histórica.">
          
          <DCArtboard id="entry-a" label="A · Compacto (link no topo) · ESCOLHIDA" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="01 Tratamentos · entrada link" data-comment-anchor="85700e7f97-div-37-5" status="chosen">
              <TreatmentsEntry entryVariant="compact" />
            </FrameA>
          </DCArtboard>
          <DCArtboard id="entry-b" label="B · Card destacado (referência)" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="01 Tratamentos · entrada card" status="archived">
              <TreatmentsEntry entryVariant="card" />
            </FrameA>
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="list"
          title="1 · Lista de medicamentos"
          subtitle="Empty state com CTA antes do primeiro cadastro; lista populada com FAB depois.">
          
          <DCArtboard id="list-empty" label="Empty state" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="02 Lista · empty"><MedicinesEmpty /></FrameA>
          </DCArtboard>
          <DCArtboard id="list-pop" label="Populada · com FAB" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="03 Lista · populada"><MedicinesList showFab /></FrameA>
          </DCArtboard>
          {t.iosParity &&
          <DCArtboard id="list-ios" label="iOS · paridade visual" width={CARD_W} height={CARD_H}>
              <FrameI screenLabel="03 Lista · iOS"><MedicinesList showFab /></FrameI>
            </DCArtboard>
          }
        </DCSection>

        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="detail"
          title="2 · Detalhe do medicamento"
          subtitle="Identificação, dosagem e dependências (protocolos/estoque que dependem deste medicamento).">
          
          <DCArtboard id="detail" label="Tela de detalhe" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="04 Detalhe"><MedicineDetail /></FrameA>
          </DCArtboard>
          {t.iosParity &&
          <DCArtboard id="detail-ios" label="iOS · paridade visual" width={CARD_W} height={CARD_H}>
              <FrameI screenLabel="04 Detalhe · iOS"><MedicineDetail /></FrameI>
            </DCArtboard>
          }
        </DCSection>

        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="form"
          title="3 · Formulário (criar e editar)"
          subtitle="Full-screen stack com sticky save bar. Em ‘editar’, banner de auto-fill ANVISA quando aplicável.">
          
          <DCArtboard id="form-create" label="Criar · vazio" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="05 Form · criar"><MedicineFormCreate /></FrameA>
          </DCArtboard>
          <DCArtboard id="form-edit" label="Editar · preenchido c/ banner ANVISA" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="06 Form · editar"><MedicineFormEdit /></FrameA>
          </DCArtboard>
          {t.iosParity &&
          <DCArtboard id="form-ios" label="iOS · paridade visual" width={CARD_W} height={CARD_H}>
              <FrameI screenLabel="05 Form · iOS"><MedicineFormCreate /></FrameI>
            </DCArtboard>
          }
        </DCSection>

        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="anvisa"
          title="4 · Busca ANVISA"
          subtitle="DECIDIDO → B (bottom sheet contextual sobre o form). Mantém o form visível e foca na ação. A fica como referência histórica.">
          
          <DCArtboard id="anvisa-b" label="B · Bottom sheet sobre o form · ESCOLHIDA" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="07 ANVISA · sheet" data-comment-anchor="ab9f60f536-div-37-5" status="chosen">
              <AnvisaSearchSheet />
            </FrameA>
          </DCArtboard>
          <DCArtboard id="anvisa-a" label="A · Tela dedicada (referência)" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="08 ANVISA · dedicada" status="archived">
              <AnvisaSearchDedicated />
            </FrameA>
          </DCArtboard>
        </DCSection>

        {/* ─────────────────────────────────────────────────────────────── */}
        <DCSection
          id="delete"
          title="5 · Excluir com dependências"
          subtitle="Bloqueio quando o medicamento está em uso por protocolos ou tem compra parcialmente consumida. Bottom sheet com lista de dependências + atalho para resolver.">
          
          <DCArtboard id="delete-sheet" label="Bottom sheet de bloqueio" width={CARD_W} height={CARD_H}>
            <FrameA screenLabel="09 Delete · dependências"><DeleteDependencySheet /></FrameA>
          </DCArtboard>
        </DCSection>

        {/* Speaker / handoff post-it */}
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Fase 1">
        <TweakSection label="Variantes" />
        <TweakRadio label="Entrada via Tratamentos"
        value={t.navStrategy}
        options={['compact', 'card']}
        onChange={(v) => setTweak('navStrategy', v)} />
        <TweakRadio label="Busca ANVISA padrão"
        value={t.anvisaUx}
        options={['dedicated', 'sheet']}
        onChange={(v) => setTweak('anvisaUx', v)} />
        <TweakSection label="Lista" />
        <TweakToggle label="FAB visível"
        value={t.showListFab}
        onChange={(v) => setTweak('showListFab', v)} />
        <TweakSection label="Comparativos" />
        <TweakToggle label="Mostrar paridade iOS"
        value={t.iosParity}
        onChange={(v) => setTweak('iosParity', v)} />
      </TweaksPanel>
    </>);

}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);