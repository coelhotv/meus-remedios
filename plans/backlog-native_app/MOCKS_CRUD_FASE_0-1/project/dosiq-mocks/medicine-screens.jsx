// medicine-screens.jsx — Fase 1 (Medicamentos) hi-fi mockups
// Each screen renders inside an Android/iOS device frame (412x812 inner area).
// State is presentational only; the file is a pure UI gallery.

const { DOSIQ } = window;
const {
  T, DosiqScreen, DosiqAppBar, DosiqLargeHeader, DosiqCard, DosiqSection,
  DosiqBadge, DosiqDosagePill, DosiqButton, DosiqTabBar, DosiqFAB,
  DosiqLabel, DosiqInput, DosiqSelect, DosiqField, DosiqBottomSheet,
  DosiqStripe, DosiqDetailRow, DosiqMedicineRow, iconBtn,
} = window;
const {
  IconChevronRight, IconChevronDown, IconChevronUp, IconPlus, IconSearch,
  IconCheck, IconAlert, IconArrowLeft, IconCalendar, IconPill, IconBox,
  IconUser, IconClose, IconTrash, IconEdit, IconMore, IconBuilding,
  IconClock, IconTag, IconLayers, IconShield, IconInfo, IconArrowDownRight,
} = window.DosiqIcons;

// ════════════════════════════════════════════════════════════════════════════
// 0. ENTRY POINT — Tratamentos com novo botão "Meus Medicamentos"
// ════════════════════════════════════════════════════════════════════════════
// Variação A: link compacto no topo (mínimo)
// Variação B: card destacado com contagem (preferido)
const TreatmentsEntry = ({ entryVariant = 'card' }) => (
  <DosiqScreen activeTab="tratamentos">
    <DosiqLargeHeader
      title="Meus Tratamentos"
      subtitle="Acompanhe seus tratamentos ativos"
    />
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {entryVariant === 'compact' ? (
        <button style={{
          display: 'flex', alignItems: 'center', gap: 10, background: 'transparent',
          border: 'none', padding: '6px 4px', color: DOSIQ.color.primary,
          fontFamily: DOSIQ.font.sans, fontWeight: 700, fontSize: 14, cursor: 'pointer',
        }}>
          <IconPill s={18} c={DOSIQ.color.primary} sw={2}/>
          <span>Meus Medicamentos</span>
          <IconChevronRight s={16} c={DOSIQ.color.primary} sw={2}/>
        </button>
      ) : (
        <DosiqMedicineRow
          icon={<IconPill s={22} c={DOSIQ.color.primary} sw={2} />}
          iconBg={DOSIQ.color.primaryBg}
          title="Meus Medicamentos"
          subtitle="Cadastre, edite e gerencie sua biblioteca"
          badge={<DosiqDosagePill>12</DosiqDosagePill>}
        />
      )}

      {/* Plano group rows (same as MVP) */}
      <PlanGroupRow color="#fce7f3" textColor="#a21caf" emoji="☮" label="Ansiolíticos — TAG" count="1 tratamento"/>
      <PlanGroupRow color="#dcfce7" textColor="#15803d" emoji="🧪" label="Antiespasmodicos" count="1 tratamento"/>
      <PlanGroupRow color="#fee2e2" textColor="#b91c1c" emoji="✦" label="Antiplaquetário Duplo — DAPT" count="2 tratamentos"/>
      <PlanGroupRow color="#fef3c7" textColor="#b45309" emoji="●" label="Colesterol — Dislipidemia" count="2 tratamentos"/>
    </div>
    <div style={{ height: 32 }}/>
  </DosiqScreen>
);

