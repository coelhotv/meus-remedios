# EXEC SPEC — Fase 1: CRUD Medicamentos

> **Duração**: 2-3 sprints semanais
> **Branch base**: `feat/crud-medications`
> **Referência**: MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md §9 (Fase 1)
> **Pré-condição**: ✅ Fase 0 (Pré-Requisitos) completa — PRs #548 + #549 + #551 mergeados em `feat/crud-foundation`; PR final #552 mãe→main em revisão
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate) — **end-to-end antes de iniciar Fase 2**
> **Mocks Hi-Fi**: `plans/backlog-native_app/MOCKS_APP_CRUD/export/mock-medicamentos-*.png`
> **Protótipo HTML**: `plans/backlog-native_app/MOCKS_APP_CRUD/project/Dosiq · Fase 1 - Medicamentos.html`
> **Versão do app**: 'v0.3.8' - ainda continua sendo um minor improvement, sem mudança de experiencia na app

---

## Objetivo

> ⚠️ **TERMINOLOGIA OBRIGATÓRIA (PO 2026-05-15):** em toda UI/copy do app o termo `protocolo` está **proibido** — usar sempre **`tratamento`**. Justificativa: "protocolo" é jargão médico que cuidadores/familiares não usam; quebra cognição em closed alpha. Vale para títulos, labels, mensagens vazias, contadores e i18n strings. **NÃO** alterar nomes de colunas/variáveis JS (`protocols`, `treatment_plan`, `active_protocols_count` etc) — só strings exibidas. Próximas specs DEVEM herdar esta regra.

Implementar CRUD completo de **Medicamentos** no mobile nativo, consumindo a fundação entregue na Fase 0:
- Listagem com busca e contador de tratamentos ativos
- Empty state com CTA "Cadastrar primeiro medicamento"
- Criação com **bottom sheet** ANVISA (não fullscreen)
- Edição completa
- Exclusão com verificação de dependências (tratamentos ativos, estoque, doses) via `DeleteConfirmation` + `Toast`
- Detalhes completos do medicamento (badges, classe terapêutica, "Em uso")

Ao final, o domínio Medicamentos percorre G1 → G2 → G3 completamente.

---

## Fundação Disponível (Fase 0)

Esta spec **consome** o que Fase 0 entregou. Não duplicar.

| Recurso | Origem | Uso em Fase 1 |
|---------|--------|---------------|
| `useFormState(schema, { initialValues })` | P.1 — `apps/mobile/src/shared/hooks/` | Estado dos forms de Create/Edit. `deepEqual` corrigido p/ Date; `validateField` preserva refinements cross-field (`.refine`). |
| `FormInput / FormSelect / FormDatePicker / FormTimePicker / FormSection / FormActions / FormAutocomplete` | P.1+P.2 — `apps/mobile/src/shared/components/form/` | Primitivos do form. Contrato comum `(name, value, error, onChange, onBlur)` + helper `formProps(form, name)`. |
| `useMutation({ onSuccess, onError, invalidateKeys, timeoutMs })` | P.2 — `apps/mobile/src/shared/hooks/` | C/U/D com guard double-submit, timeout Hermes-safe via `Promise.race`, invalidação AsyncStorage, haptics automáticos. |
| `useMedicineDatabase()` | P.2 — `apps/mobile/src/shared/hooks/` | Cache+sync banco ANVISA (~6800 registros). Word-boundary prefix match. Pré-normalização via `useMemo` no boot. Regex diacríticos `̀-ͯ`. |
| `AnvisaSearchScreen` (browse fullscreen) | P.2 — `apps/mobile/src/features/medications/screens/` | Fullscreen standalone (NÃO usado no fluxo de cadastro Fase 1). Mantido para futuro "explorar base ANVISA" em Tratamentos. |
| `DeleteConfirmation` bottom sheet | P.3 — `apps/mobile/src/shared/components/feedback/` | Modal de confirmação destrutiva. `warningHaptic` ao abrir. |
| `ToastProvider` + `useToast()` | P.3 — `apps/mobile/src/shared/components/feedback/` | Feedback `success/error/info`. Auto-dismiss + animação saída. Já wired em `AppRoot`. |
| `haptics.js` wrapper | P.3 — `apps/mobile/src/shared/utils/` | `successHaptic / errorHaptic / warningHaptic / lightTap / mediumTap / heavyTap / selectionTap`. |
| Doc canônica Form Kit | P.3 — `docs/reference/FORM_KIT.md` | Consultar **antes** de criar qualquer novo form. Inclui exemplo de CRUD básico. |
| Guia upload ANVISA | P.2 — `docs/operations/GUIA_UPLOAD_ANVISA_SUPABASE_STORAGE.md` | Bucket `dosiq-assets` no projeto `kwqjtdsqkkbebfiaxubb` (já configurado). |
| Placeholders de rota | P.3 — `apps/mobile/src/navigation/routes.js` | `MEDICINE_CREATE / MEDICINE_EDIT / MEDICINE_DETAIL` já declarados. |
| `_dev/screens/FormKitDemoScreen.jsx` | P.1/2/3 — `apps/mobile/src/features/_dev/screens/` | Padrão de validação visual antes de PR. Replicar com `MedicineDemoScreen` na Fase 1. |

---

## Lições da Fase 0 (aplicar em Fase 1)

