# EXEC SPEC — Fase 3: CRUD Estoque (v2 — 2026-05-18)

> **Duração**: 2 sprints semanais
> **Branch base**: `feat/crud-stock`
> **Referência**: MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md §9 (Fase 3)
> **Pré-condição**: ✅ Fase 2 + 2.5 completas · ✅ RETRO_FASE2 aplicada · ✅ Mocks Fase 3 aprovados pelo PO
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate)
> **SQP vinculante**: v2.0 ([INDEX_EXEC_SPECS.md](INDEX_EXEC_SPECS.md))

---

## §0 — Cuidados Aprendidos Pré-Fase 3 (consolidado RETROs Fase 1+2)

**Patterns obrigatórios** (todo spawn da Fase 3 DEVE seguir; spec sem aplicar = retrabalho garantido).

### 0.1 Arquitetura compartilhada (web↔mobile)
- **Factory pattern em `@dosiq/core/repositories/`** (R-231 + ADR-045). **NUNCA** `packages/shared-data/src/services/` (deprecado pra repositories).
- **Helpers canônicos derivados em `@dosiq/core/utils/`** — toda derivação compartilhada (status stock, dias restantes, dias até vencimento, preço médio, consumo diário) DEVE ter helper único.
- **Re-export via barrel** `@dosiq/core/utils/index.js` — auditar consumers antes de adicionar export (AP-164 naming collision).

### 0.2 Mobile patterns (consolidados Fase 2)
- **Bottom sheet** = `<Modal statusBarTranslucent>` + spacer `<View height={StatusBar.currentHeight}>` (Android) + `<SafeAreaView edges={['bottom']}>` (R-233).
- **Input numérico decimal PT-BR** preserva estados intermediários (`"0,"`, `"."`, vazio) como string; coerce só no submit (AP-167).
- **`useFormState.validate`** aceita `overrides` opcional pra fix de race com `handleChange` async (AP-166).
- **Unidade(s) sempre** em formatadores (ADR-046) — apresentação real (mg/ml/cp) em DataPills separadas.
- **Optimistic UI em toggle** = state local `override` + `setOverride(next)` antes da mutation + rollback no catch.
- **`useFocusEffect(refresh)`** em listas/detalhes para refresh pós-edit/create/delete.
- **Hook canônico antes de inline** (R-235) — grep por `use<Entity>*` existente antes de implementar inline.

### 0.3 Cache invalidation matrix (R-236) — CRÍTICO Fase 3
Fase 3 tem **3 snapshots interdependentes**:
- `@dosiq/stock-snapshot` (saldo + status)
- `@dosiq/purchases-snapshot` (histórico)
- `@dosiq/treatments-snapshot` (daysRemaining depende de stock + consumo de tratamentos)

Toda mutation deve documentar inline TODOS os snapshots invalidados. Exemplo:
```js
/**
 * createPurchase — registra compra + atualiza saldo via RPC.
 * Caches invalidados:
 *   - @dosiq/stock-snapshot (saldo, status)
 *   - @dosiq/purchases-snapshot (histórico do medicamento)
 *   - @dosiq/treatments-snapshot (daysRemaining recalculado)
 */
```
Esquecer um cache = bug latente (D11 Fase 2.5; G7 retro Fase 3).

### 0.4 Processo (SQP §§10-13)
- **Smoke PO antes de `gh pr create`** (R-234) — push pra remote OK; PR aguarda smoke local. Vinculante pra toda sprint UI.
- **Wave orchestration com dependency graph** (R-237) — mapear tasks → deps → waves antes de spawn. Maximiza paralelismo.
- **Brief cavecrew R-230 (6 itens)** em todo spawn (refs read-only, paths absolutos, contratos, R-NNN aplicáveis, validação, NÃO COMMITAR).
- **Branch sync** (`git fetch origin` + confirmar base = origin) antes de criar branch nova OU spawn que toca arquivos compartilhados (AP-169).
- **Audit barrel exports** antes de adicionar item novo em `packages/core/src/<dominio>/index.js` (AP-164).
- **Vitest config propagation**: toda mudança em alias propaga pra TODOS configs vitest (AP-170).
- **Spec viva** — atualizar este arquivo durante execução; novas regras vão pra §0 (este bloco).

