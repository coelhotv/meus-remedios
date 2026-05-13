# EXEC SPEC — Snooze de Doses (Telegram)

**Versão:** 1.0  
**Sprint alvo:** Wave N2 ou posterior  
**Escopo v1:** Telegram only · Dose individual (`dose_reminder`) · Opções fixas 15/30/60 min  
**Arquitetura:** 3 camadas (L1 scheduling → L2 payload → L3 channel) — não violar  

---

## Contexto e motivação

O alerta de dose individual no Telegram tem os CTAs `✅ Tomar` e `⏭️ Pular`. O botão `⏰ Adiar` foi removido porque não havia implementação. Esta spec define a implementação completa respeitando:

1. A janela de 2h de registro atrasado já existente no app
2. A arquitetura 3 camadas das notificações (L1/L2/L3)
3. A limitação de 64 bytes nos `callback_data` do Telegram
4. O modelo serverless (Vercel) — sem estado em memória entre invocações

---

## Arquitetura da feature

```
[Telegram: clica ⏰ Adiar]
       ↓ callback: snooze_:{protocolId}:{HH:MM}
[doseActions.js: handleSnooze()]
  - valida intervalo entre doses do protocolo (>2h)
  - calcula opções disponíveis dentro da janela de 2h
  - edita mensagem com teclado de opções
       ↓ callback: snooze_pick:{minutes}:{protocolId}:{HH:MM}
[doseActions.js: handleSnoozePick()]
  - valida novamente a janela
  - persiste em snooze_jobs (fire_at = now + minutes)
  - edita mensagem com confirmação
       ↓ (cron a cada minuto)
[notify.js → _snoozeHelpers.js: checkSnoozedDoses()]
  - lê snooze_jobs com fire_at <= now AND sent_at IS NULL
  - faz dispatcher.dispatch(kind: 'dose_reminder', context: { isSnoozed: true, originalScheduledHHMM })
       ↓
[buildNotificationPayload.js: applySnoozeDecoration()]
  - decora título e body com indicação visual de lembrete adiado
       ↓
[telegramChannel.js]
  - entrega normalmente (sem conhecimento de snooze)
```

---

## Entregáveis

| # | Arquivo | Tipo | Descrição |
|---|---------|------|-----------|
| T1 | `supabase/migrations/YYYYMMDD_snooze_jobs.sql` | New | Tabela snooze_jobs + RLS + grants |
| T2 | `server/bot/_snoozeHelpers.js` | New | Validação de janela/intervalo + checkSnoozedDoses() |
| T3 | `server/bot/callbacks/doseActions.js` | Modify | handlers handleSnooze + handleSnoozePick |
| T4 | `server/notifications/payloads/buildNotificationPayload.js` | Modify | applySnoozeDecoration() |
| T5 | `server/notifications/payloads/_payloadSchemas.js` | Modify | 'snooze' de volta no actionSchema |
| T6 | `server/notifications/channels/telegramChannel.js` | Modify | encodeCallback: case 'snooze' |
| T7 | `server/notifications/payloads/buildNotificationPayload.js` | Modify | snooze de volta em formatDoseReminder actions |
| T8 | `api/notify.js` | Modify | chamar checkSnoozedDoses() no cron |

---

## T1 — Migration SQL

Arquivo: `supabase/migrations/YYYYMMDD_snooze_jobs.sql`  
Substituir `YYYYMMDD` pela data de execução no formato `20260513`.

