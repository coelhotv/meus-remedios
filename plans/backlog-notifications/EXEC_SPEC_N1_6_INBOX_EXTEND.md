# Exec Spec — N1.6: Estender Inbox para Notificações Agrupadas

> **Status:** PLANEJADO — aguardando /devflow coding
> **Sprint:** 2026-W17
> **Origem:** `EXEC_SPEC_WAVE_N1_GROUPING.md` §Sprint 1.6
> **Agente:** 🟡 Rápido (Haiku/Fast/Mini) — edits cirúrgicos com spec exata

---

## 1. Objetivo

Estender o Notification Inbox mobile para suportar os novos tipos `dose_reminder_by_plan` e
`dose_reminder_misc` introduzidos em N1.1–N1.3.

Atualmente, itens desses tipos aparecem com ícone e CTA genérico (`Bell / null`) porque:
- `notificationIconMapper.js` não os conhece
- `CTA_MAP` em `NotificationItem` não os lista
- `buildWasTakenMap` só cruza via `protocol_id` (singular), não via `protocol_ids[]` de grouped
- `DEEP_LINK_TARGETS` não tem `bulk-plan` / `bulk-misc`

---

## 2. Análise do Estado Atual

### `notificationLogSchema` (packages/core/src/schemas/notificationLogSchema.js)

Campos **ausentes** que chegam do DB (via `SELECT *`) mas são descartados pelo Zod:
- `treatment_plan_id` — uuid, nullable
- `treatment_plan_name` — string, nullable

`provider_metadata: z.record(z.string(), z.unknown())` já existe — portanto `protocol_ids[]`
está acessível via `notification.provider_metadata.protocol_ids`.

**Ação:** adicionar `treatment_plan_id` e `treatment_plan_name` como campos opcionais ao schema.
Sem breaking change — adição pura. O SELECT no repositório já é `'*'`.

### `notificationIconMapper.js` (packages/core/src/utils/notificationIconMapper.js)

Não tem entradas para `dose_reminder_by_plan` (deve usar `Package`) nem `dose_reminder_misc`
(deve usar `Clock`). Ambos os ícones já estão importados em `NotificationItem.jsx`.

### `NotificationItem.jsx` (apps/mobile/src/features/notifications/components/NotificationItem.jsx)

- `CTA_MAP` (linha 18–24): faltam entradas para os dois novos tipos
- `resolveTitle` (linha 26–40): faltam branches `dose_reminder_by_plan` e `dose_reminder_misc`
- Footer (linhas 110–119): lógica `wasTaken` assume boolean; precisa suportar objeto `{ taken, total }`
  para renderizar "X/N tomadas"
- `isDoseReminder` (linha 58): deve incluir os novos tipos para lógica de taken

### `NotificationInboxScreen.jsx` (apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx)

- `DEEP_LINK_TARGETS` (linha 32–37): faltam `'bulk-plan'` e `'bulk-misc'`
- `onNavigate` (linha 153): não passa params — apenas navega para a rota
- `buildWasTakenMap` (linha 67–79): só processa `dose_reminder` com `protocol_id` singular;
  precisa ramo para `dose_reminder_by_plan` / `dose_reminder_misc` usando `protocol_ids[]`

### `useNotificationLog.js`

Não precisa de mudança — usa `repo.listByUserId()` que já faz `SELECT *`.
Todos os campos do DB chegam; o problema era o schema Zod descartando os campos novos.

---

## 3. Deliverables

| # | Arquivo | Tipo de mudança |
|---|---------|-----------------|
| 1 | `packages/core/src/schemas/notificationLogSchema.js` | Additive — 2 campos opcionais |
| 2 | `packages/core/src/utils/notificationIconMapper.js` | Additive — 2 entradas no map |
| 3 | `apps/mobile/src/features/notifications/components/NotificationItem.jsx` | Edit — CTA_MAP, resolveTitle, footer, isDoseReminder |
| 4 | `apps/mobile/src/features/notifications/screens/NotificationInboxScreen.jsx` | Edit — DEEP_LINK_TARGETS, onNavigate, buildWasTakenMap |

