# EXEC SPEC — Fase 2: CRUD Tratamentos (Protocolos)

> **Duração**: 2-3 sprints semanais (T2.1 → T2.2 → T2.3)
> **Branch base (mãe)**: `feat/crud-protocols`
> **Pré-condição**: ✅ Fase 1 completa (PRs #555-#558 + #559 distill)
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate)
> **Titulação**: ⏸️ POSTERGADA — apenas leitura de status, sem edição de schedule
> **Versão do app**: permanece em série `v0.3.x` durante a Fase 2; bump `v0.4.0` só ao final da Fase 3 (CRUDs chave completos)
> **Reviewer humano**: PO valida em iOS + Android (incluindo API 24) + iPhone físico
> **PR strategy**: 1 PR por sub-sprint contra mãe → 1 PR final mãe→main fechando fase (padrão Fase 1)
> **Reescrita**: 2026-05-16 — aplicando RETRO_FASE1 + mocks Fase 2 + ADR-045

---

## 0. Spec Reading Protocol (obrigatório antes de spawn)

Toda sessão de implementação Fase 2 começa com:

1. Ler esta spec **inteira** (R-228 / C1 DEVFLOW)
2. Ler `RETRO_FASE1_CRUD_MEDICAMENTOS.md` (lições aplicáveis)
3. Conferir state.json + RULES_INDEX + ANTI_PATTERNS_INDEX (bootstrap DEVFLOW)
4. Conferir mocks aprovados pelo PO em `plans/backlog-native_app/MOCKS_APP_CRUD/export/fase-2/`
5. Conferir referência hi-fi React em `MOCKS_APP_CRUD/project/dosiq-mocks/protocol-screens.jsx` e `app-fase2.jsx`
6. Conferir glossário em `docs/reference/GLOSSARY.md` (termo UI ↔ código)

**Realismo sobre refinos UX** (lição RETRO §6 T1): mocks 100% revisados antes do kickoff REDUZ commits de iteração; nunca os elimina. Refinos que só aparecem em uso real são aceitos e fazem parte do escopo. O que se evita é refino de elemento JÁ presente no mock.

**Mocks NÃO são pixel-perfect specs** (binding). São **referências visuais e de experiência** — comunicam intent, hierarquia, fluxo. Convenções do projeto sobrescrevem o mock quando há conflito. Exemplos:
- Mocks podem mostrar `"Meus Tratamentos"` no header; código segue convenção **sem pronomes possessivos** ("Tratamentos") — app pode ser usado por cuidadores/familiares (ver §8 Glossário, regra de convenção).
- Mocks podem mostrar `"comprimidos"` hardcoded; código usa `formatDoseUnit(qty, medicine.dosage_unit)` para renderizar a unidade correta (cp/ml/gotas/UI/etc).
- Mocks podem mostrar `"Sem prazo"`; código usa `"Uso contínuo"`.

Em caso de conflito mock vs convenção: **convenção vence**. Em caso de mock ambíguo: consultar PO.

---

## 1. Pré-condições estabelecidas pela Fase 1

A Fase 2 herda diretamente:

| Artefato | Onde | Reuso obrigatório |
|----------|------|-------------------|
| `createMedicineRepository` | `@dosiq/core/repositories/` | Espelhar pattern em `createProtocolRepository` (ADR-045) |
| `zodSetup.js` (locale PT-BR + customError friendly) | `@dosiq/core/zodSetup.js` | Schemas protocolo/treatmentPlan herdam globalmente |
| Form Kit | `apps/mobile/src/shared/components/form/*` | `FormInput`, `FormSelect`, `FormSection`, `FormActions`, `FormDatePicker`, `FormTimePicker`, `FormAutocomplete` |
| Feedback | `apps/mobile/src/shared/components/feedback/*` | `Toast`/`useToast`, `DeleteConfirmation` |
| `useFormState` | `apps/mobile/src/shared/hooks/useFormState.js` | Cuidado AP-156 (refinements cross-campo) |
| `useMutation` | `apps/mobile/src/shared/hooks/useMutation.js` | Wrapper Hermes-safe; pattern `useMedicineMutation` é referência |
| Haptics | `apps/mobile/src/shared/utils/haptics.js` | `lightTap`, `selectionTap`, `successHaptic` |
| Toast pattern | `useMedicineMutation` | Replicar Toast + cache invalidation centralizado em `useProtocolMutation` |
| Hard block delete | `MedicineDeleteBlockedSheet` (Fase 1) | **NÃO** replicar — tratamento permite delete (warning soft, ver §3.7) |
| AsyncStorage cache + TTL | `useMedicines` (Fase 1) | Replicar em `useProtocols` |

### Regras / Anti-patterns críticos para Fase 2

| ID | Aplicação |
|----|-----------|
| R-010 | Ordem hooks States→Memos→Effects→Handlers — comentário template OBRIGATÓRIO em todo componente novo (anti AP-160) |
| R-020 | Zero `new Date()` direto — usar `getTodayLocal` / `parseLocalDate` / `getNow` de `@dosiq/core` |
| R-022 | Limites Zod (dose máx, horários máx 10) |
| R-060 | Agente NUNCA auto-merge; PO sempre aprova |
| R-117 | Mobile lazy load (não relevante para Fase 2 — todas as telas já são carregadas via stack) |
| R-121, R-130 | Zod safeParse em TODOS métodos do service (read + write) |
| R-180 | Hooks com Toast + cache invalidation centralizado |
| R-221 | SQP — zero refactor fora do escopo durante gates |
| R-230 | Brief padrão cavecrew (6 itens obrigatórios) |
| R-231 | Factory pattern em `@dosiq/core/repositories/` |
| R-232 | Zod 4 locale + customError global (não duplicar errorMap) |
| AP-156 | `schema.pick({field:true})` descarta `.refine()` cross-campo — usar `useFormState.validateField` corretamente |
| AP-157 | NFD normalization pré-computada via useMemo (não a cada keystroke) |
| AP-159 | Delete pre-check FK — **NÃO aplicável a tratamento** (ver §3.7) |
| AP-160 | Opus em fixes incrementais viola R-010 — usar template comment + ler bloco antes de editar |
| AP-163 | `borderStyle: 'dashed'/'dotted'` em RN dispara warning (RN só aceita `'solid'`) — usar background shift (No-Line Rule do DESIGN-SYSTEM §2) para separação visual |
| ADR-036 | JS stack (`createStackNavigator`) já está aplicado em `TreatmentsStack`; não migrar |
| ADR-043 | Hardening G1→G2→G3 — parity test obrigatório em G2 |
| ADR-044 | Distribuição cavecrew Opus/Sonnet/Haiku + gate de confiança |
| ADR-045 | Factory location = `@dosiq/core/repositories/` |

