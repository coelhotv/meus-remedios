# Redesign de Notificações — Da Lista Plana à Notificação Significativa

## Context

O screenshot atual (`screenshots/notificacoes-lockscreen.png`) mostra **8 notificações idênticas empilhadas** na lock screen às 23:39 (Ansitec, Olmesartana, Espironolactona, SeloZok, Atorvastatina, Omega 3, Pregabalina, Trimebutina). Todas com a mesma copy fixa: `"💊 Lembrete de nova dose — Está na hora de tomar 1x de [X]. Não deixe para depois!"`.

**Causa-raiz** (`server/bot/tasks.js:325–399` — `checkRemindersViaDispatcher`): o cron itera **um dispatch por protocolo** quando `time_schedule.includes(currentHHMM)`. O `buildNotificationPayload` em `api/notify.js:49–61` tem template fixo único. Não há agrupamento, prioridade, copy variável, quiet hours nem digest.

**Por que importa para o posicionamento do Dosiq**: o produto é gerenciador para tratamentos crônicos com **poli-farmácia** (chatbot IA, ANVISA, titulação, predição de estoque). O público-alvo — pacientes cardiovasculares, neurológicos, ICFEr — toma **6–10 doses simultâneas em blocos coordenados**. A notificação atual trata cada dose como evento isolado, gerando ruído, fadiga e dessensibilização — exatamente o oposto do valor de adesão que o produto busca entregar. Notificações ruins **descredibilizam o app e degradam adesão**.

**Insight estrutural confirmado**: o domínio já modela **planos de tratamento** (`protocols.treatment_plan_id`, `treatmentPlanService`, `TreatmentAccordion`, `LogForm type='plan'` com bulk register pré-marcado). A notificação pode aproveitar essa camada para dar **significado nominal** ao bloco ("Quarteto Fantástico — ICFEr") em vez de listar medicamentos soltos.

---

## Eixos de Solução (resumo)

| Eixo | Problema atacado | Onde |
|------|------------------|------|
| **A. Agrupamento por minuto + plano** | 8 notifs → 1 notif com contexto | Wave N1 |
| **B. Quiet hours + Digest mode** | Sem controle do usuário sobre frequência | Wave N2 |
| **C. Copy variável + métricas** | Fadiga por repetição; ausência de tracking | Wave N3 |
| D. Criticidade por medicamento | Diferenciar essencial vs. opcional | **Backlog** |

---

## Wave N1 — Agrupamento por Treatment Plan (degradação graciosa)

**Goal**: Substituir o "1 notificação por protocolo" por **1 notificação por bloco semântico** — preservando a identidade dos planos de tratamento (essencial para multimorbidade) e evitando o colapso ambíguo de tudo em uma única notificação.

### Regra de Agrupamento

Para cada minuto-cron e cada usuário, pegar todas as doses cujo `time_schedule` contém `currentHHMM` e particionar:

1. **Para cada `treatment_plan_id` distinto com ≥2 doses** → emitir 1 notificação dedicada com nome do plano
2. **Sobra** = doses sem `treatment_plan_id` ∪ doses de planos com 1 dose só:
   - Se sobra ≥ 2 → 1 notificação consolidada "Suas doses agora"
   - Se sobra = 1 → notificação individual detalhada (formato atual)
   - Se sobra = 0 → nada
3. **Caso especial**: usuário com apenas 1 dose total no minuto (com ou sem plano) → notificação individual detalhada (atual). Não vale o overhead de agrupar 1 dose.

### Tabela de Cenários

| Cenário | Composição | Notificações enviadas |
|---------|-----------|-----------------------|
| A (screenshot atual) | 8 doses, sem plano | **1**: "Suas doses agora — 8 medicamentos" |
| B | 4 doses do "Quarteto Fantástico" | **1**: "Quarteto Fantástico — 4 medicamentos" |
| C | 4 plano A + 2 avulsos | **2**: "Plano A (4)" + "Suas doses (2)" |
| D (caso do usuário multimorbidade) | 4 plano A + 3 plano B | **2**: "Plano A (4)" + "Plano B (3)" |
| E | 4 plano A + 3 plano B + 2 avulsos | **3**: "Plano A" + "Plano B" + "Suas doses (2)" |
| F | 4 plano A + 3 plano B + 1 avulsa | **3**: "Plano A" + "Plano B" + 1 individual detalhada |
| G | plano A (1 dose) + plano B (1 dose) | **2** individuais detalhadas (cada plano com 1 dose vira "sobra"; sobra=2 → consolidada "Suas doses (2)") → revisão: ver nota |
| H | 1 dose única, com plano | **1** individual detalhada (formato atual) |
| I | 1 dose única, sem plano | **1** individual detalhada (formato atual) |