const PlanGroupRow = ({ color, textColor, emoji, label, count }) => (
  <div style={{
    background: '#fff', borderRadius: DOSIQ.radius.lg, padding: '14px 16px',
    display: 'flex', alignItems: 'center', gap: 14, boxShadow: DOSIQ.shadow.card,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 22, color: textColor,
    }}>{emoji}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <T variant="titleMD" style={{ display: 'block' }}>{label}</T>
      <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ display: 'block', marginTop: 2 }}>{count}</T>
    </div>
    <IconChevronRight s={18} c={DOSIQ.color.inkSubtle}/>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 1. LISTA MEDICAMENTOS — empty state
// ════════════════════════════════════════════════════════════════════════════
const MedicinesEmpty = () => (
  <DosiqScreen activeTab="tratamentos">
    <DosiqAppBar title="Meus Medicamentos" onBack/>
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '60px 32px', gap: 28,
    }}>
      <EmptyIllustration/>
      <div style={{ textAlign: 'center' }}>
        <T variant="titleLG" style={{ display: 'block' }}>Sua biblioteca está vazia</T>
        <T variant="body" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 10, maxWidth: 280 }}>
          Cadastre seus medicamentos para usar em protocolos, estoque e registros de dose.
        </T>
      </div>
      <DosiqButton variant="primary" size="lg" block
        icon={<IconPlus s={20} c="#fff" sw={2.4}/>}
        style={{ maxWidth: 320 }}>
        Cadastrar primeiro medicamento
      </DosiqButton>
      <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ textAlign: 'center' }}>
        Busque na base ANVISA · 6.816 registros
      </T>
    </div>
  </DosiqScreen>
);