### 0.5 Decisões PO absorvidas dos mocks Fase 3
| # | Decisão | Impacto na spec |
|---|---------|-----------------|
| PO-1 | **NÃO existe "excluir compra"** | Remove `useStockDelete` + `deletePurchase` + verificação consumo parcial. Correção via Ajuste apenas |
| PO-2 | **FAB ubíquo** "Registrar compra" no Hub E Detail | StockScreen + StockDetailScreen ambos têm FAB |
| PO-3 | **Form de compra sempre com med travado no topo** | Sem `MedicineSelectableRow` no form; seleção é `PurchaseMedicineSheet` (do FAB Hub) ou param da rota (do FAB Detail) |
| PO-4 | **Editar compra ≠ Registrar compra** | Mesma tela, mode prop diferente; push do "..." em PurchaseCard do Histórico |
| PO-5 | **Indicadores v1 = KPI grid 2×2** (skip variant C colapsável; ir direto pra A) | StockIndicators componente único; mock detalhes reflete |
| PO-6 | **Ajuste manual = modo único "Acertar saldo"** (digitar valor final) | Sem segmented `+ / −`. Preview teal do delta. Motivo obrigatório |
| PO-7 | Glossário UI: "Estoque", "compra", "lote", "validade", "saldo", "farmácia", "laboratório" | Adotar nos labels |
| PO-8 | **Stock = 0 é cenário válido** (validação acontece em LogForm dose) | Spec NÃO bloqueia stock=0; UI mostra status crítico + CTA "Registrar compra". Designer não precisa novo mock |

### 0.6 Helpers canônicos a criar em `@dosiq/core/utils/`
Antes do spawn de telas/cards, criar estes helpers (Wave 1 inline Opus):

| Helper | Assinatura | Onde consumir |
|--------|-----------|---------------|
| `resolveStockStatus(qty, dailyConsumption, today)` | `→ 'critico' \| 'baixo' \| 'normal' \| 'vencido'` | StockCard, StockIndicators, FILTER_CHIPS counts |
| `computeDaysRemaining(qty, dailyConsumption)` | `→ number \| null` | StockIndicators, StockCard `days` |
| `computeDailyConsumption(activeProtocols)` | `→ number` | StockIndicators, cross-domain treatments→stock |
| `computeAverageUnitPrice(purchases)` | `→ number` (weighted) | StockDetail, StockIndicators |
| `computeExpiryDays(expiryYYYYMM)` | `→ number \| null` | PurchaseCard, filtro "Vencendo" |
| `formatBRL(n)` | `→ 'R$ X,YY'` (locale PT-BR) | toda tela com preço |

Thresholds confirmar com `apps/web/src/features/stock/utils/` (existem? espelhar) — CLAUDE.md: CRITICAL <7d · LOW <14d · NORMAL <30d · HIGH ≥30d · VENCENDO `expDays < 90` (proposta; PO confirma).

---

## Objetivo

Expandir o módulo de Estoque de **read-only** (saldo) para **CRUD completo**:
- Registro de compras (quantidade, preço, data, farmácia, laboratório, validade, lote)
- Edição de compras (mesma tela em mode `edit`)
- Visualização de histórico de compras por medicamento
- Indicadores: previsão de reposição, custo médio unitário, dias de vencimento (KPI grid 2×2 — PO-5)
- Ajuste manual de saldo (modo único "Acertar saldo" — PO-6)
- Cross-domain: consumo diário derivado de tratamentos ativos (alto risco cache; ver §0.3)

**Fora do escopo Fase 3 v1** (decisões PO):
- ❌ Exclusão de compras (PO-1 — correção via Ajuste)
- ❌ Variant C colapsável de indicadores (PO-5 — direto pro KPI grid)
- ❌ Segmented `+ / −` em ajuste (PO-6 — só "Acertar saldo")

**Nota**: O domínio Estoque é mais complexo do que parece — envolve 2 services web (`stockService` + `purchaseService`), RPCs Supabase (`consume_stock_fifo`, `restore_stock_for_log`, `apply_manual_stock_adjustment`, `create_purchase_with_stock`), e uma view materializada (`medicine_stock_summary`).

---

## Contexto Técnico: Dualidade Stock + Purchase

Na web, o domínio de estoque é dividido em:

| Service | Responsabilidade | Linhas |
|---------|-----------------|--------|
| `stockService.js` | Saldo, consumo FIFO, ajustes, low stock alerts | 247 |
| `purchaseService.js` | CRUD de compras, histórico, preço médio | 119 |

