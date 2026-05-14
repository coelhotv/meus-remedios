# EXEC SPEC — Fase Pré-Requisitos (Fundação)

> **Duração**: 2-3 sprints semanais  
> **Branch base**: `feat/crud-foundation`  
> **Referência**: 'plans/backlog-native_app/MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md' §9 (Pré-Requisitos)
> **Pré-condição**: Nenhuma — esta fase é o ponto zero

---

## Objetivo

Construir os 3 blocos de infraestrutura que todas as fases CRUD subsequentes necessitam:

1. **Form Kit** — componentes de formulário reutilizáveis + hook `useFormState`
2. **Mutation Infrastructure** — hook `useMutation` para C/U/D operations
3. **ANVISA Infrastructure** — Supabase Storage bucket + hook `useMedicineDatabase`

Sem estes blocos, nenhuma Fase (1–6) pode começar.

---

## Sprint Breakdown

### Sprint P.1 — Form Kit Core (Semana 1)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| P1.1 | Hook `useFormState(schema)` | `apps/mobile/src/shared/hooks/useFormState.js` | 🤖 Builder | ⭐⭐⭐ |
| P1.2 | `FormInput` component | `apps/mobile/src/shared/components/form/FormInput.jsx` | 🤖 Builder | ⭐⭐ |
| P1.3 | `FormSelect` component | `apps/mobile/src/shared/components/form/FormSelect.jsx` | 🤖 Builder | ⭐⭐ |
| P1.4 | `FormDatePicker` component | `apps/mobile/src/shared/components/form/FormDatePicker.jsx` | 🤖 Builder | ⭐⭐ |
| P1.5 | `FormTimePicker` component | `apps/mobile/src/shared/components/form/FormTimePicker.jsx` | 🤖 Builder | ⭐⭐ |
| P1.6 | `FormSection` + `FormActions` | `apps/mobile/src/shared/components/form/FormSection.jsx`, `FormActions.jsx` | 🤖 Builder | ⭐ |
| P1.7 | Barrel export `form/index.js` | `apps/mobile/src/shared/components/form/index.js` | 🤖 Builder | ⭐ |
| P1.8 | Testes unitários do `useFormState` | `apps/mobile/src/shared/hooks/__tests__/useFormState.test.js` | 🤖 Builder | ⭐⭐⭐ |

**Entrega**: PR `feat/crud-foundation-form-kit` → merge em `feat/crud-foundation`

---

