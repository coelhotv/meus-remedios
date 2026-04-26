# Exec Spec — N1.5: Mobile BulkDoseRegisterModal.jsx

> **Status:** PRONTO PARA EXECUÇÃO  
> **Parent Spec:** `EXEC_SPEC_WAVE_N1_GROUPING.md` §Sprint 1.5  
> **Branch alvo:** `feature/notifications-n1.5`  
> **Estimativa:** ~4h · 4 commits atômicos  
> **Framework de testes:** Jest (jest-expo) — rodar em `apps/mobile/`

---

## 1. Objetivo

Criar o componente `BulkDoseRegisterModal.jsx` que permite ao usuário registrar múltiplas doses de um bloco semântico (plan ou misc) de uma só vez. É o destino final do deeplink `dosiq://today?at=HHMM&plan=...` implementado em N1.4.

---

## 2. Pré-requisitos Verificados

| Item | Estado |
|------|--------|
| `doseService.registerDose` (single) | ✅ `apps/mobile/src/features/dose/services/doseService.js:24` |
| `consume_stock_fifo` RPC (FIFO stock) | ✅ chamado em `doseService.js:65` |
| `treatmentsService.getActiveTreatments` | ✅ `apps/mobile/src/features/treatments/services/treatmentsService.js:14` |
| `DoseRegisterModal` (padrão visual) | ✅ `apps/mobile/src/features/dose/components/DoseRegisterModal.jsx` |
| Design tokens | ✅ `apps/mobile/src/shared/styles/tokens.js` |
| `TodayScreen` como tab screen (recebe `route.params`) | ✅ `apps/mobile/src/navigation/RootTabs.jsx` |
| `navigationRef.navigate(ROUTES.TODAY, params)` (N1.4) | ✅ `usePushNotifications.js` |

---

## 3. Arquitetura

### 3.1 Fluxo de dados

```
Push tap (N1.4) → navigationRef.navigate(ROUTES.TODAY, { screen: 'bulk-plan', params: { planId, at } })
  → TodayScreen recebe route.params
  → Abre BulkDoseRegisterModal(mode='plan', planId, scheduledTime)
  → usePlanProtocols(planId) carrega protocolos filtrados
  → Usuário desmarca/confirma → registerDoseMany(selectedLogs)
  → consume_stock_fifo por log → onSuccess → refresh
```

### 3.2 Decisão: `registerDoseMany` vs loop de `registerDose`

**Escolha:** implementar `registerDoseMany` no `doseService.js` com:
- Batch insert via `.insert([...])` — 1 roundtrip para N logs
- Loop de `consume_stock_fifo` por log (RPC não suporta batch) — N chamadas sequenciais
- Rollback individual por log se stock falhar (manter comportamento do `registerDose` single)

**Razão:** mínimo de roundtrips para insert; stock FIFO é RPC unitária por design (`p_medicine_log_id` é singular).

### 3.3 Hook `usePlanProtocols`

Reutiliza `treatmentsService.getActiveTreatments` + filtra por `planId` ou `protocolIds[]`:

```js
// usePlanProtocols({ mode, planId, protocolIds, userId })
// Retorna { protocols, loading, error }
```

---

## 4. Arquivos — Deliverables Completos

| # | Ação | Arquivo |
|---|------|---------|
| 1 | **CRIAR** | `apps/mobile/src/features/dose/hooks/usePlanProtocols.js` |
| 2 | **MODIFICAR** | `apps/mobile/src/features/dose/services/doseService.js` — adicionar `registerDoseMany` |
| 3 | **CRIAR** | `apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx` |
| 4 | **MODIFICAR** | `apps/mobile/src/features/dashboard/screens/TodayScreen.jsx` — integrar modal + deeplink params |
| 5 | **CRIAR** | `apps/mobile/src/features/dose/components/__tests__/BulkDoseRegisterModal.test.jsx` |

---

## 5. Spec por Arquivo

### 5.1 `usePlanProtocols.js` (novo hook)

```js
// Props: { mode: 'plan'|'misc', planId?: string, protocolIds?: string[], userId: string }
// Retorna: { protocols: Protocol[], loading: boolean, error: string|null }

// Internamente:
//   1. Chama treatmentsService.getActiveTreatments(userId)
//   2. Se mode='plan': filtra por protocol.treatment_plan?.id === planId
//   3. Se mode='misc': filtra por protocol.id in protocolIds[]
//   4. Se sem filtro: retorna []
```