> **Nota cenário G**: 2 doses, ambas em planos diferentes mas com 1 dose cada → caem na "sobra". Como sobra=2, a regra original gera 1 consolidada "Suas doses (2)" — porém isso esconde o nome do plano. **Decisão**: nesse caso específico, preferir 2 individuais detalhadas (mantém identidade do plano em cada). Implementação: na "sobra", se cada item da sobra tem `treatment_plan_id` próprio E sobra ≤ 3, emitir individuais; senão consolidar.

### Modelo de mensagem por plano (Telegram MarkdownV2)

```
🌅 *Quarteto Fantástico — ICFEr*

4 medicamentos agora — 08:00

  💊 Atorvastatina — 1 cp
  💊 SeloZok — 1 cp
  💊 Olmesartana — 1 cp
  💊 Espironolactona — 1 cp

[ ✅ Registrar este plano ]  [ 📋 Ver detalhes ]
```

### Modelo de mensagem para "sobra" consolidada

```
☀️ *Suas doses agora* — 08:00

2 medicamentos pendentes:

  • Ômega 3 — 1 cp
  • Trimebutina — 1 cp

[ ✅ Registrar todos ]  [ 📋 Ver detalhes ]
```

### Modelo de Push (PWA / Expo) — uma push por bloco

- **Por plano**:
  - Title: `"🌅 Quarteto Fantástico (ICFEr)"` (ou greeting + plano por hora do dia)
  - Body: `"4 medicamentos agora — 08:00"`
  - Tag: `dose-{HHMM}-plan-{planId}`
  - Deeplink: `dosiq://today?at=HHMM&plan=${planId}` — abre LogForm `type='plan'` com plano pré-selecionado
- **Sobra consolidada**:
  - Title: `"☀️ Suas doses agora"`
  - Body: `"2 medicamentos pendentes — 08:00"`
  - Tag: `dose-{HHMM}-misc`
  - Deeplink: `dosiq://today?at=HHMM&misc=1`
- **Individual** (atual): tag `dose-{HHMM}-protocol-{protocolId}`

### Por que essa regra (vs. 1 única consolidada)

