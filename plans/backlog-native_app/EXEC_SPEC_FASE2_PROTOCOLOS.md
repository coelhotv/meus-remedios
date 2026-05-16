# EXEC SPEC — Fase 2: CRUD Protocolos / Tratamentos

> **Duração**: 2-3 sprints semanais  
> **Branch base**: `feat/crud-protocols`  
> **Referência**: MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md §9 (Fase 2)  
> **Pré-condição**: ✅ Fase 1 completa (G1→G2→G3 Medicamentos)  
> **Quality Gates**: G1 (Copy) → G2 (Extract) → G3 (Migrate)  
> **Titulação**: ⏸️ POSTERGADA — apenas leitura de status, sem edição de schedule
> **Versão do app**: 'v0.3.9' - experiencia da app já começa a ganhar corpo (v0.4.0 será consolidada na fase 3)


---

## Objetivo

Implementar CRUD completo de **Protocolos** (tratamentos) no mobile nativo, incluindo:
- Criação de protocolo com seleção de medicamento
- Configuração de frequência (diário, semanal, personalizado, etc.)
- Configuração de horários (time_schedule)
- Período (start_date / end_date)
- Associação a plano terapêutico (existente ou novo)
- Edição e exclusão
- Visualização expandida dos detalhes

**Exclusões da v1**: Edição de titration_schedule, avanço de estágio de titulação. Somente leitura do status atual.

---

## Contexto Técnico: Protocolo é a Entidade Mais Complexa

O `protocolSchema` possui:
- **14 campos** (vs 9 do medicine)
- **3 refinements** cross-campo (titulation + date validation)
- **Relações**: medicine (FK obrigatória) + treatment_plan (FK opcional)
- **Arrays aninhados**: `time_schedule` (HH:MM strings) + `titration_schedule` (objetos)
- **Dias da semana**: `WEEKDAYS` para frequência `semanal` e `personalizado`

**Impacto**: O formulário de protocolo é o mais complexo do app. Requer cuidado especial na UX nativa.

---

## Sprint Breakdown

### Sprint T2.1 — Service Copy + Read Screens (Semana ~7)

> **Gate alvo**: G1 (Copy) — service + listagem + detalhes

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| T1.1 | Copiar `protocolService` da web para mobile | `apps/mobile/src/features/treatments/services/protocolService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| T1.2 | Copiar `treatmentPlanService` da web | `apps/mobile/src/features/treatments/services/treatmentPlanService.js` | 🤖 Builder | ⭐⭐ |
| T1.3 | Adaptar imports (nativeSupabaseClient + @dosiq/core) | (ambos services) | 👤 Arquiteto | ⭐⭐ |
| T1.4 | Expandir `TreatmentsScreen` para CRUD-aware | `apps/mobile/src/features/treatments/screens/TreatmentsScreen.jsx` | 🤖 Builder | ⭐⭐ |
| T1.5 | Tela `TreatmentDetailScreen` (expandida) | `apps/mobile/src/features/treatments/screens/TreatmentDetailScreen.jsx` | 🤖 Builder | ⭐⭐ |
| T1.6 | Atualizar `TreatmentsStack` com novas rotas | `apps/mobile/src/navigation/TreatmentsStack.jsx` | 🤖 Builder | ⭐ |
| T1.7 | Testes do `protocolService` mobile | `apps/mobile/src/features/treatments/services/__tests__/protocolService.test.js` | 🤖 Builder | ⭐⭐ |
| T1.8 | Atualizar `routes.js` com rotas de protocolo | `apps/mobile/src/navigation/routes.js` | 🤖 Builder | ⭐ |

**Entrega**: PR `feat/crud-protocols-g1-read` → merge em `feat/crud-protocols`

---

### Sprint T2.2 — Form Complexo + CRUD (Semana ~8)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| T2.1 | Componente `TimeSchedulePicker` (array de horários) | `apps/mobile/src/features/treatments/components/TimeSchedulePicker.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| T2.2 | Componente `WeekdaySelector` (checkboxes de dias) | `apps/mobile/src/features/treatments/components/WeekdaySelector.jsx` | 🤖 Builder | ⭐⭐ |
| T2.3 | Componente `MedicineSelector` (busca na lista do user) | `apps/mobile/src/features/treatments/components/MedicineSelector.jsx` | 🤖 Builder | ⭐⭐ |
| T2.4 | Componente `TreatmentPlanSelector` (picker com opção "criar novo") | `apps/mobile/src/features/treatments/components/TreatmentPlanSelector.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| T2.5 | Tela `ProtocolFormScreen` (create mode) | `apps/mobile/src/features/treatments/screens/ProtocolFormScreen.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| T2.6 | Tela `ProtocolFormScreen` (edit mode) | (mesmo arquivo) | 🤖 Builder | ⭐⭐ |
| T2.7 | Hook `useProtocolMutation` (create/update/delete) | `apps/mobile/src/features/treatments/hooks/useProtocolMutation.js` | 🤖 Builder | ⭐⭐ |
| T2.8 | Delete com verificação (doses registradas) | `apps/mobile/src/features/treatments/hooks/useProtocolDelete.js` | 👤 Arquiteto | ⭐⭐⭐ |
| T2.9 | Testes CRUD E2E no simulador | Manual | 👤 Humano | ⭐⭐ |

