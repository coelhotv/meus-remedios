# EXEC SPEC — Fase 3: CRUD Estoque

> **Duração**: 2 sprints semanais  
> **Branch base**: `feat/crud-stock`  
> **Referência**: MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md §9 (Fase 3)  
> **Pré-condição**: ✅ Fase 2 completa (G1→G2→G3 Protocolos)  
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate)

---

## Objetivo

Expandir o módulo de Estoque de **read-only** (saldo) para **CRUD completo**:
- Registro de compras (quantidade, preço, data, farmácia, laboratório, validade)
- Visualização de histórico de compras por medicamento
- Indicadores: previsão de reposição, custo médio unitário
- Ajuste manual de estoque
- Exclusão de entradas (com verificação de consumo)

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

### Sprint S3.1 — Service + Purchase CRUD (Semana ~10)

> **Gate alvo**: G1 (Copy)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| S1.1 | Copiar + consolidar `stockService` + `purchaseService` para mobile | `apps/mobile/src/features/stock/services/stockService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| S1.2 | Adaptar imports + validar RPCs funcionam no Hermes | (mesmo arquivo) | 👤 Arquiteto | ⭐⭐ |
| S1.3 | Hook `useStockMutation` (create purchase, adjust, delete) | `apps/mobile/src/features/stock/hooks/useStockMutation.js` | 🤖 Builder | ⭐⭐ |
| S1.4 | Componente `PurchaseCard` | `apps/mobile/src/features/stock/components/PurchaseCard.jsx` | 🤖 Builder | ⭐⭐ |
| S1.5 | Tela `PurchaseFormScreen` (registrar compra) | `apps/mobile/src/features/stock/screens/PurchaseFormScreen.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| S1.6 | Tela `PurchaseHistoryScreen` (histórico por medicamento) | `apps/mobile/src/features/stock/screens/PurchaseHistoryScreen.jsx` | 🤖 Builder | ⭐⭐ |
| S1.7 | Expandir `StockScreen` com FAB + navigate to form | `apps/mobile/src/features/stock/screens/StockScreen.jsx` | 🤖 Builder | ⭐⭐ |
| S1.8 | `StockStack` navigation | `apps/mobile/src/navigation/StockStack.jsx` | 🤖 Builder | ⭐ |
| S1.9 | Testes do `stockService` mobile | `apps/mobile/src/features/stock/services/__tests__/stockService.test.js` | 🤖 Builder | ⭐⭐ |
| S1.10 | Atualizar `routes.js` + `RootTabs.jsx` (StockStack) | `apps/mobile/src/navigation/routes.js`, `RootTabs.jsx` | 🤖 Builder | ⭐ |

**Entrega**: PR `feat/crud-stock-g1` → merge em `feat/crud-stock`

---

### Sprint S3.2 — Indicadores + Extract + Migrate (Semana ~11)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| S2.1 | Componente `StockIndicators` (previsão reposição + custo médio) | `apps/mobile/src/features/stock/components/StockIndicators.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| S2.2 | Lógica de cálculo: `calculateReplenishmentDate` | `apps/mobile/src/features/stock/utils/stockCalculations.js` | 👤 Arquiteto | ⭐⭐⭐ |
| S2.3 | Manual stock adjustment screen | `apps/mobile/src/features/stock/screens/StockAdjustmentScreen.jsx` | 🤖 Builder | ⭐⭐ |
| S2.4 | Delete purchase com verificação de consumo | `apps/mobile/src/features/stock/hooks/useStockDelete.js` | 👤 Arquiteto | ⭐⭐ |
| S2.5 | Criar `createStockRepository` em `shared-data` | `packages/shared-data/src/services/createStockRepository.js` | 👤 Arquiteto | ⭐⭐⭐ |
| S2.6 | Criar `createPurchaseRepository` em `shared-data` | `packages/shared-data/src/services/createPurchaseRepository.js` | 🤖 Builder | ⭐⭐ |
| S2.7 | Testes dos factories | `packages/shared-data/src/services/__tests__/` | 🤖 Builder | ⭐⭐ |
| S2.8 | Mobile adota factories | `apps/mobile/src/features/stock/services/` | 👤 Arquiteto | ⭐⭐ |
| S2.9 | **G2 GATE CHECK** | | 👤 Humano | — |
| S2.10 | Web adota factories | `apps/web/src/features/stock/services/` | 👤 Arquiteto | ⭐⭐⭐ |
| S2.11 | Deletar services locais web obsoletos | (delete) | 🤖 Builder | ⭐ |
| S2.12 | `validate:agent` web 100% green | `rtk npm run validate:agent` | 🤖 Builder | ⭐ |
| S2.13 | **G3 GATE CHECK** | | 👤 Humano | — |