- **Multimorbidade preserva identidade**: paciente com ICFEr + TAG quer reconhecer "esse é meu Quarteto cardiológico" sem confundir com ansiolíticos.
- **Botões com escopo claro**: "Registrar este plano" age só sobre o `treatment_plan_id` daquela notificação. Sem ambiguidade "e meus outros planos?".
- **Mantém o ganho do screenshot**: sem plano → 1 só notif "Suas doses". Com 1 plano → 1 só. Com N planos → N notifs (≤ N planos típicos). Em todos os casos, ≤ N planos << N medicamentos.
- **Degradação graciosa**: quando o usuário não usa planos, o sistema funciona idêntico ao "agrupar tudo".

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `server/bot/tasks.js:325–399` (`checkRemindersViaDispatcher`) | Refatorar loop: coletar `dosesNow[]` (com JOIN em `treatment_plan_id`/`treatment_plan_name`). Aplicar regra de partição (planos com ≥2 doses → 1 notif por plano; sobra consolidada se ≥2; individuais se sobra ≤ 1 ou sobra com planos distintos ≤ 3). Emitir N dispatches (um por bloco). |
| `server/bot/tasks.js` (novos `formatDoseGroupedByPlanMessage` + `formatDoseGroupedMiscMessage`) | Dois formatters MarkdownV2: (1) por plano (título com nome do plano), (2) "Suas doses agora" para sobra consolidada. Reutilizar `escapeMarkdownV2`. |
| `api/notify.js:47–79` (`buildNotificationPayload`) | Dois novos cases: `'dose_reminder_by_plan'` (recebe `planId`, `planName`, `doses[]`) e `'dose_reminder_misc'` (sobra consolidada). Title contextual por horário; deeplinks `?at=HHMM&plan=${planId}` ou `?at=HHMM&misc=1`. |
| `server/bot/tasks.js` (`sendDoseNotification` + novos wrappers) | Inline keyboard por plano: `✅ Registrar este plano` (`callback_data: takeplan:${planIdx}:${HHMM}` — usar índice numérico, R-030 callback_data <64 bytes) e `📋 Detalhes`. Para sobra: `✅ Registrar todos` (`takelist:${listKey}`). |
| `server/bot/callbacks/doseActions.js` | Novos handlers: `takeplan` resolve `treatment_plan_id` por índice + HHMM e chama bulk-log apenas das doses do plano (porta server da lógica `LogForm type='plan'`). `takelist` faz bulk das doses misceláneas daquele HHMM. Botão "Adiar" mantém escopo (adiar plano ou adiar lista). |
| `server/services/notificationDeduplicator.js` | Chaves de dedup mais granulares: `(userId, 'dose_reminder_by_plan', HHMM, planId)`, `(userId, 'dose_reminder_misc', HHMM)`, `(userId, 'dose_reminder', protocolId)`. Janela de 5min mantida. |
| `server/notifications/repositories/notificationLogRepository.js` | `protocol_id` armazena `null` para grouped, `protocol_ids: uuid[]` no `provider_metadata`. `treatment_plan_id` armazenado quando aplicável (já dá pra inbox listar agrupado). |
| `apps/web/src/features/dashboard/views/Today.jsx` (ou equivalente) | Ler `?at=HHMM&plan=${planId}` ou `?at=HHMM&misc=1` da URL e abrir `LogForm` (`type='plan'` com plano pré-selecionado, OU lista de protocolos misc pré-marcada). |
| `apps/web/public/sw.js` (service worker) | Adicionar `tag: dose-${HHMM}-${plan|misc|protocolId}` no payload — replace correto entre minutos sem confundir planos diferentes. |

### Helpers a reutilizar

- `treatmentPlanService` (`apps/web/src/features/protocols/services/treatmentPlanService.js`) — já busca planos por user. Server-side: replicar query simples no `checkRemindersViaDispatcher` (JOIN protocolo→treatment_plan).
- Lógica de agrupamento em `DoseZoneList.jsx:146–168` (`groupByPlan`) — referência para a estrutura `{ planId, planName, doses[] }`.
- `LogForm.jsx:151–160` (bulk plan log) — referência para o handler `takeall` server-side.
- `escapeMarkdownV2`, `wrapSendMessageResult`, `getCurrentTimeInTimezone` — já existem em `server/bot/`.

### Verificação

- Unit (partition): para cada cenário A–I da tabela, assertar `partitionDoses(doses)` retorna o número e tipo de blocos esperados
- Unit (formatters): `formatDoseGroupedByPlanMessage(plan, doses)` e `formatDoseGroupedMiscMessage(doses)` com fixtures de 2/4/12 doses (truncamento)
- Unit (`checkRemindersViaDispatcher`): fixture multi-protocolo / multi-plano — assert N dispatches corretos por bloco com chaves de dedup distintas
- Unit (callback `takeplan`): registra apenas doses do `treatment_plan_id` correspondente; `takelist` registra apenas as misc; nunca cross-plano
- Integration (sandbox bot): cenários A, D (multimorbidade), E em chat de teste
- Push manual: 2 push com tags `dose-08:00-plan-A` e `dose-08:00-plan-B` — validar que NÃO se substituem
- Manual UX: lock screen iOS com cenário D (4+3 doses) — confirmar 2 notificações distintas, cada uma identificando seu plano
- Regressão: `npm run validate:agent` (10-min kill switch); `npm run lint` antes do commit

### Riscos

