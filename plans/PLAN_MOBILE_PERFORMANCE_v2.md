# 📱 Plano de Performance Mobile v2.0 — Meus Remédios
**Data:** 2026-03-09 | **Baseado em:** Leitura linha a linha de `HealthHistory.jsx` e `adherencePatternService.js`

> **AVISO:** A primeira versão deste plano marcou estratégias existentes como ✅ funcionais.
> Após análise do código real, algumas dessas "estratégias" são a **causa direta do freeze** no iPhone 13.
> Este documento corrige isso com rastreamento linha por linha.

---

## 🔥 Post-Mortem: A Sequência Real do Freeze (iPhone 13, Safari/Chrome)

O usuário toca em "Saúde". O que acontece, em ordem:

### Fase 1 — Parse/Compile JS (Freeze #0, ~200-400ms)

`HealthHistory.jsx` tem **4 imports pesados, todos síncronos** (linhas 6-14):

```js
// HealthHistory.jsx linhas 6-14 — todos carregados ANTES de qualquer render
import { analyzeAdherencePatterns } from '@adherence/services/adherencePatternService' // 230 linhas
import CalendarWithMonthCache from '@shared/components/ui/CalendarWithMonthCache'      // desconhecido
import SparklineAdesao from '@dashboard/components/SparklineAdesao'                    // 518 linhas!
import AdherenceHeatmap from '@adherence/components/AdherenceHeatmap'                  // desconhecido
```

O Safari no iPhone 13 precisa **parsear e compilar** todos esses módulos antes de mostrar qualquer coisa. `SparklineAdesao.jsx` tem 518 linhas de SVG e Framer Motion. Isso trava a Main Thread.

**O "lazy loading" do IntersectionObserver controla quando o DADO carrega — mas o JavaScript já foi compilado.**

---

### Fase 2 — Render Inicial + IntersectionObserver imediato (Freeze #1)

`setIsLoading(false)` é chamado na linha 111. O React renderiza o JSX, que inclui:

```jsx
// HealthHistory.jsx linha 318 — O SENTINEL ESTÁ AQUI, NO MEIO DA PÁGINA
<div ref={heatmapSentinelRef} />
```

O sentinel fica **antes** das seções de Sparkline, Stats e Timeline. Com `rootMargin: '200px'`, o IntersectionObserver dispara **imediatamente** ao abrir a view — o elemento não precisa nem ser visível.

**Resultado:** `logService.getAll(500)` é chamado na abertura da view, não no scroll.

---

### Fase 3 — SparklineAdesao trava a Main Thread (Freeze #2, ~300-600ms)

O carregamento em background retorna (linha 113-116):
```js
const [summary, daily] = await Promise.all([
  adherenceService.getAdherenceSummary('30d').catch(() => null),
  adherenceService.getDailyAdherence(30).catch(() => []),
])
setDailyAdherence(daily) // ← dispara re-render com SparklineAdesao
```

`SparklineAdesao` (`size="expanded"`, linha 338) renderiza com 30 pontos de dados. 518 linhas de cálculo SVG + Framer Motion na Main Thread do Safari. Nenhuma proteção com `startTransition` ou `defer`.

---

### Fase 4 — `analyzeAdherencePatterns` em 500 logs: Zod + loops (Freeze #3, ~200-500ms)

Os 500 logs retornam do `logService.getAll(500)`. O `useMemo` na linha 69-85 dispara **sincronamente**:

```js
// HealthHistory.jsx linha 74 — roda na Main Thread, não em Worker
const pattern = analyzeAdherencePatterns({
  logs: allLogsForAnalysis, // 500 itens
  protocols: protocols.filter((p) => p.active),
})
```

Dentro de `analyzeAdherencePatterns` (adherencePatternService.js):
- **Linha 120:** `validateAnalyzeAdherencePatternsInput({ logs, protocols })` → **Zod valida 500 objetos** sincrono
- **Linha 134-141:** Loop O(n) com `new Date(log.taken_at)` para cada um dos 500 logs
- **Linha 146-154:** Segundo loop para `uniqueDates` + `Set` operations

Tudo isso acontece na Main Thread. O UI fica travado até terminar.

---

### Fase 5 — Re-render desnecessário (Freeze #4, menor)