const EmptyIllustration = () => (
  <div style={{
    width: 140, height: 140, borderRadius: 999,
    background: `radial-gradient(circle at 30% 30%, ${DOSIQ.color.primarySoft}, #fff 75%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  }}>
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      {/* simplified pill capsule */}
      <rect x="14" y="32" width="52" height="20" rx="10" fill="#fff" stroke={DOSIQ.color.primary} strokeWidth="2"/>
      <rect x="40" y="32" width="26" height="20" rx="10" fill={DOSIQ.color.primarySoft} stroke={DOSIQ.color.primary} strokeWidth="2"/>
      <line x1="40" y1="34" x2="40" y2="50" stroke={DOSIQ.color.primary} strokeWidth="1.5"/>
    </svg>
    <div style={{
      position: 'absolute', top: -2, right: 8, width: 28, height: 28, borderRadius: 999,
      background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: DOSIQ.shadow.card,
    }}>
      <IconPlus s={16} c={DOSIQ.color.primary} sw={2.6}/>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 2. LISTA MEDICAMENTOS — populated com FAB
// ════════════════════════════════════════════════════════════════════════════
const MEDICINES_MOCK = [
  { name: 'SeloZok', dosage: '50mg', lab: 'Astrazeneca', protocols: 2, type: 'Comprimido' },
  { name: 'Forxiga', dosage: '10mg', lab: 'Astrazeneca', protocols: 1, type: 'Comprimido' },
  { name: 'Espirolactona', dosage: '25mg', lab: 'Sandoz', protocols: 1, type: 'Comprimido' },
  { name: 'Atorvastatina', dosage: '80mg', lab: 'Eurofarma', protocols: 1, type: 'Comprimido' },
  { name: 'Ácido Acetilsalicílico', dosage: '100mg', lab: 'Bayer', protocols: 2, type: 'Comprimido' },
  { name: 'Pregabalina', dosage: '50mg', lab: 'Pfizer', protocols: 1, type: 'Cápsula' },
];

const MedicinesList = ({ showFab = true, showSearchHeader = true }) => (
  <DosiqScreen activeTab="tratamentos">
    <DosiqAppBar
      title="Meus Medicamentos"
      onBack
      trailing={<button style={iconBtn}><IconSearch s={20} c={DOSIQ.color.ink}/></button>}
    />
    <div style={{ padding: '4px 20px 12px' }}>
      {showSearchHeader && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          background: '#fff', borderRadius: DOSIQ.radius.md,
          border: `1px solid ${DOSIQ.color.border}`, marginBottom: 14,
        }}>
          <IconSearch s={18} c={DOSIQ.color.inkSubtle} sw={2}/>
          <T variant="body" color={DOSIQ.color.inkSubtle} style={{ flex: 1 }}>
            Buscar nos meus medicamentos…
          </T>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 4px 10px' }}>
        <T variant="eyebrow" color={DOSIQ.color.inkSubtle}>6 medicamentos</T>
        <T variant="caption" color={DOSIQ.color.inkSubtle}>Mais recentes ↓</T>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MEDICINES_MOCK.map((m, i) => (
          <DosiqMedicineRow
            key={i}
            icon={<IconPill s={22} c={DOSIQ.color.primary} sw={2}/>}
            iconBg={DOSIQ.color.primaryBg}
            title={m.name}
            badge={m.dosage}
            subtitle={`${m.lab} · ${m.protocols} protocolo${m.protocols > 1 ? 's' : ''} ativo${m.protocols > 1 ? 's' : ''}`}
          />
        ))}
      </div>
    </div>
    <div style={{ height: 96 }}/>
    {showFab && (
      <DosiqFAB label="Novo medicamento" extended/>
    )}
  </DosiqScreen>
);

// ════════════════════════════════════════════════════════════════════════════
// 3. DETALHE DO MEDICAMENTO
// ════════════════════════════════════════════════════════════════════════════
const MedicineDetail = () => (
  <DosiqScreen activeTab="tratamentos">
    <DosiqAppBar
      title="SeloZok"
      onBack
      trailing={
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={iconBtn}><IconEdit s={20} c={DOSIQ.color.ink}/></button>
          <button style={iconBtn}><IconMore s={20} c={DOSIQ.color.ink}/></button>
        </div>
      }
    />
    <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero card */}
      <DosiqCard style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: DOSIQ.color.primaryBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconPill s={28} c={DOSIQ.color.primary} sw={2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <T variant="titleLG">SeloZok</T>
              <DosiqDosagePill>50mg</DosiqDosagePill>
            </div>
            <T variant="body" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 4 }}>
              Succinato de Metoprolol
            </T>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <DosiqBadge variant="primary" icon={<IconCheck s={12} c={DOSIQ.color.primarySoftFg} sw={3}/>}>
                Estável
              </DosiqBadge>
              <DosiqBadge variant="neutral">Comprimido</DosiqBadge>
            </div>
          </div>
        </div>
      </DosiqCard>

      <DosiqCard>
        <SectionLabel>Identificação</SectionLabel>
        <DosiqDetailRow label="Princípio ativo" value="Succinato de Metoprolol"/>
        <DosiqDetailRow label="Laboratório" value="Astrazeneca do Brasil Ltda"/>
        <DosiqDetailRow label="Classe terapêutica" value="Betabloqueador"/>
        <DosiqDetailRow label="Categoria" value="Tarja vermelha" divider={false}/>
      </DosiqCard>

      <DosiqCard>
        <SectionLabel>Dosagem</SectionLabel>
        <DosiqDetailRow label="Dose por unidade" value="50 mg"/>
        <DosiqDetailRow label="Forma" value="Comprimido" divider={false}/>
      </DosiqCard>

      {/* Dependencies — informational, not blocking */}
      <DosiqCard style={{ padding: 16 }}>
        <T variant="eyebrow" color={DOSIQ.color.inkSubtle} style={{ display: 'block', marginBottom: 12 }}>
          Em uso
        </T>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <UsageRow icon={<IconLayers s={18} c={DOSIQ.color.primary} sw={2}/>} label="2 protocolos ativos" trailing="ICFEr · DAPT"/>
          <UsageRow icon={<IconBox s={18} c={DOSIQ.color.warningSoftFg} sw={2}/>} label="Estoque" trailing="16 un. · 8 dias" trailingColor={DOSIQ.color.warningSoftFg}/>
        </div>
      </DosiqCard>

      <DosiqButton variant="dangerSoft" size="lg" block icon={<IconTrash s={18} c={DOSIQ.color.dangerSoftFg} sw={2}/>}>
        Excluir medicamento
      </DosiqButton>
    </div>
  </DosiqScreen>
);

const SectionLabel = ({ children }) => (
  <div style={{ padding: '14px 16px 6px' }}>
    <T variant="eyebrow" color={DOSIQ.color.inkSubtle}>{children}</T>
  </div>
);

const UsageRow = ({ icon, label, trailing, trailingColor }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 12px', background: '#f8fafc', borderRadius: 10,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{icon}</div>
    <T variant="bodyStr" style={{ flex: 1 }}>{label}</T>
    <T variant="caption" color={trailingColor || DOSIQ.color.inkMuted}>{trailing}</T>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 4. FORM MEDICAMENTO — Create (vazio com ANVISA prompt no topo)
// ════════════════════════════════════════════════════════════════════════════
const MedicineFormCreate = () => (
  <DosiqScreen withTabs={false} padBottom={88}>
    <DosiqAppBar title="Novo Medicamento" onBack/>
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ANVISA quick search prompt */}
      <DosiqCard style={{ padding: 14, background: DOSIQ.color.primaryBg, boxShadow: 'none', border: `1.5px solid ${DOSIQ.color.primarySoft}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconSearch s={18} c={DOSIQ.color.primary} sw={2}/>
          </div>
          <div style={{ flex: 1 }}>
            <T variant="bodyStr">Buscar na base ANVISA</T>
            <T variant="caption" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 2 }}>
              Preenche nome, princípio ativo e categoria automaticamente
            </T>
          </div>
          <IconChevronRight s={18} c={DOSIQ.color.primary} sw={2}/>
        </div>
      </DosiqCard>

      <FormSectionTitle>Identificação</FormSectionTitle>
      <DosiqField label="Nome" required>
        <DosiqInput placeholder="Ex: SeloZok"/>
      </DosiqField>
      <DosiqField label="Princípio ativo">
        <DosiqInput placeholder="Ex: Succinato de Metoprolol"/>
      </DosiqField>

      <FormSectionTitle>Dosagem</FormSectionTitle>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 2 }}>
          <DosiqField label="Dose por unidade" required>
            <DosiqInput placeholder="50"/>
          </DosiqField>
        </div>
        <div style={{ flex: 1 }}>
          <DosiqField label="Unidade" required>
            <DosiqSelect value="mg"/>
          </DosiqField>
        </div>
      </div>

      <FormSectionTitle>Classificação</FormSectionTitle>
      <DosiqField label="Tipo">
        <DosiqSelect value="Comprimido"/>
      </DosiqField>
      <DosiqField label="Laboratório">
        <DosiqInput placeholder="Ex: Astrazeneca"
          trailing={<IconBuilding s={18} c={DOSIQ.color.inkSubtle}/>}/>
      </DosiqField>
      <DosiqField label="Categoria regulatória">
        <DosiqSelect placeholder="Selecione"/>
      </DosiqField>
    </div>

    {/* Sticky save bar */}
    <FormActions submitLabel="Criar medicamento"/>
  </DosiqScreen>
);