- **Telegram 4096 chars**: plano com 15+ medicamentos. Mitigação: truncar para top-10 + "_… e mais N_".
- **Callback "Registrar este plano" é "tudo ou nada do plano"**: usuário pode ter tomado 3 dos 4. Mitigação: botão "📋 Detalhes" leva ao app com checkboxes individuais (LogForm `type=plan` já existe). Não reinventar UI no Telegram.
- **Sobra com planos distintos**: regra do cenário G (≤3 itens com planos próprios → individuais). Cuidado com edge case de "11 itens cada um de um plano diferente" — manter limite e cair em "Suas doses (N)" para não inundar.
- **PWA Expo Push e `tag`**: Expo SDK pode ignorar `tag`/`channelId`. Confirmar em `server/notifications/channels/expoPushChannel.js`. Se ignorado, pior caso = leve duplicação cosmética; aceitar e documentar para o roadmap de Web Push direto.
- **Migration de `treatment_plan_id` no log**: já é coluna existente em `protocols`; não precisa migration. `notification_log.treatment_plan_id` (se ainda não existe) é nullable e seguro adicionar.

---

## Wave N2 — Quiet Hours + Digest Mode

**Goal**: Dar ao usuário controle sobre **quando** ser interrompido. Crítico para usuários noturnos (ex.: dose das 23:00 que aparece junto com tentativa de dormir).

### Comportamento

| Modo | Comportamento |
|------|---------------|
| `realtime` (default) | Atual + agrupamento da Wave N1 |
| `digest_morning` | **Nenhuma** notif individual; 1 push às `digest_time` (default 07:00) com agenda completa do dia |
| `silent` | Nenhum push/Telegram; apenas inbox web |

**Quiet hours** (`quiet_hours_start`, `quiet_hours_end`): no modo `realtime`, notifs dentro da janela são **suprimidas** (não enviadas). Se passar para `digest_morning`, são incluídas no digest do dia seguinte.

### Migration Supabase

```sql
ALTER TABLE user_settings
  ADD COLUMN quiet_hours_start TIME,
  ADD COLUMN quiet_hours_end TIME,
  ADD COLUMN notification_mode TEXT DEFAULT 'realtime'
    CHECK (notification_mode IN ('realtime', 'digest_morning', 'silent')),
  ADD COLUMN digest_time TIME DEFAULT '07:00';
```

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `apps/web/src/schemas/userSettingsSchema.js` (criar se não existir) | Adicionar `quiet_hours_start`, `quiet_hours_end` (regex `HH:MM`), `notification_mode` enum, `digest_time`. Sincronizar com migration (R obrigatória do CLAUDE.md). |
| `server/bot/tasks.js` (`checkRemindersViaDispatcher`) | Antes do dispatch: ler `notification_mode` + quiet_hours. Se `silent` → skip. Se `digest_morning` → skip (será coletado pelo digest). Se `realtime` + dentro de quiet_hours → skip. |
| `server/bot/tasks.js` (`runDailyDigest`) | Quando `notification_mode='digest_morning'` e horário = `digest_time`: incluir agenda completa do dia (todos `time_schedule` * protocolos), agrupando por bloco temporal e plano. |
| `apps/web/src/features/settings/...` (nova seção "Notificações") | UI: toggle "Não me incomode", 2 time pickers, radio com 3 modos. Persistir via `userSettingsService.updateSettings()`. |
| `apps/mobile/src/features/settings/screens/NotificationPreferencesScreen.jsx` | Adicionar mesmas opções. |

### Verificação

- Unit: `shouldSendNotification` (ou wrapper) retorna `false` quando dentro de quiet_hours
- Unit: digest agrupa por bloco temporal + plano
- E2E manual: configurar `quiet_hours_start=22:00`, `quiet_hours_end=07:00`, dose às 23:00, validar não-envio + entrada na inbox
- Manual: alternar para `digest_morning`, validar 1 push às 07:00 com toda agenda

### Riscos

- **Migration em produção**: compatibilidade com leituras existentes (sempre nullable; default seguro). Sem rollback necessário.
- **Inbox vs push**: inbox sempre persiste; quiet hours afeta só canais externos. Documentar isso na UI.

---

## Wave N3 — Copy Variável + Métricas de Engajamento

**Goal**: (a) Combater fadiga: a 14ª notificação no mesmo formato perde sentido. (b) Medir impacto: hoje não sabemos se as notificações são abertas ou ignoradas.

### Library de copy contextual

`server/bot/notificationCopy.js` (novo):