**RPCs Supabase** (server-side):
- `consume_stock_fifo(p_medicine_id, p_quantity, p_medicine_log_id)` — consumo automático ao registrar dose
- `restore_stock_for_log(p_medicine_log_id, p_reason)` — estorno ao deletar dose
- `apply_manual_stock_adjustment(p_medicine_id, p_quantity_delta, p_reason, p_notes)` — ajuste manual
- `create_purchase_with_stock(...)` — cria purchase + entry de stock atomicamente
- `get_low_stock_medicines(p_user_id, p_threshold)` — alerta de estoque baixo

**Decisão**: No mobile, consolidar em **1 service** (`stockService.js`) que expõe ambas as funcionalidades. Na extração G2, separar se necessário.

---

## Sprint Breakdown

### Sprint S3.1 — Helpers + Service + Purchase CRUD (Semana ~10)

> **Gate alvo**: G1 (Copy)
> **Wave plan** (R-237):
> - **Wave 1 inline Opus**: S1.0 (helpers `@dosiq/core/utils/`) + S1.1/S1.2 (service consolidado) — bloqueia tudo
> - **Wave 2 spawn paralelo**: S1.3 (Sonnet useStockMutation), S1.4 (Haiku PurchaseCard), S1.7 (Sonnet PurchaseMedicineSheet), S1.10 (Haiku routes+stack)
> - **Wave 3 spawn**: S1.5 (Sonnet PurchaseForm — depende S1.3 hook + S1.4 row), S1.6 (Sonnet PurchaseHistoryScreen — depende S1.4 card)
> - **Wave 4 spawn**: S1.8 (Sonnet StockScreen expand — depende S1.7 sheet + S1.10 nav)
> - **Wave 5 inline Opus**: smoke local + smoke PO

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| S1.0 | **NOVO** — helpers canônicos (§0.6) | `packages/core/src/utils/stock.js` + barrel | 👤 Arquiteto | ⭐⭐ |
| S1.1 | Copiar + consolidar `stockService` + `purchaseService` para mobile | `apps/mobile/src/features/stock/services/stockService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| S1.2 | Adaptar imports + validar RPCs funcionam no Hermes | (mesmo arquivo) | 👤 Arquiteto | ⭐⭐ |
| S1.3 | Hook `useStockMutation` (create + edit purchase + adjust) **com cache matrix R-236** | `apps/mobile/src/features/stock/hooks/useStockMutation.js` | 🤖 Sonnet | ⭐⭐ |
| S1.4 | Componente `PurchaseCard` (barra consumo + validade) | `apps/mobile/src/features/stock/components/PurchaseCard.jsx` | 🤖 Haiku | ⭐⭐ |
| S1.5 | Tela `PurchaseFormScreen` (modes create/edit; med travado no topo — PO-3) | `apps/mobile/src/features/stock/screens/PurchaseFormScreen.jsx` | 🤖 Sonnet | ⭐⭐⭐ |
| S1.6 | Tela `PurchaseHistoryScreen` (header resumo + PurchaseCards full + "..." → Editar) | `apps/mobile/src/features/stock/screens/PurchaseHistoryScreen.jsx` | 🤖 Sonnet | ⭐⭐ |
| S1.7 | Componente `PurchaseMedicineSheet` (R-233 statusBarTranslucent) | `apps/mobile/src/features/stock/components/PurchaseMedicineSheet.jsx` | 🤖 Sonnet | ⭐⭐ |
| S1.8 | Expandir `StockScreen` (chips filtro + FAB → sheet) + `StockDetailScreen` (FAB → form med travado — PO-2) | `apps/mobile/src/features/stock/screens/StockScreen.jsx`, `StockDetailScreen.jsx` | 🤖 Sonnet | ⭐⭐⭐ |
| S1.9 | `StockStack` navigation + rotas | `apps/mobile/src/navigation/StockStack.jsx` | 🤖 Haiku | ⭐ |
| S1.10 | Atualizar `routes.js` + `RootTabs.jsx` (StockStack) | `apps/mobile/src/navigation/routes.js`, `RootTabs.jsx` | 🤖 Haiku | ⭐ |
| S1.11 | Testes do `stockService` mobile + helpers `@dosiq/core/utils/stock` | `apps/mobile/.../__tests__/`, `packages/core/.../__tests__/` | 🤖 Haiku | ⭐⭐ |

**Entrega**: smoke PO (R-234) → push → `gh pr create` → merge em `feat/crud-stock`

---

### Sprint S3.2 — Indicadores + Ajuste + Extract + Migrate (Semana ~11)

> **Wave plan**:
> - **Wave 1 spawn paralelo**: S2.1 (Sonnet StockIndicators KPI grid 2×2), S2.2 (Sonnet StockAdjustment), S2.3/S2.4 (Sonnet factories)
> - **Wave 2 spawn**: S2.5 (Sonnet parity tests factories), S2.6 (Sonnet mobile adopt) — depende Wave 1
> - **Wave 3 inline Opus**: G2 gate check + smoke PO
> - **Wave 4 spawn**: S2.8 (Opus web adopt), S2.9 (Haiku delete obsoletos), S2.10 (Haiku validate:agent)
> - **Wave 5 inline Opus**: G3 gate check + merge `feat/crud-stock` → `main`

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| S2.1 | Componente `StockIndicators` KPI grid 2×2 (PO-5 — direto v2, sem variant C) | `apps/mobile/src/features/stock/components/StockIndicators.jsx` | 🤖 Sonnet | ⭐⭐⭐ |
| S2.2 | Tela `StockAdjustmentScreen` modo único "Acertar saldo" (PO-6) + DeltaPreview + motivo | `apps/mobile/src/features/stock/screens/StockAdjustmentScreen.jsx` | 🤖 Sonnet | ⭐⭐ |
| S2.3 | Criar `createStockRepository` em `@dosiq/core/repositories/` | `packages/core/src/repositories/createStockRepository.js` | 🤖 Sonnet | ⭐⭐⭐ |
| S2.4 | Criar `createPurchaseRepository` em `@dosiq/core/repositories/` | `packages/core/src/repositories/createPurchaseRepository.js` | 🤖 Sonnet | ⭐⭐ |
| S2.5 | Parity tests factories (espelhar pattern `createProtocolRepository.test.js`) | `packages/core/src/repositories/__tests__/` | 🤖 Sonnet | ⭐⭐ |
| S2.6 | Mobile adota factories | `apps/mobile/src/features/stock/services/` | 👤 Arquiteto | ⭐⭐ |
| S2.7 | **G2 GATE CHECK** (Gate Report SQP §3 + smoke PO R-234) | | 👤 Humano | — |
| S2.8 | Web adota factories | `apps/web/src/features/stock/services/` | 👤 Arquiteto | ⭐⭐⭐ |
| S2.9 | Deletar services locais web obsoletos | (delete) | 🤖 Haiku | ⭐ |
| S2.10 | `validate:agent` web 100% green + alias propagation check vitest (AP-170) | `rtk npm run validate:agent` | 🤖 Haiku | ⭐ |
| S2.11 | **G3 GATE CHECK** | | 👤 Humano | — |

**Entrega**: smoke PO (R-234) → push → `gh pr create` → merge em `feat/crud-stock` → **merge em `main`**

**Removido vs v1**: ❌ `useStockDelete` (PO-1 sem exclusão de compras) · ❌ variant C colapsável (PO-5 direto KPI grid) · ❌ segmented delta no ajuste (PO-6 só acertar saldo)

---

## Especificações Técnicas Detalhadas

### S1.1 — `stockService.js` (Mobile — Consolidado)

**Fontes**:
- `apps/web/src/features/stock/services/stockService.js` (247 linhas)
- `apps/web/src/features/stock/services/purchaseService.js` (119 linhas)

**Consolidação mobile** (1 arquivo, ~200 linhas):

```javascript
import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
import { validateStockCreate, validateStockDecrease, validateStockIncrease } from '@dosiq/core'
import { debugLog, errorLog } from '@shared/utils/debugLog'

