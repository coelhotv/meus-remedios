# Plano de Refatoração: Lint Hygiene Wave — max-lines-per-function + complexity

> **Convenção de aprovação:** O agente pode fazer merge de um PR **somente após receber aprovação textual explícita do humano** neste formato: _"aprovado, pode mergar"_ (ou equivalente inequívoco). Aprovação implícita ou silêncio não contam.

**Estado atual:** 93x `max-lines-per-function` + 80x `complexity` = **173 warnings**  
**Meta:** 0 warnings de ambas as regras  
**Abordagem:** Calibração de regras → 5 ondas de refatoração por domínio de risco

---

## Análise de Calibração das Regras

> [!IMPORTANT]
> Antes de qualquer refatoração de código, executar a **Wave 0** de calibração.
> Regras excessivamente rígidas geram débito técnico por forçar fragmentação artificial.

### Por que as regras atuais são rígidas demais em alguns contextos

| Contexto | Problema |
|----------|---------|
| Componentes `.jsx` | JSX é verboso por natureza. Um componente com 3 seções de render + 5 handlers = 130 linhas, mesmo bem estruturado |
| Test files (`.test.jsx`) | Blocos `describe` e `it` são contados como funções — um único `it` bem escrito pode ter 130 linhas de mock setup |
| Complexidade em componentes | `switch` de status, guards defensivos e renderização condicional inflam o índice sem indicar lógica complexa real |

### Proposta de Calibração (`eslint.config.js`)

**Wave 0 — Ajuste no `eslint.config.js`:**

Adicionar dois overrides ao final do array de configurações:

```js
// Override 1: Componentes React (.jsx)
{
  files: ['**/*.jsx'],
  rules: {
    'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', { max: 20 }],
  }
},
// Override 2: Arquivos de teste — describe/it são "funções" para o ESLint
{
  files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
  rules: {
    'max-lines-per-function': 'off',
    'complexity': 'off',
  }
},
```

**Impacto estimado da calibração:**

| Ajuste | Warnings eliminados sem código |
|--------|-------------------------------|
| Test files excluídos | ~6 |
| `.jsx` → 150 linhas | ~22 |
| `.jsx` → complexity 20 | ~15 |
| **Total estimado** | **~43 warnings eliminados** |

**Warnings remanescentes após calibração:** ~130 (todos genuínos, todos exigem refatoração real)

---

## Classificação por Severidade

### 🔴 CRÍTICO (complexity > 30 OU lines > 300)

| Arquivo | Lines | Complexity |
|---------|-------|------------|
| `apps/web/src/features/protocols/components/ProtocolForm.jsx` | 532 | **110** |
| `apps/web/src/features/protocols/components/TreatmentWizard.jsx` | 626 | **51** |
| `apps/web/src/shared/components/log/LogForm.jsx` | 323 | **45** |
| `server/notifications/payloads/buildNotificationPayload.js` | 264 | **45** |
| `apps/web/src/features/reports/services/consultationPdfDataBuilder.js` | 204 | **76** |
| `server/notifications/dispatcher/dispatchNotification.js` | 148 | **31+45** |
| `apps/web/src/features/medications/components/MedicineForm.jsx` | 316 | **50** |
| `apps/web/src/views/admin/DLQAdmin.jsx` | 436 | 23 |
| `apps/web/src/views/Landing.jsx` | 393 | — |
| `server/bot/tasks.js` | multi | 28/31/20/18 |

### 🟡 ALTO (complexity 16–30 OU lines 150–300)

`SparklineAdesao.jsx` (345ln), `Stock.jsx` (310ln, cx20), `Treatments.jsx` (327ln), `Protocols.jsx` (310ln), `StockForm.jsx` (246ln, cx39), `ProtocolCard.jsx` (159ln, cx35), `insightService.js` (149ln, cx27), `AdherenceWidget.jsx` (145ln, cx32), `RingGauge.jsx` (145ln, cx30), `DailyDoseModal.jsx` (158ln, cx30), `Profile.jsx` (248ln), `HealthHistory.jsx` (267ln), `Settings*.jsx` (240–288ln), `createQueryCache.js` (231ln), `adherenceLogic.js` (cx25), `Calendar.jsx` (287ln, cx35)

### 🟢 BAIXO (lines 101–150 OU complexity 16–19 — resolvidos pela calibração ou triviais)