### Cuidados aprendidos em T2.1 / T2.2 (smoke PO 2026-05-17)

| Pattern | Aplicação obrigatória |
|---------|----------------------|
| **Listagem usa `isProtocolInPeriod`** (period-only, dateUtils) — NÃO `isProtocolActiveOnDate` (strict, adherenceLogic) | `treatmentsService.getActiveTreatments` + `_treatmentsTransformer`. A versão strict filtra por frequency/weekdays e exclui `quando_necessário`, `personalizado`, `semanal` sem weekdays. Listagem deve mostrar TODOS no período. Adherence/dashboard/stock continuam usando a strict (intent correto). |
| **`isProtocolActiveOnDate` ambíguo** (2 funções com mesmo nome) | Barrel `@dosiq/core` re-exporta a strict como `isProtocolActiveOnDate` e a period-only como `isProtocolInPeriod`. Verificar import correto antes de spawn. |
| **`useFocusEffect(refresh)` em tela de listagem** | TreatmentsScreen + qualquer screen que dependa de dados mutados em outras telas. Cache key invalidation NÃO é suficiente — hook montado não escuta invalidation. |
| **Refresh on open em bottom sheets com lista** | MedicineSelectorSheet `useEffect([open, refresh])`. Captura entidades criadas em fluxos paralelos (ex: "Cadastrar novo medicamento" dentro do sheet). |
| **Reabrir sheet pós retorno de tela de create** | Flag `pendingReopenSheet` + `useFocusEffect`. Mantém foco no contexto de seleção; user vê nova entidade na lista. |
| **Defensive auth destructuring** | `const { data, error } = await supabase.auth.getUser(); const user = data?.user` — NUNCA `const { data: { user }, error }` (crasha se `data` null em falha crítica de rede). Aplicar em todos services mobile. |
| **Padronização "unidade(s)" para dose** | `pluralizeDoseUnit(qty)` e `formatDoseUnit(qty)` SEMPRE retornam "unidade(s)". Mapping por `dosage_unit` (mg→comprimido, ml→ml, gotas→gota, UI→UI) era confuso semanticamente (ex: Apidra 2ml dose=1 mostrava "1 ml" em vez de "1 unidade de 2ml"). Apresentação fica visível separadamente no DosagePill do hero. |
| **Decimais em input numérico** | `handleDoseChange` deve preservar estados intermediários como string (`"0,"`, `"."`, vazio). Conversão para number só no submit antes do `form.validate()`. Eager parse a cada keystroke perde a vírgula e bloqueia decimais. |
| **borderStyle dashed proibido (AP-163)** | Tanto pelo RN (warning ruidoso em LayoutAnimation) quanto pelo DESIGN-SYSTEM §2 No-Line Rule. Usar background shift (primary[50] chip rounded) em vez de borda. |
| **Barrel `packages/core/src/schemas/index.js`** | DEVE re-exportar `WEEKDAYS`, `WEEKDAY_LABELS`, `FREQUENCIES`, `FREQUENCY_LABELS` (faltavam até 2026-05-16 — primary[500] crash em WeekdaySelector). Sempre verificar barrel após adicionar export. |
| **Padding lateral em primitivos atômicos** | Componentes (WeekdaySelector, MedicineSelectorRow, TimeSchedulePicker) NÃO devem ter `paddingHorizontal` próprio — delegar ao container pai (FormSection / Section da tela). Caso contrário, padding cumulativo estoura largura em iPhone (sábado vazando). |

---

## 2. Objetivo

Implementar CRUD completo de **Tratamentos** (entidade DB: `protocols`) no mobile nativo:

- Listagem agrupada por plano terapêutico (Heurística de Complexidade Adaptativa já existe em `TreatmentsScreen`)
- Detalhe expandido com hero do medicamento associado (clickable → tela do medicamento da Fase 1)
- Criação com seleção de medicamento via bottom sheet + frequência + horários (TimePickerChips) + período + plano terapêutico (existente ou inline create)
- Edição (Trocar medicamento + ajustar tudo)
- Exclusão com warning soft + resumo de impacto (histórico recente, NÃO bloqueado)

**Exclusões v1**:
- Edição de `titration_schedule` — apenas leitura do status atual (`titration_status`)
- `advanceTitrationStage()` — não exposta na UI mobile, mas factory mantém o método (web usa)
- TimePickerTimeline (variação B no mock) — fica para v2 se PO solicitar; v1 usa TimePickerChips

---

## 3. Especificação de Telas (UI/UX detalhada baseada em mocks aprovados)

### 3.1 — TreatmentsScreen (Empty State) — `mock-tratamentos-empty-state.png`

**Estado**: usuário sem nenhum tratamento ativo.

**Layout (top → bottom)**:
1. Header: `"Tratamentos"` + subtitle `"Acompanhe os tratamentos ativos"` (titles já existem em Fase 1)
2. Link `"Medicamentos →"` no rodapé (ícone Pill + chevron) — **JÁ implementado em Fase 1**; quando empty, fica no topo
3. Ilustração: card circular com calendário cinza-claro + ícone de "+" verde primary (centralizada, ~120px)
4. Título: `"Comece seu primeiro tratamento"` (titleMD, weight 700)
5. Body: `"Configure doses, horários e duração para receber lembretes e acompanhar a adesão."` (body, cor inkMuted, centro)
6. CTA primário: `"+ Criar primeiro tratamento"` (DosiqButton variant primary block, largura ~80% da tela, height 52)
7. Hint secundário: `"Você pode organizar tratamentos em planos terapêuticos depois"` (caption, cor inkSubtle, centro)

**Comportamento**:
- Tap CTA → `navigation.navigate(ROUTES.PROTOCOL_FORM)` (sem params = create)
- Sem FAB neste estado (CTA grande substitui)

**Reuso**: `EmptyState` Fase 1 não cobre este layout customizado. Criar `TreatmentEmptyState.jsx` específico.

---

### 3.2 — TreatmentsScreen (Listagem) — `mock-tratamentos-listagem-abertura.png`

**Estado**: usuário com tratamentos. JÁ implementado em Fase 1 com Heurística de Complexidade Adaptativa (SIMPLE até 3 protocolos; COMPLEX agrupado por plano com accordions). **Manter implementação atual** com ajustes:

**Adições neste sprint**:
- FAB `"+"` bottom-right sticky — **paridade exata com FAB de `MedicinesListScreen` Fase 1**: `backgroundColor: colors.primary[500]` (verde teal — brand), `width/height: 56`, `borderRadius: borderRadius.full`, `shadows.md` do tokens. NÃO usar primary[600] (azul) — bug detectado e corrigido em smoke 2026-05-17.
- Em cada grupo expandido (modo COMPLEX): footer link `"+ Adicionar tratamento ao grupo"` — **chip soft `colors.primary[50]` com `borderRadius: borderRadius.md` e padding interno**. SEM borderStyle dashed (AP-163 RN + DESIGN-SYSTEM §2 No-Line Rule). Separação visual do próximo grupo via `groupContainer.marginBottom: spacing[4]`.
- Tap em qualquer card → `navigation.navigate(ROUTES.PROTOCOL_DETAIL, { id })`
- Tap FAB → `navigation.navigate(ROUTES.PROTOCOL_FORM)` (create mode)
- Tap "+ Adicionar tratamento ao grupo" → `navigation.navigate(ROUTES.PROTOCOL_FORM, { treatment_plan_id: groupId })` (pré-seleciona plano via `route.params`)
- Link "Medicamentos" no rodapé quando há tratamentos (JÁ implementado em Fase 1)
- **`useFocusEffect(refresh)` obrigatório** — captura tratamentos/planos criados em ProtocolFormScreen (`useTreatments` cache key difere de `@dosiq/protocols-snapshot` invalidado pela mutation).

**Card de tratamento** (mock):
- Ícone pill colorido (primary[500]) + ícone bg pill (primary[50])
- Nome do medicamento + DosagePill (ex: `SeloZok 50mg`)
- Linha 2: `2 comprimidos · 2x ao dia · 08:00 · 20:00` (caption)
- Chevron right (navega para detalhe)

**Reuso**: TreatmentCard já existe — auditar se cobre o layout do mock; refinar se necessário.

---

### 3.3 — ProtocolDetailScreen — `mock-tratamentos-detalhes.png`

**Layout (top → bottom)**:
1. **AppBar**: `← SeloZok manhã/noite` (título = nome do tratamento) | trailing icons: Edit + More (kebab menu para opções como pausar, futuro)
2. **Hero card — Medicamento associado (clicável)**:
   - Background: `primaryBg` (verde claro)
   - Layout: ícone dinâmico **Pill** ou **PillBottle** 52px branco baseado em `medicine.type` (`medicamento` → Pill, `suplemento` → PillBottle) — mesmo pattern aplicado em `MedicineCard` da Fase 1
   - Eyebrow: `"Medicamento" ou "Suplemento"` (caption color primary)
   - Title: `medicine.name` + `DosagePill medicine.dosage_per_pill medicine.dosage_unit` inline (ex: `SeloZok` + `50mg`)
   - Subtitle: `medicine.active_ingredient` (caption inkMuted)
   - Trailing: chevron primary → `navigation.navigate(ROUTES.MEDICINE_DETAIL, { id: medicine_id })`
   - Footer da hero: badge `✓ Estável` (DosiqBadge variant primary com check) + caption `"Em uso há N dias"` (`differenceInDays(getNow(), start_date)`)
   - **Requisito de dado**: `protocolService.getById` detailSelect DEVE incluir `medicine:medicines(*)` (não apenas `medicine_id`) — confirmar em §6
3. **Card "Dosagem & Frequência"** (DosiqCard):
   - SectionLabel: `"DOSAGEM & FREQUÊNCIA"` (eyebrow inkSubtle)
   - DetailRow `Dose por tomada`: `formatDoseUnit(dosage_per_intake)` — sempre **"N unidade(s)"** independente de `medicine.dosage_unit`. Apresentação (`2ml`, `50mg`) já está no DosagePill do hero card acima. Mapping por dosage_unit foi descontinuado em 2026-05-17 (bug Apidra 2ml mostrava "1 ml" em vez de "1 unidade de 2ml").
   - DetailRow `Frequência`: `2x ao dia` (derivado de `time_schedule.length`)
   - Bloco `Horários`: label `"Horários"` + TimeChips lado a lado: `🕐 08:00` `🕐 20:00` (badge primarySoft)
   - DetailRow `Consumo diário`: `formatDoseUnit(dosage_per_intake × time_schedule.length)` — ex: `"4 unidades"`
4. **Card "Período"**:
   - DetailRow `Início`: `formatDatePtBR(start_date)` → `"12 mar 2026"` (DD MMM YYYY)
   - DetailRow `Término`: `formatEndDate(end_date)` → `"Uso contínuo"` se null/undefined, senão `formatDatePtBR(end_date)` (color inkMuted quando `"Uso contínuo"`)
5. **Card "Plano terapêutico"** (se `treatment_plan_id`):
   - SectionLabel: `"PLANO TERAPÊUTICO"`
   - Card clicável: emoji + nome + caption `"+ N outros tratamentos neste plano"` + chevron right → navega para plano (Fase 3 ou novo)
   - **Se sem plano**: mostrar CTA `"+ Adicionar a um plano"`
6. **Card "Observações"** (se `notes`):
   - SectionLabel: `"OBSERVAÇÕES"`
   - Body text com line-height 1.5
7. **Botão Excluir tratamento** (fim, fora dos cards):
   - DosiqButton variant `dangerSoft` size lg block + ícone trash
   - Tap → abrir bottom sheet ProtocolDeleteSheet (§3.7)

**Comportamento**:
- `useFocusEffect(refresh)` para refrescar após edit
- `useProtocol(id)` com cache AsyncStorage (replicar pattern useMedicine)

---

### 3.4 — ProtocolFormScreen (Create) — `mock-tratamentos-criacao.png`

**AppBar**: `← Novo tratamento` (sem trailing)

**Seções verticais** (gap 22px, padding lateral 20px):

1. **`MEDICAMENTO`** (SectionTitle eyebrow):
   - `MedicineSelectorRow` em estado vazio: card dashed border + ícone "+" no quadrado + label `"Selecionar medicamento"` + subtitle `"Escolha da biblioteca ou cadastre um novo"` + chevron right
   - Tap → abre bottom sheet `MedicineSelectorSheet` (§3.5)
2. **`INFORMAÇÕES BÁSICAS`**:
   - `FormInput name="name"` label `"Nome do tratamento"` required, placeholder `"Ex: Hipertensão"`
   - `FormInput name="dosage_per_intake"` label `"Dose por tomada"` required, placeholder `"0"`, `keyboardType="decimal-pad"`. **helperText fixo**: `"Quantas unidades do medicamento por tomada (aceita decimais, ex: 0,5)"`. Sem suffix dinâmico baseado em medicine.dosage_unit (padronização em "unidade(s)" — ver §3.3).
     - **Decimais (`0,5`)**: `handleDoseChange` DEVE preservar estados intermediários como STRING no form state (`"0,"`, `"."`, vazio). Conversão para number só acontece no `handleSubmit` antes do `form.validate()`. Eager parse a cada keystroke apaga a vírgula e bloqueia decimais (bug detectado em smoke 2026-05-17).
