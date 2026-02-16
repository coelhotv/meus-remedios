## Resumo

feat(bot): adicionar retry com exponential backoff e telegramFormatter (Phase 1)

Este PR implementa a Fase 1 do plano de melhorias da arquitetura do bot Telegram conforme [`plans/telegram-architecture-improvements.md`](plans/telegram-architecture-improvements.md). Entrega principal: mecanismo de retry configurável, biblioteca centralizada de formatação/escape MarkdownV2, e testes que cobrem os casos críticos.

## Rationale

Falhas transitórias e parsing incorreto de Markdown provocaram notificações perdidas. O retry reduz falsos negativos em falhas de rede; o telegramFormatter elimina erros de parsing (ex.: `!`) e centraliza escaping para prevenir regressões.

## Como validar (passos locais)

1. Rodar lint e testes críticos (obrigatório):

```bash
npm run lint
npm run test:critical
```

2. Rodar apenas os testes adicionados (rápido):

```bash
npx vitest run tests/server/bot/retryManager.test.js tests/server/utils/telegramFormatter.test.js
```

3. Simular falhas do Telegram (local/integration):

- Mockar `api/notify.js` para retornar `ok: false` (400) e confirmar que `sendWithRetry` não re-tenta e que o resultado indica falha.
- Mockar retorno 429 (rate limit) e confirmar que `sendWithRetry` re-tenta com backoff e registra rate-limit metric.

Exemplo (unit/integration): use `vi.mock` nas funções de fetch ou modifique temporariamente `createNotifyBotAdapter` para retornar respostas simuladas.

## Arquivos modificados / adicionados

- server/bot/retryManager.js  — Mecanismo de retry com backoff e jitter
- server/utils/telegramFormatter.js — escapeMarkdownV2, formatTelegramMessage e helpers
- tests/server/bot/retryManager.test.js — testes de retry (unit)
- tests/server/utils/telegramFormatter.test.js — testes de escaping e formatação

Também foram atualizados testes de integração locais para integrar a nova lógica.

## Testes adicionados/atualizados

- tests/server/bot/retryManager.test.js
- tests/server/utils/telegramFormatter.test.js

## Migrações

Nenhuma migração de banco é necessária para esta entrega (DLQ e schema foram previamente ajustados).

## Rollback plan (em caso de problemas)

1. Reverter o PR: `git revert <merge-commit>` e push para `main`.
2. Restaurar comportamento anterior de chamadas Telegram (remoção do `sendWithRetry`) e re-deploy.
3. Abrir issue com logs e métricas para análise antes de re-aplicar mudanças incrementais.

## Checklist para Merge

- [ ] `npm run lint` passou localmente
- [ ] `npm run test:critical` passou localmente
- [ ] PR segue formato (título/commits em Português)
- [ ] Testes unitários incluídos e cobrindo edge-cases
- [ ] Documentação mínima atualizada em `plans/telegram-architecture-improvements.md` (referência)

## Observações para reviewers

- Classifique comentários em: must-fix-before-merge, minor suggestion, follow-up (fazer issue). Para must-fix, aplicarei correção e voltarei com commit curto em Português.