```js
// HealthHistory.jsx linhas 154-156 — useEffect que copia memo para state
useEffect(() => {
  setAdherencePattern(adherencePatternData) // ← causa um render extra desnecessário
}, [adherencePatternData])
```

`adherencePatternData` já é um `useMemo`. Copiá-lo para um `useState` via `useEffect` adiciona um ciclo de render que serve a propósito zero.

---

### Fase 6 — Cálculos inline no render (a cada re-render)

```js
// HealthHistory.jsx linhas 242-245 — NÃO estão em useMemo
const pillsThisMonth = currentMonthLogs.reduce((sum, log) => sum + log.quantity_taken, 0)
const daysThisMonth = new Set(
  currentMonthLogs.map((log) => new Date(log.taken_at).toLocaleDateString('pt-BR'))
).size
```

Cada re-render (e há muitos, vide Fases 3 e 4) recalcula esses valores. Com 200+ logs no mês, não é trivial.

---

## 📊 Reclassificação dos Bottlenecks (após análise real)

| # | Problema | Arquivo / Linha | Impacto Real | Status real |
|---|---------|----------------|-------------|-------------|
| 1 | Imports síncronos de SparklineAdesao + AdherenceHeatmap | `HealthHistory.jsx:13-14` | Freeze #0 ao abrir | ❌ Quebrado |
| 2 | IntersectionObserver dispara imediatamente (rootMargin + posição do sentinel) | `HealthHistory.jsx:131-152, 318` | Carrega 500 logs imediatamente | ❌ Ilusão de lazy |
| 3 | `analyzeAdherencePatterns` síncrono com Zod em 500 itens | `HealthHistory.jsx:69-85` + `adherencePatternService.js:120` | Freeze #3 na Main Thread | ❌ Quebrado |
| 4 | `SparklineAdesao` renderiza ao receber `dailyAdherence` sem proteção | `HealthHistory.jsx:335-340` | Freeze #2 no retorno da rede | ❌ Quebrado |
| 5 | `useState` copiando `useMemo` via `useEffect` | `HealthHistory.jsx:154-156` | Render extra desnecessário | ❌ Desnecessário |
| 6 | Cálculos `reduce`/`Set` inline no render sem `useMemo` | `HealthHistory.jsx:242-245` | CPU desperdiçada em cada re-render | ❌ Incorreto |
| 7 | Lista de logs sem virtualização (`.map()`) | `HealthHistory.jsx:365-367` | Jank no scroll com 30+ itens | ❌ Falta implementar |
| 8 | DB sem índice composto confirmado | Supabase | Queries lentas em tabela grande | ❓ Desconhecido |

**As "estratégias existentes" que NÃO estão funcionando:**
- ✅→❌ "IntersectionObserver para lazy heatmap": o sentinel dispara antes do scroll
- ✅→❌ "Carregamento em tiers": os tiers existem mas o Tier 2 (SparklineAdesao) trava a thread igual
- ✅→❌ "getAll(500) limitado": os 500 registros são carregados E processados sincronamente na thread principal

---

## 🎯 Alvos de Hardware (Brasil Real, 2026)

| Dispositivo | RAM | CPU | Conexão |
|-------------|-----|-----|---------|
| Moto G Play (2021-2024) | 3-4 GB | Snapdragon 460 | 4G variável |
| Samsung Galaxy A13/A14 | 4 GB | Exynos 850 | 4G/3G |
| Xiaomi Redmi 9/10 | 3-4 GB | Helio G85 | 4G variável |
| iPhone 13 | 4 GB | A15 Bionic | LTE |

**Metas (medidas no Chrome DevTools com CPU 4x throttle + 4G simulado):**
- View "Saúde" abre sem freeze visível: INP < 200ms
- LCP: < 2.5s
- Heap: < 80MB após 500 logs
- FPS durante scroll: ≥ 55fps

---

## 🏗️ Sprints por Ordem de Impacto

```
M0 — Correções de Emergência (sem nova biblioteca, 1 dia) ← CRÍTICO, fazer primeiro
M1 — Virtualização de Lista (react-virtuoso, 1-2 dias)
M2 — Code Splitting e Lazy Routes (1 dia)
M3 — Banco de Dados: Índices e Views (0.5 dia)
M4 — Service Worker Offline (2 dias)
```

---

# SPRINT M0 — CORREÇÕES DE EMERGÊNCIA (HealthHistory.jsx)