3. **`FREQUÊNCIA`**:
   - `FormSelect name="frequency"` label `"Periodicidade"` required, options `[Diário, Dias alternados, Semanal, Personalizado, Quando necessário]` (de `FREQUENCIES` enum)
   - **Condicional**: se `frequency ∈ {semanal, personalizado}` → mostrar `WeekdaySelector` abaixo
   - `TimeSchedulePicker` (var Chips): lista vertical de cards de horário (cada um: ícone clock primary + tempo grande + X remove) + botão dashed `"+ Adicionar horário"` (color primary)
4. **`PERÍODO`** (linha de 2 campos lado a lado):
   - `FormDatePicker name="start_date"` label `"Início"` hint `"opcional"` (mostrado se não informado), default `getTodayLocal()`, placeholder `"Hoje"`, trailing ícone calendário
   - `FormDatePicker name="end_date"` label `"Término"` hint `"opcional"`, placeholder `"Sem prazo / Uso contínuo"`
5. **`ORGANIZAÇÃO`** (renomeado de "Plano terapêutico" — termo mais leve, mock):
   - **Variação A (padrão)**: `FormSelect name="treatment_plan_id"` label `"Plano terapêutico"` com items dos planos existentes + último item `"+ Criar novo"` que muda para Variação B
   - **Variação B**: `PlanInlineCreate` card primaryBg expandido com:
     - Header: `"Criar novo plano"` + link `"Usar existente ↗"` (reverte para A)
     - `FormInput name="plan_name"` label `"Nome"`
     - Bloco "Cor": 5 swatches circulares 40px, tap seleciona (border primary 2.5px + check icon)
     - Bloco "Emoji": 6 emojis em cards 40px, tap seleciona (border primary)
   - Ao submeter, se Variação B preenchida → criar plano on-the-fly via `treatmentPlanService.create()` ANTES de criar protocolo
6. **Textarea `Observações`** (notes) hint `"opcional"`, placeholder `"Notas sobre este tratamento…"`, minHeight 90px

**FormActions** (sticky bottom, fixa fora do scroll):
- Container: background white + borderTop borderSoft + padding 12-20-18
- `Cancelar` (variant neutral, flex 1) — `navigation.goBack()`
- `Criar tratamento` (variant primary, flex 2) — submit

**Validação**:
- `useFormState(protocolCreateSchema)` — use Zod 4 + customError global (Dona Maria friendly)
- Refinements cross-campo (start_date ≤ end_date; titration; weekdays presente quando frequency é semanal/personalizado) executados no `validate()` final, NÃO em `validateField` per-field (AP-156)
- Vírgula decimal em `dosage_per_intake` (pattern handleDoseChange da Fase 1)

---

### 3.5 — MedicineSelectorSheet (bottom sheet) — `mock-tratamentos-busca-medicamentos.png`

Bottom sheet 85% altura sobre `ProtocolFormScreen`. Análogo a `MedicineAnvisaSheet` da Fase 1 estruturalmente, mas dados vêm de `useMedicines()` (biblioteca do user, NÃO ANVISA).

**Layout**:
1. Header: title `"Escolher medicamento"`
2. Search bar: pill cinza claro com ícone search + placeholder `"Buscar em medicamentos…"`
3. Section eyebrow: `"Biblioteca · N medicamentos"` (caption inkSubtle)
4. Lista vertical: cards de medicamento (ícone pill + nome + DosagePill + active_ingredient + radio à direita)
   - Estado `selected`: card com border primary 1.5px + radio preenchido primary + ícone check branco
   - Tap muda seleção (single select)
5. Footer fixo: `"+ Cadastrar novo medicamento"` (DosiqButton variant secondary block) → navega para `MEDICINE_CREATE` da Fase 1

**Comportamento**:
- Filter de busca: NFD normalize pré-computado via useMemo (AP-157)
- **Tap-and-close** (adotado): tap no item já fecha sheet e seta `medicine_id` no form via `onSelect(medicine)` + `onClose()`
- **Refresh on open obrigatório**: `useEffect([open, refresh])` no sheet força reload de `useMedicines()` toda vez que `open` transitionar para `true`. Captura medicamento recém-criado em fluxo paralelo.
- Fluxo "Cadastrar novo medicamento":
  1. Tap no footer dispara callback `onCreateNew()` no parent (ProtocolFormScreen)
  2. Parent seta `pendingReopenSheet=true` ANTES de `navigation.navigate(MEDICINE_CREATE)`
  3. User cria medicamento; MedicineFormScreen faz `goBack` ao concluir
  4. Parent ganha foco — `useFocusEffect` detecta `pendingReopenSheet=true` → reabre sheet automaticamente + limpa flag
  5. Sheet reabre, `useMedicines.refresh()` dispara (useEffect open transition) → novo medicamento aparece na lista
  6. User seleciona manualmente (sem pre-select complexo — foco visual já está no contexto correto)

---

### 3.6 — ProtocolFormScreen (Edit) — `mock-tratamentos-edicao.png`

Mesma estrutura do create, com:
- AppBar: `← Editar tratamento`
- **Medicamento** mostra `MedicineSelectorRow` em estado **selecionado**: card branco com border solid + ícone pill primary + nome + DosagePill + laboratory caption + link `"Trocar"` (color primary, weight 700) na direita
- Tap em "Trocar" → reabre `MedicineSelectorSheet` (§3.5)
- Campos preenchidos com valores atuais (`dosage_per_intake` convertido number→string)
- Botão submit label: `"Salvar alterações"` (em vez de "Criar tratamento")

**Validação**: usar `protocolCreateSchema` (não `partial()`) — mesma regra da Fase 1 (lição: edit deve manter obrigatoriedade).

---

### 3.7 — ProtocolDeleteSheet (bottom sheet warning soft) — `mock-tratamentos-apagar.png`

**Diferente de medicamento (Fase 1)**: tratamento é entidade EFÊMERA. Doses registradas continuam no histórico mesmo após delete. Não há hard block — apenas warning informativo.

**Layout**:
1. Ícone alerta soft (círculo warningSoft 56px com ícone alert warningSoftFg 28px)
2. Title (titleLG): `"Excluir este tratamento?"`
3. Body (inkMuted): `"As doses registradas continuam no histórico — apenas o agendamento futuro será removido."`
4. Section eyebrow: `"HISTÓRICO RECENTE"`
5. Card `#f8fafc` com border borderSoft, 3 DepLineRows:
   - ✓ `14 doses confirmadas` / `Últimos 7 dias` (icon successSoft)
   - 🕐 `0 doses pendentes` / `Agora` (icon warningSoft)
   - 📅 `14 doses agendadas` / `Próximos 7 dias · serão canceladas` (icon primaryBg)
   - Dados vêm de `useProtocolStats(protocol_id)` — novo hook a criar