---

## 4. Implementação Detalhada

### 4.1 notificationLogSchema.js — adicionar 2 campos

```js
// Adicionar em baseSchema (após protocol_name):
treatment_plan_id:   z.string().uuid().nullable().optional(),
treatment_plan_name: z.string().nullable().optional(),
```

### 4.2 notificationIconMapper.js — 2 novas entradas

```js
dose_reminder_by_plan: {
  iconName: 'Package',
  color: '#006a5e',
  bgColor: 'rgba(0, 106, 94, 0.10)',
  label: 'Lembrete de plano',
  deepLinkAction: 'bulk-plan',
},
dose_reminder_misc: {
  iconName: 'Clock',
  color: '#006a5e',
  bgColor: 'rgba(0, 106, 94, 0.10)',
  label: 'Doses agora',
  deepLinkAction: 'bulk-misc',
},
```

### 4.3 NotificationItem.jsx

**CTA_MAP — adicionar após dose_reminder:**
```js
dose_reminder_by_plan: { label: 'Registrar plano', action: 'bulk-plan' },
dose_reminder_misc:    { label: 'Registrar doses', action: 'bulk-misc' },
```

**resolveTitle — adicionar branches:**
```js
case 'dose_reminder_by_plan':
  return notification.treatment_plan_name ?? 'Plano de tratamento'
case 'dose_reminder_misc':
  return 'Doses agora'
```

**isDoseReminder — estender para incluir novos tipos:**
```js
const isDoseReminder = [
  'dose_reminder', 'dose_reminder_by_plan', 'dose_reminder_misc'
].includes(notification_type)
```

**Footer — suportar wasTaken como objeto { taken, total }:**
```js
// Substituir a condição de takenLabel:
{isDoseReminder && wasTaken === true ? (
  <Text style={styles.takenLabel}>✓ Tomada</Text>
) : isDoseReminder && wasTaken && typeof wasTaken === 'object' ? (
  <Text style={[styles.takenLabel, wasTaken.taken === wasTaken.total && styles.takenFull]}>
    {wasTaken.taken}/{wasTaken.total} tomadas
  </Text>
) : hasNavAction ? (
  // ... CTA existente
```

Adicionar estilo `takenFull`:
```js
takenFull: { color: colors.primary?.[600] ?? '#006a5e' },
```

### 4.4 NotificationInboxScreen.jsx

**DEEP_LINK_TARGETS — adicionar:**
```js
'bulk-plan': ROUTES.TODAY,
'bulk-misc': ROUTES.TODAY,
```

**onNavigate — passar params:**
```js
onNavigate={(view, params) => {
  const target = DEEP_LINK_TARGETS[view]
  if (target) navigation.navigate(target, params)
}}
```

**NotificationItem — atualizar prop onNavigate para passar params:**
```js
// Em renderItem, muda para:
onNavigate={(view) => {
  const target = DEEP_LINK_TARGETS[view]
  if (!target) return
  const params = {}
  if (item.notification_type === 'dose_reminder_by_plan') {
    params.bulkMode = 'plan'
    params.planId = item.treatment_plan_id
    params.treatmentPlanName = item.treatment_plan_name
    // HHMM extraído de sent_at
    const d = new Date(item.sent_at)
    params.at = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } else if (item.notification_type === 'dose_reminder_misc') {
    params.bulkMode = 'misc'
    params.protocolIds = item.provider_metadata?.protocol_ids ?? []
    const d = new Date(item.sent_at)
    params.at = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
  navigation.navigate(target, params)
}}
```