**Entrega**: PR `feat/crud-protocols-g1-crud` → merge em `feat/crud-protocols`

---

### Sprint T2.3 — Extract + Migrate (Semana ~9)

> **Gate alvo**: G2 (Extract) → G3 (Migrate)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| T3.1 | Criar `createProtocolRepository` em `shared-data` | `packages/shared-data/src/services/createProtocolRepository.js` | 👤 Arquiteto | ⭐⭐⭐ |
| T3.2 | Criar `createTreatmentPlanRepository` em `shared-data` | `packages/shared-data/src/services/createTreatmentPlanRepository.js` | 🤖 Builder | ⭐⭐ |
| T3.3 | Testes dos factories | `packages/shared-data/src/services/__tests__/createProtocolRepository.test.js` | 🤖 Builder | ⭐⭐ |
| T3.4 | Mobile adota factories | `apps/mobile/src/features/treatments/services/` | 👤 Arquiteto | ⭐⭐ |
| T3.5 | **G2 GATE CHECK** | Validar todos critérios G2 | 👤 Humano | — |
| T3.6 | Web adota `createProtocolRepository` | `apps/web/src/features/protocols/services/protocolService.js` | 👤 Arquiteto | ⭐⭐⭐ |
| T3.7 | Web adota `createTreatmentPlanRepository` | `apps/web/src/features/protocols/services/treatmentPlanService.js` | 🤖 Builder | ⭐⭐ |
| T3.8 | Deletar services locais web obsoletos | (delete) | 🤖 Builder | ⭐ |
| T3.9 | `validate:agent` web 100% green | `rtk npm run validate:agent` | 🤖 Builder | ⭐ |
| T3.10 | **G3 GATE CHECK** | Validar todos critérios G3 | 👤 Humano | — |

**Entrega**: PR `feat/crud-protocols-g2g3` → merge em `feat/crud-protocols` → **merge em `main`**

---

## Especificações Técnicas Detalhadas

### T1.1 — `protocolService.js` (Mobile — Cópia G1)

**Origem**: `apps/web/src/features/protocols/services/protocolService.js` (246 linhas)

**Adaptações necessárias**:

```diff
- import { supabase, getUserId } from '@shared/utils/supabase'
+ import { supabase } from '../../../platform/supabase/nativeSupabaseClient'
+ // getUserId extraído via session no hook

- import { getTodayLocal, getServerTimestamp } from '@utils/dateUtils'
+ import { getTodayLocal } from '@dosiq/core'
+ // getServerTimestamp: usar new Date().toISOString() (mobile não tem alias @utils)

  import { validateProtocolCreate, validateProtocolUpdate } from '@dosiq/core'
```

**Métodos a copiar** (com adaptações):
- `getAll()` — com joins `medicine:medicines(*)` + `treatment_plan:treatment_plans(*)`
- `getActive(date)` — filtro temporal com `lte/or`
- `getById(id)` — com join medicine
- `create(protocol)` — Zod validate + titration defaults
- `update(id, updates)` — Zod validate
- `delete(id)` — simples
- `getByMedicineId(medicineId)` — para verificação de dependências

**Exclusão v1**: `advanceTitrationStage()` — NÃO copiar. Titulação é read-only no mobile v1.

---

### T2.1 — `TimeSchedulePicker` — Componente Especializado