6. Info banner warningSurface: ícone info + caption `"Excluir o tratamento NÃO apaga o histórico de doses já registradas, nem o cadastro do medicamento."`
7. Ações (linha): `Cancelar` (variant neutral, flex 1) | `🗑 Excluir` (variant danger, flex 1)

**Comportamento**:
- Open: tap no botão "Excluir tratamento" no ProtocolDetailScreen
- Confirm: chama `protocolService.delete(id)` → success toast → `navigation.goBack()` → invalida cache `useProtocols`
- Não bloquear nunca; só informar impacto

**Hook**: `useProtocolDelete(protocol)` — implementação direta (NÃO usa `useMedicineDelete` pattern de pre-check; aqui o pre-check é informativo, não bloqueante).

---

### 3.8 — ProtocolFormErrors (form com erros) — `mock-tratamentos-form-erro.png`

**Estado**: submit com campos faltantes.

**Adições ao form normal**:
1. **Banner topo** (substitui ou complementa o flash do FormSection?):
   - Background dangerSoft + ícone alert dangerSoftFg + caption weight 600: `"Preencha os campos obrigatórios para salvar"`
   - Fixo no topo do scroll (não dismiss)
2. **Inline errors por campo** (mesmo pattern FormInput Fase 1):
   - Medicamento sem seleção: hint `"Selecione o medicamento"` (color danger)
   - Dose vazia: hint `"Informe a dose"` (color danger), border danger no input
   - Horários vazios: hint `"Adicione ao menos um horário"` + botão "Adicionar horário" com border DASHED danger (em vez de primary)
3. **Scroll behavior**: ao submeter inválido, scroll para o topo (banner) e mostra inline errors em todos os campos com problema
4. Touched-only display: respeitar `form.touched[name]` pattern Fase 1 — não mostrar erro antes de blur (UX gentle)

**Mensagens**: vêm do customError global (R-232). Mensagens curtas e PT-BR friendly Dona Maria.

---

## 4. Sprint Breakdown

### Sprint T2.1 — Service Copy + Read Screens (Gate G1 parte 1)

| # | Task | Path | Agente | Complexidade | Brief refs |
|---|------|------|--------|-------------|------------|
| T1.1 | Copiar `protocolService` (web) para mobile com adaptações DI | `apps/mobile/src/features/treatments/services/protocolService.js` | 👤 Opus | ⭐⭐⭐ | R-130, R-232, R-020, mock detalhe §3.3 |
| T1.2 | Copiar `treatmentPlanService` (web) para mobile | `apps/mobile/src/features/treatments/services/treatmentPlanService.js` | 🤖 Sonnet | ⭐⭐ | R-130, R-232 |
| T1.3 | Hook `useProtocols` (listagem + cache AsyncStorage TTL 24h) | `apps/mobile/src/features/treatments/hooks/useProtocols.js` | 🤖 Sonnet | ⭐⭐ | Espelhar `useMedicines.js` |
| T1.4 | Hook `useProtocol(id)` (detalhe) | (mesmo arquivo) | 🤖 Haiku | ⭐ | Espelhar `useMedicine(id)` |
| T1.5 | Atualizar `TreatmentsScreen` — empty state customizado §3.1 + FAB + adicionar tratamento ao grupo §3.2 | `apps/mobile/src/features/treatments/screens/TreatmentsScreen.jsx` | 👤 Opus | ⭐⭐⭐ | R-010 template, mocks §3.1 §3.2 |
| T1.6 | `TreatmentEmptyState.jsx` (componente custom) | `apps/mobile/src/features/treatments/components/TreatmentEmptyState.jsx` | 🤖 Haiku | ⭐ | Mock §3.1 |
| T1.7 | `ProtocolDetailScreen` (§3.3) | `apps/mobile/src/features/treatments/screens/ProtocolDetailScreen.jsx` | 👤 Opus | ⭐⭐⭐ | R-010 template, mock §3.3 |
| T1.8 | Atualizar `TreatmentsStack` com rotas PROTOCOL_FORM + PROTOCOL_DETAIL | `apps/mobile/src/navigation/TreatmentsStack.jsx` | 🤖 Haiku | ⭐ | ADR-036 (JS stack já aplicado) |
| T1.9 | Atualizar `routes.js` | `apps/mobile/src/navigation/routes.js` | 🤖 Haiku | ⭐ | — |
| T1.10 | Testes do `protocolService` mobile (12+ tests espelhando Fase 1) | `apps/mobile/src/features/treatments/services/__tests__/protocolService.test.js` | 🤖 Sonnet | ⭐⭐ | Jest + zod transformIgnorePatterns |
| T1.11 | **Polish performance** — migrar `Ionicons` → `lucide-react-native` em 5 telas auth/landing (LoginScreen, SignupScreen, ForgotPasswordScreen, ResetPasswordScreen, LandingScreen); remover dependência `@expo/vector-icons` | (5 arquivos em `apps/mobile/src/screens/`) | 🤖 Haiku | ⭐ | AP-162; economia ~4 MB assets |

**Entrega**: PR `feat/crud-protocols-t2-1` → merge em `feat/crud-protocols` (mãe).

---

### Sprint T2.2 — Form Complexo + CRUD (Gate G1 parte 2)