- `pickGreeting(hour)` — pool por bloco temporal:
  - 05–10: ☀️ "Bom dia!", "Comece bem o dia", "Hora dos remédios da manhã"
  - 11–13: 🍽️ "Hora do almoço", "Pausa para os medicamentos do almoço"
  - 14–17: ☕ "Boa tarde", "Hora dos remédios da tarde"
  - 18–22: 🌆 "Hora dos remédios da noite", "Antes de relaxar"
  - 23–04: 🌙 "Última dose do dia", "Antes de dormir"
- `pickStreakLine({ streak })` — opcional, append ao final:
  - `streak >= 7`: `🔥 ${streak}º dia em sequência`
  - `streak >= 30`: `🎯 ${streak} dias seguidos — você está mandando bem`
- `pickAdherenceLine({ weekRate })` — append em weekly recap, não em dose individual
- **Anti-repetição**: seed por `(userId + dia)` → mesma copy não aparece 2 dias seguidos

### Tipos novos de notificação (gatilhos no scheduler)

| Tipo | Quando | Copy |
|------|--------|------|
| `streak_milestone` | Streak atinge 7/14/30/60/90 | `🎯 ${n} dias seguidos!` |
| `streak_broken` | Quebra após ≥7 dias | `💔 Sua sequência de ${n} dias foi quebrada — tudo bem, recomeça hoje` |
| `daily_recap` (opt-in 22:00) | Adesão = 100% no dia | `✨ ${total}/${total} doses hoje` |

### Métricas — `notification_log` enrichment

Adicionar colunas:
```sql
ALTER TABLE notification_log
  ADD COLUMN opened_at TIMESTAMPTZ,
  ADD COLUMN action_taken_at TIMESTAMPTZ,
  ADD COLUMN action_type TEXT;  -- 'opened', 'take_all', 'snooze', 'skip'
```

### Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `server/bot/notificationCopy.js` (novo) | Pools + `pickGreeting`, `pickStreakLine`, etc. seed determinístico por (userId, día). |
| `api/notify.js` + `server/bot/tasks.js` (formatters) | Substituir strings hard-coded pelos picks. |
| `server/bot/callbacks/doseActions.js` | Em `take_all` / `snooze` / `skip`: UPDATE `notification_log` `action_taken_at` + `action_type`. |
| `apps/web/src/App.jsx` (router/main) | Detectar `?notif=<id>` na URL → POST `/api/notification-opened` (ou Supabase RPC) marca `opened_at`. |
| Deeplink no payload | Append `?notif=${notificationLog.id}` (id gerado **antes** do dispatch — pequeno refactor: `create()` retorna id, payload usa). |
| `apps/web/src/features/dashboard/components/...` (opcional) | Card "Sua taxa de resposta a notificações: X%" calculada de `notification_log` (last 30d). |

### Verificação

- Unit: `pickGreeting(8)` retorna pool da manhã; mesma seed produz mesma escolha
- Unit: `notification_log` recebe `opened_at` quando endpoint é chamado
- Manual: abrir push no dispositivo → verificar UPDATE no log
- Dashboard: validar que percentage faz sentido com dados reais

### Riscos

- **Endpoint de tracking**: criar `/api/notification-opened` consumiria 1 slot da budget Hobby (atual 6/12 — OK). Alternativa: chamar Supabase REST direto com RLS bem feita (no extra function).
- **Deeplink id**: precisa criar log `pending` antes do envio. Mudança não-trivial em `dispatchNotification.js:78–129` (hoje fire-and-forget pós-envio). Refatorar para 2-fase: `createPending()` → `dispatch` → `markSent(id, status)`.

---

---

## Mobile App (apps/mobile/) — Cobertura Transversal

> Esta seção é **transversal** às três waves. O app mobile já tem push notifications funcionando via Expo, Notification Inbox, e settings de canal. As mudanças abaixo garantem que o redesign cubra integralmente o canal mobile native.

### Estado atual relevante

