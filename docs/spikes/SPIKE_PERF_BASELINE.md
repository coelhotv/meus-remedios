# SPIKE — Performance Baseline Mobile

> **Status**: Investigação (timebox 1.5h)
> **Data**: 2026-05-16 (Spike Pre-Fase-2)
> **Origem**: RETRO_FASE1 §6 T8 — sem baseline = sem detectar regressões
> **Decisão**: Capturar baseline antes de Fase 2 + instrumentação leve

---

## Problema

Fase 0 entregou Form Kit (119 mobile tests passando) e Fase 1 entregou CRUD Medicamentos (12 tests + 530 web), mas **nunca medimos**:
- Cold start (time-to-first-screen) mobile
- JS bundle size mobile (Hermes-compiled)
- Time-to-Interactive (TTI) após cold start
- Bundle size web

Sem baseline = ao terminar Fase 2 não saberemos se regredimos performance.

## Métricas que importam (priorizadas)

### Tier 1 — Críticas (medir agora)
1. **Mobile cold start** (`app.launch_time` Firebase Analytics ou manual via `Date.now()` em `App.js`)
2. **Mobile JS bundle size** (Expo build output ou `npx expo export` analysis)
3. **Web bundle size** (Vite `dist/` total + per-chunk; já existe `bundleVisualizer` no projeto?)

### Tier 2 — Importantes (medir se Tier 1 mostrar dor)
4. **Mobile TTI** (screen-by-screen via custom `performance.now()` em mount/unmount)
5. **Mobile memory pressure** (Firebase Crashlytics ou Android Studio Profiler manual)
6. **API call latency** (Supabase response times — `getAll` medicines, protocols, etc.)

### Tier 3 — Nice-to-have
7. Frame rate em scroll de listas longas (FlatList performance)
8. Image loading time (ANVISA mocks, ícones)

## Instrumentação proposta (leve — não tooling pesado)

### Cold start — Mobile

Adicionar ao `apps/mobile/App.js`:

```javascript
import { useEffect } from 'react'
import analytics from '@react-native-firebase/analytics'

const APP_START_TS = Date.now() // capturado no top-level do módulo

export default function App() {
  useEffect(() => {
    const launchMs = Date.now() - APP_START_TS
    if (__DEV__) console.log(`[perf] cold_start: ${launchMs}ms`)
    analytics().logEvent('cold_start', { duration_ms: launchMs })
  }, [])
  // ...
}
```

**Custo**: ~10 LOC, 1 evento Firebase por launch. Já temos Firebase Analytics instalado.

### Bundle size — Mobile

Rodar `npx expo export --platform ios` e `npx expo export --platform android`. Output em `dist/` mostra tamanho do bundle JS Hermes + assets. Capturar baseline em arquivo:

```bash
# Em CI ou script local pré-merge mãe→main
npx expo export --platform ios 2>&1 | tee perf-baseline-ios.txt
npx expo export --platform android 2>&1 | tee perf-baseline-android.txt
```

**Captura inicial sugerida**: rodar em main pós-Fase-1 antes de iniciar Fase 2.

### Bundle size — Web

Vite já emite warnings de chunk size > 500kb. Capturar baseline:

```bash
cd apps/web && rtk npm run build 2>&1 | tee perf-baseline-web.txt
```

Output mostra cada chunk + total gzipped. Comparar pre vs post Fase 2 em PRs G3.

### TTI por tela (Tier 2 — adiar)

Pattern proposto se Tier 1 mostrar regressão:

```javascript
// useScreenPerf.js — custom hook
import { useEffect, useRef } from 'react'

export function useScreenPerf(screenName) {
  const mountedAt = useRef(Date.now())
  useEffect(() => {
    const tti = Date.now() - mountedAt.current
    if (__DEV__) console.log(`[perf] ${screenName} TTI: ${tti}ms`)
  }, [screenName])
}

// Uso em cada screen:
useScreenPerf('TreatmentsScreen')
```

---

## Procedimento de captura inicial (executar AGORA)

Antes do PR final do spike pre-fase-2 incluir os números:

```bash
# Web bundle baseline (em main, pós Fase 1)
cd apps/web && rtk npm run build > /tmp/perf-web-pre-f2.txt 2>&1
# Extrair: total dist size, vendor chunks size

# Mobile bundle baseline (em main, pós Fase 1)
cd apps/mobile && npx expo export --platform ios > /tmp/perf-ios-pre-f2.txt 2>&1
cd apps/mobile && npx expo export --platform android > /tmp/perf-android-pre-f2.txt 2>&1
```

**⚠️ Captura real fica para o user executar quando ambiente estiver pronto** — agente não roda `expo export` sem aprovação (pode triggar warnings/auth).

---

## Critério de regressão (post-Fase-2)

| Métrica | Threshold de regressão |
|---------|------------------------|
| Mobile cold start | > 1500ms baseline (variar ±10% OK) |
| Mobile bundle JS | > +5% vs baseline |
| Web bundle (gzipped) | > 110 kB (atual ~102 kB pós lazy load) |
| Web `validate:agent` | < 530 tests passing OU duration > +50% |

Se qualquer threshold for ultrapassado em PR Fase 2 → PR HALT, análise antes de prosseguir.

---

## Decisão recomendada

1. **Capturar baseline AGORA** (web bundle via `rtk npm run build`; mobile via Expo export quando user autorizar)
2. **Instrumentar cold start** mobile via Firebase Analytics (~10 LOC, low risk) — pode entrar no Sprint T2.1
3. **Adiar TTI per-screen** (Tier 2) — só se cold start mostrar regressão
4. **Adicionar comparação de bundle size** ao smoke checklist Fase 2 (`PROTOCOLS_G3_SMOKE_CHECKLIST.md` já tem placeholder em "Critério de aprovação")

---

## Histórico

- 2026-05-16 — spike inicial; baseline real pendente de execução pelo user