1. **Cavecrew sonnet ⭐⭐ + brief detalhado + read-only refs + lint round-trip pós-spawn = 0 retrabalhos** (validado em P.2 e P.3). Reusar pattern.
2. **Padrão serializável de retorno entre telas** — `route.params.returnRoute` (string) + consumer `useEffect` com `setTimeout(0)` defer. **Nunca** passar callbacks em `route.params` (warn React Navigation + bug de stale closure).
3. **R-010 — Ordem dos hooks**: `States → Memos → Effects → Handlers`. Lint `react-hooks/refs` proíbe `useRef(...).current` em render — usar `useState(() => new Animated.Value(0))[0]` para valores animados.
4. **R-020 — Timezone**: zero `new Date()` direto. Sempre `getNow()` de `@dosiq/core`.
5. **R-022 — Dose**: `quantity_taken <= 100` em comprimidos (não mg). Schemas Zod devem refletir.
6. **R-168 — Hermes timeout**: `useMutation` já encapsula via `Promise.race`. Não duplicar.
7. **Lint `react-hooks/set-state-in-effect`**: `setState` síncrono em `useEffect` dispara erro — usar `setTimeout(0)` defer quando necessário (padrão do `FormAutocomplete` linha ~85 e do consumer de `returnRoute`).
8. **R-020/styleguide cores**: zero color literals (`'#000'`, `'#fff'`). Sempre `colors.*` de `@shared/styles/tokens`.
9. **Demo screen como gate visual** — toda sprint termina com seção demo validada em sim iOS + Android + device físico antes do PR.
10. **Branch strategy**: `feat/crud-medications-m1-1` → mãe `feat/crud-medications` → 1 PR por sprint. PR final mãe→main para fechar Fase 1.
11. **CI workflow filter `feat/**`** — já corrigido em PR #550 (`.github/workflows/test.yml`). PRs entre branches feature rodam o pipeline.
12. **Integration tests pattern** (P.3 — `FormKit.integration.test.jsx`): mock `react-native-safe-area-context` + `lucide-react-native` (Proxy stub) + `expo-haptics`. Schema sintético reflete R-022.
13. **`useFormState` API**: além de `values/errors/touched`, expõe `setValues({...})` para auto-fill multi-campo (usado no select ANVISA).
14. **`Toast` vs `Alert.alert`**: usar `useToast()` para feedbacks não-bloqueantes (success/error de mutation). `DeleteConfirmation` para confirmações destrutivas. `Alert.alert` apenas para casos onde modal nativo é melhor (raro).

---

## Decisão UX (PO + Mocks Hi-Fi)

### ANVISA no cadastro = bottom sheet

> **Decisão PO + confirmada no mock** `mock-medicamentos-criar-busca-anvisa.png`:
>
> No fluxo de **cadastro de medicamento**, o botão "Buscar na base ANVISA" no topo do form abre um **bottom sheet** com search + lista de resultados (cards `Selozok / Seloken Zok / Metoprolol Ems / Metoprolol Teuto`). Selecionar preenche o form e fecha o sheet.
>
> **Componente novo**: `MedicineAnvisaSheet.jsx` (em `features/medications/components/`).
>
> `AnvisaSearchScreen` fullscreen (Fase 0) **NÃO é usado aqui**. Mantido para um futuro fluxo "explorar base" em Tratamentos.

### Listagem

> Mock `mock-medicamentos-listagem.png` + ajustes UX consolidados (M1.1+M1.2):
> - Header: **back button (ChevronLeft) à esquerda** + título "Medicamentos" (sem possessivo) + ícone search à direita — toggle search bar inline
> - Search bar (client-side filter sobre `getAll`, normalize NFD) — **busca por nome OU princípio ativo** (não laboratório)
> - Counter "N MEDICAMENTOS" + sort "Mais recentes ↓" (sort apenas visual v1)
> - Entry point: link "Medicamentos" no topo de TreatmentsScreen (`mock-medicamentos-link-tratamentos.png`)
> - Cards: ícone por tipo + Nome **inline com dose pill ao lado** · **Princípio Ativo** (subtitle — não laboratório, mais útil p/ contextualizar marcas) · "N tratamentos associados" (label v1, sem filtrar active)
> - FAB "+ Novo medicamento" (verde, bottom-right) — usar `lightTap` ao tocar
> - Tab bar inferior (Hoje / Tratamentos selecionada / Estoque / Perfil)
> - **Refresh on focus**: `useFocusEffect(refresh)` — lista sempre atualizada ao voltar de Detail/Create

### Empty State

> Mock `mock-medicamentos-empty.png` + sem possessivos + **single CTA** (decisão PO M1.2 — paradoxo da escolha):
> - Ilustração círculo verde + pílula
> - Título "Biblioteca vazia" + subtexto "Cadastre medicamentos para começar a gerenciar tratamentos"
> - **Único CTA**: "+ Cadastrar primeiro medicamento" (verde grande)
> - Link "Buscar na base ANVISA" **removido** — ANVISA continua acessível via banner dentro do form de cadastro. `AnvisaSearchScreen` fullscreen **deletado** (sem consumer).

### Detalhe

> Mock `mock-medicamentos-detalhe.png` + correções pós-validação PO M1.1/M1.2:
> - Header: back (ChevronLeft) + nome + ícone editar (lápis). **Lixeira removida do header** (movida para fim da seção "Em uso").
> - Card hero: **ícone dinâmico (Pill verde p/ medicamento, PillBottle laranja p/ suplemento)** + Nome **inline com dose pill** (padrão neutral do `TreatmentCard.dosagePill`) + Princípio Ativo + Badges "ESTÁVEL" + Tipo
> - Seções:
>   - **Identificação**: Tipo · Princípio Ativo · Laboratório · Classe Terapêutica · Categoria Regulatória (Tipo movido para cá; não é atributo de dose)
>   - **Dosagem**: apenas Dose por unidade (`{dosage_per_pill} {dosage_unit}`)
>   - **Em uso** (refatorado):
>     - Card 1 (Layers + bg primary): "{N} tratamentos associados" (label "associados" — v1 não filtra por flag active) + summary de acrônimos
>     - Card 2 (Package + bg supplement): "Estoque" + total de unidades (ou "Não rastreado")
>     - **Botão "Excluir medicamento"** (outline danger, full-width) — substituiu lixeira do header
> - Tab bar inferior

> ### Delete bloqueado (mock `mock-medicamentos-apagar-bloqueio.png`)
> Quando o medicamento tem QUALQUER dependência (protocolo ativo OU pausado OU estoque > 0), o tap em "Excluir medicamento" abre o `MedicineDeleteBlockedSheet`:
> - Ícone alerta + título "Não é possível excluir {nome}"
> - Descrição: "Este medicamento está em uso. Desative ou exclua as dependências abaixo antes de continuar."
> - Lista "EM USO POR": cards por tratamento (kicker "Tratamento ativo"/"pausado" + nome + frequência · N horários) + card de estoque (X unidades · Y lotes)
> - Footer: [Voltar] | [Abrir tratamentos] (CTA verde)
> - Sem dependências → fluxo normal via `DeleteConfirmation` simples ("Esta ação não pode ser desfeita.")

### Criar

> Mock `mock-medicamentos-criar.png`:
> - Header back + "Novo Medicamento"
> - Banner verde clarinho "🔍 Buscar na base ANVISA / Preenche nome, princípio ativo e categoria automaticamente" → abre bottom sheet
> - Sections: IDENTIFICAÇÃO (Nome*, Princípio ativo) · DOSAGEM (Dose por unidade*, Unidade*) · CLASSIFICAÇÃO (Tipo, Laboratório, Categoria Regulatória)
> - Footer fixo: "Cancelar" + "Criar medicamento" (verde) — `FormActions` em sticky bottom