`Auth.jsx` (104ln), `TelegramIntegrationStep.jsx` (120ln), `useCachedQuery.js` (cx16), `retryManager.js` (cx17), `doseActions.js` (107ln, cx17)

---

## Regras Obrigatórias para Agentes (todas as ondas)

> [!CAUTION]
> Violar qualquer regra abaixo = onda **reprovada** no gate de validação.

### R-REF-001: Nunca usar `eslint-disable`
Warnings eliminados via refatoração real. Exceção única: comentário `eslint-disable-next-line` com justificativa aprovada no PR.

### R-REF-002: Verificar duplicatas antes de criar arquivo
```bash
find src -name "*NomeDoArquivo*" -type f
```

### R-REF-003: Padrão de extração de sub-componente JSX
- Arquivo no mesmo diretório do pai
- Nomenclatura: `[Pai][Subfuncao].jsx` (ex: `MedicineFormScheduleSection.jsx`)
- Export: `export default` (named export só se reutilizado em >1 lugar)
- Props via desestruturação explícita — sem `{...props}` cego

### R-REF-004: Padrão de extração de função pura (services/utils)
```js
// Extrair para _helpers.js no mesmo diretório
// Prefixo _ = arquivo interno, não re-exportado pelo index.js do módulo
```

### R-REF-005: Ordem de hooks preservada
`useState` → `useMemo` → `useEffect` → handlers. Nunca dentro de condicional.

### R-REF-006: Teste antes de refatorar
Se há `*.test.*` para o arquivo: rodar `npm run test:changed` antes de modificar.  
Se não há teste e complexidade > 20: criar smoke test mínimo primeiro.

### R-REF-007: Gate obrigatório ao final de cada onda — PARAR e demonstrar

Ao concluir uma onda, o agente **deve parar completamente** e emitir o relatório abaixo antes de qualquer ação adicional. Não iniciar a onda seguinte sem aprovação explícita.

```
## ✅ Gate Report — Wave N: [Nome]

### Warnings eliminados
- max-lines-per-function: [X antes] → [Y depois] (−Z)
- complexity:             [X antes] → [Y depois] (−Z)

### Arquivos modificados
- `caminho/do/arquivo.js` (linha X): descrição do que foi extraído/refatorado
- ...

### Novos arquivos criados
- `caminho/_helpers.js`: funções extraídas — listagem

### Validação
- [ ] npm run validate:agent → PASS (X testes, 0 falhas)
- [ ] npm run lint (warnings restantes desta onda = 0)
- [ ] Nenhuma API pública quebrada (props, eventos, exports)

### Aguardando aprovação para:
→ Abrir PR da Wave N OU → Merge do PR #XXX (se já aprovado textualmente)
```

**O agente NÃO deve prosseguir até o humano responder.**

---

## Wave 0: Calibração das Regras ESLint

**Branch:** `refactor/wave-0-eslint-calibration`  
**Risco:** ⬛ Zero  
**Arquivo:** `eslint.config.js`

Adicionar os dois overrides (jsx + test) descritos acima. Nenhuma outra mudança.

**Validação + Gate Report obrigatório:**
```bash
npm run lint 2>&1 | grep -c "max-lines-per-function"  # deve cair de 93 → ~71
npm run lint 2>&1 | grep -c "complexity"               # deve cair de 80 → ~65
npm run validate:agent                                  # 0 falhas
```

Após rodar os comandos, emitir Gate Report (R-REF-007) com os números reais e **aguardar aprovação textual** antes de abrir PR.

---

## Wave 1: Server / Bot / Node.js

**Branch:** `refactor/wave-1-server-complexity`  
**Risco:** 🟡 Médio (código de produção — notificações e cron)  
**Estratégia:** Extrair funções helpers nomeadas para `_helpers.js` adjacentes

**Gate ao final da wave:**
```bash
npm run validate:agent
npm run lint 2>&1 | grep -E "(server/|packages/)" | grep -c "max-lines-per-function|complexity"
# Deve ser 0 para todos os arquivos server/ e packages/ desta onda
```
Emitir Gate Report → aguardar aprovação textual → agente abre PR → humano aprova PR → agente faz merge.

### 1.1 `server/notifications/payloads/buildNotificationPayload.js` (cx45, 264ln)
Extrair para `_payloadBuilders.js`:
- `buildDoseReminderPayload(dose, medicine)`
- `buildStockAlertPayload(stock, medicine)`
- `buildTitrationAlertPayload(protocol, step)`
- `buildNotificationPayload` vira dispatcher com `switch(type)` → cada builder (~30 linhas)