// ════════════════════════════════════════════════════════════════════════════
// 5. FORM MEDICAMENTO — Edit (com auto-fill após seleção ANVISA)
// ════════════════════════════════════════════════════════════════════════════
const MedicineFormEdit = () => (
  <DosiqScreen withTabs={false} padBottom={88}>
    <DosiqAppBar title="Editar SeloZok" onBack/>
    <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Auto-fill confirmation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: DOSIQ.color.successSoft, color: DOSIQ.color.successSoftFg,
        padding: '10px 14px', borderRadius: DOSIQ.radius.md,
      }}>
        <IconCheck s={16} c={DOSIQ.color.successSoftFg} sw={2.4}/>
        <T variant="caption" color={DOSIQ.color.successSoftFg} weight={600}>
          Dados preenchidos a partir da base ANVISA
        </T>
      </div>

      <FormSectionTitle>Identificação</FormSectionTitle>
      <DosiqField label="Nome" required>
        <DosiqInput value="SeloZok"/>
      </DosiqField>
      <DosiqField label="Princípio ativo">
        <DosiqInput value="Succinato de Metoprolol"/>
      </DosiqField>

      <FormSectionTitle>Dosagem</FormSectionTitle>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 2 }}>
          <DosiqField label="Dose por unidade" required>
            <DosiqInput value="50"/>
          </DosiqField>
        </div>
        <div style={{ flex: 1 }}>
          <DosiqField label="Unidade" required>
            <DosiqSelect value="mg"/>
          </DosiqField>
        </div>
      </div>

      <FormSectionTitle>Classificação</FormSectionTitle>
      <DosiqField label="Tipo">
        <DosiqSelect value="Comprimido"/>
      </DosiqField>
      <DosiqField label="Laboratório">
        <DosiqInput value="Astrazeneca do Brasil Ltda"
          trailing={<IconBuilding s={18} c={DOSIQ.color.inkSubtle}/>}/>
      </DosiqField>
      <DosiqField label="Categoria regulatória">
        <DosiqSelect value="Tarja vermelha"/>
      </DosiqField>
    </div>

    <FormActions submitLabel="Salvar alterações"/>
  </DosiqScreen>
);

