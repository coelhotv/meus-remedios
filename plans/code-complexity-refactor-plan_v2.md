# Plano Definitivo: Lint Hygiene — Complexity + Max-Lines

> Path canônico do repo: `/Users/coelhotv/git-icloud/dosiq/`
> Lint global (sumário): `rtk lint`
> Lint por arquivo (contagem exata): `rtk proxy npx eslint <arquivo>` + `grep -c`
> Validate command: `npm run validate:agent`

## Formato do `rtk lint`

```
ESLint: 0 errors, 131 warnings in 76 files
═══════════════════════════════════════
Top rules:
  react-native/no-color-literals (43x)   ← fora de escopo (mobile style)
  max-lines-per-function (43x)            ← alvo
  complexity (32x)                        ← alvo
  react-hooks/exhaustive-deps (10x)       ← fora de escopo desta sprint
  react-native/no-inline-styles (2x)      ← fora de escopo
```

**Gate command padrão para cada wave:**
```bash
cd /Users/coelhotv/git-icloud/dosiq && rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# Baseline: max-lines-per-function (43x), complexity (32x)
# Meta final: ambas as linhas ausentes ou (0x)
```

**Nota sobre `exhaustive-deps` (10x):** 7 das 10 violações estão em `_useDashboardDerived.js`. Tratar nesta sprint junto com a Wave C (hook já será refatorado de qualquer forma).

---

## O que deu errado no plano anterior

1. **`apps/mobile/` não existia quando o plano foi escrito** — codebase novo, 100% descoberto. Representa ~15 das violações atuais.
2. **Componentes extraídos na Wave 4 excederam os limites**: `TreatmentWizardStep1` (180ln) e `TreatmentWizardStep2` (162ln) foram criados mas eles mesmos violam.
3. **API handlers nunca foram incluídos** no plano — 7 violações em `api/`.
4. **Wave 5 incompleta** — múltiplos arquivos listados ainda violam.
5. **Wave 2 parcial** — `adherenceLogic.js` ainda tem `shouldExpectDosesOnDate` (cx23) e `calculateStreaks` (cx23).

## Limites vigentes (do eslint.config.js)

| Extensão | max-lines-per-function | complexity |
|----------|----------------------|------------|
| `.js`    | 100                  | 15         |
| `.jsx`   | 150                  | 20         |
| `.test.js/.test.jsx` | off | off   |

---

## Regras obrigatórias para todos os agentes executores

### NUNCA fazer
- `eslint-disable` (nem `eslint-disable-next-line`) — proibido sem aprovação
- Alterar lógica de negócio — apenas estrutura
- Quebrar API pública (props, exports, eventos)
- Criar arquivo fora do diretório canônico do módulo
- Usar `{...props}` cego — sempre desestruturar props explicitamente
- Usar caminhos relativos longos — sempre usar path aliases (`@features`, `@shared`, etc.)

### SEMPRE fazer
- Rodar `npm run validate:agent` ao final de cada wave antes de reportar
- Rodar `rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"` para confirmar 0 violações nos arquivos modificados
- Preservar ordem de hooks: `useState` → `useMemo` → `useEffect` → handlers

### Técnicas permitidas (por ordem de preferência)

| Técnica | Quando usar |
|---------|-------------|
| **EARLY_RETURN** | Complexity > limit; múltiplas condições aninhadas; guards defensivos |
| **NAMED_FN_INLINE** | Extrair arrow fn anônima ou bloco lógico para função nomeada no mesmo arquivo |
| **LOOKUP_TABLE** | Switch/if-else em tipo/status → `const MAP = { key: value }` |
| **EXTRACT_FILE** | Função pura, sem JSX, reutilizável → `_helpers.js` adjacente |
| **EXTRACT_COMPONENT** | Bloco JSX ≥ 30 linhas com coesão própria → novo arquivo `.jsx` adjacente |

---

## Estratégia de Execução com Sub-agentes

Cada wave é executada por um sub-agente spawn via `Agent` tool. Modelo escolhido por risco:

| Wave | Modelo | Razão |
|------|--------|-------|
| 0 — ESLint config | direto (sem sub-agente) | 1 arquivo, 5 linhas |
| A — Core/services JS | **sonnet** | lógica de negócio, risco alto |
| B — API handlers | **haiku** | padrão mecânico (extract/rename), baixo risco |
| C — Web hooks | **haiku** | padrão mecânico, sem render |
| D — JSX complexity | **haiku** | lookup tables + early returns, padrão repetível |
| E — JSX lines | **sonnet** | muitos arquivos, julgamento sobre fronteiras de componente |
| F — Mobile | **sonnet** | codebase novo, maior risco de regressão |

**Prompt padrão para cada sub-agente:**
```
Contexto: repo em /Users/coelhotv/git-icloud/dosiq/
Tarefa: [descrição da wave]
Regras: [seção de regras do plano]
Instruções de cada arquivo: [seção da wave]
Ao terminar: rodar gate e reportar resultado — NÃO abrir PR nem fazer merge
```

---

## Wave 0: Calibração ESLint

**Execução:** Direto pelo agente principal (sem branch, sem sub-agente)
**Risco:** ⬛ Zero — apenas config
**Arquivo:** `eslint.config.js`

### Justificativa dos ajustes

| Override | Limite atual | Proposta | Razão |
|----------|-------------|---------|-------|
| `api/**/*.js` | 100/15 | 150/20 | Handlers têm parse + validate + process + respond — complexidade estrutural inevitável, não sinal de código ruim |
| `.jsx` | 150/20 | mantém | Já calibrado na Wave 0 anterior — correto |
| `.js` (geral) | 100/15 | mantém | Hooks e services devem ser pequenos |

### Ação: adicionar override no `eslint.config.js`

Adicionar ANTES dos overrides de `.jsx` e test:
```js
// Override: API handlers têm complexidade estrutural legítima
{
  files: ['api/**/*.js', 'api/**/_handlers/**/*.js'],
  rules: {
    'max-lines-per-function': ['warn', { max: 150, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', { max: 20 }],
  }
},
```