- Usar `useState` + `useEffect` — sem `useCallback` (simples)
- Seguir ordem obrigatória: states → memos → effects → handlers (CLAUDE.md)

### 5.2 `doseService.js` — adicionar `registerDoseMany`

```js
/**
 * Registra múltiplas doses em batch.
 * Insert batch via Supabase → consume_stock_fifo por log (sequencial).
 * Rollback individual se stock falhar.
 *
 * @param {Array<{protocol_id, medicine_id, taken_at, quantity_taken}>} logsData
 * @returns {Promise<{ success: boolean, results: Array<{id, success, error?}>, error?: string }>}
 */
export async function registerDoseMany(logsData) {
  // 1. Validar cada log com logSchema.safeParse
  // 2. getUser()
  // 3. supabase.from('medicine_logs').insert(validatedLogs.map(l => ({...l, user_id}))).select()
  // 4. Para cada logEntry: consume_stock_fifo
  //    - Se stock falhar: rollback desse log individual (delete by id)
  //    - Continuar para os restantes (não abortar o batch inteiro)
  // 5. logEvent(EVENTS.DOSE_LOGGED_BULK, { count: results.filter(r=>r.success).length })
  // 6. Retornar { success: successCount > 0, results: [...], error? }
}
```

**Importante:** se 0 logs forem passados → retornar `{ success: false, error: 'Nenhuma dose selecionada.' }` imediatamente.

### 5.3 `BulkDoseRegisterModal.jsx` (novo componente)

**Props:**
```js
{
  visible: boolean,
  onClose: Function,
  onSuccess: Function,          // chamado após sucesso com { successCount }
  mode: 'plan' | 'misc',
  planId?: string,              // para mode='plan'
  protocolIds?: string[],       // para mode='misc'
  scheduledTime: string,        // 'HH:MM'
  treatmentPlanName?: string,   // para header mode='plan'
  userId: string,
}
```

**UX Flow:**
1. Header: `[emoji] [treatmentPlanName]` (plan) ou `"Doses agora — HH:MM"` (misc)
2. Subtítulo: `scheduledTime` badge (igual ao DoseRegisterModal)
3. Lista de checkboxes — cada item: `[Checkbox] [Nome do medicamento] — X cp`
4. Todos pré-marcados por default
5. CTA: `"Registrar X doses"` — X atualiza ao desmarcar
6. Loading state: ActivityIndicator no CTA
7. Erro: mensagem de erro inline abaixo dos checkboxes
8. Sucesso: `onSuccess({ successCount })` → pai fecha modal e dá refresh

**Estrutura de estado:**
```js
const [selected, setSelected] = useState({})  // { protocolId: boolean }
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)
const { protocols, loading: protocolsLoading, error: protocolsError } = usePlanProtocols(...)
```

**Checkbox toggle:**
```js
function toggleProtocol(id) {
  setSelected(prev => ({ ...prev, [id]: !prev[id] }))
}
```

**Submit:**
```js
async function handleConfirm() {
  const selectedIds = Object.keys(selected).filter(id => selected[id])
  const logsData = selectedIds.map(id => {
    const p = protocols.find(p => p.id === id)
    return {
      protocol_id: p.id,
      medicine_id: p.medicine.id,
      taken_at: new Date().toISOString(),
      quantity_taken: p.dosage_per_intake ?? 1,
    }
  })
  const result = await registerDoseMany(logsData)
  if (result.success) onSuccess({ successCount: result.results.filter(r => r.success).length })
  else setError(result.error)
}
```

**Estilos:** seguir padrão `DoseRegisterModal.jsx` — sheet bottom, handle, backdrop, tokens.

### 5.4 `TodayScreen.jsx` — integrar deeplink

Adicionar ao componente:
```js
// Deeplink params de push notification (N1.4)
const [bulkModal, setBulkModal] = useState(null) // null | { mode, planId?, protocolIds?, scheduledTime, treatmentPlanName? }
```