export const stockService = {
  // === READS ===
  
  async getStockSummary(medicineId, userId) {
    // Usa medicine_stock_summary view
  },
  
  async getLowStockMedicines(userId, threshold = 10) {
    // RPC get_low_stock_medicines
  },
  
  async getPurchasesByMedicine(medicineId, userId) {
    // Query purchases table
  },
  
  async getAverageUnitPrice(medicineIds, userId) {
    // Weighted average calculation
  },
  
  // === WRITES ===
  
  async createPurchase(input, userId) {
    // Zod validate + RPC create_purchase_with_stock
    const validation = validateStockCreate(input)
    if (!validation.success) throw new Error(...)
    
    const { data, error } = await supabase.rpc('create_purchase_with_stock', {
      p_medicine_id: validation.data.medicine_id,
      p_quantity: validation.data.quantity,
      p_unit_price: validation.data.unit_price ?? 0,
      p_purchase_date: validation.data.purchase_date,
      p_expiration_date: validation.data.expiration_date,
      p_pharmacy: validation.data.pharmacy,
      p_laboratory: validation.data.laboratory,
      p_notes: validation.data.notes,
    })
    if (error) throw error
    return data
  },
  
  async decreaseStock(medicineId, quantity, medicineLogId) {
    // Zod validate + RPC consume_stock_fifo
  },
  
  async increaseStock(medicineId, quantity, options) {
    // Zod validate + RPC restore_stock_for_log ou apply_manual_stock_adjustment
  },
  
  async deletePurchase(id, userId) {
    // Verificação de consumo antes de deletar
    // Entry com original_quantity !== quantity → foi parcialmente consumida
  },
}
```

**Decisão de assinatura**: Diferente da web (que usa `getUserId()` singleton), mobile recebe `userId` como parâmetro explícito. Consistente com `treatmentsService.js` existente.

---

### S1.5 — `PurchaseFormScreen`

```jsx
function PurchaseFormScreen({ route, navigation }) {
  const { medicineId, medicineName } = route.params
  // Pré-seleciona medicamento — usuário navega de StockScreen → PurchaseForm
  
  const { values, errors, handleChange, validate } = useFormState(stockCreateSchema, {
    initialValues: {
      medicine_id: medicineId,
      quantity: null,
      unit_price: 0,
      purchase_date: getTodayLocal(), // hoje por default
      expiration_date: null,
      pharmacy: null,
      laboratory: null,
      notes: null,
    }
  })
  
  return (
    <ScreenContainer title={`Compra: ${medicineName}`}>
      <FormSection title="Quantidade e Preço">
        <FormInput name="quantity" label="Quantidade" keyboardType="numeric" required />
        <FormInput name="unit_price" label="Preço unitário (R$)" keyboardType="decimal-pad" />
      </FormSection>
      
      <FormSection title="Datas">
        <FormDatePicker name="purchase_date" label="Data da compra" required />
        <FormDatePicker name="expiration_date" label="Validade (opcional)" />
      </FormSection>
      
      <FormSection title="Detalhes (opcional)">
        <FormInput name="pharmacy" label="Farmácia" />
        <FormInput name="laboratory" label="Laboratório" />
        <FormInput name="notes" label="Observações" multiline />
      </FormSection>
      
      <FormActions onSubmit={handleSubmit} onCancel={() => navigation.goBack()}
        submitLabel="Registrar Compra" loading={isLoading} />
    </ScreenContainer>
  )
}
```

---

### S2.1 — `StockIndicators` — KPI Grid 2×2 (PO-5)

Usa **helpers canônicos** de `@dosiq/core/utils/stock` (§0.6). Sem if/else por enum, sem lógica de derivação local (delegada aos helpers).

```jsx
import { computeDailyConsumption, computeDaysRemaining, computeAverageUnitPrice, formatBRL } from '@dosiq/core/utils'