### Impacto estimado

- `api/chatbot.js` handler cx17 → abaixo do novo limite 20 ✅ (elimina sem refatoração)
- `api/gemini-reviews/_handlers/create-issues.js` 118ln cx23 → ainda viola (cx23 > 20), precisa refatoração
- `api/gemini-reviews/_handlers/persist.js` 110ln cx16 → abaixo de ambos ✅
- `api/gemini-reviews/_handlers/update-status.js` 147ln cx16 → abaixo de ambos ✅
- `api/notify.js` 156ln cx18 → abaixo de ambos ✅
- `api/dlq/_handlers/retry.js` 111ln → abaixo ✅
- `api/telegram.js` 117ln cx34 → ainda viola (cx34 > 20), precisa refatoração

**Estimativa: Wave 0 elimina ~5 violações de API sem código. Restam: create-issues.js (cx23) e telegram.js (cx34).**

**Gate Wave 0:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# Deve cair de (43x)/(32x) para ~(38x)/(32x)
npm run validate:agent
```

---

## Wave A: packages/core + web services/utils (JS puro)

**Branch:** `refactor/lint-wave-a-core-services`
**Risco:** 🔴 Alto — lógica de negócio crítica. Rodar `npm run test:critical` antes.
**Arquivos:** 6

---

### A.1 `packages/core/src/utils/adherenceLogic.js`

**Violações:**
- `shouldExpectDosesOnDate` (ln ~51): complexity 23/15
- Arrow fn (ln ~632): complexity 16/15
- `calculateStreaks` (ln ~766): complexity 23/15

**Ação para `shouldExpectDosesOnDate` (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// Extrair predicados nomeados no mesmo arquivo (não exportar):
const _isOnWeeklySchedule = (dose, date) => { /* lógica weekday */ }
const _isOnAlternateDay = (dose, startDate, date) => { /* lógica dias alternados */ }
const _hasExclusionWindow = (dose, date) => { /* lógica janela exclusão */ }
// shouldExpectDosesOnDate vira: guard clauses + chamadas aos predicados (~15 linhas)
```

**Ação para arrow fn (ln ~632) (NAMED_FN_INLINE):**
```js
// Dar nome à arrow function anônima:
// ANTES: .reduce((acc, log) => { ... complex ... }, {})
// DEPOIS: extrair para função nomeada _accumulateStreak(acc, log) no mesmo arquivo
```