const FormSectionTitle = ({ children }) => (
  <T variant="eyebrow" color={DOSIQ.color.inkSubtle} style={{ display: 'block', marginTop: 4 }}>
    {children}
  </T>
);

const FormActions = ({ submitLabel = 'Salvar' }) => (
  <div style={{
    position: 'absolute', left: 0, right: 0, bottom: 0,
    background: '#fff', borderTop: `1px solid ${DOSIQ.color.borderSoft}`,
    padding: '12px 20px 18px', display: 'flex', gap: 10,
  }}>
    <DosiqButton variant="neutral" size="md" style={{ flex: 1 }}>Cancelar</DosiqButton>
    <DosiqButton variant="primary" size="md" style={{ flex: 2 }}>{submitLabel}</DosiqButton>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 6. ANVISA Search — Variação A: tela dedicada
// ════════════════════════════════════════════════════════════════════════════
const ANVISA_MOCK = [
  { name: 'SELOZOK', activeIng: 'SUCCINATO DE METOPROLOL', dosage: '25mg, 50mg, 100mg', lab: 'AstraZeneca' },
  { name: 'SELOKEN ZOK', activeIng: 'TARTARATO DE METOPROLOL', dosage: '25mg, 50mg, 100mg', lab: 'AstraZeneca' },
  { name: 'METOPROLOL EMS', activeIng: 'TARTARATO DE METOPROLOL', dosage: '25mg, 50mg, 100mg', lab: 'EMS S/A' },
  { name: 'METOPROLOL TEUTO', activeIng: 'TARTARATO DE METOPROLOL', dosage: '25mg, 50mg, 100mg', lab: 'Laboratório Teuto Brasileiro' },
  { name: 'METOPROLOL GERMED', activeIng: 'TARTARATO DE METOPROLOL', dosage: '50mg, 100mg', lab: 'Germed Pharma' },
  { name: 'METOPROLOL HYPOFARMA', activeIng: 'SUCCINATO DE METOPROLOL', dosage: '50mg', lab: 'Hypofarma' },
];

const AnvisaSearchDedicated = () => (
  <DosiqScreen withTabs={false}>
    <div style={{
      padding: '8px 12px 12px', display: 'flex', alignItems: 'center', gap: 8,
      background: '#fff', borderBottom: `1px solid ${DOSIQ.color.borderSoft}`,
    }}>
      <button style={iconBtn}><IconArrowLeft s={22} c={DOSIQ.color.ink}/></button>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 10,
        background: '#f1f5f9', borderRadius: 999, padding: '0 14px', height: 42,
      }}>
        <IconSearch s={18} c={DOSIQ.color.inkMuted} sw={2}/>
        <span style={{ flex: 1, fontFamily: DOSIQ.font.sans, fontSize: 15, color: DOSIQ.color.ink, fontWeight: 500 }}>
          metoprolol
        </span>
        <button style={{ ...iconBtn, width: 28, height: 28 }}>
          <IconClose s={16} c={DOSIQ.color.inkMuted}/>
        </button>
      </div>
    </div>

    <div style={{ padding: '14px 20px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <T variant="eyebrow" color={DOSIQ.color.inkSubtle}>Base ANVISA · 6 resultados</T>
      <T variant="caption" color={DOSIQ.color.inkSubtle}>Relevância ↓</T>
    </div>

    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ANVISA_MOCK.map((m, i) => (
        <AnvisaResultCard key={i} item={m} highlighted={i === 0}/>
      ))}
    </div>
    <div style={{ padding: '20px 20px 24px' }}>
      <div style={{
        background: '#f8fafc', borderRadius: DOSIQ.radius.md, padding: 14,
        display: 'flex', alignItems: 'center', gap: 12, border: `1px dashed ${DOSIQ.color.border}`,
      }}>
        <IconInfo s={18} c={DOSIQ.color.inkSubtle} sw={2}/>
        <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ flex: 1 }}>
          Não encontrou? Você pode criar manualmente sem a base.
        </T>
      </div>
    </div>
  </DosiqScreen>
);