### 1.2 `server/notifications/dispatcher/dispatchNotification.js` (cx31+45)
Extrair arrow fn interna (cx45) para `_dispatchHelpers.js`:
- `buildDeliveryReport(results)`
- `handleDeliveryFailure(channel, error, context)`

### 1.3 `server/notifications/channels/telegramChannel.js` (cx28)
Extrair para `_telegramHelpers.js`:
- `formatTelegramMessage(payload, type)` — toda formatação por tipo de notificação
- Reutilizar `sendWithRetry` de `retryManager.js` se aplicável

### 1.4 `server/bot/tasks.js` (5 funções com cx excessiva)
Cada cron task vira orquestrador de ~40 linhas. Extrair para:
- `_reminderHelpers.js`: `filterEligibleReminders`, `groupByUser`, `buildReminderBatch`
- `_adherenceHelpers.js`: `calculateDailyWindow`, `buildAdherenceReport`

### 1.5 `server/bot/services/chatbotServerService.js` (cx21 + cx27, 139ln)
- `fetchPatientData`: extrair queries individuais para `_patientQueries.js`
- `sendTelegramChatMessage`: extrair formatação para `_chatMessageFormatter.js`

### 1.6 `server/bot/callbacks/conversational.js` (cx28, 134ln)
Extrair no mesmo arquivo (sem novo arquivo):
- `validateDoseRegistration(ctx, data)`
- `persistDoseRegistration(userId, data)`
- `buildRegistrationResponse(result)`

### 1.7 `server/utils/retryManager.js` + `server/bot/callbacks/doseActions.js`
Guard clauses + early return. Extrair validações para funções nomeadas inline.

---

## Wave 2: Core Business Logic

**Branch:** `refactor/wave-2-core-services`  
**Risco:** 🔴 Alto (adherence logic = coração do produto)

> [!WARNING]
> Rodar `npm run test:critical` antes de iniciar. Não alterar lógica, apenas estrutura.

**Gate ao final da wave:**
```bash
npm run test:critical   # baseline deve ser idêntico ao pré-refatoração
npm run validate:agent
npm run lint 2>&1 | grep -E "(services/|packages/core)" | grep -c "max-lines-per-function|complexity"
# Deve ser 0 para todos os arquivos desta onda
```
Emitir Gate Report → aguardar aprovação textual → agente abre PR → humano aprova PR → agente faz merge.

### 2.1 `packages/core/src/utils/adherenceLogic.js` (`shouldExpectDosesOnDate` cx23, `isProtocolActiveOnDate` cx25, `calculateStreaks` cx23)
Extrair predicados nomeados:
```js
// ANTES: if (a && b && c && !d && (e || f))
// DEPOIS:
const isOnWeeklySchedule = (dose, date) => ...
const hasExclusionPeriod = (dose, date) => ...
```
**CRÍTICO:** Testes devem passar idênticos antes e depois.

### 2.2 `apps/web/src/features/dashboard/services/insightService.js` (cx27, 149ln)
Extrair para `_insightGenerators.js`:
- `generateAdherenceInsight(data)`, `generateStockInsight(data)`, etc.
- `generateAllInsights` vira array de geradores mapeado (~20 linhas)

### 2.3 `apps/web/src/features/reports/services/consultationPdfDataBuilder.js` (cx76!, 204ln)
Extrair para `_pdfSectionBuilders.js`:
- `buildMedicinesSection(medicines)`, `buildProtocolsSection(protocols)`, `buildAdherenceSection(logs)`
- Builder principal vira assembler de seções (~30 linhas)

### 2.4 `apps/web/src/features/reports/services/pdfGeneratorService.js`
`generatePDF` (cx32, 114ln), `renderSummaryPage` (106ln), `handlePersist` (cx16, 110ln):
- Extrair render de cada seção para funções nomeadas
- `handlePersist`: guard clauses para reduzir ramificações

### 2.5 `apps/web/src/services/api/adherenceService.js`
`handleCreateIssues` (cx23, 118ln): extrair `validateIssuePayload`, `buildIssueRecord` como funções nomeadas

### 2.6 `packages/shared-data/src/query-cache/createQueryCache.js` (231ln)
Extrair métodos internos: `_buildCacheKey`, `_handleExpiry`, `_normalizeOptions`

---

## Wave 3: Hooks React

**Branch:** `refactor/wave-3-hooks`  
**Risco:** 🟡 Médio

