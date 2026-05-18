# G3 Smoke Checklist — Tratamentos (Web + Mobile)

> Checklist obrigatório anexado ao PR final da Fase 2 (`feat/crud-protocols` → `main`).
> PO valida em ambientes específicos antes do merge. Todos itens ✅ obrigatórios.
> Estágio: closed alpha (time interno). Reavaliar formalismo pré-beta externo.

---

## Pré-condições

- [ ] G2 mergeado em mãe (`feat/crud-protocols`)
- [ ] PR G3 atômica: somente swap web + factory (sem refactor adicional, sem outro domínio)
- [ ] `git diff main..HEAD --stat` reflete escopo da Fase 2 apenas
- [ ] `rtk npm run validate:agent` web 100% green local
- [ ] Jest mobile 100% green local (`rtk npm test --workspace @dosiq/mobile`)
- [ ] Parity tests `createProtocolRepository.test.js` + `createTreatmentPlanRepository.test.js` passando (mocked client)
- [ ] `rtk npm run build` web OK local
- [ ] ADR-045 aplicado: factories em `@dosiq/core/repositories/` (não em `shared-data/`)
- [ ] Helpers `formatDoseUnit`, `pluralizeDoseUnit`, `formatEndDate`, `formatDatePtBR` em `@dosiq/core/utils/`
- [ ] Glossário (`docs/reference/GLOSSARY.md`) revisado para garantir consistência das strings

---

## Fluxos Críticos Mobile — iOS Simulator

### Empty state
- [x] Login com usuário sem tratamentos → vê `TreatmentEmptyState` com ilustração + CTA "Criar primeiro tratamento"
- [x] Tap no CTA abre `ProtocolFormScreen` (create mode)

### Create
- [x] Tap em "Selecionar medicamento" abre `MedicineSelectorSheet` (bottom sheet 85%)
- [x] Buscar medicamento na biblioteca (filter funciona, NFD normalize OK)
- [x] Selecionar medicamento → sheet fecha + `MedicineSelectorRow` mostra estado "selected" com "Trocar"
- [ ] Tap "Trocar" reabre sheet
- [x] Preencher Nome do tratamento, Dose por tomada (com vírgula `1,5`), Periodicidade Diário, adicionar 2 horários (08:00, 20:00)
- [ ] Suffix do input "Dose por tomada" muda dinamicamente baseado em `medicine.dosage_unit` (ex: "ml" vs "comprimidos" vs "gotas")
- [x] Tap em "Periodicidade: Semanal" mostra `WeekdaySelector` — togglar dias
- [x] Plano terapêutico: variação A (select existente) funciona
- [x] Plano terapêutico: variação B (criar novo inline) funciona — cor + emoji salvam
- [ ] Adicionar Observações
- [x] Submit com campos válidos → toast sucesso → volta para listagem → tratamento aparece
- [ ] Submit com campos vazios → banner topo `"Preencha os campos obrigatórios"` + inline errors em PT-BR friendly Dona Maria

### Detail
- [x] Tap em tratamento da listagem abre `ProtocolDetailScreen`
- [x] Hero card mostra ícone correto: Pill se `medicine.type='medicamento'`, PillBottle se `'suplemento'`
- [ ] Tap no hero card navega para `MedicineDetailScreen` (Fase 1)
- [x] Badge `✓ Estável` exibido (titration_status)
- [x] "Em uso há N dias" calculado corretamente
- [x] Card Dosagem & Frequência: `formatDoseUnit` rende `"2 comprimidos"` / `"15 ml"` / `"3 gotas"` corretamente conforme `dosage_unit`
- [x] Consumo diário = `dosage_per_intake × time_schedule.length`
- [x] Card Período: `end_date` null → mostra `"Uso contínuo"` (não "Sem prazo")
- [ ] Card Plano terapêutico aparece se há plano; mostra emoji + nome + "+ N outros tratamentos"
- [x] Card Plano: se sem plano, mostra CTA "+ Adicionar a um plano"

### Edit
- [x] Tap ícone editar no AppBar abre form em edit mode
- [x] Campos preenchidos com valores atuais (dose convertida number→string)
- [ ] Trocar medicamento via sheet funciona
- [x] Salvar alterações → toast + volta + lista reflete