const Highlight = ({ text, q = 'metoprolol' }) => {
  const parts = String(text).split(new RegExp(`(${q})`, 'gi'));
  return <>{parts.map((p, i) => p.toLowerCase() === q.toLowerCase()
    ? <mark key={i} style={{ background: DOSIQ.color.primarySoft, color: DOSIQ.color.primaryHover, padding: '0 2px', borderRadius: 3 }}>{p}</mark>
    : <span key={i}>{p}</span>)}</>;
};

const AnvisaResultCard = ({ item, highlighted }) => (
  <div style={{
    background: '#fff', borderRadius: DOSIQ.radius.lg, padding: '14px 16px',
    border: highlighted ? `1.5px solid ${DOSIQ.color.primary}` : `1px solid ${DOSIQ.color.borderSoft}`,
    display: 'flex', alignItems: 'center', gap: 14,
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <T variant="bodyStr" style={{ display: 'block', textTransform: 'capitalize' }}>
        <Highlight text={item.name.toLowerCase()}/>
      </T>
      <T variant="caption" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 3, textTransform: 'lowercase' }}>
        <Highlight text={item.activeIng.toLowerCase()}/>
      </T>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        <DosiqDosagePill style={{ fontSize: 11 }}>{item.dosage}</DosiqDosagePill>
        <span style={{
          fontFamily: DOSIQ.font.sans, fontSize: 11, fontWeight: 500,
          color: DOSIQ.color.inkSubtle, display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <IconBuilding s={11} c={DOSIQ.color.inkSubtle} sw={2}/>
          {item.lab}
        </span>
      </div>
    </div>
    <IconChevronRight s={18} c={DOSIQ.color.inkSubtle}/>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 7. ANVISA Search — Variação B: bottom sheet sobre o form
// ════════════════════════════════════════════════════════════════════════════
const AnvisaSearchSheet = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    {/* Background = form com input ativo */}
    <MedicineFormCreate/>
    {/* Sheet overlay */}
    <DosiqBottomSheet title="Base ANVISA">
      <div style={{
        padding: '4px 20px 12px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#f1f5f9', borderRadius: 999, padding: '0 14px', height: 44,
        }}>
          <IconSearch s={18} c={DOSIQ.color.inkMuted} sw={2}/>
          <span style={{ flex: 1, fontFamily: DOSIQ.font.sans, fontSize: 15, color: DOSIQ.color.ink, fontWeight: 500 }}>
            metop
          </span>
          <span style={{
            width: 1, height: 18, background: DOSIQ.color.primary, animation: 'caret 1s steps(2) infinite',
          }}/>
        </div>
        <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ display: 'block', padding: '12px 4px 8px' }}>
          6 resultados — toque para preencher o formulário
        </T>
      </div>
      <div style={{
        flex: 1, minHeight: 0, overflow: 'auto',
        padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {ANVISA_MOCK.slice(0, 4).map((m, i) => (
          <AnvisaResultCard key={i} item={m} highlighted={i === 0}/>
        ))}
      </div>
      <style>{`@keyframes caret { 50% { opacity: 0; } }`}</style>
    </DosiqBottomSheet>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// 8. DELETE c/ dependências — Bottom sheet bloqueante
// ════════════════════════════════════════════════════════════════════════════
const DeleteDependencySheet = () => (
  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <MedicineDetail/>
    <DosiqBottomSheet>
      <div style={{ padding: '8px 20px 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 999,
          background: DOSIQ.color.warningSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14,
        }}>
          <IconAlert s={28} c={DOSIQ.color.warningSoftFg} sw={2.2}/>
        </div>
        <T variant="titleLG" style={{ display: 'block', marginBottom: 6 }}>Não é possível excluir SeloZok</T>
        <T variant="body" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginBottom: 16 }}>
          Este medicamento está em uso. Desative ou exclua as dependências abaixo antes de continuar.
        </T>

        <T variant="eyebrow" color={DOSIQ.color.inkSubtle} style={{ display: 'block', marginBottom: 10 }}>
          Em uso por
        </T>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DependencyRow
            icon={<IconLayers s={18} c={DOSIQ.color.primary} sw={2}/>}
            type="Protocolo ativo"
            title="ICFEr · Quarteto Fantástico"
            subtitle="Diário · 2 horários"
          />
          <DependencyRow
            icon={<IconLayers s={18} c={DOSIQ.color.primary} sw={2}/>}
            type="Protocolo ativo"
            title="DAPT · Antiplaquetário Duplo"
            subtitle="Diário · 1 horário"
          />
          <DependencyRow
            icon={<IconBox s={18} c={DOSIQ.color.warningSoftFg} sw={2}/>}
            type="Estoque"
            title="16 unidades · 1 lote"
            subtitle="Compra parcial em andamento"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <DosiqButton variant="neutral" size="md" style={{ flex: 1 }}>Voltar</DosiqButton>
          <DosiqButton variant="primary" size="md" style={{ flex: 1 }}>Abrir protocolos</DosiqButton>
        </div>
      </div>
    </DosiqBottomSheet>
  </div>
);

const DependencyRow = ({ icon, type, title, subtitle }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', background: '#f8fafc', borderRadius: 12,
    border: `1px solid ${DOSIQ.color.borderSoft}`,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <T variant="caption" color={DOSIQ.color.inkSubtle} style={{ display: 'block' }}>{type}</T>
      <T variant="bodyStr" style={{ display: 'block', marginTop: 1 }}>{title}</T>
      <T variant="caption" color={DOSIQ.color.inkMuted} style={{ display: 'block', marginTop: 2 }}>{subtitle}</T>
    </div>
    <IconChevronRight s={18} c={DOSIQ.color.inkSubtle}/>
  </div>
);

// ── Export ───────────────────────────────────────────────────────────────────
Object.assign(window, {
  TreatmentsEntry, MedicinesEmpty, MedicinesList,
  MedicineDetail, MedicineFormCreate, MedicineFormEdit,
  AnvisaSearchDedicated, AnvisaSearchSheet, DeleteDependencySheet,
});
