# EXEC SPEC — Fase 1: CRUD Medicamentos

> **Duração**: 2-3 sprints semanais  
> **Branch base**: `feat/crud-medications`  
> **Referência**: MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md §9 (Fase 1)  
> **Pré-condição**: ✅ Fase Pré-Requisitos completa (Form Kit + useMutation + ANVISA cache)  
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate) — **end-to-end antes de iniciar Fase 2**

---

## Objetivo

Implementar CRUD completo de **Medicamentos** no mobile nativo, incluindo:
- Listagem com busca/filtro
- Criação com autocomplete ANVISA
- Edição completa
- Exclusão com verificação de dependências
- Detalhes completos do medicamento

Ao final, o domínio Medicamentos percorre G1 → G2 → G3 completamente.

---

## Sprint Breakdown

### Sprint M1.1 — Service + Screens Read (Semana ~4)

> **Gate alvo**: G1 (Copy) — service local funcionando no mobile

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| M1.1 | Copiar `medicineService` da web para mobile | `apps/mobile/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M1.2 | Adaptar imports: `nativeSupabaseClient` + `@dosiq/core` schemas | (mesmo arquivo) | 👤 Arquiteto | ⭐⭐ |
| M1.3 | Hook `useMedicines()` (getAll + getById) | `apps/mobile/src/features/medications/hooks/useMedicines.js` | 🤖 Builder | ⭐⭐ |
| M1.4 | Tela `MedicinesListScreen` | `apps/mobile/src/features/medications/screens/MedicinesListScreen.jsx` | 🤖 Builder | ⭐⭐ |
| M1.5 | Componente `MedicineCard` | `apps/mobile/src/features/medications/components/MedicineCard.jsx` | 🤖 Builder | ⭐⭐ |
| M1.6 | Tela `MedicineDetailScreen` | `apps/mobile/src/features/medications/screens/MedicineDetailScreen.jsx` | 🤖 Builder | ⭐⭐ |
| M1.7 | `MedicationsStack` navigation | `apps/mobile/src/navigation/MedicationsStack.jsx` | 🤖 Builder | ⭐ |
| M1.8 | Integrar tab Medicamentos (nova tab ou sub-menu) | `apps/mobile/src/navigation/RootTabs.jsx` + `routes.js` | 👤 Arquiteto | ⭐⭐ |
| M1.9 | Testes do `medicineService` mobile | `apps/mobile/src/features/medications/services/__tests__/medicineService.test.js` | 🤖 Builder | ⭐⭐ |

**Entrega**: PR `feat/crud-medications-g1-copy` → merge em `feat/crud-medications`

---

### Sprint M1.2 — CRUD Completo (Semana ~5)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| M2.1 | Tela `MedicineFormScreen` (create mode) | `apps/mobile/src/features/medications/screens/MedicineFormScreen.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| M2.2 | Integração ANVISA autocomplete no form | (dentro de MedicineFormScreen) | 👤 Arquiteto | ⭐⭐⭐ |
| M2.3 | Tela `MedicineFormScreen` (edit mode) | (mesmo arquivo, param `medicine`) | 🤖 Builder | ⭐⭐ |
| M2.4 | Delete com verificação de dependências | `apps/mobile/src/features/medications/hooks/useMedicineDelete.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M2.5 | Swipe-to-delete em `MedicineCard` | (componente existente) | 🤖 Builder | ⭐⭐ |
| M2.6 | FAB "+" para criar novo medicamento | `apps/mobile/src/features/medications/components/AddMedicineFAB.jsx` | 🤖 Builder | ⭐ |
| M2.7 | Hook `useMedicineMutation` (create/update/delete wrappers) | `apps/mobile/src/features/medications/hooks/useMedicineMutation.js` | 🤖 Builder | ⭐⭐ |
| M2.8 | Testes CRUD E2E no simulador | Manual | 👤 Humano | ⭐⭐ |

**Entrega**: PR `feat/crud-medications-g1-crud` → merge em `feat/crud-medications`

---

### Sprint M1.3 — Extract + Migrate (Semana ~6)

> **Gate alvo**: G2 (Extract) → G3 (Migrate)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| M3.1 | Criar `createMedicineRepository` em `shared-data` | `packages/shared-data/src/services/createMedicineRepository.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M3.2 | Testes do factory | `packages/shared-data/src/services/__tests__/createMedicineRepository.test.js` | 🤖 Builder | ⭐⭐ |
| M3.3 | Mobile adota factory (substituir service local) | `apps/mobile/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐ |
| M3.4 | Verificar mobile CRUD continua funcionando | Smoke test manual | 👤 Humano | ⭐ |
| M3.5 | **G2 GATE CHECK** | Validar todos critérios G2 | 👤 Humano | — |
| M3.6 | Web adota factory (substituir `medicineService.js` local) | `apps/web/src/features/medications/services/medicineService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| M3.7 | Deletar service local web obsoleto | (delete do antigo) | 🤖 Builder | ⭐ |
| M3.8 | `validate:agent` web 100% green | `rtk npm run validate:agent` | 🤖 Builder | ⭐ |
| M3.9 | **G3 GATE CHECK** | Validar todos critérios G3 | 👤 Humano | — |
| M3.10 | Exportar `createMedicineRepository` do `shared-data/index.js` | `packages/shared-data/src/index.js` | 🤖 Builder | ⭐ |