```sql
CREATE TABLE public.snooze_jobs (
  id                     uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid         NOT NULL,
  protocol_id            uuid         NOT NULL,
  kind                   text         NOT NULL DEFAULT 'dose_reminder',
  original_scheduled_hhmm text        NOT NULL,  -- 'HH:MM' da dose original
  fire_at                timestamptz  NOT NULL,   -- quando disparar o re-alerta
  created_at             timestamptz  NOT NULL DEFAULT now(),
  sent_at                timestamptz             -- NULL = pendente, NOT NULL = enviado
);

-- Índice para o cron (consulta principal)
CREATE INDEX idx_snooze_jobs_pending ON public.snooze_jobs (fire_at)
  WHERE sent_at IS NULL;

-- Grants obrigatórios (regra CLAUDE.md: toda tabela nova precisa de grants explícitos)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snooze_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.snooze_jobs TO service_role;

ALTER TABLE public.snooze_jobs ENABLE ROW LEVEL SECURITY;

-- RLS: usuário só vê/gerencia seus próprios jobs
CREATE POLICY "snooze_jobs_user_select"
  ON public.snooze_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "snooze_jobs_user_insert"
  ON public.snooze_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "snooze_jobs_service_all"
  ON public.snooze_jobs FOR ALL
  TO service_role
  USING (true);
```

**Aplicar via MCP `apply_migration` — não executar direto no dashboard.**

---

## T2 — `server/bot/_snoozeHelpers.js` (novo arquivo)

```js
import { supabase } from '../services/supabase.js';
import { createLogger } from '../bot/logger.js';

const logger = createLogger('SnoozeHelpers');

const DOSE_WINDOW_MINUTES = 120; // janela máxima de registro atrasado
const SNOOZE_OPTIONS_MINUTES = [15, 30, 60];

/**
 * Converte 'HH:MM' para minutos desde meia-noite.
 */
function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Retorna os minutos de snooze disponíveis dado o horário original da dose.
 * Filtra opções que fariam o fire_at ultrapassar a janela de 2h.
 *
 * @param {string} originalHHMM - Horário original da dose ('HH:MM')
 * @param {Date} now - Momento atual
 * @returns {number[]} Opções de minutos válidas (subconjunto de [15, 30, 60])
 */
export function getAvailableSnoozeOptions(originalHHMM, now = new Date()) {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const originalMinutes = hhmmToMinutes(originalHHMM);

  // Janela encerra em originalMinutes + 120. Pode cruzar meia-noite.
  const windowEndMinutes = originalMinutes + DOSE_WINDOW_MINUTES;

  return SNOOZE_OPTIONS_MINUTES.filter(opt => {
    const fireAtMinutes = nowMinutes + opt;
    return fireAtMinutes < windowEndMinutes;
  });
}

/**
 * Verifica se o protocolo tem intervalo mínimo entre doses maior que 2h.
 * Snooze só é permitido nesses casos para evitar confusão com a próxima dose.
 *
 * @param {string[]} timeSchedule - Array de horários 'HH:MM' do protocolo
 * @returns {boolean} true se o snooze está habilitado para este protocolo
 */
export function isSnoozeEligible(timeSchedule) {
  if (!timeSchedule || timeSchedule.length <= 1) return true; // dose única no dia: sempre elegível

  const sorted = [...timeSchedule].sort();
  const minutesList = sorted.map(hhmmToMinutes);

  let minGap = Infinity;
  for (let i = 1; i < minutesList.length; i++) {
    minGap = Math.min(minGap, minutesList[i] - minutesList[i - 1]);
  }
  // Verificar gap circular (última dose → primeira dose no dia seguinte)
  const circularGap = (1440 - minutesList[minutesList.length - 1]) + minutesList[0];
  minGap = Math.min(minGap, circularGap);

  return minGap > DOSE_WINDOW_MINUTES; // intervalo mínimo > 2h
}

/**
 * Persiste um snooze job no banco.
 *
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.protocolId
 * @param {string} params.originalScheduledHHMM - 'HH:MM'
 * @param {number} params.delayMinutes - 15, 30 ou 60
 * @returns {Promise<{ success: boolean, fireAt: Date }>}
 */
export async function createSnoozeJob({ userId, protocolId, originalScheduledHHMM, delayMinutes }) {
  const fireAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  const { error } = await supabase
    .from('snooze_jobs')
    .insert({
      user_id: userId,
      protocol_id: protocolId,
      kind: 'dose_reminder',
      original_scheduled_hhmm: originalScheduledHHMM,
      fire_at: fireAt.toISOString(),
    });

  if (error) {
    logger.error('Falha ao criar snooze job', error, { userId, protocolId, delayMinutes });
    return { success: false, fireAt: null };
  }

  return { success: true, fireAt };
}

/**
 * Busca e processa snooze jobs vencidos.
 * Chamado pelo cron a cada minuto.
 *
 * @param {object} dispatcher - notificationDispatcher (mesmo shape usado em notify.js)
 * @param {string} correlationId
 */
export async function checkSnoozedDoses(dispatcher, correlationId) {
  try {
    // Buscar jobs pendentes com fire_at já passado
    const { data: jobs, error } = await supabase
      .from('snooze_jobs')
      .select(`
        id, user_id, protocol_id, original_scheduled_hhmm,
        protocol:protocols(
          id, name, time_schedule, dosage_per_intake,
          medicine:medicines(name, dosage_unit, dosage_per_pill)
        )
      `)
      .is('sent_at', null)
      .lte('fire_at', new Date().toISOString())
      .limit(50); // limite defensivo por invocação

    if (error) throw error;
    if (!jobs || jobs.length === 0) return;

    logger.info(`Processando ${jobs.length} snooze jobs vencidos`, { correlationId });

    for (const job of jobs) {
      try {
        const protocol = job.protocol;

        if (!protocol) {
          // Protocolo deletado/inativado após o snooze — marcar como enviado e ignorar
          await _markJobSent(job.id);
          continue;
        }

        const medicine = protocol.medicine;
        const dosage = protocol.dosage_per_intake
          ? `${protocol.dosage_per_intake} ${medicine?.dosage_unit || 'cp'}`
          : null;

        await dispatcher.dispatch({
          userId: job.user_id,
          kind: 'dose_reminder',
          data: {
            medicineName: medicine?.name || 'Medicamento',
            time: job.original_scheduled_hhmm,
            dosage,
            hour: parseInt(job.original_scheduled_hhmm.split(':')[0], 10),
            protocolId: job.protocol_id,
          },
          context: {
            correlationId,
            isSnoozed: true,
            originalScheduledHHMM: job.original_scheduled_hhmm,
            jobType: 'snooze_reminder',
          },
        });

        await _markJobSent(job.id);
      } catch (err) {
        logger.error('Falha ao processar snooze job', err, { jobId: job.id, correlationId });
        // Não marcar como sent — cron tentará novamente no próximo minuto
      }
    }
  } catch (err) {
    logger.error('Erro crítico em checkSnoozedDoses', err, { correlationId });
  }
}

async function _markJobSent(jobId) {
  await supabase
    .from('snooze_jobs')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', jobId);
}
```