| Componente | Arquivo | Estado |
|------------|---------|--------|
| Setup push + listener de tap | `apps/mobile/src/platform/notifications/usePushNotifications.js` | Listener existe (linha 53) mas **deeplink só dá `console.log` em DEV** (linhas 57–66). Comentário no código confirma: "seria via event emitter ou context" — gap atual. |
| Inbox mobile | `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx` | SectionList por dia (Hoje/Ontem/Esta semana/Mais antigos), cruza dose_reminder com medicine_logs para "✓ Tomada" via `buildWasTakenMap` (linhas 67–79). |
| Item da Inbox | `apps/mobile/src/features/notifications/components/NotificationItem.jsx` | `CTA_MAP` (linhas 18–24) cobre 5 tipos: `dose_reminder`, `stock_alert`, `missed_dose`, `titration_update`, `daily_digest`. `resolveTitle` (linhas 26–40) usa `medicine_name`/`protocol_name`. |
| Hook de log | `apps/mobile/src/shared/hooks/useNotificationLog.js` | SWR-style com cache local + refresh em meia-noite/AppState. Lê `notification_log` direto. |
| Registro de dose | `apps/mobile/src/features/dose/components/DoseRegisterModal.jsx` | **Apenas log individual hoje** — não tem bulk/plan register equivalente ao `LogForm type='plan'` web. |
| Preferências | `apps/mobile/src/features/profile/screens/NotificationPreferencesScreen.jsx` (431 linhas) | Apenas toggle Telegram vs Mobile push. Sem quiet hours / modo / digest_time. |
| Canal Expo | `server/notifications/channels/expoPushChannel.js` | Já envia push. Falta enriquecer payload com `data.navigation` para deeplink. |
| Navigation | `apps/mobile/src/navigation/Navigation.jsx` | React Navigation com `navigationRef`. Sem hookup com push tap nem `Linking`. |

### Mudanças transversais por wave

#### N1 — Agrupamento + bulk register mobile

| Arquivo | Mudança |
|---------|---------|
| `server/notifications/channels/expoPushChannel.js` | Enriquecer `data` do push Expo com `{ navigation: { screen, params: { at, planId, misc, protocolId, treatmentPlanName } }, notificationLogId }`. Manter `tag` cosmético se Expo aceitar; senão documentar. |
| `apps/mobile/src/platform/notifications/usePushNotifications.js:53–68` | **Conectar deeplink real**: substituir `console.log` por `navigationRef.current?.navigate(targetRoute, params)`. Importar `navigationRef` exportado de `Navigation.jsx`. Mapear `screen` → ROUTE: `bulk-plan` → `TODAY` (com modal aberto), `bulk-misc` → `TODAY` idem, `dose-individual` → `TODAY`. Tratar cold start: usar `Notifications.getLastNotificationResponseAsync()` no mount. |
| `apps/mobile/src/features/dose/components/BulkDoseRegisterModal.jsx` (novo) | Modal com 2 modos: (a) `mode='plan'` — lê `treatment_plan_id`, lista checkboxes dos protocolos do plano com `time_schedule` contendo `at`, todos pré-marcados, botão "Registrar X doses" faz batch via `medicineLogService.createMany()`. (b) `mode='misc'` — recebe `protocolIds[]`, mesma UI flat sem header de plano. Reutilizar lógica de `LogForm.jsx:151–160` (web `type='plan'`) portada para RN. |
| `apps/mobile/src/features/dashboard/screens/TodayScreen.jsx` | Abrir `BulkDoseRegisterModal` quando navegação chegar com params `{ at, planId }` ou `{ at, misc: true, protocolIds }`. Usar `route.params` + `useEffect` para abrir modal automaticamente. |
| `apps/mobile/src/navigation/routes.js` (ou equivalente) | Garantir ROUTE `TODAY` aceita params. |
| `apps/mobile/src/features/notifications/components/NotificationItem.jsx:18–24` | Estender `CTA_MAP`: `dose_reminder_by_plan: { label: 'Registrar plano', action: 'bulk-plan' }`, `dose_reminder_misc: { label: 'Registrar doses', action: 'bulk-misc' }`. |
| `apps/mobile/src/features/notifications/components/NotificationItem.jsx:26–40` (`resolveTitle`) | Adicionar branches: `dose_reminder_by_plan` → `notification.treatment_plan_name ?? 'Plano de tratamento'`; `dose_reminder_misc` → `'Doses agora'`. |
| `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx:32–37` (`DEEP_LINK_TARGETS`) | Adicionar `'bulk-plan': ROUTES.TODAY` e `'bulk-misc': ROUTES.TODAY`. `onNavigate` passa params do log (`metadata.protocol_ids`, `treatment_plan_id`, etc.). |
| `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx:67–79` (`buildWasTakenMap`) | Atualizar lógica: para grouped, cruzar via `metadata.protocol_ids[]` (todos registrados? "✓ Todas tomadas"; parcial? "X/N tomadas"; nenhum? CTA padrão). |
| `apps/mobile/src/features/notifications/components/NotificationItem.jsx` (footer) | Renderizar "X/N tomadas" quando `wasTaken` for objeto `{ taken, total }` em vez de boolean. |
| `apps/mobile/src/shared/hooks/useNotificationLog.js` | Garantir SELECT inclui `treatment_plan_id`, `treatment_plan_name`, `provider_metadata` (de onde virá `protocol_ids[]`). |
| `apps/web/src/utils/notificationIcon.js` (ou `@dosiq/core` se for compartilhado — verificar via `getNotificationIcon` import) | Adicionar `dose_reminder_by_plan` (ícone `Package` ou novo) e `dose_reminder_misc` (ícone `Clock`). |

