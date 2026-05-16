# SPIKE — Performance Baseline + Crash Tracking Mobile

> **Status**: Parcialmente aplicado (web bundle capturado + Crashlytics + cold start integrados; mobile bundle pendente)
> **Data**: 2026-05-16 (Spike Pre-Fase-2)
> **Origem**: RETRO_FASE1 §6 T8 + decisão PO 2026-05-16 (integrar Crashlytics aproveitando Firebase já ativo)
> **Decisão**: Integração Tier 1 (Analytics cold start + Crashlytics) feita NESTE PR; captura bundle mobile pendente

---

## Problema

Fase 0 entregou Form Kit (119 mobile tests passando) e Fase 1 entregou CRUD Medicamentos (12 tests + 530 web), mas **nunca medimos**:
- Cold start (time-to-first-screen) mobile
- JS bundle size mobile (Hermes-compiled)
- Time-to-Interactive (TTI) após cold start
- Bundle size web
- Crashes em produção (especialmente cenários legacy como Android API 24 onde tivemos crash rn-screens em Fase 1)

Sem baseline + sem crash tracking = ao terminar Fase 2 não saberemos se regredimos performance nem se quebramos algo em prod.

---

## Métricas que importam (priorizadas)

### Tier 1 — Críticas (cobertura inicial NESTE spike)
1. **Mobile cold start** — `analytics().logEvent('cold_start', { duration_ms })` ✅ integrado em `AppRoot.jsx`
2. **Mobile crash tracking** — `@react-native-firebase/crashlytics` ✅ instalado + plugin + ErrorBoundary global
3. **Web bundle size** — ✅ capturado (números em §Baseline atual)
4. **Mobile JS bundle size** — ⏳ pendente (executar `npx expo export` quando EAS build estiver pronto)

### Tier 2 — Importantes (medir se Tier 1 mostrar dor)
5. **Mobile TTI** screen-by-screen via custom `performance.now()` em mount/unmount
6. **Mobile memory pressure** — Firebase Performance Monitoring (não Crashlytics) ou Android Studio Profiler manual
7. **API call latency** — Supabase response times (`getAll` medicines/protocols/etc)

### Tier 3 — Nice-to-have
8. Frame rate em scroll de listas longas (FlatList performance)
9. Image loading time (ANVISA mocks, ícones)

---

## Baseline atual capturado

### Web bundle (`apps/web/dist/`) — 2026-05-16 pós-Fase-1

| Métrica | Valor |
|---------|-------|
| Total `dist/` | 14 MB (inclui sourcemaps + assets) |
| Total JS files | 36 arquivos |
| Total JS sum | 3.36 MB (raw, sem gzip) |
| **Maior chunk** | `feature-medicines-db-CCIbo1ef.js` 1.34 MB raw / **129 kB gzip** (ANVISA DB) |
| `vendor-pdf` | 588 kB / 174 kB gzip |
| `index` (entry) | 247 kB / 76 kB gzip |
| `feature-stock` | 219 kB / 61 kB gzip |
| `vendor-supabase` | 204 kB / 53 kB gzip |
| `index.es` (zod?) | 159 kB / 53 kB gzip |
| `vendor-framer` | 134 kB / 44 kB gzip |
| `Treatments` view | 41 kB / 12 kB gzip |
| `Dashboard` | 40 kB / 13 kB gzip |
| Service worker (PWA) | 17 kB / 6 kB gzip |
| Precache total (Workbox) | 3.6 MB / 63 entries |
| Build time | 3.44s |

**Critical path** (entry + main vendor + index.es): ~280 kB gzip
**Lazy loaded medicines-db**: 129 kB gzip (apenas quando user abre busca ANVISA)

### Mobile bundle — ⏳ pendente

Comandos para captura (executar quando EAS build estiver pronto pós install Crashlytics):

```bash
cd apps/mobile
npx expo export --platform ios     > /tmp/perf-ios-pre-f2.txt 2>&1
npx expo export --platform android > /tmp/perf-android-pre-f2.txt 2>&1
```

Anotar aqui o resultado: tamanho do bundle Hermes + assets totais por plataforma.

---

## Instrumentação aplicada NESTE PR

### 1. Cold start telemetry (`AppRoot.jsx`)

```javascript
const APP_START_TS = Date.now() // top-level do módulo (antes de React mount)

export default function AppRoot() {
  const [fontsLoaded] = useFonts({ ... })

  useEffect(() => {
    if (!fontsLoaded) return
    const launchMs = Date.now() - APP_START_TS
    if (__DEV__) debugLog(`[perf] cold_start: ${launchMs}ms`)
    analytics().logEvent('cold_start', { duration_ms: launchMs }).catch(() => {})
  }, [fontsLoaded])
  // ...
}
```

