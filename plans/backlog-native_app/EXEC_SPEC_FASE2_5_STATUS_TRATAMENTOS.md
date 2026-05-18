# EXEC SPEC — Fase 2.5: Status de Tratamentos (Ativo / Pausado / Finalizado)

> **Tipo**: Sprint expansiva pós-Fase 2 — fecha gap de paridade com a web
> **Duração estimada**: 1 sprint (5-7 dias)
> **Branch base (mãe)**: `feat/treatments-status` (a criar; sai de `main` após merge da Fase 2)
> **Pré-condição**: ✅ Fase 2 completa (PRs #561-#566 mergeados + PR final mãe→main)
> **Quality Gates**: G1 (mobile feature flag) → G2 (extract filter logic em @dosiq/core se necessário)
> **Versão do app**: bump menor `v0.3.x` durante; bump `v0.4.0` ainda só ao final da Fase 3
> **Reviewer humano**: PO valida iOS + Android (incluindo API 24)
> **PR strategy**: 1 PR único contra `main` (escopo pequeno, atômico)
> **Origem**: feedback PO 2026-05-17 — após smoke da Fase 2, percebeu que a flag `active` (true/false) do tratamento + lógica de período (`end_date < hoje` = finalizado) não estão expostas no mobile, ao contrário da web que já possui 3 tabs.

---

## 0. Spec Reading Protocol (R-228)

Toda sessão de implementação Fase 2.5 começa com:

1. Ler esta spec **inteira**
2. Conferir state.json + RULES_INDEX + ANTI_PATTERNS_INDEX (bootstrap DEVFLOW)
3. Ler referência web canônica:
   - `apps/web/src/features/protocols/hooks/_treatmentListUtils.js` — `resolveTabStatus` (canônico)
   - `apps/web/src/features/protocols/hooks/useTreatmentsState.js` — gerenciamento de tabs + counts
   - `apps/web/src/features/protocols/components/redesign/TreatmentTabBar.jsx` — UI segmented control
4. Conferir mocks aprovados pelo PO em `plans/backlog-native_app/MOCKS_APP_CRUD/export/fase-2-5/` — **podem não existir ainda**; nesse caso, PO aprova a referência web durante sprint kickoff
5. Conferir glossário em `docs/reference/GLOSSARY.md` (termos: ativo/pausado/finalizado)

**Mocks ausentes na pasta `fase-2-5/` ⇒ trabalhar a partir da paridade web + revisão visual PO durante a sprint**. Não bloquear o sprint por falta de PNG quando a referência web é clara.

---

## 1. Diagnóstico — gap entre web e mobile (estado em 2026-05-17)

| Aspecto | Web | Mobile (pós-Fase 2) | Gap |
|---------|-----|---------------------|-----|
| Listagem traz tratamentos pausados | ✅ `active=true` removido do query, tabStatus derivado client-side | ❌ `treatmentsService.getActiveTreatments` faz `.eq('active', true)` — pausados NUNCA aparecem | 🔴 |
| Listagem traz finalizados | ✅ Sem filtro de período no query; client filtra `end_date < hoje` | ❌ Filtro `isProtocolInPeriod` exclui finalizados | 🔴 |
| TabBar Ativos/Pausados/Finalizados | ✅ `TreatmentTabBar` com counts | ❌ Não existe | 🔴 |
| Toggle pause/resume | ✅ Ação no detail (atualiza `active`) | ❌ Não existe; `protocolService.update({active})` existe na factory mas UI não dispara | 🟠 |
| `tabStatus` derivado por item | ✅ `resolveTabStatus(protocol)` | ❌ Não existe equivalente mobile | 🔴 |
| Adherence score só na tab "ativos" | ✅ `ProtocolRow` conditional | N/A — adherence ainda não está na listagem mobile | 🟢 (não regressivo) |

**Implicação UX atual no mobile**: usuário só vê tratamentos com `active=true` E em período. Não consegue:
1. Pausar um tratamento temporariamente (não tem ação)
2. Retomar tratamento pausado (não consegue encontrá-lo)
3. Revisitar histórico de tratamentos finalizados (somem da listagem)

---

## 2. Objetivo

Levar para o mobile a mesma capacidade da web de **categorizar tratamentos por status operacional**, expondo:

- **Listagem completa** (sem filtro server-side de `active`)
- **TabBar com 3 tabs** (Ativos | Pausados | Finalizados) e contadores
- **Ação Pausar/Retomar** no `ProtocolDetailScreen`
- **Helper canônico `resolveTabStatus`** (extraído para `@dosiq/core/utils/treatmentStatus.js` para web e mobile compartilharem)

**Exclusões v1**:
- Tab dedicada para tratamentos arquivados (não existe na web)
- Bulk pause/resume (não existe na web)
- Filtros adicionais (frequency, plano) — Fase futura

---

## 3. Especificação de Telas

### 3.1 — TreatmentsScreen com TabBar

**Layout atual** (pós-Fase 2): header "Tratamentos" + lista agrupada por plano + FAB + link "Medicamentos".

**Adições Fase 2.5**:

1. **TreatmentTabBar** (novo componente mobile, espelha visualmente o segmented control web):
   - Posicionado abaixo do header, antes do conteúdo da lista
   - 3 tabs: `Ativos (N)`, `Pausados (N)`, `Finalizados (N)`
   - Counts entre parênteses; omitir parênteses quando count=0
   - Tab ativa: bg primary[100] + text primary[700] weight 700
   - Tabs inativas: text muted
   - Tap altera state local da screen + scroll para o topo da lista
   - **Tab default = `Ativos`** ao abrir a tela (sem persistência cross-session na v1; cada entrada na tela resetar pra `Ativos`). Se voltar via `useFocusEffect` da mesma sessão, mantém a tab que o user selecionou (não resetar em refresh, só em mount).

2. **Estado vazio por tab** (cobrir gracefully):
   - Tab "Ativos" vazia + zero pausados + zero finalizados → mantém `TreatmentEmptyState` atual (CTA criar primeiro)
   - Tab "Pausados" vazia (mas há ativos ou finalizados) → texto centralizado "Nenhum tratamento pausado." sem CTA
   - Tab "Finalizados" vazia → "Nenhum tratamento finalizado ainda."

3. **Conteúdo da tab**:
   - **Ativos**: comportamento atual (heurística SIMPLE/COMPLEX já implementada)
   - **Pausados**: lista flat com badge "Pausado" cinza no card (sem agrupamento por plano — paridade web)
   - **Finalizados**: lista flat com badge "Finalizado em DD MMM YYYY" cinza-claro (data do `end_date`)

4. **FAB** continua na tela mesmo nas tabs pausados/finalizados (criar novo sempre disponível).

### 3.2 — ProtocolDetailScreen — toggle Desligado / Ligado

**Adição** (acima do botão Excluir existente, dentro de um `SectionCard` próprio para destaque):

- **Row com toggle nativo (`Switch` do react-native)**:
  - Esquerda: label `"Tratamento ligado"` (titleSM weight 600) + helper text logo abaixo (caption muted):
    - Quando ligado: `"Recebendo lembretes e contando aderência."`
    - Quando desligado: `"Pausado — sem lembretes, sem impacto na aderência."`
  - Direita: `Switch` nativo (`trackColor={{ true: colors.primary[500], false: colors.neutral[300] }}`); haptics `selectionTap` no toggle
  - **Tratamento finalizado (`end_date < hoje`)**: ocultar a row inteira do toggle (não faz sentido ligar/desligar algo já fora de período; user deve editar `end_date` se quiser reativar). Em vez disso, mostrar caption inerte: `"Tratamento finalizado em DD MMM YYYY. Edite o período para reativar."`

- **Tap no toggle**: SEM confirmação modal — ação reversível e o feedback visual do switch já comunica a intenção. Apenas:
  - Toast success: `"Tratamento ligado"` ou `"Tratamento desligado"`
  - Chamada `protocolService.update(id, { active: nextValue })` em background
  - Optimistic update do toggle visual + reverte se erro + toast error
  - Invalida cache `useProtocols` + `@dosiq/protocols-snapshot` → próximo focus na listagem reagrupa por tab

**Justificativa do toggle vs botão Pausar/Retomar**: feedback PO 2026-05-17 — analogia play/pause carrega conotação temporal ("vou voltar logo") que nem sempre é o caso. Toggle ligado/desligado é cognitivamente mais simples, alinhado com padrão de switches do iOS/Android e binário sem ambiguidade semântica.

### 3.3 — Card de tratamento na listagem

**Estado novo (Pausado)**:
- Background do card: `colors.bg.card` normal
- Ícone medicamento: opacity 0.6 (visual "apagado")
- Nome + DosagePill: opacity 0.8
- Badge `Pausado` (chip `colors.neutral[200]` + text `colors.neutral[700]` weight 600 fontSize 11)

**Estado novo (Finalizado)**:
- Background do card: `colors.neutral[50]`
- Ícone + textos: opacity 0.7
- Badge `Finalizado em DD MMM YYYY` (chip `colors.neutral[100]` + text `colors.neutral[600]`)
- Chevron right MANTIDO (user pode reabrir detail mesmo finalizado)

---

## 4. Sprint Breakdown

### Sprint T2.5.1 — Status Tratamentos (PR único)

| # | Task | Path | Agente | Complexidade |
|---|------|------|--------|-------------|
| T1 | Criar helper canônico `resolveTreatmentStatus(protocol, today)` em `@dosiq/core/utils/treatmentStatus.js` (lê: end_date, active) — extrair lógica de `_treatmentListUtils.js` web sem regredir comportamento | `packages/core/src/utils/treatmentStatus.js` + barrel | 👤 Opus | ⭐⭐ |
| T2 | Tests do helper (`status: 'ativo' \| 'pausado' \| 'finalizado'`; edge cases: end_date hoje = ativo; active=null=ativo; finalizado vence pausado) | `packages/core/src/utils/__tests__/treatmentStatus.test.js` | 🤖 Haiku | ⭐ |
| T3 | Web adopt helper canônico — `_treatmentListUtils.resolveTabStatus` vira wrapper de `resolveTreatmentStatus` (mapping de nome: 'ativo'→'ativos' label segmented; mas storage interno usa singular novo) | `apps/web/src/features/protocols/hooks/_treatmentListUtils.js` | 🤖 Sonnet | ⭐⭐ |
| T4 | `treatmentsService.getActiveTreatments` mobile renomeado para `getAllTreatments(userId)` — remove `.eq('active', true)` + remove filtro `isProtocolInPeriod` (helper agora decide). Manter assinatura de retorno `{ success, data, error }` | `apps/mobile/src/features/treatments/services/treatmentsService.js` | 👤 Opus | ⭐⭐ |
| T5 | `_treatmentsTransformer` agora anota cada item com `tabStatus` via helper + computa `counts` ({ ativos, pausados, finalizados }) — ainda agrupa só ativos por plano | `apps/mobile/src/features/treatments/hooks/_treatmentsTransformer.js` | 🤖 Sonnet | ⭐⭐ |
| T6 | `useTreatments` mobile expõe `{ data, counts, activeTab, setActiveTab, refresh }` — state interno mantém qual tab está selecionada | `apps/mobile/src/features/treatments/hooks/useTreatments.js` | 👤 Opus | ⭐⭐ |
| T7 | `TreatmentTabBar.jsx` novo (espelha web visualmente) | `apps/mobile/src/features/treatments/components/TreatmentTabBar.jsx` | 🤖 Sonnet | ⭐⭐ |
| T8 | `TreatmentCard` ganha props `tabStatus` + `endDate` + badges visuais (pausado/finalizado) | `apps/mobile/src/features/treatments/components/TreatmentCard.jsx` | 🤖 Sonnet | ⭐⭐ |
| T9 | `TreatmentsScreen` consome `useTreatments` novo + renderiza `TreatmentTabBar` + handle empty per-tab | `apps/mobile/src/features/treatments/screens/TreatmentsScreen.jsx` | 👤 Opus | ⭐⭐⭐ |
| T10 | `ProtocolDetailScreen` ganha row de toggle `Tratamento ligado` (Switch nativo, optimistic update, ocultar se finalizado) | `apps/mobile/src/features/treatments/screens/ProtocolDetailScreen.jsx` | 👤 Opus | ⭐⭐ |
| T11 | `useProtocolMutation` ganha helper `toggleActive(id, nextValue)` com optimistic update (wrapper sobre update + rollback em erro) | `apps/mobile/src/features/treatments/hooks/useProtocolMutation.js` | 🤖 Haiku | ⭐ |
| T12 | Atualizar EXEC_SPEC_FASE2 (§3.2) — listagem agora cobre 3 status; adicionar nota cross-ref pra Fase 2.5 | `plans/backlog-native_app/EXEC_SPEC_FASE2_PROTOCOLOS.md` | 🤖 Haiku | ⭐ |
| T13 | Smoke E2E iOS + Android API 24 | Manual | 👤 Humano | — |

**Entrega**: PR único `feat/treatments-status` → review Gemini → smoke PO → merge `main`.

---

## 5. Quality Gates

### 5.1 — G1 (Status mobile)

| Critério | Validação |
|----------|-----------|
| `resolveTreatmentStatus` retorna corretamente para os 3 status (incluindo edge cases) | `npx vitest run packages/core/src/utils/__tests__/treatmentStatus.test.js` |
| Web continua passando todos os testes após adopt do helper canônico | `rtk npm run validate:agent` |
| Mobile lista carrega TODOS os tratamentos (ativos + pausados + finalizados); counts batem com DB | Smoke + cross-check via Supabase MCP |
| Tap em tab muda conteúdo + scroll para o topo | Smoke manual |
| Desligar tratamento (toggle OFF) move da tab Ativos para Pausados sem refresh manual ao voltar pra listagem | Smoke (focus refresh + cache invalidation) |
| Religar tratamento (toggle ON) volta para Ativos | Smoke |
| Tratamento finalizado (end_date < hoje) aparece SOMENTE na tab Finalizados; toggle ligado/desligado oculto no detail (caption inerte no lugar) | Smoke |
| Tab default ao abrir a tela Tratamentos = `Ativos` | Smoke |
| Jest mobile suite > +3 tests novos (helper aplicado em transformer + hook) | CI |
| Lint clean nos arquivos novos/modificados | `rtk lint` |

---

## 6. Schema & data layer

`protocols.active` já é `boolean default true` no DB e no `protocolSchema.js` — **nenhuma migração necessária**.

`end_date` já é `date nullable` — sem mudanças.

**Sem refator no schema canônico**. Apenas leitura/escrita do campo existente.

### Helper canônico

```js
// packages/core/src/utils/treatmentStatus.js

import { formatLocalDate, getNow } from './dateUtils.js'

export const TREATMENT_STATUS = Object.freeze({
  ATIVO: 'ativo',
  PAUSADO: 'pausado',
  FINALIZADO: 'finalizado',
})

/**
 * Resolve o status operacional de um tratamento.
 *
 * Ordem de precedência (igual à web em _treatmentListUtils.js):
 *   1. end_date && end_date < hoje  → FINALIZADO
 *   2. active === false             → PAUSADO
 *   3. caso contrário               → ATIVO
 *
 * @param {{ active?: boolean, end_date?: string|null }} protocol
 * @param {string} [today=formatLocalDate(getNow())]
 * @returns {'ativo'|'pausado'|'finalizado'}
 */
export function resolveTreatmentStatus(protocol, today) {
  const ref = today ?? formatLocalDate(getNow())
  if (protocol?.end_date && protocol.end_date < ref) return TREATMENT_STATUS.FINALIZADO
  if (protocol?.active === false) return TREATMENT_STATUS.PAUSADO
  return TREATMENT_STATUS.ATIVO
}
```

Re-export no `packages/core/src/utils/index.js`.

---

## 7. Brief padrão cavecrew (R-230)

Cada spawn recebe:

1. Read-only refs absolutas (esta spec + referência web + arquivo Fase 2 análogo)
2. Path absoluto do arquivo
3. Contrato exato (assinatura/props/return)
4. Regras críticas (R-010, R-020, R-130 quando aplicável)
5. Output esperado + ponto de integração
6. Sem commits (Write/Edit only)

---

## 8. PR Strategy

| Sprint | PR contra | Reviewer humano | Reviewer LLM |
|--------|-----------|-----------------|--------------|
| T2.5.1 | `main` | PO valida iOS + Android API 24 | Gemini-Code-Assist |

PR pequeno o suficiente pra um único review cycle; sem necessidade de mãe→main fan-out.

---

## 9. Critérios para encerramento da Fase 2.5

- [ ] G1 passou (humano)
- [ ] PR mergeado em main
- [ ] DEVFLOW C5: novo R-NNN sobre resolveTreatmentStatus canônico se for considerado pattern de paridade web↔mobile; journal entry
- [ ] EXEC_SPEC_FASE2 atualizada com cross-ref
- [ ] Master plan (`MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md`) registra Fase 2.5 como completa

---

## 10. Histórico

- **2026-05-17 (criação)**: Spec criada após smoke PO da Fase 2 PR-A T2.3 revelar gap de paridade com web (`active` flag + categorização de status). Origem: feedback explícito do PO durante o sprint final da Fase 2.
- **2026-05-17 (revisão pós-PO)**: §3.1 — tornado explícito que tab default ao mount = `Ativos`. §3.2 — botão Pausar/Retomar trocado por toggle `Tratamento ligado` (Switch nativo, optimistic update, sem confirmação modal). Feedback PO: analogia play/pause carrega conotação temporal indesejada; toggle binário ligado/desligado é cognitivamente mais simples e alinhado com switches nativos do SO.