#### N2 — Quiet hours + Digest mode (mobile UI)

| Arquivo | Mudança |
|---------|---------|
| `apps/mobile/src/features/profile/screens/NotificationPreferencesScreen.jsx` | Adicionar 3 seções abaixo do toggle de canal: (1) **Modo de notificação** — `RadioGroup` com 3 opções (`realtime` / `digest_morning` / `silent`), persistir em `user_settings.notification_mode`. (2) **Não me incomode** — Switch + 2 `DateTimePicker` (mode='time') para `quiet_hours_start` e `quiet_hours_end`. (3) **Hora do resumo diário** — `DateTimePicker` visível apenas quando `notification_mode === 'digest_morning'`. |
| `apps/mobile/src/features/profile/services/userSettingsService.js` (ou equivalente) | Estender métodos `getSettings`/`updateSettings` para incluir os novos campos. |
| Schema Zod compartilhado | Se `userSettingsSchema` está em `@dosiq/core` ou `apps/web/src/schemas/`, mobile importa de lá. Validar que está sincronizado com migration (R-038-equivalente: schema-DB sync). |
| `apps/mobile/src/platform/notifications/usePushNotifications.js` | Suprimir handler local quando recebe push em quiet_hours (defesa em profundidade — server já filtra, mas `Notifications.setNotificationHandler` pode ser ajustado por modo). Opcional para Wave N2. |

#### N3 — Métricas + Copy variável (mobile)

| Arquivo | Mudança |
|---------|---------|
| `apps/mobile/src/platform/notifications/usePushNotifications.js` (handler de tap) | Antes de navegar, marcar `notification_log.opened_at = now()` via Supabase REST. Usar `notificationLogId` do payload `data`. Idempotente (não sobrescrever se já marcado). |
| `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx` | Ao tocar item: além de navegar, marcar `opened_at` se ainda nulo. `markAllRead` atual marca `read_at`? Verificar e separar `read_at` (visualizou na inbox) de `opened_at` (clicou no push). |
| `apps/mobile/src/features/dashboard/screens/...` (insight card opcional) | Se Wave N3 incluir card "Sua taxa de resposta a notificações: X%", componente paralelo ao web. Reutilizar query de `notification_log`. |
| Copy variável | **Nada a mudar no mobile** — server gera title/body finais; mobile só renderiza. |

### Verificação mobile

- **Cold start**: matar app, enviar push → tocar → app abre direto no `BulkDoseRegisterModal` correto (não no Today vazio). Validar via `getLastNotificationResponseAsync`.
- **Foreground tap**: app aberto, push chega, banner aparece, tocar banner → navega para modal correto.
- **Inbox cruzamento**: registrar 2 das 4 doses do plano via modal → voltar à Inbox → item exibe "2/4 tomadas".
- **Quiet hours**: configurar 22:00–07:00, simular push 23:00 → não chega no device.
- **Digest mode**: configurar `digest_morning 07:00` → única notif aparece 07:00 com agenda do dia.
- **Cross-plan tag**: 2 push com `tag` `dose-08:00-plan-A` e `dose-08:00-plan-B` → ambas aparecem (não substitui). Atenção: Expo SDK pode não respeitar `tag`; testar e documentar.
- **Acessibilidade**: VoiceOver lê título do plano + total + CTA. Já é padrão do `NotificationItem` (R-138 ícone com label).

