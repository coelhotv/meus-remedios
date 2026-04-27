# Exec Spec — Wave N1: Agrupamento por Treatment Plan + Bulk Mobile

> **Status:** 7/8 sprints concluídos — N1.7 DESBLOQUEADA (PR #502 entregou SW+webpush infra), aguardando execução
> **Master Plan:** [`MASTER_PLAN_NOTIFICATIONS_REVAMP.md`](./MASTER_PLAN_NOTIFICATIONS_REVAMP.md)
> **Idea Plan:** [`IDEA_PLAN_NOTIFICATIONS_REVAMP.md`](./IDEA_PLAN_NOTIFICATIONS_REVAMP.md) — §Wave N1
> **PRs:** #496 (N1.1+N1.2), #498 (N1.3+N1.4), #499 (N1.4 fixes), #500 (N1.5), #501 (N1.6), #502 (PWA), commit `55e968fc` (N1.8 fixes) — todos mergeados em main ✅
> **Estimativa:** ~3 dias úteis · 8 sprints · Início: 2026-W17

---

## 1. Objetivo

Substituir o "1 push por protocolo" por **1 push por bloco semântico**, preservando identidade de `treatment_plan_id` em multimorbidade. Estender o canal mobile native com deeplink real e bulk register modal.

**Resolve diretamente o screenshot** (`screenshots/notificacoes-lockscreen.png`) sem migration de DB.

---

## 2. Pré-requisitos

| Item | Estado |
|------|--------|
| `protocols.treatment_plan_id` existente | ✅ (`apps/web/src/schemas/protocolSchema.js:75–77`) |
| `treatmentPlanService` server-readable | ✅ (`apps/web/src/features/protocols/services/treatmentPlanService.js`) |
| `LogForm type='plan'` (web) | ✅ (`apps/web/src/shared/components/log/LogForm.jsx:151–160`) |
| Dispatcher multicanal | ✅ (`server/notifications/dispatcher/dispatchNotification.js`) — ADR-029 |
| `notificationDeduplicator` 5min window | ✅ (`server/services/notificationDeduplicator.js`) |
| Mobile Notification Inbox | ✅ (`apps/mobile/src/features/notifications/`) |
| Mobile Push setup | ✅ (`apps/mobile/src/platform/notifications/usePushNotifications.js`) — **mas tap handler é stub** |

---

## 3. Convenção de Alocação de Agente

| Categoria | Modelos | Quando usar |
|-----------|---------|-------------|
| **🟢 Avançado** | Claude Sonnet, Gemini Pro, GPT Codex | Lógica nova com decisões arquiteturais; refactors multi-arquivo coordenados; testes não-triviais; código que toca contratos críticos (notificações, callbacks, dedup); novos componentes RN com edge cases (cold start, navigation timing) |
| **🟡 Rápido** | Claude Haiku, Gemini Fast, GPT Mini | Edits cirúrgicos em arquivos isolados; extensão de mapas/enums com spec clara; UI form fields com design system existente; tests unitários quando spec já está pronta; migrations simples; updates de copy |
| **⚪ Humano** | — | Validações manuais (sandbox bot, device físico, lock screen) |

> **Regra-mãe**: se um sprint pode ser descrito como "edite `X.jsx` para adicionar a entrada `Y` no objeto `Z` conforme tabela abaixo", é 🟡 Rápido. Se requer entender comportamento dinâmico, escolher entre alternativas, ou coordenar mudanças em 3+ arquivos, é 🟢 Avançado.

---

## 4. Sprints

### Sprint 1.1 — Backend: partição de doses + formatters (`tasks.js` + `notify.js`) ✅

**Status:** CONCLUÍDO (PR #496) ✅

**Agente recomendado**: 🟢 **Avançado** (Sonnet/Pro/Codex)

**Justificativa**: lógica nova de partição com 9 cenários (A–I), edge case do cenário G, dois formatters MarkdownV2 com truncamento, refactor não-trivial de `checkRemindersViaDispatcher`. Erros silenciosos aqui virariam regressão direta para todos os usuários.

**Entregas**:

1. Em `server/bot/tasks.js`:
   - Refatorar `checkRemindersViaDispatcher:325–399`: substituir loop "1 dispatch por protocolo" por:
     - Coletar `dosesNow[]` (JOIN `protocols` + `treatment_plans`) onde `time_schedule.includes(currentHHMM)`
     - Aplicar `partitionDoses(dosesNow)` (helper novo) → array de blocos `{ kind: 'by_plan'|'misc'|'individual', planId?, planName?, doses[] }`
     - Para cada bloco: chamar `dispatcher.dispatch()` com `kind` apropriado (`dose_reminder_by_plan`, `dose_reminder_misc`, `dose_reminder`)
   - Implementar `partitionDoses` conforme regra do Master Plan §3 P2 (planos com ≥2 doses → bloco; sobra ≥2 → misc; sobra 1 → individual; sobra com planos distintos ≤3 → individuais por plano).
   - Criar `formatDoseGroupedByPlanMessage(planName, doses, scheduledTime)` e `formatDoseGroupedMiscMessage(doses, scheduledTime)` em MarkdownV2. Truncar para 10 doses + "_… e mais N_" se necessário.

2. Em `api/notify.js`:
   - Adicionar cases `'dose_reminder_by_plan'` e `'dose_reminder_misc'` em `buildNotificationPayload:47–79`.
   - Title contextual via helper `getTimeOfDayGreeting(hour)` (manhã 🌅 / almoço 🍽️ / tarde ☕ / noite 🌆 / madrugada 🌙).
   - Body resumido: `"Quarteto Fantástico (4) — 08:00"` ou `"3 medicamentos pendentes — 14:00"`.
   - Deeplinks: `dosiq://today?at=HHMM&plan=${planId}` e `dosiq://today?at=HHMM&misc=1`.
   - `metadata.protocol_ids = [...]` populado.

3. Tests unitários em `server/bot/__tests__/`:
   - `partitionDoses.test.js` — fixture para cada cenário A–I.
   - `formatters.test.js` — render esperado de 1/4/12 doses (truncamento).

**Critério de aceite**:
- `partitionDoses` retorna arrays corretos para os 9 cenários.
- Formatters geram MarkdownV2 válido (escape correto, sem chars não-escapados).
- `checkRemindersViaDispatcher` emite N dispatches por bloco para fixture multi-plano (não 1 por protocolo).

---

### Sprint 1.2 — Backend: callback handlers `takeplan` / `takelist` ✅

**Status:** CONCLUÍDO (PR #1)

**Agente recomendado**: 🟢 **Avançado** (Sonnet/Pro/Codex)

**Justificativa**: porta de lógica `LogForm type='plan'` para o server-side com bulk-log via `medicineLogService` ou equivalente; necessita resolver protocolos por `(userId, HHMM, planId)` ou `(userId, HHMM, protocolIds[])`; respeitar `callback_data < 64 bytes` (R-030 — usar índices numéricos em sessão).

**Entregas**:

1. Em `server/bot/callbacks/doseActions.js`:
   - Novo handler `takeplan` (`callback_data: takeplan:${planIdx}:${HHMM}`):
     - Buscar protocolos do user com `treatment_plan_id` correspondente cujo `time_schedule.includes(HHMM)`
     - Registrar todas as doses via porta server-side de `LogForm.jsx:151–160` (criar `medicineLogService.createMany(logs)` se ainda não existir)
     - Decrementar estoque (R-040 — ordem: validar → registrar → decrementar)
     - Responder no Telegram: `"✅ X doses do [plano] registradas"` + edição da mensagem original (remover botões)
   - Novo handler `takelist` (`callback_data: takelist:${listIdx}:${HHMM}`):
     - Análogo, mas resolve por lista de `protocolIds` armazenada em sessão (índice numérico → array)
   - Manter `take_:`, `snooze_:`, `skip_:` atuais para o caso individual.

2. Tests:
   - `takeplan.test.js` — fixture multi-plano valida que apenas doses do `treatment_plan_id` correto são registradas, não cross-plano.
   - `takelist.test.js` — idem para lista flat.

**Critério de aceite**:
- Botão "Registrar este plano" no Telegram registra exatamente as doses daquele plano.
- Estoque decrementa correto para todas as doses.
- Mensagem original é editada (botões removidos) após sucesso.

---

### Sprint 1.3 — Backend: dedup keys + `expoPushChannel` payload data ✅

**Status:** CONCLUÍDO (PR #498) ✅

**Agente recomendado**: 🟡 **Rápido** (Haiku/Fast/Mini)

**Justificativa**: edits cirúrgicos com spec clara — adicionar 2 chaves em `notificationDeduplicator` e enriquecer payload Expo com `data.navigation`. Sem decisões arquiteturais.

**Entregas**:

1. Em `server/services/notificationDeduplicator.js`:
   - Aceitar tipos `'dose_reminder_by_plan'` e `'dose_reminder_misc'`.
   - Chaves: `(userId, 'dose_reminder_by_plan', HHMM, planId)` e `(userId, 'dose_reminder_misc', HHMM)`. Janela 5min mantida.

2. Em `server/notifications/channels/expoPushChannel.js`:
   - Adicionar ao payload Expo:
     ```js
     data: {
       navigation: { screen: 'bulk-plan'|'bulk-misc'|'dose-individual', params: { at, planId, misc, protocolIds, treatmentPlanName } },
       notificationLogId: payload.metadata?.notificationLogId ?? null  // populado em N3
     }
     ```
   - Manter `tag: dose-${HHMM}-${suffix}` (cosmético — Expo pode ignorar; documentar).

3. Em `server/notifications/repositories/notificationLogRepository.js`:
   - Aceitar `protocol_ids: uuid[]` em `provider_metadata`. `protocol_id` recebe `null` para grouped (ou primeiro como "lead" — definir uma regra e seguir).
   - Aceitar `treatment_plan_id` populado quando aplicável.

**Critério de aceite**:
- Push Expo enviado contém `data.navigation` corretamente estruturado (validar via inspeção em sandbox).
- Dedup retorna `false` para chave repetida em 5min, `true` para chave nova.

---

### Sprint 1.4 — Mobile: deeplink real em `usePushNotifications` (cold start + foreground) ✅

**Status:** CONCLUÍDO (PRs #498 + #499) ✅

**Agente recomendado**: 🟢 **Avançado** (Sonnet/Pro/Codex)

**Justificativa**: Edge cases de cold start (navigationRef não pronto), `getLastNotificationResponseAsync`, integração com `@react-navigation/native`, mapeamento de screens. Stub atual (`console.log`) é gap crítico — implementação errada quebra a UX inteira do redesign.

**Entregas**:

1. Em `apps/mobile/src/navigation/Navigation.jsx`:
   - Exportar `navigationRef` para uso externo (já existe `useRef(null)` linha 29 — apenas exportar).

2. Em `apps/mobile/src/platform/notifications/usePushNotifications.js`:
   - Substituir `console.log` (linhas 57–66) por:
     ```js
     const { screen, params } = navigation || {}
     const targetRoute = SCREEN_TO_ROUTE[screen] ?? ROUTES.TODAY
     if (navigationRef.current?.isReady()) {
       navigationRef.current.navigate(targetRoute, params)
     } else {
       // Aguardar isReady (caso raro)
       const subscription = navigationRef.current?.addListener?.('state', () => {
         navigationRef.current.navigate(targetRoute, params)
         subscription?.()
       })
     }
     ```
   - Tratar **cold start**: no primeiro `useEffect`, chamar `Notifications.getLastNotificationResponseAsync()` e processar resposta como se fosse tap (mesmo path).
   - Mapa `SCREEN_TO_ROUTE`: `bulk-plan` / `bulk-misc` / `dose-individual` → `ROUTES.TODAY` (modal abre por params).

3. Tests:
   - Mock `navigationRef` e `Notifications.getLastNotificationResponseAsync`. Validar navegação correta para cada `screen`.

**Critério de aceite**:
- Tap em push com app em foreground → navega para Today com params.
- App matado, tap em push → cold start abre Today com params (não tela vazia).
- `__DEV__` logs preservados, mas comportamento de produção é **navegar de fato**.

---

### Sprint 1.5 — Mobile: `BulkDoseRegisterModal.jsx` (NOVO) ✅

**Status:** CONCLUÍDO (PR #500) ✅

**Agente recomendado**: 🟢 **Avançado** (Sonnet/Pro/Codex)

**Justificativa**: Componente totalmente novo em RN, batch logic com decremento de estoque, dois modos (`plan` / `misc`), checkboxes pré-marcados, edge case de offline (queue local + retry — pode ser follow-up). Reusar lógica do web `LogForm` mas em RN puro (sem react-hook-form).

**Entregas**:

1. Criar `apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx`:
   - Props: `{ visible, onClose, mode: 'plan'|'misc', planId?, protocolIds?, scheduledTime }`
   - Carrega protocolos correspondentes via `protocolService` ou hook (`usePlanProtocols(planId)` ou `useProtocolsByIds(protocolIds)`)
   - Lista de checkboxes pré-marcados (todos `true` por default)
   - Header: nome do plano (se `mode='plan'`) ou "Doses agora — HH:MM" (se `mode='misc'`)
   - CTA: `"Registrar X doses"` (count atualiza com unchecks)
   - Submit: chama `medicineLogService.createMany(selectedLogs)` + decremento de estoque (já em `medicineLogService`?)
   - Loading + erro estados

2. Estilos seguindo design tokens (`apps/mobile/src/shared/styles/tokens.js`).

3. Tests:
   - `BulkDoseRegisterModal.test.jsx` — render com fixture de plano, valida bulk submit, valida que unchecking remove do batch.

**Critério de aceite**:
- Modal abre com 4 medicamentos pré-marcados → submit registra 4 logs.
- Unchecking 1 medicamento → submit registra 3.
- Estoque decrementa para todos os submitted (validar via fetch após submit).

---

### Sprint 1.6 — Mobile: estender Inbox (`NotificationItem` + `NotificationInboxScreen` + `useNotificationLog`) ✅

**Status:** CONCLUÍDO (PR #501) ✅

**Agente recomendado**: 🟡 **Rápido** (Haiku/Fast/Mini)

**Justificativa**: Edits cirúrgicos com spec exata — estender mapas (`CTA_MAP`, `DEEP_LINK_TARGETS`), adicionar branches em `resolveTitle`, atualizar SELECT no hook, atualizar `buildWasTakenMap`. Cada mudança é tipada e testável independentemente.

**Entregas**:

1. Em `apps/mobile/src/features/notifications/components/NotificationItem.jsx`:
   - `CTA_MAP` estendido com `dose_reminder_by_plan` e `dose_reminder_misc`.
   - `resolveTitle` com branches para nome do plano e "Doses agora".
   - Footer renderiza `"X/N tomadas"` para tipo objeto `{ taken, total }`.
   - **Doses rendering (adicionado em N1.8):** quando `notification.doses` presente, lista medicamentos com dosagem em vez de `body` texto.

2. Em `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx`:
   - `DEEP_LINK_TARGETS` com `'bulk-plan'`, `'bulk-misc'`, `'dose-individual'` → `ROUTES.TODAY`.
   - `buildWasTakenMap` com branch grouped para `protocol_ids[]`.
   - **Fix N1.8:** params enviados com `screen` (não `bulkMode`) para compatibilidade com `TodayScreen`.
   - **Fix N1.8:** case `dose_reminder` individual → `params.screen = 'dose-individual'`.

3. Em `apps/mobile/src/shared/hooks/useNotificationLog.js`:
   - SELECT inclui `treatment_plan_id`, `treatment_plan_name`, `provider_metadata`.
   - **Adicionado em N1.8:** `enrichWithDoses()` — enriquecimento relacional pós-fetch via queries paralelas a `protocols` (R-195). Não persiste dados em `notification_log`.

4. Em `packages/core/src/notificationIconMapper.js`:
   - `dose_reminder_by_plan` (ícone `Package`), `dose_reminder_misc` (ícone `Clock`).

**Critério de aceite**:
- ✅ Inbox renderiza notificação grouped com título correto e lista de medicamentos do horário.
- ✅ Contagem "X/N tomadas" exibida no footer.
- ✅ Tap navega para Today + abre `BulkDoseRegisterModal` com params corretos.
- ✅ Tap em `dose_reminder` individual → abre `DoseRegisterModal` pré-configurado.

---

### Sprint 1.7 — Web: deeplink Today + canal web_push no dispatcher 🔓 DESBLOQUEADA

**Status:** DESBLOQUEADA — PR #502 entregou Service Worker (Workbox + `vite-plugin-pwa`), `webpushService.js` (subscribe + `register-webpush`), e endpoint `api/register-webpush.js`. Infra básica existente. **Pronta para execução.**

> **Análise de desbloqueio (2026-04-27):** `apps/web/src/service-worker.js` existe com handlers `push` + `notificationclick`. `webpushService.subscribe()` registra dispositivos via `api/register-webpush.js` → `notification_devices` (provider `webpush`). O que está **faltando** é o canal `web_push` no dispatcher e a navegação view-based no `notificationclick`.

**Agente recomendado**: 🟢 **Avançado** (Sonnet/Pro/Codex)

**Justificativa (revisada):** Eram previstos edits cirúrgicos (🟡), mas o estado atual tem 3 gaps estruturais: (1) o dispatcher não conhece o canal `web_push`; (2) o SW usa `data.url` simples em vez de `data.navigation` estruturado; (3) `resolveChannelsForUser` não inclui dispositivos `webpush`. Cada peça afeta o fluxo ponta-a-ponta — erros aqui resultam em push recebido mas deeplink silencioso.

---

#### Estado atual do PWA (PR #502 — o que JÁ existe)

| Componente | Estado |
|-----------|--------|
| `apps/web/src/service-worker.js` | ✅ Existe — handler `push` + `notificationclick` com `data.url` |
| `apps/web/src/shared/services/webpushService.js` | ✅ Existe — `subscribe()` + `registerDevice()` via `/api/register-webpush` |
| `api/register-webpush.js` | ✅ Existe — persiste em `notification_devices` com `provider: 'webpush'` |
| `server/notifications/channels/webPushChannel.js` | ❌ Não existe — dispatcher não sabe enviar para webpush |
| `resolveChannelsForUser.js` | ❌ Não inclui `webpush` — `listActiveByUser(userId, 'expo')` apenas |
| `dispatchNotification.js` | ❌ Case `web_push` ausente em `dispatchChannel()` |
| SW `data.navigation` | ❌ SW usa apenas `data.url` — não navega por view/modal |
| `App.jsx` integration | ❌ `webpushService.subscribe()` não está sendo chamado em nenhum ponto da UX web |

---

#### Entregas

**1. Canal `webPushChannel.js` (NOVO)** — `server/notifications/channels/webPushChannel.js`

```js
// Envia Web Push via web-push npm package usando VAPID
// Lista devices com provider='webpush' para o userId
// Para cada subscription JSON: webpush.sendNotification(subscription, payload)
// Tratar 410 Gone (subscription expirada) → desativar device
```

Dependências: `npm install web-push` no workspace `server/` (ou raiz). Variáveis de env necessárias: `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_EMAIL` (já devem existir para mobile? verificar `.env.example`).

**2. `dispatchNotification.js`** — adicionar case `web_push`

```js
// Em dispatchChannel():
} else if (channel === 'web_push') {
  return await sendWebPushNotification({ userId, payload, context, repositories })
}
```

**3. `resolveChannelsForUser.js`** — incluir dispositivos webpush

```js
const activeWebPushDevices = await repositories.devices.listActiveByUser(userId, 'webpush')

// Nos cases que já incluem mobile_push, adicionar web_push quando disponível:
if (preference === 'mobile_push') {
  return [
    ...(activeExpoDevices.length > 0 ? ['mobile_push'] : []),
    ...(activeWebPushDevices.length > 0 ? ['web_push'] : []),
  ]
}
// idem para 'both'
```

**4. `service-worker.js`** — substituir navegação por `data.url` simples por `data.navigation` estruturado

O SW atual usa `event.notification.data?.url` para abrir uma URL. O sistema web do Dosiq é **view-based** (não URL-based) — `App.jsx` controla `currentView` via estado. Por isso a abordagem correta é:

```js
// NO SW: ao clicar na notificação, focar/abrir a janela e enviar mensagem via postMessage
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const navigation = event.notification.data?.navigation // { view, params }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const appClient = windowClients.find(c => c.url.includes(self.location.origin))
      if (appClient) {
        appClient.focus()
        // Enviar mensagem para o App.jsx tratar a navegação
        appClient.postMessage({ type: 'NOTIFICATION_CLICK', navigation })
        return
      }
      return clients.openWindow('/')
      // Nota: ao abrir janela nova, o navigation não será processado nesta versão (follow-up N3)
    })
  )
})
```

**5. `App.jsx`** — ouvir `postMessage` do SW e navegar para view/modal correto

```js
useEffect(() => {
  const handler = (event) => {
    if (event.data?.type !== 'NOTIFICATION_CLICK') return
    const { view, params } = event.data.navigation ?? {}
    if (view === 'dashboard') setCurrentView('dashboard')
    // Abrir GlobalDoseModal se params indicarem bulk-plan / dose-individual
    if (params?.screen === 'bulk-plan' || params?.screen === 'dose-individual') {
      setDoseModalInitialValues(params)
      setIsDoseModalOpen(true)
    }
  }
  navigator.serviceWorker?.addEventListener('message', handler)
  return () => navigator.serviceWorker?.removeEventListener('message', handler)
}, [])
```

**6. `api/notify.js` — payload do push web**

No `buildNotificationPayload`, o campo `data` enviado ao `webPushChannel` deve incluir `navigation`:

```js
data: {
  navigation: {
    view: 'dashboard',
    params: { screen: 'bulk-plan'|'bulk-misc'|'dose-individual', at, planId, protocolIds, treatmentPlanName }
  },
  tag: `dose-${data.scheduledTime}-${suffix}`  // para agrupamento no SO
}
```

**7. Ponto de entrada UX — como o usuário ativa o Web Push**

O `webpushService.subscribe()` existe mas **não é chamado em nenhum lugar da UX**. Verificar se `PushPermission.jsx` existe e está integrado, ou criar o ponto de ativação mínimo (Settings ou prompt inline após login).

---

**Critério de aceite**:
- Push web enviado via cron chega ao browser (validar com `web-push` CLI ou DevTools > Application > Push).
- Clique na notificação web → `App.jsx` processa `postMessage` → `GlobalDoseModal` abre pré-configurado (para `bulk-plan`).
- Clique em `dose-individual` → `GlobalDoseModal` abre com protocolo pré-selecionado.
- 2 push com tags distintas (`dose-08:00-plan-A` e `dose-08:00-plan-B`) não se substituem no SO.
- `resolveChannelsForUser` inclui `web_push` quando o usuário tem device webpush ativo.

---

**⚠️ Dependências externas para verificar antes de iniciar:**
- `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_EMAIL` em `.env` (necessário para `web-push` server-side)
- `npm install web-push` no workspace correto (raiz do monorepo ou `server/`)
- Ícones PWA `pwa-192x192.png` / `pwa-512x512.png` em `apps/web/public/` (referenciados pelo SW mas podem não existir)

---

### Sprint 1.8 — Validação manual + DEVFLOW C5 + Fixes

**Status:** CONCLUÍDO (commit `55e968fc`, 2026-04-27) ✅

**Agente recomendado**: ⚪ **Humano** (validação) + 🟢 **Avançado** (fixes identificados)

**O que foi validado e corrigido**:

Durante a validação manual no simulador iOS, foram identificados e corrigidos 4 bugs adicionais que não faziam parte do escopo original dos sprints anteriores:

**Bug 1 — Params de navegação com mismatch (AP-117):**
- `NotificationInboxScreen` enviava `params.bulkMode = 'plan'` mas `TodayScreen` lia `params.screen === 'bulk-plan'`.
- Fix: `params.screen = 'bulk-plan'` / `params.screen = 'bulk-misc'` em `NotificationInboxScreen.jsx`.

**Bug 2 — Repository INSERT não persistia `treatment_plan_name` (AP-118):**
- `dispatchNotification.js` e o schema já estavam corretos (PR #504). Mas `notificationLogRepository.js` não incluía os campos no INSERT.
- Fix: 2 linhas adicionadas ao INSERT em `notificationLogRepository.js`.

**Bug 3 — `usePushNotifications` não propagava `screen` no tap (AP-117 variante):**
- `navigateFromPush` passava `params` sem incluir a chave `screen`, que `TodayScreen` usa para decidir qual modal abrir.
- Fix: `navigationRef.navigate(targetRoute, screen ? { screen, ...params } : params)`.

**Bug 4 — `BulkDoseRegisterModal` listava todos os medicamentos do plano (sem filtro de horário):**
- `usePlanProtocols` não recebia `scheduledTime` e não filtrava por janela.
- Fix: `isInWindow(±2h)` implementado em `usePlanProtocols.js`; `scheduledTime` passado de `BulkDoseRegisterModal`.

**Paridade Web (descoberta durante validação):**
- Web inbox não tinha as mesmas melhorias de mobile (doses rendering, `onOpenDoseModal`).
- Corrigido: `enrichWithDoses()` em `apps/web/src/shared/hooks/useNotificationLog.js`, prop chain `onOpenDoseModal` por `NotificationCard → NotificationList → NotificationInbox → App.jsx → GlobalDoseModal`, `initialValues` prop em `GlobalDoseModal`.

**Bug 5 — Deeplink `dose-individual` ausente no mobile:**
- `NotificationInboxScreen` não tinha case para `dose_reminder` individual.
- `TodayScreen` não processava `params.screen === 'dose-individual'`.
- Fix: adicionados em ambos os arquivos.

**DEVFLOW C5 executado** (2026-04-27):
- ✅ AP-117: Params de navegação sem contrato tipado entre emissor e receptor
- ✅ AP-118: Repository INSERT não espelhando campos do dispatcher/schema após adição tardia
- ✅ R-195: Enrichment relacional no hook — nunca duplicar dados relacionais em `notification_log`
- ✅ Journal entry em `.agent/memory/journal/2026-W17.jsonl`
- ✅ `state.json` atualizado (rules: 142, APs: 118)

**Arquivos modificados em N1.8**:
```
server/notifications/repositories/notificationLogRepository.js   (INSERT fix)
apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx (params + dose-individual)
apps/mobile/src/shared/hooks/useNotificationLog.js               (enrichWithDoses)
apps/mobile/src/features/notifications/components/NotificationItem.jsx (doses rendering)
apps/mobile/src/platform/notifications/usePushNotifications.js   (screen key fix)
apps/mobile/src/features/dose/hooks/usePlanProtocols.js          (±2h filter)
apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx (scheduledTime)
apps/mobile/src/features/dashboard/screens/TodayScreen.jsx       (dose-individual deeplink)
apps/web/src/shared/hooks/useNotificationLog.js                  (enrichWithDoses)
apps/web/src/features/notifications/components/NotificationCard.jsx (doses + onOpenDoseModal)
apps/web/src/features/notifications/components/NotificationList.jsx (prop chain)
apps/web/src/views/redesign/NotificationInbox.jsx                (prop chain)
apps/web/src/shared/components/ui/GlobalDoseModal.jsx            (initialValues prop)
apps/web/src/App.jsx                                             (onOpenDoseModal wiring)
```

**Critério de aceite**:
- ✅ Central de Avisos mobile exibe nome do plano e lista de medicamentos do horário.
- ✅ Tap em push de plano → `BulkDoseRegisterModal` abre com medicamentos do horário (±2h).
- ✅ Tap em dose individual na Inbox → `DoseRegisterModal` pré-configurado.
- ✅ Web inbox com paridade completa de mobile (doses rendering + CTA → GlobalDoseModal).
- ✅ DEVFLOW C5 registrado.

---

## 5. Tabela Resumo de Alocação

| Sprint | Descrição | Agente | Estimativa | Status |
|--------|-----------|--------|------------|--------|
| **1.1** | Backend: partição + formatters | 🟢 Avançado | ~4h | ✅ PR #496 |
| **1.2** | Backend: callbacks `takeplan`/`takelist` | 🟢 Avançado | ~3h | ✅ PR #496 |
| **1.3** | Backend: dedup + payload Expo | 🟡 Rápido | ~1h | ✅ PR #498 |
| **1.4** | Mobile: deeplink real | 🟢 Avançado | ~3h | ✅ PRs #498 + #499 |
| **1.5** | Mobile: `BulkDoseRegisterModal` | 🟢 Avançado | ~4h | ✅ PR #500 |
| **1.6** | Mobile: estender Inbox | 🟡 Rápido | ~2h | ✅ PR #501 |
| **1.7** | Web: canal web_push + SW navigation + deeplink | 🟢 Avançado | ~3h | 🔓 Desbloqueada — aguardando execução |
| **1.8** | Validação + fixes + DEVFLOW C5 | 🟢 Avançado + ⚪ Humano | ~3h | ✅ commit `55e968fc` |

**Total**: ~23.5h trabalho. **6 sprints 🟢 (~20h)** + **1 sprint 🟡 (~2h)** + **1 sprint misto (~1.5h)**.

---

## 6. Distribuição de Tokens (estimativa para gestão de quota)

> Calibração aproximada para planejamento — ajustar conforme telemetria real do time.

- **🟢 Avançado** (Sprint 1.1, 1.2, 1.4, 1.5): cada sprint consome ~30k–60k tokens contexto + saída (lendo arquivos, gerando código, iterando com testes).
- **🟡 Rápido** (Sprint 1.3, 1.6, 1.7): cada sprint consome ~5k–15k tokens.

Wave N1 estimado: **120k–240k tokens em modelos avançados** + **15k–45k em modelos rápidos**.

---

## 7. Critério de Saída

Wave N1 entregue em main (sem PR único final — sprints foram mergeados individualmente):

- ✅ Todos os 7 sprints executáveis concluídos (N1.7 bloqueada por ausência de push web)
- ✅ Validação manual parcial — Inbox mobile e desktop validados pelo operador
- ✅ Cold start mobile + foreground tap funcionando (fix N1.8)
- ✅ Inbox cruza grupo via `protocol_ids[]` + enriquecimento relacional `enrichWithDoses` (R-195)
- ✅ Inbox exibe lista de medicamentos do horário (não todos do plano)
- ✅ Deeplink `dose-individual` funcional no mobile
- ✅ Web inbox com paridade completa de mobile
- ✅ `GlobalDoseModal` abre pré-configurado via CTA da inbox web
- ✅ DEVFLOW C5 registrado (AP-117, AP-118, R-195 + journal)
- ⏳ Lock screen iOS cenário D (múltiplas notifs distintas) — pendente validação com novo push noturno
- ⛔ N1.7 (SW tag web) — bloqueada indefinidamente até push web ser desenvolvido