---

## Padrões UX Consolidados (Sprint M1.1 — herdar em M1.2/M1.3)

Decisões PO durante a Sprint M1.1 que **toda nova tela/componente de medicamentos** deve seguir:

1. **Terminologia "tratamento" vs "protocolo"** — UI usa **`tratamento`** sempre. `protocolo` é jargão médico, banido de strings exibidas. Variáveis JS (`protocols`, `active_protocols_count`, `treatment_plan`) mantêm os nomes originais.
2. **Sem possessivos em títulos/links** — "Medicamentos", "Tratamentos", "Biblioteca vazia". Justificativa: ocupam espaço (quebram linha em telas pequenas) + uso por cuidadores/familiares (os remédios não são "deles").
3. **Ícone por tipo** — `Pill` (verde `colors.primary[500]` sobre `colors.primary[50]`) para `type === 'medicamento'`; `PillBottle` (laranja `colors.supplement[500]` sobre `colors.supplement[50]`) para `type === 'suplemento'`. Paridade com web (`MedicineCardRedesign.jsx`). Token novo: `colors.supplement` em `tokens.js`.
4. **Dose pill padronizado** — neutral (`bg colors.neutral[100]`, `border colors.neutral[300]`, `text colors.neutral[700]`, `borderRadius 4`, `borderWidth 0.5`). **Inline ao lado do nome**, nunca em linha separada. Replicar exatamente o estilo do `TreatmentCard.dosagePill`.
5. **Back button explícito** — toda tela aninhada deve ter `ChevronLeft` no header (`navigation.goBack()`) — não confiar em swipe/gesture.
6. **Entry point para Medicamentos** — link "Medicamentos" no topo de `TreatmentsScreen` (ver `mock-medicamentos-link-tratamentos.png`). Não criar tab nova.
7. **Stack JS para sub-stacks aninhados** — `TreatmentsStack` usa `createStackNavigator` (`@react-navigation/stack`), **não** `createNativeStackNavigator`. ADR-036: rn-screens 4.11.1 crasha em Android API 24 ao navegar entre stacks aninhados (`IndexOutOfBoundsException` em `Screen.startTransitionRecursive`). Vale para qualquer novo stack aninhado até upgrade do rn-screens.
8. **`type` enum** — `medicamento | suplemento` (schema `@dosiq/core`). CLAUDE.md tem lista legada `comprimido|capsula|...` desatualizada; ignorar.
9. **Section card label "Tipo" pertence a Identificação**, não Dosagem.
10. **Tab re-tap = popToTop** — em `createStackNavigator` (JS) o re-tap em tab ativa NÃO faz popToTop por padrão (diferente de native-stack). Toda tab com sub-stack deve declarar `listeners={tabPress}` que detecta foco em sub-tela e navega para a raiz (ver `RootTabs.jsx` tab Tratamentos).
11. **Refresh on focus** — telas que dependem de dados mutáveis (Detail, List) usam `useFocusEffect(() => refresh())` para garantir dados atualizados após retorno de edit/create.
12. **Empty state = single CTA** — paradoxo da escolha proibido. Empty state tem **apenas 1 ação primária**. Links secundários (ex: "buscar na base ANVISA") só existem se levarem a fluxo coerente de retorno; caso contrário, removê-los.
13. **Mensagens Zod amigáveis (Dona Maria)** — `packages/core/src/zodSetup.js` define `customError` global com texto curto sem jargão ("Este campo é obrigatório", "Use pelo menos N caracteres", "O valor deve ser maior que zero"). Locale PT-BR (`zod/v4/locales/pt`) como fallback. Schemas individuais **NÃO devem** definir `errorMap` redundante — só mensagens customizadas em refinements de regra de negócio.
14. **Subtitle do card de medicamento = `active_ingredient`**, não laboratório. Princípio ativo contextualiza melhor remédios de marca (ex: Tylenol → Paracetamol).
15. **Label "tratamentos associados"** (não "ativos") — v1 não diferencia ativo/pausado/expirado. Granularidade vira spec futura.
16. **Delete com bloqueio hard se há dependências** — `MedicineDeleteBlockedSheet` bottom sheet com lista "EM USO POR" + CTA "Abrir tratamentos" (mock `mock-medicamentos-apagar-bloqueio.png`). Bloqueia se houver QUALQUER protocolo (ativo OU pausado) OU estoque > 0. Apagar com órfãos no banco é proibido por design.
17. **Decimal com vírgula em tempo real** — campos numéricos com decimal devem ter handler que normaliza vírgula→ponto durante typing (`replace(',', '.')` + filtra chars não-numéricos + colapsa pontos múltiplos). `keyboardType="decimal-pad"` no TextInput. Schema usa `z.coerce.number()` p/ aceitar string normalizada. Postgres `numeric/double precision` aceita ponto nativo.
18. **ANVISA autocomplete: laboratório em branco para genéricos** — `regulatoryCategory` começa com "gener" (case insensitive) → `laboratory: ''` (preenchido no estoque por compra). Demais categorias preenchem com `item.laboratory` do ANVISA.

---

## Sprint Breakdown

### Sprint M1.1 — Service + Read (Listagem + Detalhe + Empty) ✅ ENTREGUE