**Ação para `calculateStreaks` (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo:
const _initStreakState = () => ({ current: 0, best: 0, ... })
const _processStreakDay = (state, dayLogs, expectedDoses) => { /* lógica por dia */ }
// calculateStreaks vira: inicializar + loop que chama _processStreakDay (~20 linhas)
```

---

### A.2 `apps/web/src/features/adherence/services/adherencePatternService.js`

**Violação:** `analyzeAdherencePatterns` complexity 18/15

**Ação (NAMED_FN_INLINE + EARLY_RETURN):**
```js
// Extrair no mesmo arquivo:
const _classifyPattern = (adherenceRate) => { /* if/else → switch ou lookup */ }
const _buildPatternReport = (logs, window) => { /* sub-lógica */ }
// analyzeAdherencePatterns vira orquestrador ~15 linhas
```

---

### A.3 `apps/web/src/features/calendar/services/doseCalendarService.js`

**Violações:**
- Arrow fn (ln ~3): complexity 57/15 — **CRÍTICO**
- Arrow fn (ln ~632 no arquivo total do lint — verificar): complexity 16/15

**Ação para arrow fn cx57 (NAMED_FN_INLINE + LOOKUP_TABLE + EARLY_RETURN):**
```
Esta é a violação mais severa do codebase. A arrow function provavelmente processa
eventos de calendário com múltiplos tipos.

1. Grep: `grep -n "=>" apps/web/src/features/calendar/services/doseCalendarService.js | head -20`
2. Identificar a arrow fn na linha 3 do arquivo
3. Extrair no mesmo arquivo:
   - _buildDoseEvent(dose, date) — cria objeto de evento
   - _buildProtocolEvent(protocol, date) — cria objeto de evento protocolo
   - _buildLogEvent(log) — cria objeto de evento de log
   - Função principal vira map/flatMap sobre arrays de entrada (~15 linhas)
```

---

### A.4 `apps/web/src/features/reports/services/consultationPdfService.js`

**Violações:**
- `renderSummaryPage` (ln ~376): 106 linhas / limit 100
- `drawHeroGauge` (ln ~261): complexity 16/15

**Ação para `renderSummaryPage` (NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo:
const _drawMedicinesSection = (doc, medicines, y) => { ... }
const _drawProtocolsSection = (doc, protocols, y) => { ... }
// renderSummaryPage vira orquestrador que chama helpers sequencialmente
```

**Ação para `drawHeroGauge` (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo:
const _computeGaugeArc = (value, max, radius) => { ... }
// Ou: substituir if/else aninhados por early returns nos casos de borda
```

---

### A.5 `apps/web/src/features/reports/services/shareService.js`

**Violação:** `shareReport` complexity 18/15

**Ação (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// shareReport provavelmente tem vários paths de share (PDF, link, WhatsApp, etc.)
// LOOKUP_TABLE para tipo de share:
const _shareHandlers = {
  pdf: (report) => { ... },
  link: (report) => { ... },
  whatsapp: (report) => { ... },
}
// shareReport vira: validate → _shareHandlers[type](report)
```

---

### A.6 `apps/web/src/services/api/adherenceService.js`

**Violação:** Arrow fn (ln ~27): complexity 23/15

**Ação (NAMED_FN_INLINE):**
```js
// Grep: grep -n "=>" apps/web/src/services/api/adherenceService.js | head -10
// Identificar arrow fn na linha ~27
// Dar nome e extrair predicados internos como funções nomeadas no mesmo arquivo
```

**Gate Wave A:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
npm run test:critical
rtk proxy npx eslint \
  packages/core/src/utils/adherenceLogic.js \
  apps/web/src/features/adherence/services/adherencePatternService.js \
  apps/web/src/features/calendar/services/doseCalendarService.js \
  apps/web/src/features/reports/services/consultationPdfService.js \
  apps/web/src/features/reports/services/shareService.js \
  apps/web/src/services/api/adherenceService.js \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# max-lines-per-function deve decrementar ~4x; complexity ~6x
npm run validate:agent
```

---

## Wave B: API handlers

**Branch:** `refactor/lint-wave-b-api-handlers`
**Risco:** 🟡 Médio — código de produção, sem testes automatizados
**Arquivos:** 7

**Padrão obrigatório para todos os handlers:**
```js
// Handler = orquestrador: parse → validate → processar → responder
// Extrair lógica de processamento para funções nomeadas no mesmo arquivo OU em _helpers.js adjacente
// Handler resultante deve ter ≤ 80 linhas e complexity ≤ 12 (margem de segurança)
```

---

### B.1 `api/chatbot.js`

**Violação:** `handler` complexity 17/15 (ln ~28)

**Ação (EARLY_RETURN + LOOKUP_TABLE):**
```js
// O handler provavelmente faz dispatch por tipo de mensagem/evento
// LOOKUP_TABLE para tipo de evento:
const _chatbotHandlers = {
  message: _handleMessage,
  callback_query: _handleCallback,
  // etc
}
// handler vira: identificar tipo → _chatbotHandlers[tipo]?.(ctx) ?? _handleUnknown(ctx)
// Extrair funções _handle* no mesmo arquivo
```

---

### B.2 `api/dlq/_handlers/retry.js`

**Violação:** `handleRetry` 111 linhas / limit 100 (ln ~18)

**Ação (NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo (sem novo arquivo):
const _validateRetryPayload = (body) => { ... } // throws se inválido
const _buildRetryJob = (item) => { ... }
const _processRetryResult = (result) => { ... }
// handleRetry vira: validar → construir → executar → processar resultado (~40 linhas)
```

---

### B.3 `api/gemini-reviews/_handlers/create-issues.js`

**Violações:** `handleCreateIssues` 118 linhas cx23 / limits 100/15

**Ação (EXTRACT_FILE + EARLY_RETURN):**
```js
// Criar _createIssuesHelpers.js no mesmo diretório
// Extrair para lá:
//   validateCreateIssuesPayload(body) — throws AppError se inválido
//   buildIssueRecord(reviewData, context) — retorna objeto puro
//   persistIssues(records, supabase) — async, retorna results
// handleCreateIssues vira: parse → validate → build → persist → respond (~35 linhas, cx ≤ 8)
```

---

### B.4 `api/gemini-reviews/_handlers/persist.js`

**Violações:** `handlePersist` 110 linhas cx16 / limits 100/15

**Ação (NAMED_FN_INLINE + EARLY_RETURN):**
```js
// Extrair no mesmo arquivo:
const _validatePersistPayload = (body) => { ... }
const _buildPersistRecord = (data) => { ... }
// handlePersist vira orquestrador ~50 linhas
```

---

### B.5 `api/gemini-reviews/_handlers/update-status.js`

**Violações:** `handleUpdateStatus` 147 linhas cx16 / limits 100/15

**Ação (NAMED_FN_INLINE + EARLY_RETURN):**
```js
// Extrair no mesmo arquivo:
const _validateStatusTransition = (currentStatus, newStatus) => { ... }
const _buildStatusUpdate = (id, newStatus, meta) => { ... }
const _notifyStatusChange = async (record, supabase) => { ... }
// handleUpdateStatus vira orquestrador ~50 linhas
```

---

### B.6 `api/notify.js`

**Violações:** `handler` 156 linhas cx18 / limits 100/15 (ln ~209 no arquivo)

**Ação (NAMED_FN_INLINE + LOOKUP_TABLE):**
```js
// notify.js provavelmente despacha múltiplos tipos de notificação
// Extrair no mesmo arquivo:
const _notifyHandlers = {
  dose_reminder: _handleDoseReminder,
  stock_alert: _handleStockAlert,
  // etc
}
const _buildNotificationResult = (channel, result) => { ... }
// handler vira: parse → _notifyHandlers[type]?.(payload) → respond
```

---

### B.7 `api/telegram.js`

**Violações:** `handler` 117 linhas cx34 / limits 100/15 (ln ~88) — **cx34 = mais severo desta wave**

**Ação (LOOKUP_TABLE + NAMED_FN_INLINE):**
```js
// Telegram handler provavelmente faz dispatch por update type + callback data
// Extrair no mesmo arquivo:
const _updateHandlers = {
  message: _handleMessage,
  callback_query: _handleCallbackQuery,
  // etc
}
const _handleCallbackQuery = async (update, bot) => {
  // Se ainda > 15 de complexity, subdividir por prefixo de callback:
  const _callbackHandlers = { dose_: ..., stock_: ..., proto_: ... }
}
// handler vira: identifica type → delega (~20 linhas, complexity ≤ 5)
```

**Gate Wave B:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk proxy npx eslint \
  api/chatbot.js \
  api/dlq/_handlers/retry.js \
  api/gemini-reviews/_handlers/create-issues.js \
  api/gemini-reviews/_handlers/persist.js \
  api/gemini-reviews/_handlers/update-status.js \
  api/notify.js \
  api/telegram.js \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
npm run validate:agent
```

---

## Wave C: Web hooks (JS puro)

**Branch:** `refactor/lint-wave-c-web-hooks`
**Risco:** 🟡 Médio
**Arquivos:** 6

---

### C.1 `apps/web/src/features/dashboard/hooks/_useDashboardDerived.js`

**Violação:** `useDashboardDerived` 106 linhas / limit 100

**Ação (NAMED_FN_INLINE):**
```js
// Extrair derivações como funções nomeadas no mesmo arquivo (não são hooks):
const _deriveTodayAdherence = (logs, doses) => { ... }
const _deriveStockAlerts = (stock) => { ... }
// O hook retorna useMemo calls que chamam essas funções
```

---

### C.2 `apps/web/src/features/protocols/hooks/useProtocolFormState.js`

**Violação:** `useProtocolFormState` 104 linhas / limit 100

**Ação (NAMED_FN_INLINE):**
```js
// Extrair handlers de submit/reset como funções nomeadas fora do hook:
const _buildProtocolPayload = (formState) => { ... } // função pura
const _validateProtocolForm = (formState) => { ... } // função pura
// O hook retorna apenas useState + callbacks que chamam essas funções
```

---

### C.3 `apps/web/src/features/settings/hooks/useSettingsState.js`

**Violação:** `useSettingsState` 162 linhas / limit 100

**Ação (NAMED_FN_INLINE + EXTRACT_FILE):**
```js
// Criar _settingsHelpers.js adjacente:
//   buildNotificationPayload(settings) — retorna objeto puro
//   validateSettingsForm(settings) — retorna { valid, errors }
//   applySettingsDefaults(partial) — retorna settings completo
// O hook reduz para ~60 linhas gerenciando estado + chamando helpers
```

---

### C.4 `apps/web/src/views/admin/useDLQState.js`

**Violação:** `useDLQState` 143 linhas / limit 100

**Ação (NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo:
const _buildDLQFilters = (filterState) => { ... }
const _processDLQResults = (raw) => { ... }
// O hook fica com useState + useEffect + callbacks que chamam essas funções
```

---

### C.5 `apps/mobile/src/features/stock/hooks/useStock.js`

**Violações:**
- `useStock` 177 linhas / limit 100
- Arrow fn (ln ~26): 114 linhas / limit 100

**Ação (EXTRACT_FILE):**
```js
// Criar _stockDataTransformer.js no mesmo diretório:
//   transformStockData(raw) — a arrow fn atual (114ln) vira função nomeada exportada
//   filterLowStock(items) — predicado extraído
//   sortByExpiry(items) — predicado extraído
// useStock reduz para ~50 linhas: fetch → transform → return state
```

---

### C.6 `apps/mobile/src/features/treatments/hooks/useTreatments.js`

**Violação:** `useTreatments` 141 linhas / limit 100

**Ação (EXTRACT_FILE):**
```js
// Criar _treatmentsTransformer.js adjacente:
//   transformTreatmentsData(raw) — processamento de dados brutos
//   groupTreatmentsByStatus(treatments) — agrupamento
// useTreatments reduz para ~50 linhas
```

**Gate Wave C:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk proxy npx eslint \
  apps/web/src/features/dashboard/hooks/_useDashboardDerived.js \
  apps/web/src/features/protocols/hooks/useProtocolFormState.js \
  apps/web/src/features/settings/hooks/useSettingsState.js \
  apps/web/src/views/admin/useDLQState.js \
  apps/mobile/src/features/stock/hooks/useStock.js \
  apps/mobile/src/features/treatments/hooks/useTreatments.js \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# Bônus: exhaustive-deps deve cair de (10x) pois _useDashboardDerived será reescrito
npm run validate:agent
```

---

## Wave D: Web JSX — complexity-only (sem extração de componentes)

**Branch:** `refactor/lint-wave-d-jsx-complexity`
**Risco:** 🟡 Médio
**Arquivos:** 9 (apenas complexity, tamanho OK)
**Técnica exclusiva:** EARLY_RETURN + NAMED_FN_INLINE + LOOKUP_TABLE dentro do arquivo

---

### D.1 `apps/web/src/features/adherence/components/AdherenceWidget.jsx`

**Violação:** `AdherenceWidget` complexity 32/20

**Ação:**
```js
// Extrair funções de cálculo no mesmo arquivo (antes do componente):
const _computeAdherenceColor = (rate) =>
  rate >= 0.8 ? 'green' : rate >= 0.5 ? 'yellow' : 'red'
const _computeAdherenceLabel = (rate) => { ... }
const _buildAdherenceSegments = (logs, doses) => { ... }
// Componente usa os resultados pré-computados, sem lógica inline
```

---

### D.2 `apps/web/src/features/dashboard/components/RingGauge.jsx`

**Violação:** `RingGauge` complexity 30/20

**Ação:**
```js
// Extrair cálculos SVG como funções antes do componente:
const _computeArcPath = (value, max, radius, strokeWidth) => { ... }
const _computeRotation = (value, max) => { ... }
const _getGaugeColor = (value, thresholds) => { ... }
// RingGauge usa hooks mínimos + chama helpers pré-computados
```

---

### D.3 `apps/web/src/features/notifications/components/NotificationCard.jsx`

**Violação:** `NotificationCard` complexity 23/20

**Ação (LOOKUP_TABLE):**
```js
// Extrair antes do componente:
const _notificationIcons = {
  dose_reminder: <DoseIcon />,
  stock_alert: <StockIcon />,
  protocol_update: <ProtocolIcon />,
}
const _notificationColors = {
  dose_reminder: 'blue',
  stock_alert: 'orange',
  // etc
}
// Substituir switch/if-else por lookup no render
```

---

### D.4 `apps/web/src/features/protocols/components/ProtocolCard.jsx`

**Violações:** 159 linhas / limit 150, complexity 35/20

**Ação (LOOKUP_TABLE + NAMED_FN_INLINE + EXTRACT_COMPONENT):**
```jsx
// Complexity primeiro via lookup:
const _protocolStatusConfig = {
  active:   { label: 'Ativo',    color: 'green',  icon: CheckIcon },
  paused:   { label: 'Pausado',  color: 'yellow', icon: PauseIcon },
  finished: { label: 'Concluído', color: 'gray',  icon: DoneIcon },
}
// Extrair badge de status como componente interno:
// ProtocolStatusBadge({ status }) — ~15 linhas
// ProtocolCard reduz para < 150 linhas e complexity < 20
```

---

### D.5 `apps/web/src/features/protocols/components/ProtocolForm.jsx`

**Violação:** `ProtocolForm` complexity 21/20

**Ação (EARLY_RETURN):**
```jsx
// Apenas 1 acima do limite — bastam guard clauses:
// ANTES: if (condition) { if (other) { ... } }
// DEPOIS: if (!condition) return null
//         if (!other) return <FallbackSection />
// Verificar handlers inline com ternários aninhados → extrair para função nomeada
```

---

### D.6 `apps/web/src/features/protocols/hooks/_treatmentListUtils.js`

**Violação:** `transformProtocolToItem` complexity 31/15

**Ação (LOOKUP_TABLE + NAMED_FN_INLINE):**
```js
// transformProtocolToItem provavelmente mapeia campos por tipo de protocolo
// Extrair no mesmo arquivo:
const _protocolTypeTransformers = {
  simple: _transformSimpleProtocol,
  titration: _transformTitrationProtocol,
  cyclical: _transformCyclicalProtocol,
}
const _transformSimpleProtocol = (protocol) => { ... }
// etc
// transformProtocolToItem vira: validar → _protocolTypeTransformers[type](protocol)
```

---

### D.7 `apps/web/src/features/protocols/hooks/protocolFormUtils.js`

**Violação:** `useWizardMedicine` complexity 18/15

**Ação (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// Extrair predicados/derivações no mesmo arquivo:
const _computeMedicineDefaults = (medicine) => { ... }
const _validateMedicineForProtocol = (medicine) => { ... }
// useWizardMedicine vira hook com useMemo que chama helpers
```

---

### D.8 `apps/web/src/features/protocols/hooks/_useWizardSections.js`

**Violação:** Verificar com `rtk proxy npm run lint 2>&1 | grep "_useWizardSections"`

**Ação:** Aplicar EARLY_RETURN + NAMED_FN_INLINE conforme a violação encontrada.

---

### D.9 `apps/web/src/features/stock/components/redesign/StockCardRedesign.jsx`

**Violação:** `StockCardRedesign` complexity 23/20

**Ação (LOOKUP_TABLE + NAMED_FN_INLINE):**
```js
// Extrair antes do componente:
const _stockLevelConfig = {
  critical: { color: 'red',    label: 'Crítico' },
  low:      { color: 'orange', label: 'Baixo'   },
  normal:   { color: 'green',  label: 'Normal'  },
  high:     { color: 'blue',   label: 'Alto'    },
}
const _getStockLevel = (daysRemaining) =>
  daysRemaining < 7 ? 'critical' : daysRemaining < 14 ? 'low' : daysRemaining < 30 ? 'normal' : 'high'
```

**Gate Wave D:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk proxy npx eslint \
  apps/web/src/features/adherence/components/AdherenceWidget.jsx \
  apps/web/src/features/dashboard/components/RingGauge.jsx \
  apps/web/src/features/notifications/components/NotificationCard.jsx \
  apps/web/src/features/protocols/components/ProtocolCard.jsx \
  apps/web/src/features/protocols/components/ProtocolForm.jsx \
  apps/web/src/features/protocols/hooks/_treatmentListUtils.js \
  apps/web/src/features/protocols/hooks/protocolFormUtils.js \
  apps/web/src/features/protocols/hooks/_useWizardSections.js \
  apps/web/src/features/stock/components/redesign/StockCardRedesign.jsx \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
npm run validate:agent
```

---

## Wave E: Web JSX — extração de sub-componentes (line count)

**Branch:** `refactor/lint-wave-e-jsx-lines`
**Risco:** 🔴 Alto — componentes com estado e interação
**Arquivos:** 16

**Padrão obrigatório para extração de componente:**
```
1. Novo arquivo: [Pai][Secao].jsx no MESMO diretório do pai
2. Export: `export default` (named só se usado em >1 lugar)
3. Props via desestruturação explícita: ({ prop1, prop2, onAction })
4. Sem lógica de negócio — apenas apresentação / orquestração visual
5. Componente pai vira: hooks + <SubComponente prop1={val} />
```

---

### E.1 `apps/web/src/App.jsx`

**Violação:** `AppInner` 291 linhas / limit 150

**Ação:**
```jsx
// AppInner provavelmente contém routing + providers + modais globais
// Extrair:
//   AppRoutes.jsx — <Routes> com todas as rotas (~80 linhas)
//   AppModals.jsx — modais globais (UpdatePrompt, etc.) (~40 linhas)
// AppInner vira: <AppRoutes /> + <AppModals /> + providers (~30 linhas)
```

---

### E.2 `apps/web/src/features/adherence/components/AdherenceHeatmap.jsx`

**Violação:** `AdherenceHeatmap` 158 linhas / limit 150

**Ação:**
```jsx
// Extrair funções de renderização como componentes:
//   AdherenceHeatmapCell({ date, level, onClick }) — célula individual
//   AdherenceHeatmapLegend({ levels }) — legenda
// AdherenceHeatmap vira: calcular grid → renderizar células
```

---

### E.3 `apps/web/src/features/calendar/components/DoseCalendar.jsx`

**Violação:** `DoseCalendar` 200 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   DoseCalendarHeader({ month, onPrev, onNext }) — navegação (~20 linhas)
//   DoseCalendarDay({ date, doses, logs, onClick }) — célula de dia (~30 linhas)
// DoseCalendar vira: fetch data → grid → <DoseCalendarDay /> por dia
```

---

### E.4 `apps/web/src/features/chatbot/components/ChatWindow.jsx`

**Violação:** `ChatWindow` 172 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   ChatWindowHeader({ botName, onClose }) — (~15 linhas)
//   ChatMessageList({ messages }) — lista de mensagens (~20 linhas)
//   ChatInputBar({ onSend, disabled }) — input + botão (~20 linhas)
// ChatWindow vira: estado + layout com subcomponentes
```

---

### E.5 `apps/web/src/features/consultation/components/ConsultationView.jsx`

**Violação:** `ConsultationView` 253 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   ConsultationHeader({ patient, date }) — (~25 linhas)
//   ConsultationMedicinesList({ medicines }) — (~30 linhas)
//   ConsultationAdherenceSection({ data }) — (~30 linhas)
// ConsultationView vira: fetch → <Header /> + <MedicinesList /> + <AdherenceSection />
```

---

### E.6 `apps/web/src/features/consultation/components/redesign/ConsultationViewRedesign.jsx`

**Violação:** `ConsultationViewRedesign` 326 linhas / limit 150

**Ação:**
```jsx
// Extrair (mesmo diretório redesign/):
//   ConsultationRedesignHeader({ ... }) — cabeçalho redesenhado
//   ConsultationRedesignTimeline({ events }) — timeline de eventos
//   ConsultationRedesignStats({ adherence, doses }) — estatísticas
// ConsultationViewRedesign vira orquestrador < 100 linhas
```

---

### E.7 `apps/web/src/features/dashboard/components/DailyDoseModal.jsx`

**Violações:** `DailyDoseModal` 158 linhas / limit 150, complexity 30/20

**Ação (LOOKUP_TABLE + EXTRACT_COMPONENT):**
```jsx
// Complexity via lookup:
const _doseStatusActions = {
  pending:  { label: 'Registrar', action: 'register' },
  taken:    { label: 'Desmarcar', action: 'unregister' },
  skipped:  { label: 'Retomar',   action: 'restore' },
}
// Extrair:
//   DailyDoseModalHeader({ dose, medicine }) — (~20 linhas)
//   DailyDoseModalActions({ status, onAction }) — botões de ação (~20 linhas)
```

---

### E.8 `apps/web/src/features/emergency/components/EmergencyCardForm.jsx`

**Violação:** `EmergencyCardForm` 293 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   EmergencyCardPersonalSection({ formState, onChange }) — dados pessoais
//   EmergencyCardMedicinesSection({ medicines, onAdd, onRemove }) — lista medicamentos
//   EmergencyCardContactSection({ contacts, onChange }) — contatos emergência
// EmergencyCardForm vira: useEmergencyCardFormState (existente?) + seções (~50 linhas)
```

---

### E.9 `apps/web/src/features/emergency/components/EmergencyCardView.jsx`

**Violação:** `EmergencyCardView` 188 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   EmergencyCardViewMedicines({ medicines }) — seção de medicamentos
//   EmergencyCardViewContacts({ contacts }) — seção de contatos
// EmergencyCardView vira layout + subcomponentes
```

---

### E.10 `apps/web/src/features/emergency/components/EmergencyQRCode.jsx`

**Violação:** `EmergencyQRCode` 155 linhas / limit 150

**Ação:**
```jsx
// Apenas 5 linhas acima — extrair seção de instruções ou botões de ação:
//   EmergencyQRCodeActions({ onShare, onDownload }) — botões (~20 linhas)
// EmergencyQRCode reduz para < 150 linhas
```

---

### E.11 `apps/web/src/features/export/components/ExportDialog.jsx`

**Violação:** `ExportDialog` 200 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   ExportDialogOptions({ options, selected, onChange }) — seleção de opções (~30 linhas)
//   ExportDialogPreview({ config }) — preview do export (~25 linhas)
// ExportDialog vira: estado + <Options /> + <Preview /> + botões
```

---

### E.12 `apps/web/src/features/protocols/components/steps/TreatmentWizardStep1.jsx`

**Violação:** `TreatmentWizardStep1` 180 linhas / limit 150

**Ação:**
```jsx
// Extrair no mesmo diretório (steps/):
//   TreatmentWizardStep1MedicineSearch({ onSelect }) — busca de medicamento (~40 linhas)
//   TreatmentWizardStep1SchedulePreview({ medicine }) — preview de horário (~25 linhas)
// TreatmentWizardStep1 vira: estado local + subcomponentes
```

---

### E.13 `apps/web/src/features/protocols/components/steps/TreatmentWizardStep2.jsx`

**Violação:** `TreatmentWizardStep2` 162 linhas / limit 150

**Ação:**
```jsx
// Extrair no mesmo diretório:
//   TreatmentWizardStep2DosageForm({ dosage, onChange }) — form de dosagem (~30 linhas)
// TreatmentWizardStep2 reduz para < 150 linhas
```

---

### E.14 `apps/web/src/features/protocols/components/TreatmentPlanForm.jsx`

**Violação:** `TreatmentPlanForm` 156 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   TreatmentPlanFormDatesSection({ startDate, endDate, onChange }) — (~25 linhas)
// TreatmentPlanForm reduz para < 150 linhas
```

---

### E.15 `apps/web/src/features/reports/components/ReportGenerator.jsx`

**Violação:** `ReportGenerator` 314 linhas / limit 150

**Ação:**
```jsx
// Extrair (mesmo diretório):
//   ReportGeneratorOptions({ config, onChange }) — seleção de seções (~40 linhas)
//   ReportGeneratorPreview({ config }) — preview (~30 linhas)
//   ReportGeneratorActions({ onGenerate, onShare, loading }) — botões (~20 linhas)
// ReportGenerator vira: useReportState + <Options /> + <Preview /> + <Actions />
```

---

### E.16 `apps/web/src/features/stock/components/StockCard.jsx`

**Violação:** `StockCard` 158 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   StockCardActions({ onRefill, onDelete }) — botões de ação (~20 linhas)
// StockCard reduz para < 150 linhas
```

---

### E.17 `apps/web/src/shared/components/pwa/InstallPrompt.jsx`

**Violação:** `InstallPrompt` 248 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   InstallPromptBanner({ onInstall, onDismiss }) — banner de instalação (~30 linhas)
//   InstallPromptModal({ onInstall, onClose }) — modal de instrução (~40 linhas)
// InstallPrompt vira: lógica de detecção de plataforma + condicional de render
```

---

### E.18 `apps/web/src/shared/components/ui/Calendar.jsx`

**Violações:** `Calendar` 287 linhas / limit 150, complexity 35/20

**Ação:**
```jsx
// Calendar é o mais complexo desta wave. Extrair:
//   CalendarHeader({ month, year, onPrev, onNext }) — (~20 linhas)
//   CalendarWeekDays() — cabeçalho dias da semana (~10 linhas)
//   CalendarDay({ date, events, isSelected, onClick }) — célula (~25 linhas)
// Complexity via NAMED_FN_INLINE antes do componente:
const _buildWeeksGrid = (month, year) => { /* gera array de semanas */ }
const _isDateInRange = (date, start, end) => { ... }
// Calendar vira: _buildWeeksGrid() → grid de <CalendarDay />
```

---

### E.19 `apps/web/src/views/Landing.jsx`

**Violação:** `LandingVariantNew` 393 linhas / limit 150

**Ação:**
```jsx
// Extrair (mesmo diretório views/ ou subdir landing/):
//   LandingHero({ onCTA }) — seção hero (~50 linhas)
//   LandingFeatures() — grid de features (~50 linhas)
//   LandingTestimonials() — depoimentos (~40 linhas)
//   LandingCTA({ onSignup }) — call to action final (~30 linhas)
// LandingVariantNew vira: layout com <Hero /> + <Features /> + <Testimonials /> + <CTA />
```

---

### E.20 `apps/web/src/views/Medicines.jsx`

**Violação:** `Medicines` 189 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   MedicinesHeader({ onAdd, searchQuery, onSearch }) — (~25 linhas)
//   MedicinesEmptyState({ onAdd }) — estado vazio (~15 linhas)
// Medicines vira: data fetch + <MedicinesHeader /> + lista de cards
```

---

### E.21 `apps/web/src/views/Protocols.jsx`

**Violação:** `Protocols` 310 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   ProtocolsHeader({ onAdd, filter, onFilter }) — (~25 linhas)
//   ProtocolsEmptyState({ onAdd }) — estado vazio (~15 linhas)
//   ProtocolsFilterBar({ filter, onFilter }) — filtros (~25 linhas)
// Protocols vira: data + <Header /> + <FilterBar /> + lista de ProtocolCard
```

---

### E.22 `apps/web/src/views/Settings.jsx`

**Violação:** `Settings` 240 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   SettingsProfileSection({ user, onSave }) — (~30 linhas)
//   SettingsThemeSection({ theme, onChange }) — (~20 linhas)
//   SettingsAccountSection({ onLogout, onDelete }) — (~25 linhas)
// Settings vira: useSettingsState + <ProfileSection /> + <ThemeSection /> + <AccountSection />
```

---

### E.23 `apps/web/src/views/redesign/Dashboard.jsx`

**Violação:** `Dashboard` 170 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   DashboardQuickActions({ onLogDose, onViewCalendar }) — (~25 linhas)
// Dashboard reduz para < 150 linhas
```

---

### E.24 `apps/web/src/views/redesign/HealthHistory.jsx`

**Violação:** `HealthHistory` 267 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   HealthHistoryFilters({ period, onPeriodChange }) — (~20 linhas)
//   HealthHistoryChart({ data, period }) — wrapper do gráfico (~30 linhas)
//   HealthHistoryTable({ logs }) — tabela de histórico (~40 linhas)
// HealthHistory vira: fetch data + <Filters /> + <Chart /> + <Table />
```

**Gate Wave E:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk proxy npx eslint \
  apps/web/src/App.jsx \
  apps/web/src/features/adherence/components/AdherenceHeatmap.jsx \
  apps/web/src/features/calendar/components/DoseCalendar.jsx \
  apps/web/src/features/chatbot/components/ChatWindow.jsx \
  apps/web/src/features/consultation/components/ConsultationView.jsx \
  apps/web/src/features/consultation/components/redesign/ConsultationViewRedesign.jsx \
  apps/web/src/features/dashboard/components/DailyDoseModal.jsx \
  apps/web/src/features/emergency/components/EmergencyCardForm.jsx \
  apps/web/src/features/emergency/components/EmergencyCardView.jsx \
  apps/web/src/features/emergency/components/EmergencyQRCode.jsx \
  apps/web/src/features/export/components/ExportDialog.jsx \
  apps/web/src/features/protocols/components/TreatmentPlanForm.jsx \
  apps/web/src/features/protocols/components/steps/TreatmentWizardStep1.jsx \
  apps/web/src/features/protocols/components/steps/TreatmentWizardStep2.jsx \
  apps/web/src/features/reports/components/ReportGenerator.jsx \
  apps/web/src/features/stock/components/StockCard.jsx \
  apps/web/src/shared/components/pwa/InstallPrompt.jsx \
  apps/web/src/shared/components/ui/Calendar.jsx \
  apps/web/src/views/Landing.jsx \
  apps/web/src/views/Medicines.jsx \
  apps/web/src/views/Protocols.jsx \
  apps/web/src/views/Settings.jsx \
  apps/web/src/views/redesign/Dashboard.jsx \
  apps/web/src/views/redesign/HealthHistory.jsx \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# Deve estar próximo de (0x)/(0x) exceto o que restar de mobile (Wave F)
npm run validate:agent
```

---

## Wave F: Mobile app (apps/mobile/)

**Branch:** `refactor/lint-wave-f-mobile`
**Risco:** 🔴 Alto — app mobile diferente da web, verificar se há testes antes
**Arquivos:** 8

**ANTES de iniciar:** verificar se há `*.test.*` para cada arquivo com `find apps/mobile -name "*.test.*"`.

---

### F.1 `apps/mobile/src/features/dashboard/screens/TodayScreen.jsx`

**Violações:** `TodayScreen` 219 linhas / limit 150, complexity 48/20 — **mais severo do mobile**

**Ação:**
```jsx
// Extrair (diretório screens/ ou components/ adjacente):
//   TodayScreenHeader({ date, adherenceRate }) — cabeçalho (~20 linhas)
//   TodayScreenDoseList({ doses, onRegister }) — lista de doses (~30 linhas)
//   TodayScreenEmptyState({ message }) — estado vazio (~15 linhas)
// Complexity via NAMED_FN_INLINE antes do componente:
const _groupDosesByTime = (doses) => { ... }
const _computeTodayStats = (doses, logs) => { ... }
// TodayScreen vira: fetch + computed + <Header /> + <DoseList />
```

---

### F.2 `apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx`

**Violação:** `BulkDoseRegisterModal` 158 linhas / limit 150

**Ação:**
```jsx
// Extrair:
//   BulkDoseRegisterList({ doses, selected, onToggle }) — lista de doses (~30 linhas)
// BulkDoseRegisterModal reduz para < 150 linhas
```

---

### F.3 `apps/mobile/src/features/dashboard/components/DoseListItem.jsx`

**Violação:** `DoseListItem` complexity 29/20

**Ação (LOOKUP_TABLE + NAMED_FN_INLINE):**
```jsx
const _doseStatusConfig = {
  taken:   { icon: CheckIcon,    color: 'green',  label: 'Tomado'  },
  missed:  { icon: CloseIcon,    color: 'red',    label: 'Perdido' },
  pending: { icon: ClockIcon,    color: 'gray',   label: 'Pendente'},
  skipped: { icon: SkipIcon,     color: 'orange', label: 'Pulado'  },
}
const _shouldShowAlert = (dose, now) => { ... } // extrai condição composta
// DoseListItem usa lookup em vez de switch/if-else
```

---

### F.4 `apps/mobile/src/features/dose/services/doseService.js`

**Violações:**
- `registerDose` complexity 24/15
- `registerDoseMany` complexity 29/15

**Ação (EARLY_RETURN + NAMED_FN_INLINE):**
```js
// Extrair no mesmo arquivo:
const _validateDoseRegistration = (dose, userId) => { /* throws se inválido */ }
const _buildDoseRecord = (dose, userId, timestamp) => { /* retorna objeto puro */ }
const _decrementStockIfNeeded = async (dose, supabase) => { /* side effect isolado */ }
// registerDose vira: validate → build → insert → decrement → return
// registerDoseMany: validate all → build all → insert batch → decrement all
```

---

### F.5 `apps/mobile/src/features/notifications/components/NotificationItem.jsx`

**Violação:** `NotificationItem` complexity 29/20

**Ação (LOOKUP_TABLE):**
```jsx
const _notificationConfig = {
  dose_reminder:   { icon: MedicineIcon, color: 'blue',   actionLabel: 'Registrar' },
  stock_alert:     { icon: AlertIcon,    color: 'orange',  actionLabel: 'Ver estoque' },
  protocol_update: { icon: UpdateIcon,   color: 'purple',  actionLabel: 'Ver protocolo' },
}
// NotificationItem usa _notificationConfig[type] em vez de switch
```

---

### F.6 `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx`

**Violações:** `NotificationInboxScreen` 241 linhas / limit 150, complexity 22/20

**Ação:**
```jsx
// Extrair (mesmo diretório screens/):
//   NotificationInboxFilters({ filter, onFilter }) — (~20 linhas)
//   NotificationInboxEmpty({ filter }) — estado vazio contextual (~15 linhas)
// Complexity via EARLY_RETURN nos handlers de filtro
// NotificationInboxScreen vira: fetch + <Filters /> + lista de NotificationItem
```

---

### F.7 `apps/mobile/src/features/profile/screens/NotificationPreferencesScreen.jsx`

**Violações:** `NotificationPreferencesScreen` 303 linhas / limit 150, arrow fn complexity 23/20

**Ação:**
```jsx
// Extrair (mesmo diretório):
//   NotificationPreferencesGeneralSection({ prefs, onChange }) — (~40 linhas)
//   NotificationPreferencesDoseSection({ dosePrefs, onChange }) — (~40 linhas)
//   NotificationPreferencesTimingSection({ timing, onChange }) — (~30 linhas)
// Arrow fn inline → extrair como useCallback nomeado ou função externa
```

---

### F.8 `apps/web/src/features/profile/hooks/useProfileState.js`

**Violação:** Verificar com `rtk lint 2>&1 | grep "useProfileState"` antes de iniciar.

**Ação:** Aplicar NAMED_FN_INLINE + EARLY_RETURN conforme a violação encontrada.

**Gate Wave F:**
```bash
cd /Users/coelhotv/git-icloud/dosiq
rtk proxy npx eslint \
  apps/mobile/src/features/dashboard/screens/TodayScreen.jsx \
  apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx \
  apps/mobile/src/features/dashboard/components/DoseListItem.jsx \
  apps/mobile/src/features/dose/services/doseService.js \
  apps/mobile/src/features/notifications/components/NotificationItem.jsx \
  apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx \
  apps/mobile/src/features/profile/screens/NotificationPreferencesScreen.jsx \
  apps/web/src/features/profile/hooks/useProfileState.js \
  2>&1 | grep -c "max-lines-per-function\|complexity"
# → 0 (conta violações reais — rtk proxy bypassa o hook)
rtk lint 2>&1 | grep -E "max-lines-per-function|complexity"
# Deve ser (0x)/(0x) — meta final atingida
npm run validate:agent
```

---

## Gate Report Final (após todas as waves)

```bash
rtk lint 2>&1 | grep -c "max-lines-per-function\|complexity"
# Deve ser 0

npm run validate:agent
# 0 falhas
```

---

## Fluxo de entrega por wave

```
Para cada wave A→F:
  1. Agente cria branch (ex: refactor/lint-wave-a-core-services)
  2. Agente implementa conforme instruções desta wave
  3. Agente roda gate da wave (lint count = 0 para arquivos modificados)
  4. Agente emite Gate Report com: arquivos modificados, violations antes/depois, validate:agent result
  5. Agente PARA e aguarda aprovação textual do humano
  6. Humano aprova → agente abre PR
  7. Humano revisa PR → aprova textualmente → agente faz merge
  8. Próxima wave
```

**Aprovação válida:** mensagem inequívoca tipo "aprovado", "pode mergar", "pode abrir PR"
**Não válido:** silêncio, emoji isolado

---

## Resumo de violações (baseline atual)

| Category | Violations |
|----------|-----------|
| complexity | 32 |
| max-lines-per-function | 43 |
| **Total** | **75** |

**Meta:** 0/0 após Wave F.