**Entrega**: PR `feat/crud-stock-g2g3` → merge em `feat/crud-stock` → **merge em `main`**

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

### S2.1 — `StockIndicators` — Previsão de Reposição

```jsx
// Calcula: saldo atual ÷ consumo diário = dias restantes

function StockIndicators({ medicine, stockSummary, activeProtocols }) {
  // Consumo diário = Σ (dosage_per_intake × times_per_day) para cada protocolo ativo
  const dailyConsumption = activeProtocols.reduce((total, protocol) => {
    const timesPerDay = protocol.time_schedule?.length || 1
    return total + (protocol.dosage_per_intake * timesPerDay)
  }, 0)
  
  const currentStock = stockSummary?.total_quantity || 0
  const daysRemaining = dailyConsumption > 0
    ? Math.floor(currentStock / dailyConsumption)
    : null // Sem protocolo ativo = sem previsão
  
  const replenishmentDate = daysRemaining !== null
    ? addDays(new Date(), daysRemaining)
    : null
  
  return (
    <SectionCard>
      <Indicator label="Estoque atual" value={`${currentStock} un.`} />
      <Indicator label="Consumo diário" value={`${dailyConsumption} un./dia`} />
      {daysRemaining !== null && (
        <>
          <Indicator label="Duração estimada" value={`${daysRemaining} dias`}
            status={daysRemaining < 7 ? 'warning' : daysRemaining < 3 ? 'error' : 'success'} />
          <Indicator label="Reposição em" value={formatDate(replenishmentDate)} />
        </>
      )}
      {stockSummary?.avg_unit_price > 0 && (
        <Indicator label="Custo médio" value={formatCurrency(stockSummary.avg_unit_price)} />
      )}
    </SectionCard>
  )
}
```

---

### S2.4 — Delete com Verificação de Consumo

```javascript
// Regra: Compra parcialmente consumida NÃO pode ser deletada
// (web já implementa: entry.original_quantity !== entry.quantity → throw)

async function checkPurchaseCanDelete(purchaseId) {
  const { data: entry } = await supabase
    .from('stock')
    .select('quantity, original_quantity, entry_type')
    .eq('id', purchaseId)
    .single()
  
  if (entry.entry_type === 'purchase' && 
      entry.original_quantity !== null && 
      entry.quantity !== entry.original_quantity) {
    return {
      canDelete: false,
      reason: 'Esta compra já teve consumo parcial. Use ajuste manual para corrigir.',
    }
  }
  
  return { canDelete: true }
}
```

---

## Novas Rotas

```javascript
// routes.js — adições
export const ROUTES = {
  // ... existentes ...
  
  // Sub-rotas de Estoque (expand)
  STOCK_MAIN: 'StockMain',                     // [NEW] renomear de STOCK
  PURCHASE_FORM: 'PurchaseForm',               // [NEW]
  PURCHASE_HISTORY: 'PurchaseHistory',         // [NEW]
  STOCK_ADJUSTMENT: 'StockAdjustment',         // [NEW]
}
```

---