> **Gate alvo**: G1 (Copy) parcial — service local + leitura
>
> **Status**: 100% mergeada (PR #555) — `feat/crud-medications-m1-1` → `feat/crud-medications`
>
> **Cavecrew (real)**: Opus (M1.1/M1.2/M1.8) + Sonnet ⭐⭐ (M1.3/M1.4/M1.5/M1.7/M1.9 — lint round-trip aplicado) + Haiku ⭐ (M1.6 + M1.10) **0 retrabalho** ✅

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|--------------|
| M1.1 | Copiar `medicineService` da web para mobile | `apps/mobile/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M1.2 | Adaptar imports: `nativeSupabaseClient` + `@dosiq/core` schemas | (mesmo arquivo) | 👤 Arquiteto | ⭐⭐ |
| M1.3 | Hook `useMedicines()` (getAll + getById + invalidação via `useMutation.invalidateKeys`) | `apps/mobile/src/features/medications/hooks/useMedicines.js` | 🤖 Sonnet | ⭐⭐ |
| M1.4 | `MedicinesListScreen` (header + search inline + lista + empty state + FAB) | `apps/mobile/src/features/medications/screens/MedicinesListScreen.jsx` | 🤖 Sonnet | ⭐⭐ |
| M1.5 | `MedicineCard` (ícone + nome + badge dose + lab + "N tratamentos ativos") | `apps/mobile/src/features/medications/components/MedicineCard.jsx` | 🤖 Sonnet | ⭐⭐ |
| M1.6 | `MedicineEmptyState` (ilustração + CTA primário + link ANVISA) | `apps/mobile/src/features/medications/components/MedicineEmptyState.jsx` | 🐦 Haiku | ⭐ |
| M1.7 | `MedicineDetailScreen` (hero + badges status + seções + Em uso) | `apps/mobile/src/features/medications/screens/MedicineDetailScreen.jsx` | 🤖 Sonnet | ⭐⭐ |
| M1.8 | `MedicationsStack` + integração no `TreatmentsStack` (não nova tab) | `apps/mobile/src/navigation/TreatmentsStack.jsx` + `routes.js` | 👤 Arquiteto | ⭐⭐ |
| M1.9 | Testes do `medicineService` mobile (parity com web) | `apps/mobile/src/features/medications/services/__tests__/medicineService.test.js` | 🤖 Sonnet | ⭐⭐ |
| M1.10 | Seção `Medicamentos (M1.1)` no `_dev/MedicineDemoScreen.jsx` | `apps/mobile/src/features/_dev/screens/MedicineDemoScreen.jsx` | 🐦 Haiku (gate de confiança) | ⭐ |
| M1.11 | Validação visual sim iOS + Android + iPhone físico | Manual | 👤 PO | ⭐ |

**Entrega**: PR `feat/crud-medications-m1-1` → mãe `feat/crud-medications`

---

### Sprint M1.2 — CRUD Completo (Form + Bottom Sheet ANVISA + Delete) 🚧 EM VALIDAÇÃO

> **Gate alvo**: G1 (Copy) completo — CRUD funcional end-to-end
>
> **Status**: código entregue em `feat/crud-medications-m1-2` (push); validação PO em andamento.
>
> **Ajustes adicionais surgidos durante implementação** (todos commitados na branch):
> - Padding horizontal + Dose+Unidade na mesma row + Classificação reordenada (Tipo · Classe · Categoria · Laboratório)
> - Zod locale PT-BR + customError friendly (Dona Maria) — removidos errorMaps redundantes do schema
> - Decimal com vírgula em tempo real (`handleDoseChange` + `decimal-pad`)
> - ANVISA autocomplete: laboratory em branco para genéricos
> - Empty state single CTA (link ANVISA removido) + `AnvisaSearchScreen` DELETADO
> - `MedicineDeleteBlockedSheet` (mock `mock-medicamentos-apagar-bloqueio.png`) — bloqueio hard se houver QUALQUER dependência
> - Botão delete movido para fim da seção "Em uso" (não mais no header)
> - Em uso refatorado: cards de tratamentos (Layers) + estoque (Package)
> - Subtitle do card = princípio ativo (não laboratório)
> - Label "tratamentos associados" (v1 — não filtra active)
> - Tab Tratamentos re-tap = popToTop (listener `tabPress`)
> - useFocusEffect refresh em Detail + List
> - Schema exports faltantes (DOSAGE_UNITS, MEDICINE_TYPES, REGULATORY_CATEGORIES, *_LABELS) adicionados ao `@dosiq/core`
> - jest.config: zod adicionado ao `transformIgnorePatterns` (ESM)
>
> **Cavecrew (real)**: Opus (M2.1/M2.4/M2.5/M2.7/M2.8 + ajustes pós-validação) + Sonnet ⭐⭐ (M2.2) + Haiku ⭐ (M2.3 + M2.10) **0 retrabalho mantido** ✅

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|--------------|
| M2.1 | `MedicineFormScreen` (create+edit mode unificado, sticky `FormActions`) | `apps/mobile/src/features/medications/screens/MedicineFormScreen.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| M2.2 | `MedicineAnvisaSheet` (bottom sheet com search inline + lista cards + select) | `apps/mobile/src/features/medications/components/MedicineAnvisaSheet.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| M2.3 | Banner "Buscar na base ANVISA" no topo do form (trigger sheet) | `apps/mobile/src/features/medications/components/AnvisaBanner.jsx` | 🐦 Haiku | ⭐ |
| M2.4 | `useMedicineDelete` — checagem de dependências (protocols + stock + doses) | `apps/mobile/src/features/medications/hooks/useMedicineDelete.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M2.5 | Botão lixeira no `MedicineDetailScreen` → `DeleteConfirmation` + Toast | (mesma tela) | 🤖 Sonnet | ⭐⭐ |
| M2.6 | FAB "+ Novo medicamento" wire para `MedicineFormScreen` (create mode) | `MedicinesListScreen` + `AddMedicineFAB.jsx` | 🤖 Sonnet | ⭐ |
| M2.7 | `useMedicineMutation` (create/update/delete wrappers c/ `useMutation`) | `apps/mobile/src/features/medications/hooks/useMedicineMutation.js` | 🤖 Sonnet | ⭐⭐ |
| M2.8 | Botão editar (lápis) no `MedicineDetailScreen` → `MedicineFormScreen` (edit mode) | (mesma tela) | 🤖 Sonnet | ⭐ |
| M2.9 | Integration test `MedicineForm.integration.test.jsx` (create + edit + auto-fill ANVISA) | `apps/mobile/src/features/medications/__tests__/` | 🤖 Sonnet | ⭐⭐ | **⏭ ADIADO** — smoke via validação manual PO em sim iOS/Android. Backlog tech-debt. |
| M2.10 | Seção `Medicamentos CRUD (M1.2)` no `MedicineDemoScreen` | (mesmo arquivo) | 🐦 Haiku | ⭐ |
| M2.11 | Validação visual sim iOS + Android + iPhone físico | Manual | 👤 PO | ⭐⭐ |

**Entrega**: PR `feat/crud-medications-m1-2` → mãe `feat/crud-medications`

---

### Sprint M1.3 — Extract + Migrate (G2 → G3)

> **Gate alvo**: G2 (Extract) → G3 (Migrate)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|--------------|
| M3.1 | Criar `createMedicineRepository` em `shared-data` | `packages/shared-data/src/services/createMedicineRepository.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M3.2 | Testes do factory + **parity suite** (cenários do web rodados contra factory) | `packages/shared-data/src/services/__tests__/createMedicineRepository.test.js` + `createMedicineRepository.parity.test.js` | 🤖 Sonnet | ⭐⭐ |
| M3.3 | Mobile adota factory (substituir service local) | `apps/mobile/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐ |
| M3.4 | Verificar mobile CRUD continua funcionando | Smoke test manual | 👤 PO | ⭐ |
| M3.5 | **G2 GATE CHECK** | Validar todos critérios G2 | 👤 PO | — |
| M3.6 | Web adota factory (substituir `medicineService.js` local) | `apps/web/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M3.7 | Deletar service local web obsoleto | (delete do antigo) | 🐦 Haiku | ⭐ |
| M3.8 | `validate:agent` web 100% green | `rtk npm run validate:agent` | 👤 Arquiteto | ⭐ |
| M3.9 | **G3 GATE CHECK** | Validar todos critérios G3 | 👤 PO | — |
| M3.10 | Exportar `createMedicineRepository` do `shared-data/index.js` | `packages/shared-data/src/index.js` | 🐦 Haiku | ⭐ |

**Entrega**: PR `feat/crud-medications-m1-3` → mãe `feat/crud-medications` → **PR final `feat/crud-medications` → `main`** (fechamento Fase 1)

---

## Especificações Técnicas Detalhadas

### M1.1 — `medicineService.js` (Mobile — Cópia G1)

**Origem**: `apps/web/src/features/medications/services/medicineService.js` (138 linhas)

**Adaptações** (web → mobile):

```diff
- import { supabase, getUserId } from '@shared/utils/supabase'
+ import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
+ import { getUserId } from '../../../platform/supabase/session' // helper já existente

- import { calculateAvgUnitPrice } from '@stock/services/costAnalysisService'
+ // v1: avg_price calculado no hook (não no service) — evitar dependência circular

  // Schema imports mantidos idênticos:
  import { validateMedicineCreate, validateMedicineUpdate } from '@dosiq/core'
```

**Métodos a copiar** (1:1 com web): `getAll() / getById(id) / create(medicine) / update(id, updates) / delete(id)`.

**Simplificação v1**: `avg_price` calculado no hook `useMedicines`, não no service.

---

### M2.1 — `MedicineFormScreen` (Tela Principal — Create + Edit)

> ⚠️ **Consulta obrigatória antes**: `docs/reference/FORM_KIT.md` §Exemplo Completo de CRUD Básico.

```jsx
// Fluxo:
// 1. Se route.params.medicine → modo edição (preenche initialValues)
// 2. Se vazio → modo criação (defaults: type='comprimido', dosage_unit='mg')
// 3. useFormState resolve schema por modo (medicineUpdateSchema vs medicineCreateSchema)
// 4. Banner "Buscar na base ANVISA" abre <MedicineAnvisaSheet/>
// 5. onAnvisaSelect → form.setValues({...}) auto-fill multi-campo
// 6. Sticky FormActions no bottom (não rolável)

import { useState, useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useFormState } from '@shared/hooks/useFormState'
import { useMutation } from '@shared/hooks/useMutation'
import { useToast } from '@shared/components/feedback'
import { medicineCreateSchema, medicineUpdateSchema } from '@dosiq/core'
import {
  FormInput, FormSelect, FormSection, FormActions,
} from '@shared/components/form'
import { MedicineAnvisaSheet } from '../components/MedicineAnvisaSheet'
import { medicineService } from '../services/medicineService'

// Helper local — também documentado em FORM_KIT.md
function formProps(form, name) {
  return {
    value: form.values[name],
    error: form.touched[name] ? form.errors[name] : undefined,
    onChange: form.handleChange,
    onBlur: form.handleBlur,
  }
}

export function MedicineFormScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { show } = useToast()
  const medicine = route.params?.medicine ?? null
  const isEditing = !!medicine

  // States
  const [sheetOpen, setSheetOpen] = useState(false)
  const form = useFormState(
    isEditing ? medicineUpdateSchema : medicineCreateSchema,
    { initialValues: medicine ?? { type: 'medicamento', dosage_unit: 'mg' } },
  )
  const mutation = useMutation({
    onSuccess: () => {
      show(isEditing ? 'Medicamento atualizado' : 'Medicamento criado', { variant: 'success' })
      navigation.goBack()
    },
    onError: (err) => show(err.message ?? 'Erro ao salvar', { variant: 'error' }),
    invalidateKeys: ['@dosiq/medicines-snapshot'],
  })

  // Handlers
  const handleAnvisaSelect = useCallback((item) => {
    // setValues já faz merge interno com o estado atual (apenas campos passados)
    form.setValues({
      name: item.name,
      active_ingredient: item.activeIngredient,
      therapeutic_class: item.therapeuticClass,
      regulatory_category: item.regulatoryCategory,
      // laboratory NÃO auto-fill — base ANVISA tem lab do registro, não do genérico
    })
    setSheetOpen(false)
  }, [form])

  const handleSubmit = useCallback(() => {
    if (!form.validate()) return
    if (isEditing) {
      mutation.mutate(() => medicineService.update(medicine.id, form.values))
    } else {
      mutation.mutate(() => medicineService.create(form.values))
    }
  }, [form, isEditing, medicine, mutation])

  return (
    <ScreenContainer title={isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AnvisaBanner onPress={() => setSheetOpen(true)} />
        <FormSection title="Identificação">
          <FormInput name="name" label="Nome" required {...formProps(form, 'name')} />
          <FormInput name="active_ingredient" label="Princípio Ativo" {...formProps(form, 'active_ingredient')} />
        </FormSection>
        <FormSection title="Dosagem">
          <FormInput name="dosage_per_pill" label="Dose por unidade" required keyboardType="numeric"
                     {...formProps(form, 'dosage_per_pill')} />
          <FormSelect name="dosage_unit" label="Unidade" required options={DOSAGE_UNIT_OPTIONS}
                      {...formProps(form, 'dosage_unit')} />
        </FormSection>
        <FormSection title="Classificação">
          <FormSelect name="type" label="Tipo" options={MEDICINE_TYPE_OPTIONS} {...formProps(form, 'type')} />
          <FormInput name="laboratory" label="Laboratório" {...formProps(form, 'laboratory')} />
          <FormSelect name="regulatory_category" label="Categoria Regulatória"
                      options={REGULATORY_CATEGORY_OPTIONS} {...formProps(form, 'regulatory_category')} />
        </FormSection>
      </ScrollView>

      <FormActions
        primaryLabel={isEditing ? 'Salvar' : 'Criar medicamento'}
        onPrimary={handleSubmit}
        primaryLoading={mutation.isLoading}
        secondaryLabel="Cancelar"
        onSecondary={() => navigation.goBack()}
      />

      <MedicineAnvisaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSelect={handleAnvisaSelect}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing[20] },
})
```

**Validação visual**: replicar mock `mock-medicamentos-criar.png` (cores + spacing tokens, banner verde clarinho `colors.success.bg`).

---

### M2.2 — `MedicineAnvisaSheet` (Bottom Sheet — Decisão UX)

```jsx
// Bottom sheet (React Native Modal + slide-up animation) sobre o form.
// Consome useMedicineDatabase (cache+sync já implementado em Fase 0).
// Sem dependência adicional — modal nativo + Animated.