**Entrega**: PR `feat/crud-medications-g2g3-extract` → merge em `feat/crud-medications` → **merge em `main`**

---

## Especificações Técnicas Detalhadas

### M1.1 — `medicineService.js` (Mobile — Cópia G1)

**Origem**: `apps/web/src/features/medications/services/medicineService.js` (138 linhas)

**Adaptações necessárias** (web → mobile):

```diff
- import { supabase, getUserId } from '@shared/utils/supabase'
+ import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
+ import { createUserSessionRepository } from '@dosiq/shared-data'

- import { calculateAvgUnitPrice } from '@stock/services/costAnalysisService'
+ // v1: avg_price calculado no hook (não no service) — evitar dependência circular

  // Schema imports mantidos idênticos:
  import { validateMedicineCreate, validateMedicineUpdate } from '@dosiq/core'
```

**Métodos a copiar** (1:1 com web):
- `getAll()` — com join `stock(*)` + `purchases(*)`
- `getById(id)` — com join
- `create(medicine)` — com Zod `validateMedicineCreate`
- `update(id, updates)` — com Zod `validateMedicineUpdate`
- `delete(id)` — simples

**Simplificação v1**: `avg_price` calculado no hook `useMedicines`, não no service. Isso evita importar `costAnalysisService` que tem lógica complexa de weighted average.

---

### M3.1 — `createMedicineRepository` (Factory — G2)

**Padrão de referência**: `createUserSessionRepository.js` (64 linhas)

```javascript
/**
 * createMedicineRepository — Factory para CRUD de medicamentos
 *
 * @param {Object} deps
 * @param {import('@supabase/supabase-js').SupabaseClient} deps.supabase
 * @param {() => Promise<string>} deps.getUserId
 * @returns {MedicineRepository}
 */
export function createMedicineRepository({ supabase, getUserId }) {
  if (!supabase) throw new Error('createMedicineRepository: supabase client is required')
  if (!getUserId) throw new Error('createMedicineRepository: getUserId is required')

  async function getAll() {
    const { data, error } = await supabase
      .from('medicines')
      .select('*, stock(*), purchases(*)')
      .eq('user_id', await getUserId())
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  async function getById(id) { /* ... */ }
  async function create(medicine) { /* Zod validate + insert */ }
  async function update(id, updates) { /* Zod validate + update */ }
  async function remove(id) { /* delete */ }

  return { getAll, getById, create, update, remove }
}
```

**Diff G2 vs G1**: Apenas wiring — lógica idêntica. O diff deve ser < 5%.

---

### M2.1 — `MedicineFormScreen` (Tela Principal de Formulário)