**Objetivo:** Eliminar os freezes confirmados sem adicionar dependências novas.
**Arquivo:** `src/views/HealthHistory.jsx`
**Estimativa:** 1 dia de desenvolvimento.

---

## M0.1 — Lazy import de SparklineAdesao e AdherenceHeatmap

**Problema:** Imports síncronos na linha 13-14 forçam o browser a compilar 518+ linhas antes de qualquer render.

```jsx
// ❌ ATUAL (linhas 13-14)
import SparklineAdesao from '@dashboard/components/SparklineAdesao'
import AdherenceHeatmap from '@adherence/components/AdherenceHeatmap'

// ✅ CORRIGIR PARA
import { lazy, Suspense } from 'react'

const SparklineAdesao = lazy(() => import('@dashboard/components/SparklineAdesao'))
const AdherenceHeatmap = lazy(() => import('@adherence/components/AdherenceHeatmap'))
```

No JSX, envolver cada um com `<Suspense>`:
```jsx
// Sparkline
<Suspense fallback={<div className="sparkline-skeleton" style={{ height: 80 }} />}>
  <SparklineAdesao adherenceByDay={dailyAdherence} size="expanded" />
</Suspense>

// Heatmap
<Suspense fallback={<div className="heatmap-skeleton" style={{ height: 120 }} />}>
  <AdherenceHeatmap pattern={adherencePattern} />
</Suspense>
```

---

## M0.2 — Mover sentinel para depois de todos os cards

**Problema:** O sentinel está na linha 318, antes de Sparkline, Stats e Timeline. Com `rootMargin: '200px'`, dispara ao abrir.

```jsx
// ❌ ATUAL: sentinel no meio do JSX (linha 318)
<div ref={heatmapSentinelRef} />  // ← dispara imediatamente

{/* ... Heatmap, Sparkline, Stats, Timeline ... */}
```

```jsx
// ✅ CORRIGIR: sentinel NO FINAL, antes só do CTA
{/* ... todos os cards ... */}
<div ref={heatmapSentinelRef} />  {/* ← só dispara quando usuário realmente chega aqui */}

{/* Register dose CTA */}
<div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
  <Button ...>Registrar Dose</Button>
</div>
```

Também reduzir o `rootMargin` de `'200px'` para `'50px'` — garante pré-carregamento real sem disparar ao abrir:
```js
// linha 147 — alterar rootMargin
{ rootMargin: '50px' }
```

---

## M0.3 — Mover `analyzeAdherencePatterns` para `startTransition`

**Problema:** `analyzeAdherencePatterns` roda sincronamente no useMemo, bloqueando a Main Thread com Zod + loops.

A correção correta é mover o processamento para fora do useMemo e usar `startTransition` para marcar como trabalho não-urgente:

```jsx
// ❌ ATUAL (linhas 69-85) — síncrono, bloqueia Main Thread
const adherencePatternData = useMemo(() => {
  if (allLogsForAnalysis.length > 0 && protocols.length > 0) {
    const pattern = analyzeAdherencePatterns({ logs: allLogsForAnalysis, protocols: ... })
    return pattern
  }
  return null
}, [allLogsForAnalysis, protocols])

// useEffect copiando memo para state (desnecessário)
useEffect(() => {
  setAdherencePattern(adherencePatternData)
}, [adherencePatternData])
```

```jsx
// ✅ CORRIGIR — state + startTransition (sem useMemo)
import { useState, useTransition } from 'react'

const [adherencePattern, setAdherencePattern] = useState(null)
const [, startTransition] = useTransition()

// No IntersectionObserver callback, após o fetch:
logService
  .getAll(500)
  .then((result) => {
    const logs = result || []
    setAllLogsForAnalysis(logs)

    // startTransition marca como baixa prioridade — browser pode interromper para inputs
    startTransition(() => {
      try {
        if (logs.length > 0 && protocols.length > 0) {
          const pattern = analyzeAdherencePatterns({
            logs,
            protocols: protocols.filter((p) => p.active),
          })
          setAdherencePattern(pattern)
        }
      } catch (err) {
        console.error('Erro ao analisar padrões:', err)
      }
    })
  })
  .catch(() => {})
  .finally(() => setIsLoadingPatterns(false))
```