---

## T3 — `server/bot/callbacks/doseActions.js`

### 3.1 — Imports a adicionar no topo do arquivo

```js
import { getAvailableSnoozeOptions, isSnoozeEligible, createSnoozeJob } from '../_snoozeHelpers.js';
import { getUserIdByChatId } from '../../services/userService.js';
```

`getUserIdByChatId` já deve estar importado. Verificar antes de duplicar.

### 3.2 — Registrar handlers no `handleCallbacks(bot)`

Adicionar dentro do `bot.on('callback_query', ...)`, **antes** do bloco `snooze_` existente (ou onde os outros `startsWith` estão):

```js
} else if (data.startsWith('snooze_pick:')) {
  await handleSnoozePick(bot, callbackQuery);
} else if (data.startsWith('snooze_:')) {
  await handleSnooze(bot, callbackQuery);
}
```

**ATENÇÃO:** `snooze_pick:` deve vir **antes** de `snooze_:` no if/else chain — caso contrário `snooze_pick` seria capturado pelo `startsWith('snooze_')`.

### 3.3 — Implementar `handleSnooze`

```js
/**
 * Exibe opções de tempo para adiar a dose.
 * callback_data: snooze_:{protocolId}:{HH:MM}
 * Exemplo: snooze_:dac9309d-...-xxxx:11:45
 */
async function handleSnooze(bot, callbackQuery) {
  const { data, message, id } = callbackQuery;
  const chatId = message.chat.id;

  // Parse: ['snooze_', protocolId, HH, MM]
  // Reconstruir originalHHMM com slice para lidar com ':' no horário
  const parts = data.split(':');
  const protocolId = parts[1];
  const originalHHMM = parts.slice(2).join(':'); // 'HH:MM'

  try {
    // Buscar time_schedule do protocolo para validar elegibilidade
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('time_schedule')
      .eq('id', protocolId)
      .single();

    if (error || !protocol) {
      await bot.answerCallbackQuery(id, { text: 'Protocolo não encontrado.', show_alert: true });
      return;
    }

    if (!isSnoozeEligible(protocol.time_schedule)) {
      await bot.answerCallbackQuery(id, {
        text: 'Este protocolo tem doses muito próximas. Adiar poderia causar confusão com a próxima dose.',
        show_alert: true,
      });
      return;
    }

    const availableOptions = getAvailableSnoozeOptions(originalHHMM);

    if (availableOptions.length === 0) {
      await bot.answerCallbackQuery(id, {
        text: 'Janela de adiamento encerrada. Você tem até 2h após o horário original para registrar.',
        show_alert: true,
      });
      return;
    }

    const labelMap = { 15: '⏰ 15 min', 30: '⏰ 30 min', 60: '⏰ 1 hora' };
    const buttons = availableOptions.map(opt => ({
      text: labelMap[opt],
      callback_data: `snooze_pick:${opt}:${protocolId}:${originalHHMM}`,
    }));

    await bot.editMessageReplyMarkup(
      { inline_keyboard: [buttons] },
      { chat_id: chatId, message_id: message.message_id }
    );

    await bot.answerCallbackQuery(id, { text: 'Por quanto tempo adiar?' });
  } catch (err) {
    console.error('Erro ao exibir opções de snooze:', err);
    await bot.answerCallbackQuery(id, { text: 'Erro ao processar. Tente novamente.', show_alert: true });
  }
}
```