### Riscos mobile específicos

- **`navigationRef` não inicializado**: se push chegar antes do `NavigationContainer` montar (cold start), navegação falha. Mitigação: usar `Notifications.getLastNotificationResponseAsync()` dentro de um `useEffect` que aguarda navigationRef.isReady().
- **Expo Push não respeita `tag`**: cosmético — duplicação curta em raros casos. Documentar e considerar Web Push direto na evolução futura.
- **Bulk register modal RN ≠ web**: implementação RN puro (sem react-hook-form se for caso). Cuidar de offline (queue local + retry) — pode ficar fora do MVP de Wave N1 se aumentar escopo demais. Documentar como follow-up.
- **`metadata.protocol_ids[]` em `provider_metadata`**: hoje a coluna é JSONB. Garantir índice de queries comuns ou aceitar full-scan limitado (volume baixo de notification_log por usuário).
- **Schema `userSettingsSchema` duplicado**: se mobile importa do core e web tem cópia, sincronizar ambos. Idealmente single source em `packages/core/` ou similar.

---

## Ordem de execução recomendada

1. **PR #1 (Wave N1)** — agrupamento por treatment_plan + bulk register mobile. Inclui: backend (partição, formatters, callbacks Telegram, payload Expo enriquecido), web (deeplink Today + LogForm já reusável), mobile (deeplink real, `BulkDoseRegisterModal`, NotificationItem estendido, Inbox cruzamento por `protocol_ids[]`). **Resolve o screenshot e estabelece base mobile.** Sem migration. ~3 dias (escopo alargou pelo mobile).
2. **PR #2 (Wave N2)** — quiet hours + digest mode. Migration `user_settings`. UI Settings nas duas pontas (web + `NotificationPreferencesScreen` mobile com DateTimePicker + RadioGroup). Server-side suppression e digest enriquecido. ~3 dias.
3. **PR #3 (Wave N3)** — copy variável + métricas. Refactor `dispatchNotification.js` para `notificationLogId` pré-criado. Migration `notification_log` (`opened_at`, `action_taken_at`, `action_type`). Tap handler marca `opened_at` em web (router) e mobile (`usePushNotifications`). Pool de copy contextual server-side. ~3 dias.

**Total estimado**: ~9 dias de trabalho focado, 3 PRs faseados.

---

## DEVFLOW — registros antecipados

- **Novo R-NNN candidato**: "Notificações de doses simultâneas particionam por treatment_plan_id (uma notif por plano com ≥2 doses + sobra consolidada/individual). NÃO consolidar tudo em 1 só — perde identidade do plano em multimorbidade" — após N1
- **Novo AP-NNN candidato**: "Não emitir 1 push por protocolo no mesmo minuto (caso real: 8 notifs em 23:39, screenshot)" — após N1
- **Novo AP-NNN candidato (extra)**: "Não colapsar todas as doses simultâneas em uma única notificação consolidada — botão 'registrar todos' vira ambíguo em multimorbidade ('e meus outros planos?')" — após N1
- **ADR candidato**: "Política de quiet hours e modos de notificação (realtime/digest_morning/silent)" — após N2
- Journal: cada wave = uma entry em `.agent/memory/journal/2026-W17.jsonl` (ou seguinte).

---

## Out of scope (backlog)

- **Wave N4 — Criticidade por medicamento** (`protocols.criticality`): comportamento diferenciado para anticoagulante/antiepiléptico/antibiótico (requireInteraction, som específico). Requer migration + UX de marcação. Considerar após uso real das Waves N1–N3.
- **Auto-tuning de horário**: detectar drift de horário típico (sempre toma 09:15 quando agendado 09:00) e sugerir migrar. Depende de pipeline de analytics rodando primeiro.
- **A/B test de copy**: framework de variantes em `notificationCopy.js` com tracking. Útil **depois** das métricas básicas estarem em produção.
- **Pré-aviso 5min antes**: mais um job no cron, baixo valor isolado, alto valor combinado com criticidade.