function StockIndicators({ medicine, stockSummary, activeProtocols, purchases }) {
  const dailyConsumption = computeDailyConsumption(activeProtocols)
  const currentStock = stockSummary?.total_quantity ?? 0
  const daysRemaining = computeDaysRemaining(currentStock, dailyConsumption)
  const avgPrice = computeAverageUnitPrice(purchases)
  const replenishmentDate = daysRemaining != null ? addDays(new Date(), daysRemaining) : null

  // KPI Grid 2×2 (PO-5 direto v2):
  //   [Saldo atual]    [Consumo diário]
  //   [Duração]        [Custo médio]
  return (
    <KpiGrid>
      <KpiCard label="Saldo atual"      value={currentStock}   unit="unidade(s)" emphasis />
      <KpiCard label="Consumo diário"   value={dailyConsumption} unit="un./dia" />
      <KpiCard label="Duração"          value={daysRemaining ?? '—'} unit="dias"
               status={daysRemaining != null && daysRemaining < 7 ? 'critico' : daysRemaining < 14 ? 'baixo' : 'normal'} />
      <KpiCard label="Custo médio"      value={avgPrice > 0 ? formatBRL(avgPrice) : '—'} />
    </KpiGrid>
  )
}
```

**Cross-domain note** (PO-5 + G7 retro): `activeProtocols` vem de `@dosiq/treatments-snapshot`. Quando treatments muda (toggleActive, edit, delete), StockDetail precisa re-renderizar consumo. Tratado via `useFocusEffect` + cache invalidation matrix em `useTreatmentMutation` (R-236).

---

### S2.2 — Ajuste Manual de Saldo (PO-6 modo único)

```jsx
function StockAdjustmentScreen({ route, navigation }) {
  const { medicineId, currentStock } = route.params
  const { values, errors, handleChange, validate } = useFormState(adjustmentSchema, {
    initialValues: { new_balance: null, reason: null, notes: null }
  })

  const delta = values.new_balance != null ? values.new_balance - currentStock : null

  return (
    <ScreenContainer title="Acertar saldo">
      <FormSection>
        <DataPill label="Saldo atual" value={`${currentStock} un.`} />
        <FormInput name="new_balance" label="Novo saldo" keyboardType="numeric" required />
        {delta != null && <DeltaPreview from={currentStock} to={values.new_balance} />}
        <FormSelect name="reason" label="Motivo" options={ADJUSTMENT_REASONS} required />
        <FormInput name="notes" label="Observações" multiline />
      </FormSection>
      <FormActions submitLabel="Acertar saldo" onSubmit={handleSubmit} />
    </ScreenContainer>
  )
}
```

**ADJUSTMENT_REASONS** (proposta — PO confirma):
`perda`, `doacao`, `descarte`, `vencimento`, `correcao_erro`, `outro`

---

## Novas Rotas

```javascript
// routes.js — adições
export const ROUTES = {
  // ... existentes ...

  // Sub-rotas de Estoque (expand)
  STOCK_MAIN: 'StockMain',                     // [NEW] renomear de STOCK
  STOCK_DETAIL: 'StockDetail',                 // [NEW] detalhe por medicamento
  PURCHASE_FORM: 'PurchaseForm',               // [NEW] mode: 'create' | 'edit'
  PURCHASE_HISTORY: 'PurchaseHistory',         // [NEW]
  STOCK_ADJUSTMENT: 'StockAdjustment',         // [NEW]
  // ❌ PURCHASE_DELETE removido (PO-1)
}
```

**Navegação** (PO-2 FAB ubíquo + PO-3 form sempre med travado):
- `StockMain → FAB` → `PurchaseMedicineSheet` → `PurchaseForm` (medicineId travado, mode=create)
- `StockMain → StockCard tap` → `StockDetail`
- `StockDetail → FAB` → `PurchaseForm` direto (medicineId travado, mode=create, skip sheet)
- `StockDetail → "Ver todas"` → `PurchaseHistory`
- `PurchaseHistory → "..." em PurchaseCard` → `PurchaseForm` (medicineId travado, mode=edit, purchaseId param)
- `StockDetail → "Acertar saldo"` → `StockAdjustment`

---

## Estrutura de Diretórios (Resultado Final)

```
apps/mobile/src/
  features/
    stock/                                  ← [EXPAND]
      components/
        StockItem.jsx                       ← existente (refactor → StockCard)
        StockLevelBadge.jsx                 ← existente
        PurchaseCard.jsx                    ← [NEW]
        StockIndicators.jsx                 ← [NEW] KPI grid 2×2 (PO-5)
        PurchaseMedicineSheet.jsx           ← [NEW] R-233 statusBarTranslucent
        StockFilterChips.jsx                ← [NEW] todos/baixo/vencendo/crítico
      hooks/
        useStock.js                         ← existente (expandir + cache matrix)
        useStockDetail.js                   ← [NEW] cross-domain w/ treatments
        _stockDataTransformer.js            ← existente
        useStockMutation.js                 ← [NEW] create + edit purchase + adjust
        # ❌ useStockDelete removido (PO-1)
      screens/
        StockScreen.jsx                     ← [MODIFY] chips + FAB → sheet (PO-2)
        StockDetailScreen.jsx               ← [NEW] hero + KPI grid + history + FAB direct
        PurchaseFormScreen.jsx              ← [NEW] mode create/edit, med travado (PO-3/4)
        PurchaseHistoryScreen.jsx           ← [NEW]
        StockAdjustmentScreen.jsx           ← [NEW] modo único Acertar saldo (PO-6)
      services/
        stockService.js                     ← [REPLACE] thin → full CRUD (sem delete)
        __tests__/
          stockService.test.js              ← [NEW]
      utils/
        # ❌ stockCalculations.js movido pra @dosiq/core/utils/stock.js (canônico web↔mobile)
  navigation/
    StockStack.jsx                          ← [NEW]
    RootTabs.jsx                            ← [MODIFY] use StockStack
    routes.js                               ← [MODIFY] add STOCK routes