### 3.4 — Implementar `handleSnoozePick`

```js
/**
 * Persiste o snooze job após seleção de tempo.
 * callback_data: snooze_pick:{minutes}:{protocolId}:{HH:MM}
 * Exemplo: snooze_pick:30:dac9309d-...-xxxx:11:45
 */
async function handleSnoozePick(bot, callbackQuery) {
  const { data, message, id } = callbackQuery;
  const chatId = message.chat.id;

  const parts = data.split(':');
  const delayMinutes = parseInt(parts[1], 10);
  const protocolId = parts[2];
  const originalHHMM = parts.slice(3).join(':'); // 'HH:MM'

  const VALID_OPTIONS = [15, 30, 60];
  if (!VALID_OPTIONS.includes(delayMinutes)) {
    await bot.answerCallbackQuery(id, { text: 'Opção inválida.', show_alert: true });
    return;
  }

  try {
    // Re-validar janela (pode ter passado tempo desde handleSnooze)
    const availableOptions = getAvailableSnoozeOptions(originalHHMM);
    if (!availableOptions.includes(delayMinutes)) {
      await bot.answerCallbackQuery(id, {
        text: 'Esta opção não está mais disponível. A janela de 2h está se encerrando.',
        show_alert: true,
      });
      return;
    }

    const userId = await getUserIdByChatId(chatId);

    const { success, fireAt } = await createSnoozeJob({
      userId,
      protocolId,
      originalScheduledHHMM: originalHHMM,
      delayMinutes,
    });

    if (!success) {
      await bot.answerCallbackQuery(id, { text: 'Erro ao agendar lembrete. Tente novamente.', show_alert: true });
      return;
    }

    const fireTimeStr = fireAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    const confirmText = `⏰ *Lembrete adiado\\!*\n\nVou te lembrar novamente às *${escapeMarkdownV2(fireTimeStr)}*\\.`;

    await bot.editMessageText(confirmText, {
      chat_id: chatId,
      message_id: message.message_id,
      parse_mode: 'MarkdownV2',
      reply_markup: { inline_keyboard: [] },
    });

    await bot.answerCallbackQuery(id, { text: `Lembrete agendado para ${fireTimeStr}` });
  } catch (err) {
    console.error('Erro ao agendar snooze:', err);
    if (err.message === 'User not linked') {
      await bot.answerCallbackQuery(id, { text: 'Conta não vinculada. Use /start.', show_alert: true });
      return;
    }
    await bot.answerCallbackQuery(id, { text: 'Erro ao agendar. Tente novamente.', show_alert: true });
  }
}
```