Este é o componente mais complexo do formulário de protocolos.

```jsx
// TimeSchedulePicker gerencia um array de horários ["08:00", "14:00", "22:00"]

// Props
{
  times,          // string[] — array de "HH:MM"
  onChange,       // (times: string[]) => void
  error,          // string | undefined
  maxTimes,       // number — default 10 (schema max)
}

// UX Flow:
// 1. Lista vertical dos horários atuais (com badge numerada)
// 2. Botão "+ Adicionar horário" abre DateTimePicker nativo (mode="time")
// 3. Cada item tem swipe-to-remove ou ícone X
// 4. Ordenação automática: sort ascendente após cada add
// 5. Validação: mínimo 1, máximo 10 (schema)
// 6. Haptic feedback no add/remove
```

**Implementação**:
```jsx
import DateTimePicker from '@react-native-community/datetimepicker'
// DateTimePicker com mode="time" retorna Date → format para "HH:MM"
```

---

### T2.5 — `ProtocolFormScreen` — Formulário Multi-Seção

```jsx
function ProtocolFormScreen({ route, navigation }) {
  const protocol = route.params?.protocol
  const isEditing = !!protocol
  
  // Schema: usar protocolSchema (sem refinements) para validação por campo
  // Refinements cross-campo executados apenas no validate() final
  const { values, errors, handleChange, validate, setValues } = useFormState(protocolSchema, {
    initialValues: protocol || {
      frequency: 'diário',
      time_schedule: ['08:00'],
      dosage_per_intake: 1,
      active: true,
      start_date: getTodayLocal(),
      titration_status: 'estável',
      titration_schedule: [],
      current_stage_index: 0,
    }
  })
  
  return (
    <ScrollView>
      {/* Seção 1: Medicamento */}
      <FormSection title="Medicamento">
        <MedicineSelector
          value={values.medicine_id}
          onChange={(id) => handleChange('medicine_id', id)}
          error={errors.medicine_id}
        />
      </FormSection>
      
      {/* Seção 2: Identificação */}
      <FormSection title="Nome do Protocolo">
        <FormInput name="name" label="Nome" value={values.name}
          error={errors.name} onChange={handleChange} required />
      </FormSection>
      
      {/* Seção 3: Dosagem */}
      <FormSection title="Dosagem por Tomada">
        <FormInput name="dosage_per_intake" label="Quantidade"
          value={values.dosage_per_intake} error={errors.dosage_per_intake}
          onChange={handleChange} keyboardType="numeric" required />
      </FormSection>
      
      {/* Seção 4: Frequência */}
      <FormSection title="Frequência">
        <FormSelect name="frequency" label="Frequência" value={values.frequency}
          error={errors.frequency} onChange={handleChange}
          options={FREQUENCIES.map(f => ({ value: f, label: FREQUENCY_LABELS[f] }))} />
        
        {/* Condicional: Semanal/Personalizado mostra WeekdaySelector */}
        {['semanal', 'personalizado'].includes(values.frequency) && (
          <WeekdaySelector
            selected={values.weekdays || []}
            onChange={(days) => handleChange('weekdays', days)}
          />
        )}
      </FormSection>
      
      {/* Seção 5: Horários */}
      <FormSection title="Horários">
        <TimeSchedulePicker
          times={values.time_schedule}
          onChange={(times) => handleChange('time_schedule', times)}
          error={errors.time_schedule}
        />
      </FormSection>
      
      {/* Seção 6: Período */}
      <FormSection title="Período">
        <FormDatePicker name="start_date" label="Data de Início"
          value={values.start_date} error={errors.start_date}
          onChange={handleChange} required />
        <FormDatePicker name="end_date" label="Data de Término (opcional)"
          value={values.end_date} error={errors.end_date}
          onChange={handleChange} />
      </FormSection>
      
      {/* Seção 7: Plano Terapêutico (opcional) */}
      <FormSection title="Plano Terapêutico">
        <TreatmentPlanSelector
          value={values.treatment_plan_id}
          onChange={(id) => handleChange('treatment_plan_id', id)}
        />
      </FormSection>
      
      {/* Seção 8: Notas */}
      <FormSection title="Observações">
        <FormInput name="notes" label="Notas (opcional)" value={values.notes}
          error={errors.notes} onChange={handleChange} multiline numberOfLines={3} />
      </FormSection>
      
      <FormActions onSubmit={handleSubmit} onCancel={() => navigation.goBack()}
        submitLabel={isEditing ? 'Salvar' : 'Criar Protocolo'} loading={isLoading} />
    </ScrollView>
  )
}
```