| # | Task | Path | Agente | Complexidade |
|---|------|------|--------|-------------|
| T2.1 | `TimeSchedulePicker` (var Chips) | `apps/mobile/src/features/treatments/components/TimeSchedulePicker.jsx` | 👤 Opus | ⭐⭐⭐ |
| T2.2 | `WeekdaySelector` (7 botões D/S/T/Q/Q/S/S) | `apps/mobile/src/features/treatments/components/WeekdaySelector.jsx` | 🤖 Sonnet | ⭐⭐ |
| T2.3 | `MedicineSelectorRow` (vazio + selected com "Trocar") | `apps/mobile/src/features/treatments/components/MedicineSelectorRow.jsx` | 🤖 Sonnet | ⭐⭐ |
| T2.4 | `MedicineSelectorSheet` (bottom sheet busca biblioteca user §3.5) | `apps/mobile/src/features/treatments/components/MedicineSelectorSheet.jsx` | 👤 Opus | ⭐⭐⭐ |
| T2.5 | `PlanSelectField` + `PlanInlineCreate` (toggle entre variações) | `apps/mobile/src/features/treatments/components/PlanSelectField.jsx` | 👤 Opus | ⭐⭐⭐ |
| T2.6 | `ProtocolFormScreen` — create mode (§3.4) | `apps/mobile/src/features/treatments/screens/ProtocolFormScreen.jsx` | 👤 Opus | ⭐⭐⭐ |
| T2.7 | `ProtocolFormScreen` — edit mode (mesmo arquivo, §3.6) | (mesmo) | 🤖 Sonnet | ⭐⭐ |
| T2.8 | `ProtocolFormErrors` UX (§3.8 — banner topo + inline) | (mesmo) | 🤖 Sonnet | ⭐⭐ |
| T2.9 | Hook `useProtocolMutation` (create/update wrappers) | `apps/mobile/src/features/treatments/hooks/useProtocolMutation.js` | 🤖 Sonnet | ⭐⭐ |
| T2.10 | Hook `useProtocolDelete` (delete + bottom sheet open helper) | `apps/mobile/src/features/treatments/hooks/useProtocolDelete.js` | 👤 Opus | ⭐⭐ |
| T2.11 | `ProtocolDeleteSheet` componente (§3.7 — warning soft, não hard block) | `apps/mobile/src/features/treatments/components/ProtocolDeleteSheet.jsx` | 👤 Opus | ⭐⭐⭐ |
| T2.12 | Hook `useProtocolStats(protocol_id)` (doses confirmadas/pendentes/agendadas para sheet de delete) | `apps/mobile/src/features/treatments/hooks/useProtocolStats.js` | 🤖 Sonnet | ⭐⭐ |
| T2.13 | Smoke E2E no simulador (iOS + Android API 24) | Manual | 👤 Humano | — |

**Entrega**: PR `feat/crud-protocols-t2-2` → merge em `feat/crud-protocols`.

---

### Sprint T2.3 — Extract + Migrate (Gate G2 + G3)

| # | Task | Path | Agente | Complexidade |
|---|------|------|--------|-------------|
| T3.1 | Criar `createProtocolRepository` em `@dosiq/core/repositories/` (ADR-045) | `packages/core/src/repositories/createProtocolRepository.js` | 👤 Opus | ⭐⭐⭐ |
| T3.2 | Criar `createTreatmentPlanRepository` em `@dosiq/core/repositories/` | `packages/core/src/repositories/createTreatmentPlanRepository.js` | 🤖 Sonnet | ⭐⭐ |
| T3.3 | Parity tests createProtocolRepository (espelhar 19-test pattern Fase 1) | `packages/core/src/repositories/__tests__/createProtocolRepository.test.js` | 🤖 Sonnet | ⭐⭐ |
| T3.4 | Parity tests createTreatmentPlanRepository | `packages/core/src/repositories/__tests__/createTreatmentPlanRepository.test.js` | 🤖 Haiku | ⭐ |
| T3.5 | Mobile adota factories (refatora services para usar factory) | `apps/mobile/src/features/treatments/services/{protocolService,treatmentPlanService}.js` | 👤 Opus | ⭐⭐ |
| T3.6 | **G2 GATE CHECK** humano (critérios §5.2) | — | 👤 Humano | — |
| T3.7 | Web `protocolService` adota `createProtocolRepository` | `apps/web/src/features/protocols/services/protocolService.js` | 👤 Opus | ⭐⭐⭐ |
| T3.8 | Web `treatmentPlanService` adota `createTreatmentPlanRepository` | `apps/web/src/features/protocols/services/treatmentPlanService.js` | 🤖 Sonnet | ⭐⭐ |
| T3.9 | `validate:agent` web 100% green | `rtk npm run validate:agent` | 🤖 Haiku | ⭐ |
| T3.10 | **G3 GATE CHECK** humano + smoke web | — | 👤 Humano | — |

**Entrega**: PR `feat/crud-protocols-t2-3` → merge em `feat/crud-protocols` → PR final `feat/crud-protocols` → `main` fechando Fase 2.

---

## 5. Quality Gates

### 5.1 — G1 (Cópia)

| Critério | Validação |
|----------|-----------|
| `protocolCreateSchema` com refines funciona no Hermes | `__tests__/protocol.smoke.test.js` |
| CRUD protocolo funcional no sim iOS | Smoke manual T2.13 |
| CRUD protocolo funcional no sim Android API 24 (sem crash rn-screens) | Smoke manual T2.13 |
| `TimeSchedulePicker` add/remove sem crash | Demo gravada |
| `MedicineSelectorSheet` lista medicamentos do user | Depends Fase 1 |
| `WeekdaySelector` toggle on/off | Smoke manual |
| `PlanInlineCreate` cria plano on-the-fly | Smoke manual |
| `ProtocolDeleteSheet` mostra histórico correto | Smoke manual (precisa user com doses) |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |
| Jest mobile suite > 12 tests new (protocolService) | CI |
| Lint clean nos arquivos novos | `rtk lint <files>` |

### 5.2 — G2 (Extração)

| Critério | Validação |
|----------|-----------|
| `createProtocolRepository` inclui `advanceTitrationStage` (mesmo mobile não usa) | Test unitário |
| Mobile usa factory — todos tests passam | CI |
| 19+ parity tests cobrem CRUD + presets web/mobile + edge cases | `rtk vitest run packages/core/src/repositories/__tests__/createProtocolRepository.test.js` |
| Schema canônico em `@dosiq/core/schemas/protocolSchema.js` é único source of truth | Grep verification |
| Locale Zod PT-BR friendly (R-232) cobre mensagens novas (array empty, datetime) | Smoke manual no form |

### 5.3 — G3 (Migração)

| Critério | Validação |
|----------|-----------|
| Web `protocolService.js` é apenas wrapper sobre factory | Grep verification + diff < 30 LOC |
| Web `treatmentPlanService.js` idem | Grep verification |
| `validate:agent` web 100% green + build OK | CI |
| Smoke web manual: criar/editar/apagar protocolo via UI web sem regressão | Checklist `docs/operations/PROTOCOLS_G3_SMOKE_CHECKLIST.md` |
| Zero LOC duplicado entre web e mobile no CRUD de protocolos | Diff |

---

## 6. Schema (referência)

`packages/core/src/schemas/protocolSchema.js` já existe e é canônico. **NÃO duplicar/adaptar**. Confirmar antes do spawn:

- `name`: string min 2 max 200
- `medicine_id`: uuid required
- `treatment_plan_id`: uuid optional/nullable
- `dosage_per_intake`: number positive
- `frequency`: enum `['diario', 'dias_alternados', 'semanal', 'personalizado', 'quando_necessario']`
- `weekdays`: array of `['dom','seg','ter','qua','qui','sex','sab']` — required se frequency ∈ {semanal, personalizado}
- `time_schedule`: array of `"HH:MM"` strings, min 1, max 10
- `start_date`: date required (default getTodayLocal)
- `end_date`: date optional (refinement: end_date ≥ start_date)
- `notes`: string max 1000 optional
- `active`: boolean default true
- `titration_status`: enum default `'estavel'`
- `titration_schedule`: array (objects) — read-only mobile v1
- `current_stage_index`: integer default 0

**Cuidados Zod**:
- Datetime: `z.string().datetime({offset:true})` ou `z.date()` (decidir pattern; em mobile manipulamos como `YYYY-MM-DD` string via `getTodayLocal`)
- Customizar mensagens só quando regra dá info útil (R-232); deixar locale global cobrir genéricos
- Refinements cross-campo: **NÃO** usar `schema.pick({field:true}).safeParse` (AP-156). Usar `validateField` do `useFormState` que parsea objeto completo e filtra issues por campo

### Helpers de Apresentação (`@dosiq/core/utils/`)

Centralizados em `@dosiq/core` para reuso web↔mobile. Já criados em PR-A T2.1 (mergeado).

```javascript
// packages/core/src/utils/doseUnit.js — Fase 2 (padronizado 2026-05-17)
//
// dosage_per_intake = NÚMERO DE UNIDADES farmacêuticas do medicamento por
// tomada (1 comprimido, 1 ampola, 1 gota). A apresentação (dosage_per_pill +
// dosage_unit no medicamento) é a carga POR UNIDADE — exibida separadamente
// no DosagePill do hero card.
//
// Padronização: SEMPRE "unidade(s)", independente de dosage_unit. Mapping
// (mg→comprimido, ml→ml, gotas→gota) foi descontinuado por gerar bug
// semântico (Apidra 2ml dose=1 → "1 ml" em vez de "1 unidade [de 2ml]").

export function pluralizeDoseUnit(qty) {
  return Number(qty) === 1 ? 'unidade' : 'unidades'
}

// Hermes (mobile) sem ICU completo → replace('.', ',') manual em vez de
// toLocaleString('pt-BR') (cairia em fallback US).
export function formatDoseUnit(qty) {
  const display = String(qty).replace('.', ',')
  return `${display} ${pluralizeDoseUnit(qty)}`
}
```

```javascript
// packages/core/src/utils/dateFormat.js — Fase 2

// formatDatePtBR('2026-03-12') → '12 mar 2026'
export function formatDatePtBR(isoDate) { /* tabela manual de meses PT */ }

// formatEndDate(null) → 'Uso contínuo'
// formatEndDate('2026-12-31') → '31 dez 2026'
export function formatEndDate(isoDate) {
  if (!isoDate) return 'Uso contínuo'
  return formatDatePtBR(isoDate)
}
```

**Reuso obrigatório**: tanto detail (§3.3) quanto form (§3.4 helperText) usam apenas o número (sem dosage_unit). Web pode adotar os mesmos helpers no G3.

### Barrel exports críticos (`packages/core/src/schemas/index.js`)

A partir de 2026-05-16, o barrel DEVE re-exportar (faltavam — bug crashou WeekdaySelector):

```javascript
export {
  protocolSchema, protocolCreateSchema, ...,
  FREQUENCIES, FREQUENCY_LABELS,
  WEEKDAYS, WEEKDAY_LABELS,  // ← obrigatórios para WeekdaySelector + FormSelect frequency
} from './protocolSchema.js'
```

### Função `isProtocolActiveOnDate` — DUAS variantes (cuidado)

`@dosiq/core` exporta DUAS funções com semântica diferente — escolher a correta por contexto:

| Função | De onde | Comportamento | Quando usar |
|--------|---------|---------------|-------------|
| `isProtocolActiveOnDate` | `adherenceLogic.js` (strict) | Checa period + frequency + weekdays. Retorna false para `quando_necessário`/`personalizado` SEMPRE. Para `semanal` exige `weekdays`. | Adherence: cálculo de doses esperadas hoje. Dashboard/calendar/stock. |
| `isProtocolInPeriod` | `dateUtils.js` (period-only) | Checa apenas start_date/end_date | **Listagem** de tratamentos visíveis ao paciente. treatmentsService + _treatmentsTransformer. |

Usar o nome errado oculta tratamentos não-diários da listagem (bug detectado e corrigido em 2026-05-17).

---

## 7. Brief padrão para spawn (R-230 — 6 itens obrigatórios)

Todo spawn cavecrew Fase 2 DEVE receber:

1. **Read-only refs absolutas**:
   - Esta spec inteira (path absoluto)
   - Mock(s) PNG aplicáveis (path absoluto em `MOCKS_APP_CRUD/export/fase-2/`)
   - JSX referência (path absoluto em `MOCKS_APP_CRUD/project/dosiq-mocks/protocol-screens.jsx` com range de linhas)
   - Arquivo Fase 1 análogo (ex: `MedicineFormScreen.jsx` para Form, `MedicineAnvisaSheet.jsx` para sheet)
   - Doc canônica relevante (`docs/reference/FORM_KIT.md`, `docs/reference/GLOSSARY.md`)
2. **Path absoluto** do arquivo a criar/modificar
3. **Contrato exato** (props, API esperada) com exemplo de chamada
4. **Regras críticas explícitas**:
   - R-010 — bloco template `// States (R-010 — States → Memos → Effects → Handlers)` OBRIGATÓRIO no topo do componente
   - R-020 — zero `new Date()` direto
   - R-022 — limites Zod
   - R-230 — este brief
   - Lint `react-hooks/refs`, `react-hooks/set-state-in-effect`, zero color literals, `StyleSheet.create()`
5. **Output esperado**: código + ponto único de integração (qual arquivo importa, qual rota navega)
6. **Sem commits** — apenas Write/Edit

**Pós-spawn (Opus arquiteto)**:
- `rtk lint <file>` — qualquer erro = retrabalho contabilizado
- `rtk jest <pattern>` quando aplicável
- Verificar R-010 ritual (template comment presente) antes de commitar

---

## 8. Glossário de Termos (Fase 2)

### Convenções de string (aplicam-se a TODA UI do app)