**Verificar:** `escapeMarkdownV2` já deve estar importado no arquivo. Confirmar antes de adicionar import duplicado.

---

## T4 — `server/notifications/payloads/buildNotificationPayload.js`

### 4.1 — Adicionar `applySnoozeDecoration`

Adicionar **após** a função `applyRetryDecoration` existente (em torno da linha 285):

```js
/**
 * Aplica decoração visual de lembrete adiado quando context.isSnoozed = true.
 */
function applySnoozeDecoration(content, context) {
  if (!context.isSnoozed) return content;

  const originalTime = context.originalScheduledHHMM ?? '';
  const safeOriginal = escapeMarkdownV2(originalTime);

  return {
    ...content,
    title: `⏰ ${content.title}`,
    body: `_Lembrete adiado \\(original: ${safeOriginal}\\)_\n\n${content.body}`,
    pushBody: `(Lembrete adiado — original: ${originalTime})\n${content.pushBody}`,
  };
}
```

### 4.2 — Chamar `applySnoozeDecoration` na pipeline

Localizar a linha que chama `applyRetryDecoration`:

```js
const decorated = applyRetryDecoration({ title, body, pushBody }, context);
```

Substituir por:

```js
const decorated = applySnoozeDecoration(
  applyRetryDecoration({ title, body, pushBody }, context),
  context
);
```

### 4.3 — Restaurar botão snooze em `formatDoseReminder`

Localizar o array `actions` em `formatDoseReminder` e adicionar `snooze` entre `take` e `skip`:

```js
const actions = [
  { id: 'take',   label: '✅ Tomar',  params: { protocolId: protocolId ?? '', dosage: dosage ?? 1 } },
  { id: 'snooze', label: '⏰ Adiar',  params: { protocolId: protocolId ?? '', originalHHMM: time } },
  { id: 'skip',   label: '⏭️ Pular', params: { protocolId: protocolId ?? '' } }
];
```

**Nota:** `time` é o `HH:MM` da dose já disponível no escopo de `formatDoseReminder` via destructuring de `result.data`.

---

## T5 — `server/notifications/payloads/_payloadSchemas.js`

Localizar:

```js
id: z.enum(['take', 'skip', 'take_plan', 'take_misc']),
```

Substituir por:

```js
id: z.enum(['take', 'snooze', 'skip', 'take_plan', 'take_misc']),
```

---

## T6 — `server/notifications/channels/telegramChannel.js`

Localizar a função `encodeCallback` e adicionar o case `snooze`:

```js
// Adicionar antes do `default: return null`:
case 'snooze': raw = `snooze_:${p.protocolId}:${p.originalHHMM ?? '00:00'}`; break
```

**Verificar limite 64 bytes:**
- `snooze_:` = 8 chars
- UUID = 36 chars
- `:HH:MM` = 6 chars
- **Total = 50 chars** ✓

---

## T7 — `server/notifications/channels/telegramChannel.js` — layout inline_keyboard

O botão snooze volta para `dose_reminder` (3 botões). O `singleRow` check já existente garante layout em linha:

```js
const singleRow = payload.metadata?.kind === 'dose_reminder'
options.reply_markup = { inline_keyboard: singleRow ? [buttons] : buttons.map(b => [b]) }
```

Nenhuma alteração necessária aqui — já está correto.

---

## T8 — `api/notify.js` — integrar checkSnoozedDoses no cron

### 8.1 — Adicionar import

Localizar os imports das funções de tarefa no topo do arquivo e adicionar:

```js
import { checkSnoozedDoses } from '../server/bot/_snoozeHelpers.js';
```

### 8.2 — Chamar no loop de cron