**Gate ao final da wave:**
```bash
npm run validate:agent
npm run lint 2>&1 | grep -E "hooks/" | grep -c "max-lines-per-function|complexity"
# Deve ser 0 para todos os hooks desta onda
```
Emitir Gate Report → aguardar aprovação textual → agente abre PR → humano aprova PR → agente faz merge.

### 3.1 `apps/web/src/features/dashboard/hooks/useDashboardContext.jsx` (175ln)
Extrair lógica de derivação para `_useDashboardDerived.js` (hook privado)

### 3.2 `apps/web/src/features/stock/hooks/useStockData.js` (150ln, arrow cx25)
Extrair arrow fn anônima (cx25) para `_stockDataTransformer.js` (função pura — testável)

### 3.3 `apps/web/src/features/protocols/hooks/useTreatmentList.js`
Extrair transformações de dados para `_treatmentListUtils.js`

### 3.4 `apps/web/src/shared/hooks/useCachedQuery.js` (cx16 — 1 acima do limite `.js`)
Mínima: extrair lógica de retry/fallback para função nomeada inline

### 3.5 `useTodayData` hook
Se responsabilidades distintas: separar em `useScheduledDoses` + `useTodayLogs`

---

## Wave 4: Formulários e Wizards

**Branch:** `refactor/wave-4-forms-wizards`  
**Risco:** 🔴 Alto (UI complexa com estado compartilhado)

> [!WARNING]
> Verificar cobertura de testes antes de iniciar. Criar smoke test de render se ausente.

**Gate ANTES de iniciar (pré-condição obrigatória):**
```bash
# Para cada componente desta onda, verificar existência de teste:
find apps/web/src -name "ProtocolForm.test.*" -o -name "TreatmentWizard.test.*" \
  -o -name "LogForm.test.*" -o -name "MedicineForm.test.*" -o -name "StockForm.test.*"
# Se ausente: criar smoke test mínimo ANTES de refatorar
```

**Gate ao final da wave:**
```bash
npm run validate:agent
npm run lint 2>&1 | grep -E "(MedicineForm|ProtocolForm|TreatmentWizard|LogForm|StockForm|EmergencyCardForm)" | grep -c "max-lines-per-function|complexity"
# Deve ser 0
```
Emitir Gate Report → aguardar aprovação textual → agente abre PR → humano aprova PR → agente faz merge.

### Padrão obrigatório para formulários grandes

```
1. Hook de estado: useXxxFormState(initialValues) — useState, useCallback, submit logic
2. Seções de render: XxxFormGeneralSection, XxxFormScheduleSection — componentes puros
3. Formulário raiz: orquestra hook + seções (≤ 80 linhas)
```

### 4.1 `ProtocolForm.jsx` (532ln, cx110 — CRÍTICO)
Extrair: `useProtocolFormState`, `ProtocolFormBasicSection`, `ProtocolFormDosesSection`, `ProtocolFormAdvancedSection`

### 4.2 `TreatmentWizard.jsx` (626ln, cx51 — CRÍTICO)
Extrair: `useTreatmentWizardState`, um componente por step (`TreatmentWizardStep1.jsx`, etc.)

### 4.3 `LogForm.jsx` (323ln, cx45)
Extrair: `useLogFormState`, `LogFormMedicineSection`, `LogFormTimeSection`

### 4.4 `MedicineForm.jsx` (316ln, cx50)
Extrair: `useMedicineFormState`, `MedicineFormBasicSection`, `MedicineFormScheduleSection`, `MedicineFormStockSection`

### 4.5 `StockForm.jsx` (246ln, cx39)
Extrair: `useStockFormState`, seções de render

### 4.6 `EmergencyCardForm.jsx` (293ln, cx19)
Após calibração jsx→20: só max-lines a resolver. Extrair seções de render.

---

## Wave 5: Views e Componentes Restantes

**Branch:** `refactor/wave-5-views-components`  
**Risco:** 🟢 Baixo-Médio

> [!NOTE]
> Views que excedem o limite mas **não têm lógica** (apenas orquestram componentes): extrair seções JSX para subcomponentes. Não criar hooks artificiais para reduzir linhas.

**Gate ao final da wave:**
```bash
npm run validate:agent
npm run lint 2>&1 | grep -c "max-lines-per-function"  # deve ser 0
npm run lint 2>&1 | grep -c "complexity"               # deve ser 0
```
Emitir Gate Report final com contagem **0/0** → aguardar aprovação textual → agente abre PR → humano aprova PR → agente faz merge.