```jsx
// Fluxo:
// 1. Se route.params.medicine → modo edição (preenche initialValues)
// 2. Se vazio → modo criação
// 3. Usa useFormState(medicineCreateSchema) ou medicineUpdateSchema
// 4. Integra FormAutocomplete para busca ANVISA
// 5. Auto-fill: selecionar ANVISA preenche name, active_ingredient, laboratory, etc.

function MedicineFormScreen({ route, navigation }) {
  const medicine = route.params?.medicine // undefined = create, object = edit
  const isEditing = !!medicine
  
  const schema = isEditing ? medicineUpdateSchema : medicineCreateSchema
  const { values, errors, handleChange, handleBlur, validate, setValues } = useFormState(schema, {
    initialValues: medicine || { type: 'medicamento', dosage_unit: 'mg' }
  })
  
  const { mutate, isLoading } = useMutation({
    onSuccess: () => navigation.goBack(),
    invalidateKeys: ['@dosiq/medicines-snapshot'],
  })
  
  const handleAnvisaSelect = (anvisaItem) => {
    // Auto-fill múltiplos campos de uma vez
    setValues({
      name: anvisaItem.name,
      active_ingredient: anvisaItem.activeIngredient,
      therapeutic_class: anvisaItem.therapeuticClass,
      regulatory_category: anvisaItem.regulatoryCategory,
      // laboratory NÃO auto-fill — base ANVISA tem lab do registro, não do genérico
    })
  }
  
  const handleSubmit = () => {
    if (!validate()) return
    if (isEditing) {
      mutate(() => medicineService.update(medicine.id, values))
    } else {
      mutate(() => medicineService.create(values))
    }
  }
  
  return (
    <ScreenContainer title={isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}>
      <FormSection title="Identificação">
        <FormAutocomplete
          label="Buscar na base ANVISA"
          onSelect={handleAnvisaSelect}
          placeholder="Digite o nome do medicamento..."
        />
        <FormInput name="name" label="Nome" value={values.name} error={errors.name}
          onChange={handleChange} onBlur={handleBlur} required />
        <FormInput name="active_ingredient" label="Princípio Ativo" value={values.active_ingredient}
          error={errors.active_ingredient} onChange={handleChange} onBlur={handleBlur} />
      </FormSection>
      
      <FormSection title="Dosagem">
        <FormInput name="dosage_per_pill" label="Dosagem por unidade" value={values.dosage_per_pill}
          error={errors.dosage_per_pill} onChange={handleChange} onBlur={handleBlur}
          keyboardType="numeric" required />
        <FormSelect name="dosage_unit" label="Unidade" value={values.dosage_unit}
          error={errors.dosage_unit} onChange={handleChange}
          options={DOSAGE_UNITS.map(u => ({ value: u, label: DOSAGE_UNIT_LABELS[u] }))} required />
      </FormSection>
      
      <FormSection title="Classificação">
        <FormSelect name="type" label="Tipo" value={values.type}
          error={errors.type} onChange={handleChange}
          options={MEDICINE_TYPES.map(t => ({ value: t, label: MEDICINE_TYPE_LABELS[t] }))} />
        <FormInput name="laboratory" label="Laboratório" value={values.laboratory}
          error={errors.laboratory} onChange={handleChange} onBlur={handleBlur} />
        <FormSelect name="regulatory_category" label="Categoria Regulatória"
          value={values.regulatory_category} error={errors.regulatory_category}
          onChange={handleChange}
          options={REGULATORY_CATEGORIES.map(c => ({ value: c, label: REGULATORY_CATEGORY_LABELS[c] }))} />
      </FormSection>
      
      <FormActions
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
        submitLabel={isEditing ? 'Salvar' : 'Criar Medicamento'}
        loading={isLoading}
      />
    </ScreenContainer>
  )
}
```

---

### M2.4 — Delete com Verificação de Dependências

```javascript
// Hook: useMedicineDelete(medicineId)
// Antes de deletar, verifica:
// 1. Protocolos ativos usando este medicamento
// 2. Entradas de estoque
// 3. Registros de dose

async function checkDependencies(medicineId) {
  const { data: protocols } = await supabase
    .from('protocols')
    .select('id, name')
    .eq('medicine_id', medicineId)
    .eq('active', true)
    .limit(5)
  
  if (protocols?.length > 0) {
    return {
      canDelete: false,
      reason: `Este medicamento possui ${protocols.length} protocolo(s) ativo(s). Desative-os primeiro.`,
      protocols,
    }
  }
  
  return { canDelete: true }
}
```