packages/core/src/
  utils/
    stock.js                                ← [NEW] helpers canônicos (§0.6)
    index.js                                ← [MODIFY] re-export (audit barrel — AP-164)
    __tests__/
      stock.test.js                         ← [NEW]
  repositories/                             ← R-231 + ADR-045 (não shared-data)
    createStockRepository.js                ← [NEW] G2
    createPurchaseRepository.js             ← [NEW] G2
    __tests__/
      createStockRepository.test.js         ← [NEW] parity tests
      createPurchaseRepository.test.js      ← [NEW] parity tests
```

---

## Quality Gates — Fase 3

### G1 — Gate de Cópia

| Critério | Validação |
|----------|-----------|
| Helpers canônicos `@dosiq/core/utils/stock.js` criados + testados | Teste unitário (>=10 tests) |
| `stockCreateSchema` com refinements funciona no Hermes | Teste unitário |
| RPCs Supabase (`create_purchase_with_stock`, `consume_stock_fifo`, `apply_manual_stock_adjustment`) | Smoke test no simulador |
| Purchase form (create+edit) cria entrada + atualiza saldo | Demo gravada |
| FAB ubíquo (Hub + Detail) funciona conforme PO-2/PO-3 | Smoke PO |
| `StockIndicators` KPI grid 2×2 calcula corretamente | Smoke PO |
| Cache invalidation matrix documentada em `useStockMutation` (R-236) | Code review |
| Bottom sheets com `statusBarTranslucent` (R-233) testado em Android API 24 | Smoke PO Android |
| **Smoke PO (R-234) concluído antes de `gh pr create`** | Confirmação PO |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |

### G2 — Gate de Extração

| Critério | Validação |
|----------|-----------|
| Factories em `@dosiq/core/repositories/` (R-231 + ADR-045) — NÃO em shared-data | Path verification |
| `createStockRepository` + `createPurchaseRepository` aceitam injection (DI) | Teste unitário |
| Parity tests com mocked client (espelhar `createProtocolRepository.test.js`) | >=15 tests por factory |
| Mobile usa factories — todos os testes passam | CI |
| Barrel `@dosiq/core/utils/index.js` auditado (AP-164 — sem naming collision) | Grep consumers |
| Diff < 5% | `rtk diff` |
| Smoke PO G2 | Confirmação PO |

### G3 — Gate de Migração

| Critério | Validação |
|----------|-----------|
| Web `stockService.js` + `purchaseService.js` usam factories | Grep |
| `vitest.config.js` + `vitest.critical.config.js` alias `@dosiq/core` propagado (AP-170) | Run `validate:agent` |
| `validate:agent` web 100% green + build OK | CI |
| Services locais web DELETADOS | `find` verification |
| `npx expo export` mobile — 0 erros | CI |
| Smoke PO G3 (E2E completo: criar/editar compra, ajustar saldo, ver KPIs, filtros, FAB ubíquo) | Confirmação PO |
| DEVFLOW C5 aplicado pós-merge (R/AP/ADR + journal + state.json counters) | `.agent/` audit |

---

## Delegação de Agentes (Cavecrew SQP §4 v2.0)

Brief obrigatório R-230 (6 itens) em TODO spawn. Recalibração pós-Fase 2: Sonnet cap 4 arquivos, Haiku cap 2.

| Task ID | Agente | Motivo |
|---------|--------|--------|
| S1.0 | 👤 Opus | Helpers canônicos (decisão de API web↔mobile) |
| S1.1-S1.2 | 👤 Opus | Consolidação 2 services + validar RPCs Hermes |
| S1.3, S1.5, S1.6, S1.7, S1.8 | 🤖 Sonnet ⭐⭐ | Componentes/hooks complexos (cache matrix, sheet R-233, form mode dual, KPI cross-domain) |
| S1.4, S1.9, S1.10, S1.11 | 🤖 Haiku ⭐ | Tasks mecânicas (card simples, nav files, tests espelhados) |
| S2.1, S2.2 | 🤖 Sonnet ⭐⭐ | KPI grid 2×2 + ajuste com DeltaPreview (UX complexa, mas pattern claro) |
| S2.3, S2.4, S2.5 | 🤖 Sonnet ⭐⭐ | Factories — espelhar `createProtocolRepository` pattern (validado Fase 2) |
| S2.6, S2.8 | 👤 Opus | Adopção mobile + web (mudança em arquivos sensíveis cross-feature) |
| S2.9, S2.10 | 🤖 Haiku ⭐ | Delete obsoletos + validate:agent |

---

## Risco Especial: RPCs Supabase

> [!WARNING]
> O domínio Estoque depende de 4 RPCs server-side que executam lógica atômica no PostgreSQL.
> Essas RPCs já existem e são usadas pela web — **não precisam ser criadas**.
> Porém, testar no mobile é obrigatório pois o `nativeSupabaseClient` pode ter behaviors diferentes do browser client (auth header, connection pooling).
>
> **Ação**: Sprint S3.1, task S1.2 deve incluir teste manual de cada RPC no simulador.

## Risco Especial: Cross-Domain Cache (G7 RETRO_FASE2)

> [!WARNING]
> Fase 3 é a **primeira fase com 3 snapshots interdependentes**:
> - `@dosiq/stock-snapshot` (saldo, status)
> - `@dosiq/purchases-snapshot` (histórico)
> - `@dosiq/treatments-snapshot` (daysRemaining depende de consumo de tratamentos ativos)
>
> **Pattern obrigatório** (R-236 — ver §0.3): toda mutation em qualquer dos 3 hooks DEVE listar inline TODOS os snapshots que invalida. Esquecer = bug latente (refresh on focus pode salvar, mas falha em rede instável).
>
> **Caches a auditar retroativamente** (P6 do plano de ação RETRO_FASE2):
> - `useTreatmentMutation.toggleActive/create/update/delete` — passar a invalidar `stock-snapshot` (afeta daysRemaining)
> - `useProtocolMutation.create/update/delete` — idem
> - `useStockMutation.create/update/adjust` — invalida treatments-snapshot (daysRemaining recalculado)
> - LogForm dose (consume_stock_fifo) — invalida stock + treatments

---

## Changelog

### v2 — 2026-05-18 (pós-RETRO_FASE2 + absorção mocks designer)
- **§0 NOVO** — Cuidados aprendidos pré-Fase 3 (consolidado RETROs Fase 1+2): arquitetura compartilhada, mobile patterns, cache invalidation matrix CRÍTICA, processo SQP §§10-13, decisões PO PO-1..PO-8, helpers canônicos §0.6
- **Factory paths corrigidos**: `packages/shared-data/src/services/` → `packages/core/src/repositories/` (R-231 + ADR-045)
- **Escopo cortado** (decisões PO mocks Fase 3):
  - ❌ `useStockDelete` + `deletePurchase` + verificação consumo parcial (PO-1)
  - ❌ Variant C colapsável de indicadores (PO-5 — direto KPI grid 2×2)
  - ❌ Segmented `+ / −` em ajuste (PO-6 — só "Acertar saldo")
- **Escopo expandido**:
  - Editar compra (PO-4) — mesma tela, mode prop
  - FAB ubíquo Hub + Detail (PO-2)
  - PurchaseMedicineSheet (sheet seleção do FAB Hub — R-233)
  - Helpers canônicos `@dosiq/core/utils/stock.js` (S1.0 nova task)
- **Sprint Breakdown** reorganizado em Waves (R-237) com agentes recalibrados (SQP §4 v2.0)
- **Quality Gates** expandidos: smoke PO (R-234), cache matrix (R-236), R-233 Android API 24, AP-170 vitest config, helpers canônicos, DEVFLOW C5 pós-merge
- **Risco Especial Cross-Domain Cache** adicionado (G7 RETRO_FASE2) com lista retroativa de hooks a auditar
- **Delegação** atualizada pra cavecrew matrix v2.0 (Sonnet cap 4, Haiku cap 2, brief R-230 obrigatório)

### v1 — 14/05/2026 (inicial)
- Sprint breakdown G1/G2/G3, especificações S1.1-S2.4, estrutura diretórios, quality gates básicos