| Arquivo | Ação |
|---------|------|
| `DLQAdmin.jsx` (436ln, cx23) | Extrair `DLQTable`, `DLQFilters`, `useDLQState` |
| `Stock.jsx` (310ln, cx20) | Extrair `StockHeader`, `StockFilters` |
| `Treatments.jsx` (327ln) | Extrair por seção da view |
| `Protocols.jsx` (310ln) | Extrair `ProtocolList`, `ProtocolFilters` |
| `SettingsRedesign.jsx` (288ln) | Extrair seções além da `NotificationSection` existente |
| `Profile.jsx` (248ln, cx24) | Extrair `ProfileForm`, lógica upload → hook |
| `HealthHistory.jsx` (267ln) | Extrair `HistoryChart`, `HistoryTable` |
| `SparklineAdesao.jsx` (345ln, cx30) | Extrair cálculos para `_sparklineUtils.js` |
| `RingGauge.jsx` (145ln, cx30) | Extrair cálculos SVG para `_ringGaugeUtils.js` |
| `ProtocolCard.jsx` (159ln, cx35) | Extrair status badges e handlers |
| `AdherenceWidget.jsx` (145ln, cx32) | Extrair cálculos para utils |
| `Calendar.jsx` (287ln, cx35) | Extrair `_calendarUtils.js` (cálculo de semanas/dias) |
| `NotificationCard.jsx` (132ln, cx23) | Extrair formatação de mensagem |
| `DailyDoseModal.jsx` (158ln, cx30) | Extrair seções do modal |
| `Landing.jsx` (393ln) | Extrair seções: `LandingHero`, `LandingFeatures`, `LandingCTA` |

---

## Critérios de Aceitação Global

### Meta final
```bash
npm run lint 2>&1 | grep -E "max-lines-per-function|complexity" | wc -l  # = 0
npm run validate:agent  # 0 regressões
```

### Proibido em todas as ondas
- ❌ `eslint-disable` sem aprovação explícita
- ❌ Criar arquivo fora do diretório canônico do domínio
- ❌ Alterar lógica de negócio durante refatoração estrutural
- ❌ Quebrar API pública do componente (props, eventos)
- ❌ Iniciar Wave N sem Gate Report emitido e aprovação textual recebida
- ❌ Fazer merge sem aprovação textual explícita do humano

---

## Fluxo de Entrega por Onda

```
┌─────────────────────────────────────────────────────────┐
│  Para cada onda:                                        │
│                                                         │
│  1. Agente executa refatorações                         │
│  2. Agente roda: npm run validate:agent + lint count    │
│  3. Agente emite Gate Report (R-REF-007) e PARA         │
│                      ↓                                  │
│  4. Humano revisa Gate Report                           │
│  5. Humano dá aprovação textual explícita               │
│     ex: "aprovado, pode abrir PR" ou "aprovado Wave N" │
│                      ↓                                  │
│  6. Agente abre PR com descrição do Gate Report         │
│  7. Humano revisa o PR no GitHub                        │
│  8. Humano aprova o PR textualmente                     │
│     ex: "PR aprovado, pode mergar"                      │
│                      ↓                                  │
│  9. Agente faz merge do PR                              │
│  10. Agente inicia próxima onda                         │
└─────────────────────────────────────────────────────────┘
```

> **Aprovação válida:** qualquer mensagem inequívoca do humano autorizando o próximo passo.  
> **Não válido:** silêncio, emoji isolado, ou confirmação de onda anterior aplicada à nova.

---

## Roadmap

```
Wave 0: Calibração ESLint   → 1 arquivo  | ~1h  | ✅ CONCLUÍDO
Wave 1: Server/Bot          → ~8 arquivos | ~4h  | Gate → PR → Aprovação → Merge
Wave 2: Core Services       → ~6 arquivos | ~4h  | Gate → PR → Aprovação → Merge
Wave 3: Hooks               → ~5 arquivos | ~3h  | Gate → PR → Aprovação → Merge
Wave 4: Formulários (RISCO) → ~6 comps   | ~6h  | Gate → PR → Aprovação → Merge
Wave 5: Views + Componentes → ~15 arqs   | ~5h  | Gate → PR → Aprovação → Merge
─────────────────────────────────────────────────────────────────────────────
Total estimado: ~23h de agente | 6–7 PRs | Merge pelo agente após aprovação textual
```