---

### T2.4 — `TreatmentPlanSelector`

```jsx
// UX Flow:
// 1. Mostra picker com planos existentes do user + opção "Criar novo"
// 2. Se "Criar novo" → inline input (nome + emoji + cor)
// 3. Criar o plano on-the-fly via treatmentPlanService.create()
// 4. Selecionar automaticamente o plano recém-criado

// Props
{
  value,        // string | null — treatment_plan_id
  onChange,     // (id: string | null) => void
}
```

---

### T3.1 — `createProtocolRepository` (Factory — G2)

```javascript
export function createProtocolRepository({ supabase, getUserId }) {
  // Mesmo padrão de createMedicineRepository
  // NOTA: advanceTitrationStage() também entra na factory
  // mesmo que mobile v1 não use — web usa!
  
  async function getAll() { /* join medicine + treatment_plan */ }
  async function getActive(date) { /* filtro temporal */ }
  async function getById(id) { /* join */ }
  async function create(protocol) { /* Zod + insert + titration defaults */ }
  async function update(id, updates) { /* Zod + update */ }
  async function remove(id) { /* delete */ }
  async function getByMedicineId(medicineId) { /* filter */ }
  async function advanceTitrationStage(id, markAsCompleted) { /* titration logic */ }
  
  return { getAll, getActive, getById, create, update, remove, getByMedicineId, advanceTitrationStage }
}
```

**Atenção**: `advanceTitrationStage` usa `getServerTimestamp()`. Na factory, usar `new Date().toISOString()` ou aceitar como parâmetro. Decidir na implementação.

---

## Novas Rotas

```javascript
// routes.js — adições
export const ROUTES = {
  // ... existentes ...
  
  // Sub-rotas de Tratamentos (expand)
  PROTOCOL_FORM: 'ProtocolForm',       // [NEW] create/edit
  PROTOCOL_DETAIL: 'ProtocolDetail',    // [NEW] detalhes expandidos (renomear de TREATMENT_DETAIL?)
}
```

---

## Quality Gates — Fase 2

### G1 — Gate de Cópia

| Critério | Validação |
|----------|-----------|
| `protocolCreateSchema` com refines funciona no Hermes | Teste unitário mobile |
| CRUD protocolo funcional no simulador iOS + Android | Smoke test |
| TimeSchedulePicker add/remove horários sem crash | Demo gravada |
| MedicineSelector lista medicamentos do user | Depends on Fase 1 |
| `validate:agent` web 100% green | `rtk npm run validate:agent` |

### G2 — Gate de Extração

| Critério | Validação |
|----------|-----------|
| `createProtocolRepository` inclui `advanceTitrationStage` | Teste unitário |
| Mobile usa factory — testes passam | CI |
| Diff factory vs service < 5% | `rtk diff` |

### G3 — Gate de Migração

| Critério | Validação |
|----------|-----------|
| Web `protocolService.js` usa factory | Grep verification |
| Web `treatmentPlanService.js` usa factory | Grep verification |
| `validate:agent` web 100% green + build OK | CI |
| Services locais web DELETADOS | `find` verification |

---

## Delegação de Agentes

| Task ID | Agente | Motivo |
|---------|--------|--------|
| T1.1, T1.3 | 👤 Arquiteto | Adaptação com exclusão de titulação |
| T1.2 | 🤖 Builder | Service simples sem complexidade |
| T1.4-T1.8 | 🤖 Builder | Extensão de padrões Fase 1 |
| T2.1 | 👤 Arquiteto | TimeSchedulePicker é UX complexo |
| T2.2-T2.3 | 🤖 Builder | Componentes padrão |
| T2.4-T2.5 | 👤 Arquiteto | Formulário multi-seção + inline creation |
| T2.8 | 👤 Arquiteto | Cross-domain dependency check |
| T3.1, T3.6 | 👤 Arquiteto | Factory + migração web |
| T3.2-T3.3, T3.7-T3.9 | 🤖 Builder | Tasks mecânicas |