**Por que `startTransition` resolve:** O React pode "pausar" o trabalho de `analyzeAdherencePatterns` entre frames do browser, evitando o freeze visual. O usuário consegue interagir com a UI enquanto o cálculo acontece em background.

**Remover:** O `useMemo` `adherencePatternData` (linhas 69-85) e o `useEffect` que o copia (linhas 154-156) — ambos se tornam desnecessários.

---

## M0.4 — Memoizar cálculos inline do render

**Problema:** `pillsThisMonth` e `daysThisMonth` recalculam em cada re-render (e há muitos).

```jsx
// ❌ ATUAL (linhas 242-245) — inline, roda em todo render
const pillsThisMonth = currentMonthLogs.reduce((sum, log) => sum + log.quantity_taken, 0)
const daysThisMonth = new Set(
  currentMonthLogs.map((log) => new Date(log.taken_at).toLocaleDateString('pt-BR'))
).size

// ✅ CORRIGIR — adicionar ao bloco de memos (antes dos effects)
const pillsThisMonth = useMemo(
  () => currentMonthLogs.reduce((sum, log) => sum + log.quantity_taken, 0),
  [currentMonthLogs]
)

const daysThisMonth = useMemo(
  () =>
    new Set(currentMonthLogs.map((log) => new Date(log.taken_at).toLocaleDateString('pt-BR'))).size,
  [currentMonthLogs]
)
```

---

## M0.5 — `startTransition` no retorno do SparklineAdesao

**Problema:** `setDailyAdherence(daily)` na linha 119 causa re-render imediato com SparklineAdesao pesado.

```jsx
// ❌ ATUAL (linhas 118-119)
setAdherenceSummary(summary)
setDailyAdherence(daily)

// ✅ CORRIGIR — marcar como não-urgente
setAdherenceSummary(summary)
startTransition(() => {
  setDailyAdherence(daily)
})
```

---

## M0.6 — Critérios de Aceite (M0)

- [ ] Abrir a view "Saúde" no iPhone 13 (Safari + Chrome) sem freeze visual perceptível
- [ ] Chrome DevTools Performance: zero "Long Task" (> 50ms) na thread principal ao abrir a view
- [ ] `SparklineAdesao` e `AdherenceHeatmap` aparecem nos chunks separados após `npm run build`
- [ ] IntersectionObserver: `logService.getAll(500)` NÃO é chamado na abertura — só ao scroll
- [ ] `npm run validate:agent` passa sem regressões

---

# SPRINT M1 — VIRTUALIZAÇÃO DA LISTA (HealthHistory Timeline)

**Objetivo:** Eliminar jank no scroll. Só iniciar após M0 estar deployado.
**Arquivo:** `src/views/HealthHistory.jsx` (linha 362-378) + `src/shared/components/log/LogEntry.jsx`

---

## 1.1 Instalar react-virtuoso

```bash
npm install react-virtuoso
```

**Por que react-virtuoso e não react-window:**
- Alturas dinâmicas automáticas (logs têm conteúdo variável)
- `useWindowScroll` nativo (evita scroll container)
- `endReached` substitui o botão "Ver mais" atual

---

## 1.2 Substituir `.map()` por `<Virtuoso>`

```jsx
// ❌ ATUAL (linhas 362-378)
{timelineLogs.map((log) => (
  <LogEntry key={log.id} log={log} onEdit={handleEditClick} onDelete={handleDeleteLog} />
))}
{timelineHasMore && (
  <button onClick={handleLoadMoreTimeline}>Ver mais {TIMELINE_PAGE_SIZE} doses</button>
)}

// ✅ SUBSTITUIR POR
import { Virtuoso } from 'react-virtuoso'

<Virtuoso
  useWindowScroll
  data={timelineLogs}
  endReached={handleLoadMoreTimeline}
  overscan={300}
  itemContent={(index, log) => (
    <LogEntry log={log} onEdit={handleEditLog} onDelete={handleDeleteLog} />
  )}
  components={{
    Footer: () =>
      isLoadingMore ? (
        <div className="timeline__loading-footer">Carregando...</div>
      ) : !timelineHasMore ? (
        <div className="timeline__end">Histórico completo</div>
      ) : null,
  }}
/>
```

---

## 1.3 Memoizar LogEntry