**buildWasTakenMap — adicionar ramo grouped:**
```js
function buildWasTakenMap(notifications, doseLogs) {
  if (!doseLogs?.length) return {}
  const map = {}
  for (const n of notifications) {
    if (n.notification_type === 'dose_reminder') {
      if (!n.protocol_id) continue
      map[n.id] = doseLogs.some(
        log => log.protocol_id === n.protocol_id &&
               new Date(log.taken_at) > new Date(n.sent_at)
      )
    } else if (
      n.notification_type === 'dose_reminder_by_plan' ||
      n.notification_type === 'dose_reminder_misc'
    ) {
      const protocolIds = n.provider_metadata?.protocol_ids ?? []
      if (!protocolIds.length) continue
      const taken = protocolIds.filter(pid =>
        doseLogs.some(
          log => log.protocol_id === pid &&
                 new Date(log.taken_at) > new Date(n.sent_at)
        )
      ).length
      map[n.id] = { taken, total: protocolIds.length }
    }
  }
  return map
}
```

---

## 5. Contracts & ADRs

| Contrato | Impacto |
|----------|---------|
| `notificationLogSchema` | Adição de campos opcionais — non-breaking |
| Nenhum CON-NNN cobre este schema | Sem gate de contrato — mudança aditiva |

Nenhum novo ADR necessário — decisões arquiteturais já cobertas por ADR-029 (dispatcher multicanal)
e ADR-014 (feature-based architecture).

---

## 6. Ordem de Implementação (C3)

1. `notificationLogSchema.js` — adicionar campos (schema primeiro)
2. `notificationIconMapper.js` — adicionar entradas (core util)
3. `NotificationItem.jsx` — CTA_MAP, resolveTitle, isDoseReminder, footer
4. `NotificationInboxScreen.jsx` — DEEP_LINK_TARGETS, buildWasTakenMap, onNavigate

---

## 7. Quality Gates (C4)

```bash
# Lint (rodar antes de cada commit)
cd apps/mobile && npx eslint src/features/notifications/ --max-warnings 0
cd packages/core && npx eslint src/ --max-warnings 0

# Testes (mobile usa Jest via Expo)
cd apps/mobile && npx jest src/features/notifications/ --passWithNoTests
cd packages/core && npx jest src/ --passWithNoTests

# Validate geral
npm run validate:agent   # raiz — kill switch 10 min
```

---

## 8. Acceptance Criteria (DoD)

- [ ] Inbox renderiza notificação `dose_reminder_by_plan` com título = `treatment_plan_name` e CTA "Registrar plano"
- [ ] Inbox renderiza notificação `dose_reminder_misc` com título "Doses agora" e CTA "Registrar doses"
- [ ] Ícone de `dose_reminder_by_plan` = Package (verde)
- [ ] Ícone de `dose_reminder_misc` = Clock (verde)
- [ ] Footer de grouped com 2 de 4 tomadas exibe "2/4 tomadas"
- [ ] Footer de grouped com todas tomadas exibe "4/4 tomadas" em verde
- [ ] Tap em `dose_reminder_by_plan` navega para ROUTES.TODAY com params `{ bulkMode: 'plan', planId, treatmentPlanName, at }`
- [ ] Tap em `dose_reminder_misc` navega para ROUTES.TODAY com params `{ bulkMode: 'misc', protocolIds: [...], at }`
- [ ] `buildWasTakenMap` retorna `{ taken: N, total: M }` para grouped (não boolean)
- [ ] `notificationLogSchema` valida e preserva `treatment_plan_id` e `treatment_plan_name`
- [ ] Lint clean em arquivos modificados antes de cada commit
- [ ] `npm run validate:agent` passa

---

## 9. Risk Flags

- **`notificationLogSchema` é shared** (`@dosiq/core`) — consumido por mobile e possivelmente web.
  Adição de campos opcionais é sempre safe. Verificar se web usa `notificationLogSchema` diretamente.
- **`buildWasTakenMap` retorna mix de `boolean` e `{ taken, total }`** — o componente `NotificationItem`
  precisa checar `typeof wasTaken === 'object'` antes de renderizar "X/N tomadas". Já incluído no spec.
- **`onNavigate` signature** muda de `(view) => void` para `(view, params) => void` — verificar se
  há outros callers de `onNavigate` em outros lugares (grep antes de modificar).