export function MedicineAnvisaSheet({ open, onClose, onSelect }) {
  // States
  const [query, setQuery] = useState('')
  const { search, isReady } = useMedicineDatabase()

  // Memos
  const results = useMemo(
    () => (isReady && query.length >= 2 ? search(query, 40) : []),
    [search, query, isReady],
  )

  // Handlers
  const handleSelect = useCallback((item) => {
    selectionTap()
    onSelect(item)
    setQuery('')
  }, [onSelect])

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Base ANVISA</Text>
        <FormInput
          icon="search"
          placeholder="Digite o nome do medicamento..."
          value={query}
          onChange={(_, v) => setQuery(v)}
        />
        <Text style={styles.hint}>
          {results.length > 0
            ? `${results.length} resultados — toque para preencher o formulário`
            : query.length >= 2 ? 'Nenhum resultado' : null}
        </Text>
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AnvisaResultCard item={item} onPress={() => handleSelect(item)} />}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Modal>
  )
}
```

**Card de resultado** (`AnvisaResultCard`): mock `mock-medicamentos-criar-busca-anvisa.png` mostra: Nome (verde se selecionado) + Princípio ativo (com termo destacado) + 3 chips de doses + Laboratório (cinza).

---

### M2.4 — `useMedicineDelete` (Verificação de Dependências)

```jsx
// Antes de deletar, verifica:
// 1. Tratamentos ativos usando este medicamento (variável JS continua `protocols` — só UI muda; warning, bloqueio)
// 2. Entradas de estoque (warning, bloqueio)
// 3. Registros de dose históricos (warning, não bloqueio)
//
// Retorna { canDelete, blocker, warnings, deletePreCheck() }
// UI: DeleteConfirmation (bottom sheet) consome blocker/warnings p/ exibir resumo
//     e exigir confirmação explícita.