```jsx
// src/shared/components/log/LogEntry.jsx
import { memo } from 'react'

const areEqual = (prev, next) =>
  prev.log.id === next.log.id &&
  prev.log.status === next.log.status &&
  prev.log.quantity_taken === next.log.quantity_taken

export const LogEntry = memo(function LogEntry({ log, onEdit, onDelete }) {
  // ... implementação atual sem alteração ...
}, areEqual)
```

**No pai:** envolver `handleEditClick` e `handleDeleteLog` em `useCallback` (já usam `useCallback` — verificar se dependências estão corretas).

---

## 1.4 Critérios de Aceite M1

- [ ] Scroll de 300 logs sem queda abaixo de 55fps (CPU 4x throttle)
- [ ] Heap < 80MB após 300 logs carregados
- [ ] Botão "Ver mais" removido — substituído por carregamento automático
- [ ] `npm run validate:agent`

---

# SPRINT M2 — CODE SPLITTING E LAZY ROUTES

**Objetivo:** Reduzir bundle JS inicial para melhorar cold start.
**Arquivos:** `src/App.jsx` + `vite.config.js`

---

## 2.1 Lazy Loading por View

```jsx
import { lazy, Suspense } from 'react'

// Views pesadas → lazy
const HealthHistory = lazy(() => import('./views/HealthHistory'))
const Protocols     = lazy(() => import('./views/Protocols'))
const Stock         = lazy(() => import('./views/Stock'))
const AdminDlq      = lazy(() => import('./views/AdminDlq'))
const Landing       = lazy(() => import('./views/Landing'))

// Dashboard → eager (view padrão, carregada sempre)
import Dashboard from './views/Dashboard'
```

---

## 2.2 Chunks Manuais no Vite

```js
// vite.config.js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'framer-motion': ['framer-motion'],
        'supabase': ['@supabase/supabase-js'],
        'virtuoso': ['react-virtuoso'],
        'feature-history': [
          './src/views/HealthHistory',
          './src/features/adherence/components/AdherenceHeatmap',
        ],
      },
    },
  },
},
```

---

## 2.3 Critérios de Aceite M2

- [ ] Bundle inicial < 250KB gzipped (`npm run build` + `npx vite-bundle-analyzer`)
- [ ] `HealthHistory` chunk carregado só ao navegar para a view
- [ ] LCP do Dashboard < 2.5s em simulação 4G (Lighthouse DevTools)

---

# SPRINT M3 — BANCO DE DADOS: ÍNDICES E VIEW

**Objetivo:** Queries Supabase < 10ms para usuários com >10k logs.

---

## 3.1 Índices (SQL Editor Supabase)

```sql
-- Paginação principal (logService.getAllPaginated)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_user_taken_at_desc
ON medication_logs (user_id, taken_at DESC);

-- Por protocolo (logService.getByProtocol)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_logs_protocol_taken_at
ON medication_logs (protocol_id, taken_at DESC);
```

**Validar:**
```sql
EXPLAIN ANALYZE
SELECT * FROM medication_logs
WHERE user_id = '<uuid>'
ORDER BY taken_at DESC
LIMIT 30;
-- Deve mostrar "Index Scan", não "Seq Scan"
```

---

## 3.2 View de Adesão Diária

```sql
CREATE OR REPLACE VIEW v_daily_adherence AS
SELECT
    user_id,
    (taken_at AT TIME ZONE 'UTC')::date AS log_date,
    COUNT(*) AS total_doses,
    COUNT(*) FILTER (WHERE status = 'taken') AS taken_doses,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'taken') * 100.0) / NULLIF(COUNT(*), 0),
        2
    ) AS adherence_percentage
FROM medication_logs
GROUP BY user_id, (taken_at AT TIME ZONE 'UTC')::date;
```

---

## 3.3 Check Constraint (Integridade)

```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'chk_medication_logs_status'
  ) THEN
    ALTER TABLE medication_logs
    ADD CONSTRAINT chk_medication_logs_status
    CHECK (status IN ('taken', 'skipped', 'pending', 'late'));
  END IF;
END $$;
```

---

## 3.4 Critérios de Aceite M3

- [ ] `EXPLAIN ANALYZE` mostra "Index Scan"
- [ ] View `v_daily_adherence` criada e consultável
- [ ] Query com 10k logs responde em < 10ms

---

# SPRINT M4 — SERVICE WORKER E OFFLINE FIRST