### Sprint P.2 — Mutation Hook + ANVISA Infrastructure (Semana 2)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| P2.1 | Hook `useMutation()` | `apps/mobile/src/shared/hooks/useMutation.js` | 👤 Arquiteto | ⭐⭐⭐ |
| P2.2 | Testes do `useMutation` | `apps/mobile/src/shared/hooks/__tests__/useMutation.test.js` | 🤖 Builder | ⭐⭐ |
| P2.3 | Upload ANVISA JSONs → Supabase Storage | Manual (dashboard) + script | 👤 Humano | ⭐ |
| P2.4 | Hook `useMedicineDatabase()` | `apps/mobile/src/shared/hooks/useMedicineDatabase.js` | 👤 Arquiteto | ⭐⭐⭐ |
| P2.5 | Testes do `useMedicineDatabase` | `apps/mobile/src/shared/hooks/__tests__/useMedicineDatabase.test.js` | 🤖 Builder | ⭐⭐ |
| P2.6 | `FormAutocomplete` component | `apps/mobile/src/shared/components/form/FormAutocomplete.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| P2.7 | Tela de busca ANVISA (stack) | `apps/mobile/src/features/medications/screens/AnvisaSearchScreen.jsx` | 🤖 Builder | ⭐⭐ |
| P2.8 | Smoke test E2E no simulador | Manual | 👤 Humano | ⭐ |

**Entrega**: PR `feat/crud-foundation-mutations-anvisa` → merge em `feat/crud-foundation`

---

### Sprint P.3 — Integração + Polish (Semana 3, se necessário)

| # | Task | Arquivos | Agente | Complexidade |
|---|------|----------|--------|-------------|
| P3.1 | `DeleteConfirmation` bottom sheet | `apps/mobile/src/shared/components/feedback/DeleteConfirmation.jsx` | 🤖 Builder | ⭐⭐ |
| P3.2 | `Toast` / feedback de sucesso | `apps/mobile/src/shared/components/feedback/Toast.jsx` | 🤖 Builder | ⭐⭐ |
| P3.3 | Haptics wrapper (expo-haptics) | `apps/mobile/src/shared/utils/haptics.js` | 🤖 Builder | ⭐ |
| P3.4 | Novas rotas no `routes.js` | `apps/mobile/src/navigation/routes.js` | 🤖 Builder | ⭐ |
| P3.5 | Integration test Form Kit completo | `apps/mobile/src/shared/components/form/__tests__/FormKit.integration.test.jsx` | 👤 Arquiteto | ⭐⭐⭐ |
| P3.6 | Documentação interna do Form Kit | `plans/backlog-native_app/docs/FORM_KIT.md` | 🤖 Builder | ⭐ |

**Entrega**: PR `feat/crud-foundation-polish` → merge em `feat/crud-foundation` → merge em `main`

---

## Especificações Técnicas Detalhadas

### P1.1 — `useFormState(schema)` — Hook Core

```javascript
// API Surface
const {
  values,          // { name: '', dosage_per_pill: 0, ... }
  errors,          // { name: 'Nome deve ter pelo menos 2 caracteres', ... }
  touched,         // { name: true, dosage_per_pill: false, ... }
  isDirty,         // boolean — algum campo mudou vs initial
  isValid,         // boolean — sem erros
  handleChange,    // (field, value) => void
  handleBlur,      // (field) => void — marca touched + valida campo
  validate,        // () => boolean — valida tudo, seta errors, retorna isValid
  reset,           // (initialValues?) => void
  setValues,       // (partial) => void — merge parcial (ex: auto-fill ANVISA)
  scrollToFirstError, // () => void — usa refs para scroll (opcional, pode ser NOP na v1)
} = useFormState(schema, { initialValues })
```

**Regras de implementação**:
1. `schema` é um Zod schema de `@dosiq/core` (ex: `medicineCreateSchema`)
2. Validação **on blur** por campo (`schema.pick({ [field]: true }).safeParse`)
3. Validação **full** no `validate()` — chamado antes de submit
4. `errors` é resetado campo a campo conforme o user corrige
5. `handleChange` limpa o error do campo que mudou (UX imediato)
6. `setValues` é para auto-fill (ex: selecionar um medicamento ANVISA preenche nome + princípio ativo)

**Zod gotcha (Hermes)**:
- Usar `safeParse()` sempre (nunca `parse()` que lança)
- Testar `.pick()` no Hermes — se falhar, usar validação manual por campo

---

### P2.1 — `useMutation()` — Hook de Mutations

```javascript
// API Surface
const {
  mutate,     // (asyncFn) => Promise<result>
  isLoading,  // boolean
  error,      // Error | null
  reset,      // () => void — limpa error
} = useMutation({
  onSuccess: (data) => { /* invalidate cache, toast, navigate back */ },
  onError: (err) => { /* toast error */ },
  invalidateKeys: ['treatments', 'medicines'], // AsyncStorage keys para invalidar
})

// Uso
const handleSubmit = () => {
  mutate(() => medicineService.create(values))
}
```

**Regras de implementação**:
1. Guard contra double-submit (se `isLoading`, `mutate` é NOP)
2. `try/catch` wrapper com parsing de erros Supabase
3. `invalidateKeys` limpa AsyncStorage snapshots para forçar re-fetch
4. Haptic feedback: success → `Haptics.notificationAsync(Success)`, error → `Haptics.notificationAsync(Error)`
5. Timeout de 15s com abort controller (R-168 Hermes safety)

---

### P2.4 — `useMedicineDatabase()` — Cache ANVISA

```javascript
// API Surface
const {
  search,         // (query: string, limit?: number) => MedicineResult[]
  getByName,      // (name: string) => MedicineResult | null
  isReady,        // boolean — database loaded
  isLoading,      // boolean — downloading/loading
  lastUpdated,    // Date | null — quando o cache foi atualizado
  error,          // string | null
} = useMedicineDatabase()
```

**Fluxo de dados**:
```
mount → AsyncStorage.getItem('@dosiq/anvisa-manifest')
  ├── null → fetch manifest.json de Supabase Storage
  │         → comparar versão
  │         → se diferente ou null → download medicineDatabase.json
  │         → AsyncStorage.setItem('@dosiq/anvisa-data', compressed)
  │         → AsyncStorage.setItem('@dosiq/anvisa-manifest', { version, timestamp })
  └── exists → load da AsyncStorage
              → background check manifest version (silent update)