export function useMedicineDelete(medicineId) {
  const { show } = useToast()
  const navigation = useNavigation()
  const mutation = useMutation({
    onSuccess: () => {
      show('Medicamento removido', { variant: 'success' })
      navigation.goBack()
    },
    onError: (err) => show(err.message ?? 'Erro ao remover', { variant: 'error' }),
    invalidateKeys: ['@dosiq/medicines-snapshot'],
  })

  async function preCheck() {
    const [protocols, stockCount, doseCount] = await Promise.all([
      checkActiveProtocols(medicineId),
      countStockEntries(medicineId),
      countDoseRecords(medicineId),
    ])
    return {
      canDelete: protocols.length === 0,
      blocker: protocols.length > 0
        ? `Existem ${protocols.length} tratamento(s) ativo(s). Desative-os antes de remover.`
        : null,
      warnings: [
        stockCount > 0 ? `${stockCount} entrada(s) de estoque serão preservadas` : null,
        doseCount > 0 ? `${doseCount} registro(s) de dose serão preservados` : null,
      ].filter(Boolean),
      protocols,
    }
  }

  return {
    preCheck,
    confirmDelete: () => mutation.mutate(() => medicineService.delete(medicineId)),
    isLoading: mutation.isLoading,
  }
}
```

UI consumidora: `MedicineDetailScreen` → toque na lixeira → chama `preCheck()` → abre `<DeleteConfirmation/>` com `itemName`, `warnings`, e `disabled` se `blocker` presente.

---

## Decisão de Navegação: ✅ Dentro de TreatmentsStack (confirmada PO 14/05/2026)

> Medicamentos como **sub-tela** dentro do stack de Tratamentos. Tab bar permanece 4 (Hoje / Tratamentos / Estoque / Perfil) — confirmado pelos mocks.

**Entrada**: link "Medicamentos" no topo de `TreatmentsScreen` (consolidado em M1.1) + botão DEV em TodayScreen → MedicineDemo (apenas `__DEV__`).

```
Tab Tratamentos → TreatmentsStack (createStackNavigator JS — ADR-036)
  ├── TreatmentsList (home — entry "Medicamentos" no topo)
  ├── MedicinesListScreen        ← push (M1.1)
  ├── MedicineDetailScreen       ← push (M1.1)
  │     ├── MedicineDeleteBlockedSheet ← modal (M1.2, hard-block)
  │     └── DeleteConfirmation         ← modal (M1.2, sem dependências)
  ├── MedicineFormScreen         ← push (M1.2, create+edit unificado)
  │     └── MedicineAnvisaSheet  ← bottom sheet modal (M1.2, NÃO push)
  ├── ProtocolForm               ← push (Fase 2 futura)
  └── TreatmentDetail            ← push (Fase 2 futura)