E um `useEffect` para route.params:
```js
useEffect(() => {
  const params = route?.params
  if (!params) return
  if (params.screen === 'bulk-plan' && params.planId) {
    setBulkModal({ mode: 'plan', planId: params.planId, scheduledTime: params.at ?? '', treatmentPlanName: params.treatmentPlanName })
  } else if (params.screen === 'bulk-misc') {
    setBulkModal({ mode: 'misc', protocolIds: params.protocolIds ?? [], scheduledTime: params.at ?? '' })
  }
  // Limpar params após consumir (evitar re-abertura em back-navigate)
  navigation.setParams(undefined)
}, [route?.params])
```

E renderizar `BulkDoseRegisterModal` junto com `DoseRegisterModal`.

**Atenção:** `TodayScreen` deve receber `{ route, navigation }` como props (tab screens recebem automaticamente).

### 5.5 `BulkDoseRegisterModal.test.jsx`

4 cenários obrigatórios:
1. **Renderiza com protocolos** — modal aberto com `mode='plan'`, mock de 4 protocolos → verifica 4 checkboxes pré-marcados
2. **Desmarcar atualiza count** — desmarcar 1 → CTA exibe "Registrar 3 doses"
3. **Submit registra selecionados** — todos marcados → `registerDoseMany` chamado com 4 logs
4. **Submit com unchecked** — 1 desmarcado → `registerDoseMany` chamado com 3 logs

Padrão de mock (AP-116 / jest-expo hoisting):
```js
jest.mock('../../../features/dose/hooks/usePlanProtocols', () => ({ ... }))
jest.mock('../../../features/dose/services/doseService', () => ({ ... }))
// Acesso via require() após os mocks
```

---

## 6. Contratos Tocados

| Contrato | Impacto |
|----------|---------|
| CON-005 `logService.createLog` | Extensão aditiva — `registerDoseMany` é nova função, não altera assinatura existente |

---

## 7. Acceptance Criteria (DoD)

- [ ] **AC-1:** Modal abre com 4 medicamentos pré-marcados → submit registra 4 logs + decrementa stock
- [ ] **AC-2:** Desmarcar 1 medicamento → submit registra 3 logs
- [ ] **AC-3:** Push tap com `mode='plan'` → TodayScreen abre `BulkDoseRegisterModal` automaticamente
- [ ] **AC-4:** Push tap com `mode='misc'` → TodayScreen abre `BulkDoseRegisterModal` no modo misc
- [ ] **AC-5:** Stock de um medicamento insuficiente → rollback individual, restantes registram com sucesso (partial batch)
- [ ] **AC-6:** `registerDoseMany([])` → retorna `{ success: false, error: 'Nenhuma dose selecionada.' }`
- [ ] **AC-7:** Loading state visível durante submit (ActivityIndicator no CTA)
- [ ] **AC-8:** Erro de rede exibe mensagem inline clara
- [ ] **AC-9:** Todos os 4 testes Jest passam em `apps/mobile/`
- [ ] **AC-10:** `npm run lint` sem erros no `apps/mobile/`

---

## 8. Risk Flags

| Risco | Mitigação |
|-------|-----------|
| `TodayScreen` não recebe `route` props hoje (não declarado nas props) | Adicionar `{ route, navigation }` como props — React Navigation injeta automaticamente em tab screens |
| Batch insert pode ser grande (limite Supabase ~5MB) | Limite prático: ≤20 protocolos por bloco — sem paginação necessária |
| Stock parcial (um falha, outros passam) | `registerDoseMany` retorna `results[]` por log; UI exibe `"X/N doses registradas"` |
| `navigation.setParams(undefined)` pode re-renderizar | Alternativa: `useRef` como flag "params já consumidos" se houver flicker |

---

## 9. Commits Atômicos (ordem)

```
1. feat(mobile/dose): registerDoseMany em doseService + usePlanProtocols hook
2. feat(mobile/dose): BulkDoseRegisterModal — checkboxes, batch submit, estados
3. feat(mobile/today): integrar BulkDoseRegisterModal + deeplink params em TodayScreen
4. test(mobile/dose): BulkDoseRegisterModal — 4 cenários Jest
```

---

## 10. Quality Gates

```bash
# No workspace apps/mobile/:
cd apps/mobile && npx jest --testPathPattern="BulkDoseRegisterModal" --passWithNoTests
cd ../.. && npm run lint --workspace=apps/mobile
```