- Dispara 1x quando fontes carregam (app considerado "interativo")
- Log em dev via `debugLog`; produção envia evento `cold_start` para Firebase Analytics
- Custo: ~5 LOC + 1 evento/launch

### 2. Crashlytics (ErrorBoundary global + native crashes)

**Pacote**: `@react-native-firebase/crashlytics@21.14.0` instalado.
**Plugin Expo**: `'@react-native-firebase/crashlytics'` adicionado a `apps/mobile/app.config.js`.

**ErrorBoundary** (`apps/mobile/src/shared/components/ErrorBoundary.jsx`):
- Class component (necessário para `componentDidCatch`)
- Em dev: `console.error` + re-throw (LogBox/RedBox padrão)
- Em prod: fallback UI ("Algo deu errado" + botão "Tentar novamente") + `crashlytics().recordError(error)`
- Wrappa toda a árvore via `AppRoot.jsx`:
  ```jsx
  <ErrorBoundary>
    <SafeAreaProvider>
      <ToastProvider>
        <Navigation />
      </ToastProvider>
    </SafeAreaProvider>
  </ErrorBoundary>
  ```

**Cobertura automática** (sem código adicional):
- Crashes nativos iOS (Objective-C/Swift) → Firebase Console
- Crashes nativos Android (Java/Kotlin) → Firebase Console
- Crashes JS não-tratados (capturados pelo ErrorBoundary) → Firebase Console

### 3. Smoke test crash (pendente — adicionar dev-only)

Quando EAS build estiver pronto, adicionar botão escondido em `MedicineDemoScreen` (tela `_dev`):
```jsx
<Pressable onPress={() => crashlytics().crash()}>
  <Text>Trigger crash (dev only)</Text>
</Pressable>
```
Valida pipeline Crashlytics em dev antes de assumir que funciona em prod.

---

## Próximos passos (pós-merge deste PR)

| Ordem | Ação | Owner | Bloqueia Fase 2? |
|-------|------|-------|------------------|
| 1 | EAS build novo com Crashlytics plugin (precisa rebuild nativo) | User | ⚠️ Recomendado antes de T2.1 |
| 2 | Capturar bundle mobile via `expo export` | User | ❌ |
| 3 | Smoke test crash em dev (trigger + verificar no Firebase Console) | User | ❌ |
| 4 | Ajustar thresholds nesta doc com números reais (substituir chutes) | Opus pós-baseline | ❌ |
| 5 | TTI per-screen (Tier 2) — só se cold start mostrar regressão | Adiado | ❌ |

---

## Critério de regressão (post-Fase-2)

> Thresholds atuais são **conservadores** — refinar após captura real do bundle mobile.

| Métrica | Threshold de regressão |
|---------|------------------------|
| Mobile cold start | > +20% vs baseline (capturado via evento Firebase) |
| Mobile bundle JS (Hermes) | > +5% vs baseline mobile |
| Web bundle critical path (entry+vendor+index.es) | > 310 kB gzip (atual ~280 kB +10%) |
| Web `vendor-supabase` | > 60 kB gzip (atual 53 kB) |
| Web `feature-medicines-db` | manter lazy load — chunk não pode entrar em critical path |
| Web `validate:agent` | < 530 tests passing OU duration > +50% |
| Crashlytics crash-free rate | < 99% sessions em dev/staging (medir ao longo das semanas) |

Se qualquer threshold for ultrapassado em PR Fase 2 → PR HALT, análise antes de prosseguir.

---

## Decisão final

1. ✅ Capturar web bundle baseline — **feito neste PR**
2. ✅ Integrar Crashlytics + ErrorBoundary global — **feito neste PR**
3. ✅ Instrumentar cold start mobile — **feito neste PR**
4. ⏳ Capturar mobile bundle baseline — pendente (user roda `expo export` pós-EAS build)
5. ⏳ Smoke test crash dev — pendente (T2.1)
6. 🔜 TTI per-screen (Tier 2) — só se cold start mostrar regressão
7. ✅ Adicionar comparação de bundle ao `PROTOCOLS_G3_SMOKE_CHECKLIST.md`

---

## Histórico

- 2026-05-16 (manhã) — spike inicial; só investigação e proposta
- 2026-05-16 (tarde) — PO autorizou integrar Crashlytics. Web bundle capturado, Crashlytics instalado + ErrorBoundary + cold start telemetry. Mobile bundle pendente de EAS build.