Tab re-tap: listener `tabPress` em RootTabs.jsx popToTop quando em sub-tela.
```

---

## Estrutura de Diretórios (Resultado Final Fase 1)

```
apps/mobile/src/
  features/
    medications/                         ← [domain novo]
      components/
        MedicineCard.jsx                 ← [DONE M1.1] ícone+dose pill inline+subtitle=princípio ativo
        MedicineEmptyState.jsx           ← [DONE M1.1 → simplificado M1.2] single CTA
        MedicineAnvisaSheet.jsx          ← [DONE M2.2] bottom sheet
        AnvisaBanner.jsx                 ← [DONE M2.3]
        MedicineDeleteBlockedSheet.jsx   ← [DONE M1.2] bottom sheet hard-block delete
      hooks/
        useMedicines.js                  ← [DONE M1.3] useMedicines + useMedicine(id) + useFocusEffect
        useMedicineMutation.js           ← [DONE M2.7] wrappers create/update (NÃO delete — ver useMedicineDelete)
        useMedicineDelete.js             ← [DONE M2.4] precheck + delete direto (sem wrapper genérico)
      screens/
        MedicinesListScreen.jsx          ← [DONE M1.1] header+search+list+FAB+useFocusEffect
        MedicineDetailScreen.jsx         ← [DONE M1.1 → enriquecido M1.2] hero+sections+cards uso+botão delete fim
        MedicineFormScreen.jsx           ← [DONE M2.1] create+edit unificado
      services/
        medicineService.js               ← [DONE M1.1] G1 copy → G2 usa factory
        __tests__/
          medicineService.test.js        ← [DONE M1.9] 12/12 parity web
      __tests__/
        MedicineForm.integration.test.jsx ← ⏭ ADIADO (M2.9 — backlog tech-debt)
  features/_dev/screens/
    MedicineDemoScreen.jsx               ← [DONE M1.10/M2.10] gate visual atualizado p/ M1.2
  features/treatments/screens/
    TreatmentsScreen.jsx                 ← [MODIFY M1.1] entry "Medicamentos" no topo
  shared/styles/
    tokens.js                            ← [MODIFY M1.1] novo `colors.supplement` (50/500/700)
  navigation/
    TreatmentsStack.jsx                  ← [MODIFY M1.1+M1.2] add Medications screens + JS stack (ADR-036)
    RootTabs.jsx                         ← [MODIFY M1.2] tabPress listener p/ popToTop em Tratamentos
    Navigation.jsx                       ← [MODIFY M1.2] MedicineDemoScreen wired + AnvisaSearchScreen REMOVIDO
    routes.js                            ← [MODIFY M1.1+M1.2] MEDICINES_LIST + MEDICINE_DEMO; ANVISA_SEARCH REMOVIDO