**Objetivo:** App funcional com conexão ruim ou offline.

---

## 4.1 Estratégia de Cache por Tipo de Dado

| Dado | Estratégia | TTL |
|------|-----------|-----|
| Assets JS/CSS (com hash) | CacheFirst | 7 dias |
| Supabase API: protocolos, medicamentos | StaleWhileRevalidate | 5 min |
| Supabase API: logs do dia atual | NetworkFirst | 30s |
| Supabase Auth | NetworkOnly | — |

---

## 4.2 Indicador de Conectividade

**Arquivo:** `src/shared/components/ui/OfflineBanner.jsx` (novo)

```jsx
import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="offline-banner" role="alert" aria-live="polite">
      Sem conexão — exibindo dados salvos
    </div>
  )
}
```

```css
.offline-banner {
  position: fixed;
  bottom: 64px; /* acima do BottomNav */
  left: 0; right: 0;
  background: var(--color-warning);
  color: var(--color-text-on-warning);
  text-align: center;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  z-index: 100;
}
```

---

## 4.3 Critérios de Aceite M4

- [ ] Dados visíveis ao desativar WiFi/dados (DevTools > Network > Offline)
- [ ] Banner aparece e desaparece corretamente
- [ ] Lighthouse PWA score >= 90

---

# 📋 Checklist Consolidado

## Sprint M0 — FAZER PRIMEIRO (sem nova dependência)
- [ ] Converter imports de SparklineAdesao e AdherenceHeatmap para `lazy()`
- [ ] Adicionar `<Suspense>` com fallback skeleton em cada um
- [ ] Mover `heatmapSentinelRef` div para o final do JSX (antes do CTA)
- [ ] Reduzir `rootMargin` de `'200px'` para `'50px'`
- [ ] Substituir `useMemo` + `useEffect` do `adherencePatternData` por `startTransition` no callback do observer
- [ ] Mover `setDailyAdherence` para dentro de `startTransition`
- [ ] Mover `pillsThisMonth` e `daysThisMonth` para `useMemo`
- [ ] `npm run validate:agent`
- [ ] Testar no iPhone 13 real ou simulação Safari com CPU throttle

## Sprint M1 (após M0)
- [ ] `npm install react-virtuoso`
- [ ] Substituir `.map()` da timeline por `<Virtuoso>`
- [ ] Envolver `LogEntry` com `React.memo` + comparação customizada
- [ ] `npm run validate:agent`

## Sprint M2 (após M1)
- [ ] `lazy()` para HealthHistory, AdminDlq, Landing, Stock, Protocols
- [ ] `manualChunks` no vite.config.js
- [ ] Medir bundle antes/depois

## Sprint M3 (paralelo ou após M2)
- [ ] SQL de índices no Supabase
- [ ] Validar com `EXPLAIN ANALYZE`
- [ ] Criar View `v_daily_adherence`

## Sprint M4 (por último)
- [ ] Auditar SW existente
- [ ] Configurar estratégias de cache
- [ ] Implementar `OfflineBanner`

---

# 🚫 O Que NÃO Fazer

| Ação | Razão |
|------|-------|
| Instalar @tanstack/react-query ou SWR | `useCachedQuery` já cobre todos os casos de uso do projeto |
| Mover `analyzeAdherencePatterns` para Web Worker agora | `startTransition` é suficiente para o volume atual e sem custo de implementação |
| Refatorar DashboardProvider para RPC | Já consolida em 3 queries — overhead não justifica |
| Criar cursor-based pagination | `getAllPaginated(offset)` funciona; cursor é premature optimization |
| Remover Framer Motion completamente | Impacto visual alto, otimizar seletivamente |
| Começar pelo M1/M2/M3 sem fazer o M0 | Os freezes são na abertura da view — virtualização não resolve freeze de parse/compile |

---

## Referências de Código

- [HealthHistory.jsx](src/views/HealthHistory.jsx) — arquivo principal de todas as correções M0
- [adherencePatternService.js](src/features/adherence/services/adherencePatternService.js) — onde `analyzeAdherencePatterns` roda
- [logService.js](src/shared/services/api/logService.js) — paginação já implementada, não alterar
- [plans/PLAN_MOBILE_SCALABILITY.md](plans/PLAN_MOBILE_SCALABILITY.md) — plano original (substituído)