### Delete (warning soft)
- [x] Tap "Excluir tratamento" no detail abre `ProtocolDeleteSheet`
- [x] Sheet mostra histórico: doses confirmadas / agendadas (dados de `useProtocolStats`)
- [x] Banner amarelo `"Excluir o tratamento NÃO apaga o histórico"` visível
- [ ] Tap Cancelar fecha sheet sem ação
- [x] Tap Excluir confirma → toast → navigation.goBack() → listagem atualiza (tratamento sumiu)
- [ ] Histórico de doses (Tab Hoje, Calendário, Relatórios) MANTÉM doses já registradas

### Refresh / Cache
- [x] Após criar/editar/excluir, voltar para listagem → cache invalidado, dados frescos
- [ ] Modo offline: sem rede, abrir lista → vê cache AsyncStorage com banner "stale"

### Sem pronomes (R-201)
- [x] Header listagem: `"Tratamentos"` (não "Meus Tratamentos")
- [ ] Search bar em medicamento selector: `"Buscar em medicamentos..."` (não "meus")
- [x] Subtitle empty: sem pronome possessivo
- [x] CTAs: sem pronome

---

## Fluxos Críticos Mobile — Android API 24 Simulator (Crash Prevention)

> Cenário legacy de Hermes — ADR-036 (JS stack já aplicada em TreatmentsStack).

- [x] Lista de tratamentos carrega sem crash de rn-screens
- [x] Navegar listagem → detail → form → goBack — sem `IndexOutOfBoundsException`
- [x] Bottom sheets abrem/fecham (MedicineSelectorSheet, ProtocolDeleteSheet, PlanInlineCreate)
- [x] TimeSchedulePicker add/remove sem crash
- [x] WeekdaySelector toggle sem crash

---

## Fluxos Críticos Mobile — Android moderno + iPhone físico

- [ ] Repetir os fluxos críticos iOS sim em pelo menos 1 device físico
- [ ] Haptics disparam (lightTap, selectionTap, successHaptic)
- [ ] Keyboard `decimal-pad` aparece em campos numéricos
- [ ] SafeArea respeitada em iPhone com notch

---

## Fluxos Críticos Web (após swap factory G3)

### CRUD básico
- [ ] Login com usuário com tratamentos
- [ ] Lista de tratamentos web carrega
- [ ] Criar tratamento via UI web → salva e aparece
- [ ] Editar tratamento → atualiza
- [ ] Excluir tratamento → remove

### Joins e relacionamentos
- [ ] Listagem mostra `medicine:medicines(*)` joined corretamente
- [ ] Detalhe mostra `treatment_plan:treatment_plans(*)` joined

### Cross-domain (regressão indireta)
- [ ] Tab **Hoje** — doses do dia renderizam (dependem de protocols)
- [ ] Tab **Calendário** — adesão calcula sem erro
- [ ] Tab **Relatórios** — agregação por tratamento renderiza
- [ ] **Titulação web** — `advanceTitrationStage` funciona (factory mantém método)
- [ ] **Adherence service** — `calculateProtocolAdherence(id, period)` retorna valores

### Multi-tenancy / RLS
- [ ] Usuário A → vê apenas seus tratamentos
- [ ] Logout + login B → vê apenas dele (zero vazamento)

### Console / Network
- [ ] Console limpo (sem erros em runtime)
- [ ] Network: chamadas `medicines.select`, `protocols.select`, `treatment_plans.select` retornam 200
- [ ] Payload de `create/update` matches Zod schema canônico

### Schema canônico
- [ ] Refinements cross-campo (start_date ≤ end_date; weekdays required se frequency in {semanal, personalizado}) bloqueiam payload inválido
- [ ] Mensagens de erro em PT-BR friendly Dona Maria

---

## Critério de aprovação

- [ ] Todos os checks acima ✅
- [ ] Zero regressão detectada
- [ ] Bundle size web: variação < +5% vs main pré-Fase-2 (`rtk npm run build` reporta)
- [ ] Bundle size mobile: variação < +5% (baseline a definir no Spike Pre-Fase-2 / S10)

**Após aprovação**: PO autoriza merge final mãe→main. Agente NUNCA auto-merge (R-060).

---

## Histórico

- 2026-05-16 — esqueleto criado no Spike Pre-Fase-2. Itens detalhados serão refinados durante sprints T2.1-T2.3.