packages/core/src/
  zodSetup.js                            ← [DONE M1.2] locale PT-BR + customError friendly (Dona Maria)
  schemas/index.js                       ← [MODIFY M1.2] exports DOSAGE_UNITS/MEDICINE_TYPES/REGULATORY_CATEGORIES/*_LABELS
  schemas/medicineSchema.js              ← [MODIFY M1.2] z.coerce.number + errorMaps redundantes removidos

apps/mobile/
  jest.config.js                         ← [MODIFY M1.2] zod adicionado ao transformIgnorePatterns

DELETADOS:
  apps/mobile/src/features/medications/screens/AnvisaSearchScreen.jsx   ← [DELETED M1.2] sem consumer pós empty-state-single-CTA
  apps/mobile/src/features/_dev/screens/FormKitDemoScreen.jsx           ← [DELETED M1.1] substituído por MedicineDemoScreen

packages/shared-data/src/
  services/
    createMedicineRepository.js          ← [NEW] G2
    __tests__/
      createMedicineRepository.test.js   ← [NEW]
  index.js                               ← [MODIFY] export
```

---

## Quality Gates — Fase 1

### G1 — Gate de Cópia

| Critério | Validação |
|----------|-----------|
| `medicineCreateSchema` cobre 100% dos campos do form (com refinements cross-field se necessário) | Teste unitário + integration test |
| Service CRUD funcional no simulador iOS + Android | Smoke test |
| `MedicineFormScreen` com bottom sheet ANVISA auto-fill | Demo gravada + iPhone físico |
| Listagem com search + empty state + FAB | Demo gravada |
| Detail com badges status/tipo + "Em uso" | Demo gravada |
| Delete com pre-check de tratamentos ativos via `DeleteConfirmation` + `Toast` | Demo + teste |
| Testes unitários do service mobile equivalentes ao web | Diff comparison |
| Integration test do form (create + edit + auto-fill ANVISA) | `npx jest` |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |

### G2 — Gate de Extração

| Critério | Validação |
|----------|-----------|
| `createMedicineRepository({ supabase, getUserId })` aceita injection | Teste unitário |
| Mobile usa factory — testes passam | `rtk npm test` mobile |
| Web continua com service local (NÃO migrada nesta PR) | Grep verification |
| Diff factory vs service local < 5% (exceto wiring) | `rtk diff` |
| **Suite de testes do `medicineService` web roda contra a factory** (mesmo input, mesma saída) | Novo teste em `packages/shared-data/src/services/__tests__/createMedicineRepository.parity.test.js` adapta cenários de `apps/web/.../medicineService.test.js` com injection mock — tudo verde |
| **Parity test snapshot por método** (getAll/getById/create/update/delete) — output factory ≡ output service local com mesma fixture (modulo timestamps) | Mesmo arquivo de teste acima — usa `toMatchObject` com fixtures determinísticas |

### G3 — Gate de Migração

| Critério | Validação |
|----------|-----------|
| Web usa `createMedicineRepository` | Grep: zero import do local |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |
| `npm run build` (web) OK | CI |
| `npx expo export` (mobile) OK | CI |
| Service local web DELETADO | `find` verification |
| **PR G3 atômica**: somente swap web. Sem refactor adicional, sem outro domínio, sem cleanup oportunista. | Review manual no PR description + `git diff --stat` ≤ ~5 arquivos |
| **Decisão `costAnalysisService` aplicada e testada** (ver §"Decisão pré-G3" abaixo) | Smoke web no fluxo de Stock/avg-price |
| **Smoke checklist E2E PO marcado no PR** | `docs/operations/MEDICINES_G3_SMOKE_CHECKLIST.md` linkado na descrição, todos itens ✅ antes do merge |

### Decisão pré-G3 — `costAnalysisService` e `avg_price`

> Resolver **antes** de M3.1. Sem essa decisão, G3 quebra cálculo de preço médio na web.

**Estado atual**:
- Web `medicineService.getAll()` injeta `avg_price` calculado via `costAnalysisService` (weighted average).
- Spec Fase 1 propõe simplificação v1: factory não carrega `costAnalysisService`; consumidor (hook) calcula.

**Opções**:
- **(A) Factory carrega `costAnalysisService`** via injection: `createMedicineRepository({ supabase, getUserId, calculateAvgUnitPrice })`. Mantém comportamento web 1:1; mobile passa `() => null` ou implementação trivial.
- **(B) Hook `useMedicines` web absorve cálculo** (igual mobile). Factory pura, sem dependência de stock. Web ganha hook composto.

**Recomendação**: **(B)** — factory limpa, sem dependência circular stock↔medicines. Custo: refactor pontual em web (1 hook + chamadas existentes). Decidir formalmente na primeira reunião de M1.3.

**Critério de pronto**: opção decidida, registrada aqui, e — se (B) — task M3.6 expandida com sub-tarefa "web `useMedicines` absorve `calculateAvgUnitPrice`".

---

## Delegação de Agentes

### Distribuição por modelo

| Agente | Tasks | Motivo |
|--------|-------|--------|
| 👤 **Opus (arquiteto)** | M1.1, M1.2, M1.8, M2.1, M2.2, M2.4, M3.1, M3.3, M3.6, M3.8 | Decisões de adaptação, navigation cross-screen, integrações complexas (useFormState + bottom sheet + auto-fill), lógica cross-domain (delete deps), factory pattern, migração web (risco regressão), gates de validação |
| 🤖 **Sonnet (cavecrew ⭐⭐)** | M1.3, M1.4, M1.5, M1.7, M1.9, M2.5, M2.7, M2.8, M2.9, M3.2 | Componentes/hooks com lógica de estado, integration test pattern P.3, testes do factory — onde sutilezas de R-010/R-020/lint refs importam |
| 🐦 **Haiku (cavecrew ⭐)** | M1.6, M1.10, M2.3, M2.10, M3.7, M3.10 | Tasks **estritamente mecânicas**: componente puro sem state (Empty, Banner), template copy-paste em demo screen, delete + grep, export 1-linha |

### Gate de confiança Haiku (Fase 1 = experimento)

> Fase 0 não usou Haiku na prática (spec previa mas Sonnet absorveu tudo). Fase 1 é o **primeiro teste real** sob o mesmo padrão de brief + lint round-trip.

**M1.10 (Seção demo screen)** = primeiro spawn Haiku da fase. Avaliação:
- **0 retrabalho** → expandir Haiku para todas tasks ⭐ marcadas (mantém spec)
- **1+ retrabalho** → recuar M2.3, M2.10, M3.7, M3.10 para Sonnet, ajustar spec, registrar lição
- Lint round-trip (`rtk lint <file>`) obrigatório pós-spawn; qualquer fix manual conta como retrabalho

### Brief padrão (validado em P.2/P.3 com Sonnet — 0 retrabalhos)

Aplica-se igual para Sonnet e Haiku. Cada spawn recebe:
1. **Read-only refs** absolutas para todos arquivos a consultar (Form Kit components, hooks Fase 0, mock PNG correspondente, doc canônica `FORM_KIT.md`).
2. **Path absoluto** do arquivo a criar.
3. **Contrato exato** (props/API esperados, com exemplos de chamada).
4. **Regras críticas explícitas** (R-010 ordem hooks, R-020 zero `new Date()`, R-022 dose max 100, lint `react-hooks/refs`, lint `react-hooks/set-state-in-effect`, zero color literals, `StyleSheet.create()`).
5. **Output esperado** — código + ponto único de integração.
6. **Sem commits** — apenas Write.

**Para Haiku especificamente**: brief mais curto, mas mantém os 6 itens. Tasks Haiku devem ter referência canônica direta (ex: "copie estrutura do `Toast.jsx` linhas 80-90 trocando X por Y"); se a task exige decisão de design não óbvia, é Sonnet.

Após spawn (todos modelos): arquiteto roda `rtk lint <file>` + `rtk jest <pattern>` + fix manual de qualquer issue residual antes do commit. Issue manual = retrabalho contabilizado.

---

## Histórico de mudanças nesta spec

| Data | Mudança |
|------|---------|
| 2026-05-13 (original) | Spec inicial com 3 sprints (M1.1 / M1.2 / M1.3), gates G1/G2/G3 |
| 2026-05-15 (revisão pós-Fase 0) | Reescrita consumindo Fase 0: + bottom sheet ANVISA (mock), Toast/DeleteConfirmation, `useMutation/useFormState` corrigidos (deepEqual Date, refinements), padrão serializável de retorno, lições de cavecrew (0 retrabalhos), mocks hi-fi linkados, demo screen como gate, integration test pattern, R-022 reforçado |
| 2026-05-15 (hardening G1→G2→G3) | Adicionado: parity test factory vs web (G2), decisão pré-G3 sobre `costAnalysisService`/`avg_price` (opção B recomendada), PR G3 atômica, smoke checklist E2E PO em `docs/operations/MEDICINES_G3_SMOKE_CHECKLIST.md`. **Não adotados**: feature flag e rollback playbook (over engineering p/ closed alpha — reavaliar pré-beta externo). Distribuição Haiku/Sonnet/Opus refinada + gate de confiança Haiku em M1.10. |
| 2026-05-15 (pós-implementação Sprint M1.1) | Consolidados padrões UX validados em dev pelo PO durante M1.1: nova seção §"Padrões UX Consolidados" com 9 regras (terminologia tratamento vs protocolo; sem possessivos; ícone por tipo Pill/PillBottle; dose pill padronizado neutral inline; back button explícito; entry point em TreatmentsScreen; stack JS para sub-stacks legacy ADR-036; type enum medicamento\|suplemento; Tipo em Identificação não Dosagem). Token novo `colors.supplement` em `apps/mobile/src/shared/styles/tokens.js`. Gate de confiança Haiku **passou 2/2** (M1.6 EmptyState + M1.10 DemoScreen) — manter Haiku para tasks ⭐ mecânicas em M1.2/M1.3. |
| 2026-05-15 (Sprint M1.1 mergeada) | PR #555 → `feat/crud-medications`. 11 arquivos, +1478/-6 linhas. Lint clean + jest 131/131. Validado em sim iOS + Android API 24 (crash de rn-screens resolvido via ADR-036). |
| 2026-05-16 (Sprint M1.2 em validação) | Código entregue em `feat/crud-medications-m1-2`. Expandida §"Padrões UX Consolidados" para 18 regras incluindo: tab re-tap = popToTop; refresh on focus; empty state single CTA; mensagens Zod amigáveis (Dona Maria) via `zodSetup.js` global; subtitle do card = princípio ativo; label "tratamentos associados" v1; delete com bloqueio hard via `MedicineDeleteBlockedSheet`; decimal com vírgula em tempo real; ANVISA autocomplete lab em branco para genéricos. M2.9 integration test heavy adiado (smoke manual PO). Novo componente `MedicineDeleteBlockedSheet` (mock `mock-medicamentos-apagar-bloqueio.png`). Setup Zod 4 locale PT-BR + customError em `packages/core/src/zodSetup.js` (efeito colateral ao importar `@dosiq/core`). Deletados: `AnvisaSearchScreen.jsx` (sem consumer) + `FormKitDemoScreen.jsx` (cumpriu papel). Cavecrew Haiku **passou 4/4** (M1.6 + M1.10 + M2.3 + M2.10 update) — manter para tarefas mecânicas em M1.3. Tech-debt registrado: granularidade ativo/pausado/expirado em contador de tratamentos por medicamento. |