| Regra | Razão |
|-------|-------|
| **Sem pronomes possessivos** em headers, placeholders, subtitles, CTAs (proibido: "meu/minha/meus/minhas/sua/seu/seus") | App pode ser usado por cuidadores/familiares; os remédios/tratamentos não são "deles". Exemplos: ❌ "Meus Tratamentos" → ✅ "Tratamentos"; ❌ "Buscar nos meus medicamentos" → ✅ "Buscar em medicamentos". |
| **"Uso contínuo"** em vez de "Sem prazo" para `end_date` null | Termo mais claro para paciente — comunica intenção (tratamento ongoing). |
| **Unidades formatadas via `pluralizeDoseUnit`** | Nunca hardcoded "comprimidos" — usar helper baseado em `medicine.dosage_unit`. |
| **Datas PT-BR** formato `"12 mar 2026"` (`DD MMM YYYY`) | Padrão visual brasileiro; mês abreviado lowercase. |
| **Vírgula decimal** em valores numéricos exibidos (`15,5 ml`, não `15.5 ml`) | Via `toLocaleString('pt-BR')`. |

### Tabela termo UI ↔ código

| Termo UI (PT) | Variável código (EN) | Contexto |
|---------------|---------------------|----------|
| Tratamento(s) | `protocol(s)` | DB table `protocols`; UI usa "tratamento" sempre |
| Plano terapêutico / Organização | `treatment_plan` | DB table; UI usa "plano" curto OU "organização" em forms |
| Dose por tomada | `dosage_per_intake` | Quantidade em unidades farmacêuticas (cp/ml/gotas/UI/etc — depende de `medicine.dosage_unit`); renderizar via `formatDoseUnit` |
| Frequência / Periodicidade | `frequency` | enum PT-BR snake_case |
| Horários | `time_schedule` | array de "HH:MM" |
| Dias da semana | `weekdays` | array enum dom/seg/ter/qua/qui/sex/sab |
| Início / Término | `start_date` / `end_date` | YYYY-MM-DD; `end_date null` → renderizar `"Uso contínuo"` via `formatEndDate` |
| Observações | `notes` | string livre |
| Estado | `titration_status` | enum (estavel/escalando/descalando) — read-only v1 |

(Glossário completo: `docs/reference/GLOSSARY.md`)

---

## 9. Smoke Checklist E2E (PO)

Documento canônico: `docs/operations/PROTOCOLS_G3_SMOKE_CHECKLIST.md`

Cobertura mínima:
- iOS sim — empty state, create com novo plano, edit (Trocar medicamento), delete (sheet warning)
- Android API 24 sim — same flows sem crash rn-screens
- Android moderno sim — same
- Web — após G3, criar/editar/apagar via UI web sem regressão de Adherence, Dashboard, etc.

---

## 10. PR Strategy

| Sprint | PR contra | Reviewer humano | Reviewer LLM |
|--------|-----------|-----------------|--------------|
| T2.1 | `feat/crud-protocols` | PO valida iOS+Android | Gemini-Code-Assist (`/check-review`) |
| T2.2 | `feat/crud-protocols` | PO valida iOS+Android API 24 + iPhone físico | Gemini-Code-Assist |
| T2.3 | `feat/crud-protocols` | PO valida web (G3) | Gemini-Code-Assist |
| **Final** | `main` | PO aprova fechamento da Fase 2 | Gemini-Code-Assist |

**Nota sobre reviewer LLM**: Gemini pode flagar APIs de libs novas (Zod 4 etc) por corpus desatualizado — validar empiricamente antes de aplicar (RETRO §6 T4).

---

## 11. Critérios para encerramento da Fase 2

- [ ] G1, G2, G3 todos passaram (humano)
- [ ] PR final mãe→main mergeada (humano)
- [ ] DEVFLOW C5 executado: R-NNN, AP-NNN, ADR-NNN, journal entry, state.json bump
- [ ] Spec atualizada com lições da Fase 2 (capture-as-you-go)
- [ ] Smoke checklist completo (`PROTOCOLS_G3_SMOKE_CHECKLIST.md` 100%)
- [ ] Distill trigger se `journal_entries >= 15`

---

## 12. Histórico

- **2026-05-17 (Sprint T2.2 PR-A + PR-B smoke PO)**: Spec atualizada com lições de implementação real (3 PRs mergeados: #561 PR-A T2.1, #563 PR-A T2.2, #562 T2.1 fan-out; #564 PR-B T2.2 aguardando review). Mudanças principais:
  - §1 — adicionado AP-163 (borderStyle dashed/dotted RN proibido) + bloco "Cuidados aprendidos em T2.1/T2.2" com 11 patterns obrigatórios (focus refresh, sheet reopen, defensive auth destructure, padronização unidade(s), decimais intermediate string, padding lateral atomic components, etc.).
  - §3.2 — FAB primary[500] verde teal (paridade Fase 1 — não primary[600] azul). Link "+ Adicionar tratamento ao grupo" usa chip primary[50] soft em vez de dashed border (No-Line Rule + AP-163). `useFocusEffect(refresh)` obrigatório.
  - §3.3 — Dose por tomada/Consumo diário usam `formatDoseUnit(qty)` sem dosage_unit (padronizado em "unidade(s)").
  - §3.4 — Dose input com `decimal-pad` aceita decimais via estado intermediate string (coerce no submit). helperText explica intent.
  - §3.5 — MedicineSelectorSheet com refresh on open + flow completo "Cadastrar novo medicamento" (pendingReopenSheet flag + reabertura automática).
  - §6 — Helpers reescritos (padronização "unidade(s)"). Barrel exports schemas/index.js explicitados. Documentação das DUAS `isProtocolActiveOnDate` (strict adherence vs period-only) com tabela de uso.
  - PRs entregues: #561 helpers+protocolService, #562 hooks+screens+navigation+icons, #563 primitivos+useProtocolMutation/Delete/Stats+dev demo, #564 MedicineSelectorSheet+PlanSelectField+ProtocolFormScreen CREATE.
  - Bugs corrigidos no smoke (8 ciclos cobertos pela spec atualizada): WEEKDAYS not exported, Android picker race condition, sábado vazando, dashed warning, focus refresh, sheet reopen, isProtocolActiveOnDate strict filtrando não-diários, Apidra 2ml semantic, decimais bloqueados.
- **2026-05-16 (Spike Pre-Fase-2)**: Spec reescrita aplicando RETRO_FASE1 (18 gaps) + mocks Fase 2 aprovados pelo PO (8 PNG + 1173 LOC JSX referência) + ADR-045 (factory location). Mudanças principais:
  - G1: factory location consolidado em `@dosiq/core/repositories/` (descarta `shared-data/services/`)
  - G4: delete tratamento NÃO usa hard block — warning soft com histórico (mock confirma)
  - G14: versão permanece série v0.3.x; bump v0.4.0 só fim Fase 3
  - Seções §3.1-§3.8 com UI/UX detalhada baseada em mocks
  - Brief cavecrew R-230 explícito em §7
  - Glossário §8 + Smoke checklist §9 + PR strategy §10 + Encerramento §11
- **(prévio)**: Spec original criada — agora reescrita.