```

**Supabase Storage URL**:
```
https://<PROJECT_ID>.supabase.co/storage/v1/object/public/dosiq-assets/anvisa/v1/manifest.json
https://<PROJECT_ID>.supabase.co/storage/v1/object/public/dosiq-assets/anvisa/v1/medicineDatabase.json
```

**Regras de implementação**:
1. `search()` usa `normalizeText()` idêntico ao `medicineDatabaseService.js` da web (NFD + diacríticos)
2. JSON é armazenado como string no AsyncStorage (sem compressão na v1 — 1.34 MB é aceitável)
3. Se download falhar → formulário funciona sem autocomplete (UX graceful degradation)
4. Cache TTL: 7 dias — após isso, re-verifica manifest em background
5. Laboratórios (14 KB) incluídos no mesmo download (manifest controla ambos)

---

### P1.2–P1.6 — Form Components (Padrão Comum)

Cada componente segue este contrato:

```jsx
// Props padrão
{
  name,           // string — chave no values/errors (ex: 'name', 'dosage_per_pill')
  label,          // string — label visual
  value,          // any — controlled value
  error,          // string | undefined — mensagem de erro
  onChange,        // (name, value) => void
  onBlur,         // (name) => void
  disabled,       // boolean
  placeholder,    // string
  helperText,     // string — texto auxiliar permanente
  required,       // boolean — * visual no label
}
```

**Estilos**: Todos usam `tokens.js` (colors, spacing, borderRadius). Sem StyleSheet inline para cores/espaçamentos.

**Animações**: Error state com `Animated.spring` no border color (red shake).

**Acessibilidade**: `accessibilityLabel`, `accessibilityHint` em todos os inputs.

---

## Estrutura de Diretórios (Resultado Final)

```
apps/mobile/src/
  shared/
    components/
      form/                          ← [NEW] Form Kit
        FormInput.jsx
        FormSelect.jsx
        FormDatePicker.jsx
        FormTimePicker.jsx
        FormAutocomplete.jsx
        FormSection.jsx
        FormActions.jsx
        index.js                     ← barrel export
        __tests__/
          FormKit.integration.test.jsx
      feedback/                      ← [EXPAND]
        StaleBanner.jsx              ← existente
        DeleteConfirmation.jsx       ← [NEW]
        Toast.jsx                    ← [NEW]
    hooks/
      useFormState.js                ← [NEW]
      useMutation.js                 ← [NEW]
      useMedicineDatabase.js         ← [NEW]
      __tests__/
        useFormState.test.js         ← [NEW]
        useMutation.test.js          ← [NEW]
        useMedicineDatabase.test.js  ← [NEW]
    utils/
      haptics.js                     ← [NEW]
  features/
    medications/                     ← [NEW domain]
      screens/
        AnvisaSearchScreen.jsx       ← [NEW]
  navigation/
    routes.js                        ← [MODIFY] add MEDICATIONS routes
```

---

## Quality Gate (Pré-Requisitos → Fase 1)

| Critério | Bloqueante | Validação |
|----------|-----------|-----------|
| `useFormState` com `medicineCreateSchema` produz errors corretos | ✅ | Teste unitário |
| `useMutation` executa create + mostra loading + feedback | ✅ | Teste unitário |
| Form Kit renderiza sem crash no Hermes | ✅ | Simulador iOS+Android |
| ANVISA database baixa e busca funciona no mobile | ✅ | Smoke test manual |
| `validate:agent` web 100% green (zero regressão) | ✅ | `rtk npm run validate:agent` |
| Build mobile `npx expo export` sem erros | ✅ | CI |

---

## Delegação de Agentes

| Complexidade | Agente | Modelo Sugerido |
|-------------|--------|-----------------|
| ⭐ (trivial) | 🤖 Sub-agente builder | Modelo leve (flash/haiku) |
| ⭐⭐ (standard) | 🤖 Sub-agente builder | Modelo médio (sonnet/flash-thinking) |
| ⭐⭐⭐ (complexo) | 👤 Arquiteto principal | Modelo forte (opus/pro) |

**Regra**: Tarefas ⭐⭐⭐ SEMPRE são revisadas pelo arquiteto antes de merge.