---

## Decisão de Navegação: ✅ Dentro de TreatmentsStack

> **Decisão PO (14/05/2026)**: Medicamentos como **sub-tela** dentro do stack de Tratamentos.
>
> **Racional**: Medicamentos é uma entidade "cadastra uma vez" — não há gestão constante. O fluxo principal do usuário é gerenciar tratamentos (horários, dosagens, prazos) e estoque (compras, validade). Manter 4 tabs clean.

**Implementação**: Botão `💊 Meus Medicamentos` no topo ou seção da `TreatmentsScreen` → navega para `MedicinesListScreen` dentro do `TreatmentsStack`.

```
Tab Tratamentos → TreatmentsStack
  ├── TreatmentsList (home)
  │     └── [Botão "Meus Medicamentos"]
  ├── MedicinesListScreen        ← push
  │     ├── MedicineDetailScreen  ← push
  │     └── MedicineFormScreen    ← push (create/edit)
  │           └── AnvisaSearchScreen ← modal
  ├── ProtocolForm               ← push (Fase 2)
  └── TreatmentDetail            ← push
```

---

## Estrutura de Diretórios (Resultado Final)

```
apps/mobile/src/
  features/
    medications/                         ← [NEW domain]
      components/
        MedicineCard.jsx                 ← [NEW]
        AddMedicineFAB.jsx               ← [NEW]
      hooks/
        useMedicines.js                  ← [NEW]
        useMedicineMutation.js           ← [NEW]
        useMedicineDelete.js             ← [NEW]
      screens/
        MedicinesListScreen.jsx          ← [NEW]
        MedicineDetailScreen.jsx         ← [NEW]
        MedicineFormScreen.jsx           ← [NEW]
        AnvisaSearchScreen.jsx           ← [NEW] (criado no Pré-Req)
      services/
        medicineService.js               ← [NEW] G1 copy → G2 usa factory
        __tests__/
          medicineService.test.js        ← [NEW]
  navigation/
    TreatmentsStack.jsx                  ← [MODIFY] add Medications screens
    routes.js                            ← [MODIFY] add MEDICATIONS routes
    (RootTabs.jsx — NÃO modificado, 4 tabs mantidas)

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
| `medicineCreateSchema` cobre 100% dos campos do form | Teste unitário |
| Service CRUD funcional no simulador iOS + Android | Smoke test |
| `MedicineFormScreen` com ANVISA autocomplete | Demo gravada |
| Testes unitários do service mobile equivalentes ao web | Diff comparison |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |

### G2 — Gate de Extração

| Critério | Validação |
|----------|-----------|
| `createMedicineRepository({ supabase, getUserId })` aceita injection | Teste unitário |
| Mobile usa factory — testes passam | `rtk npm test` mobile |
| Web continua com service local (NÃO migrada nesta PR) | Grep verification |
| Diff factory vs service local < 5% (exceto wiring) | `rtk diff` |

### G3 — Gate de Migração

| Critério | Validação |
|----------|-----------|
| Web usa `createMedicineRepository` | Grep: zero import do local |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |
| `npm run build` (web) OK | CI |
| `npx expo export` (mobile) OK | CI |
| Service local web DELETADO | `find` verification |

---

## Delegação de Agentes

| Task ID | Agente | Motivo |
|---------|--------|--------|
| M1.1-M1.2 | 👤 Arquiteto | Adaptação de imports + decisão de simplificação (avg_price) |
| M1.3-M1.6 | 🤖 Builder | Componentes padrão com specs claras |
| M1.7-M1.8 | 🤖 Builder | Navegação dentro de TreatmentsStack (decisão PO confirmada) |
| M2.1-M2.2 | 👤 Arquiteto | Integração ANVISA + form state complexo |
| M2.3-M2.6 | 🤖 Builder | Extensão de padrões existentes |
| M2.4 | 👤 Arquiteto | Lógica de dependências cross-domain |
| M3.1 | 👤 Arquiteto | Factory pattern — referência para todas as fases |
| M3.6 | 👤 Arquiteto | Migração web — risco de regressão alto |
| M3.2, M3.7-M3.10 | 🤖 Builder | Tasks mecânicas com spec clara |