Dentro de `_executeCronJobs`, no bloco "1. Always check dose reminders (Every minute)", **após** o `checkReminders` existente:

```js
// 1.1 Snooze jobs vencidos (Every minute, junto com reminders)
await withCorrelation(
  (context) => checkSnoozedDoses(notificationDispatcher, context.correlationId),
  { correlationId, jobType: 'snooze_reminders' }
);
results.push('snooze_reminders');
```

---

## Acceptance Criteria / DoD

- [ ] Tabela `snooze_jobs` criada com RLS e grants corretos
- [ ] Botão `⏰ Adiar` aparece no alerta de dose individual no Telegram
- [ ] Ao clicar em `⏰ Adiar`, teclado é substituído por opções de tempo (15/30/60 min)
- [ ] Opções que ultrapassariam a janela de 2h não aparecem
- [ ] Para protocolo com doses a cada 1h (ex: 08:00, 09:00), botão `⏰ Adiar` retorna mensagem de inelegibilidade ao clicar
- [ ] Ao selecionar tempo, mensagem é editada com confirmação e horário do re-alerta
- [ ] Re-alerta chega com título `⏰ 🍽️ Remédios do almoço` (ou o emoji do horário correspondente)
- [ ] Re-alerta tem linha `_Lembrete adiado (original: HH:MM)_` no body
- [ ] Re-alerta tem os CTAs `✅ Tomar`, `⏰ Adiar` e `⏭️ Pular` (pode adiar novamente se ainda dentro da janela)
- [ ] `snooze_jobs` marcado com `sent_at` após entrega
- [ ] Protocolos sem `active = true` na hora do fire_at → job marcado sem enviar
- [ ] 0 erros de lint após implementação

---

## Testes a escrever

Arquivo: `server/bot/utils/__tests__/snoozeHelpers.test.js`

```
describe('getAvailableSnoozeOptions')
  - dose às 11:00, agora 11:05 → retorna [15, 30, 60]
  - dose às 11:00, agora 12:55 → retorna [] (janela encerrada)
  - dose às 11:00, agora 12:40 → retorna [15] (só 15 cabe antes de 13:00)

describe('isSnoozeEligible')
  - ['08:00', '14:00', '20:00'] → true (gap mínimo = 360 min)
  - ['08:00', '09:00', '20:00'] → false (gap mínimo = 60 min)
  - ['22:00', '07:00'] → false (gap circular = 540, mas gap direto 22→07 = 540 → true? não, 22:00→07:00 = 9h = 540 min > 120 → true)
  - ['22:00', '23:30'] → false (gap = 90 min < 120)
  - [] → true (sem schedule)
  - ['08:00'] → true (dose única)
```

---

## Notas de implementação

### Callback data parsing — convenção de ':'
Todos os horários `HH:MM` contêm `:`. Ao parsear callbacks, **sempre** usar `parts.slice(N).join(':')` para o horário, nunca destructuring simples. Ver padrão em `handleTakePlan` em `doseActions.js` (linha ~384).

### Serverless e in-memory
O Vercel recria o ambiente a cada invocação. **Nunca** usar `setTimeout` ou variáveis globais para o snooze. A tabela `snooze_jobs` é a única fonte de verdade.

### Adiar um lembrete já adiado
É permitido — desde que o novo `fire_at` caiba dentro da janela de 2h original. `getAvailableSnoozeOptions` usa o `originalHHMM` como âncora fixa, independente de quantas vezes o usuário já adiou.

### `notification_mode` no re-alerta
O dispatcher verifica `notification_mode` e quiet hours normalmente. Se o usuário estiver em modo `silent` ou dentro do quiet hours quando o snooze vencer, o re-alerta será suprimido pela `checkGatePolicy`. Isso é comportamento correto — o usuário configurou silêncio.

---

## Escopo fora desta spec (v2+)

- Snooze para `dose_reminder_by_plan` e `dose_reminder_misc` (bulk)
- Snooze dentro do app mobile (UI nativa)
- Notificação Expo do re-alerta
- Histórico de snoozes no perfil do usuário