## Estrutura de Diretórios (Resultado Final)

```
apps/mobile/src/
  features/
    stock/                                  ← [EXPAND]
      components/
        StockItem.jsx                       ← existente
        StockLevelBadge.jsx                 ← existente
        PurchaseCard.jsx                    ← [NEW]
        StockIndicators.jsx                 ← [NEW]
      hooks/
        useStock.js                         ← existente (expandir)
        _stockDataTransformer.js            ← existente
        useStockMutation.js                 ← [NEW]
        useStockDelete.js                   ← [NEW]
      screens/
        StockScreen.jsx                     ← [MODIFY] add FAB + navigate
        PurchaseFormScreen.jsx              ← [NEW]
        PurchaseHistoryScreen.jsx           ← [NEW]
        StockAdjustmentScreen.jsx           ← [NEW]
      services/
        stockService.js                     ← [REPLACE] thin → full CRUD
        __tests__/
          stockService.test.js              ← [NEW]
      utils/
        stockCalculations.js                ← [NEW]
  navigation/
    StockStack.jsx                          ← [NEW]
    RootTabs.jsx                            ← [MODIFY] use StockStack
    routes.js                               ← [MODIFY] add STOCK routes

packages/shared-data/src/
  services/
    createStockRepository.js                ← [NEW] G2
    createPurchaseRepository.js             ← [NEW] G2
    __tests__/
      createStockRepository.test.js         ← [NEW]
      createPurchaseRepository.test.js      ← [NEW]
  index.js                                  ← [MODIFY] export
```

---

## Quality Gates — Fase 3

### G1 — Gate de Cópia

| Critério | Validação |
|----------|-----------|
| `stockCreateSchema` com refinements funciona no Hermes | Teste unitário |
| RPCs Supabase (`create_purchase_with_stock`, `consume_stock_fifo`) | Smoke test |
| Purchase form cria entrada + atualiza saldo | Demo gravada |
| Previsão de reposição calcula corretamente | Teste unitário `stockCalculations` |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |

### G2 — Gate de Extração

| Critério | Validação |
|----------|-----------|
| `createStockRepository` + `createPurchaseRepository` aceitam injection | Teste unitário |
| Mobile usa factories — testes passam | CI |
| Diff < 5% | `rtk diff` |

### G3 — Gate de Migração

| Critério | Validação |
|----------|-----------|
| Web `stockService.js` + `purchaseService.js` usam factories | Grep |
| `validate:agent` web 100% green + build OK | CI |
| Services locais web DELETADOS | `find` verification |

---

## Delegação de Agentes

| Task ID | Agente | Motivo |
|---------|--------|--------|
| S1.1-S1.2 | 👤 Arquiteto | Consolidação de 2 services + RPCs |
| S1.3-S1.4, S1.6-S1.10 | 🤖 Builder | Componentes/hooks padrão |
| S1.5 | 👤 Arquiteto | Form com schema refinements cross-campo |
| S2.1-S2.2 | 👤 Arquiteto | Lógica de previsão + cross-domain |
| S2.3 | 🤖 Builder | Formulário simples (qtd + motivo) |
| S2.4 | 👤 Arquiteto | Verificação de consumo parcial |
| S2.5, S2.10 | 👤 Arquiteto | Factory + migração web |
| S2.6-S2.7, S2.11-S2.12 | 🤖 Builder | Tasks mecânicas |

---

## Risco Especial: RPCs Supabase

> [!WARNING]
> O domínio Estoque depende de 4 RPCs server-side que executam lógica atômica no PostgreSQL.
> Essas RPCs já existem e são usadas pela web — **não precisam ser criadas**.
> Porém, testar no mobile é obrigatório pois o `nativeSupabaseClient` pode ter behaviors diferentes do browser client (auth header, connection pooling).
>
> **Ação**: Sprint S3.1, task S1.2 deve incluir teste manual de cada RPC no simulador.
