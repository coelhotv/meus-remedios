# Análise do Workflow Gemini Code Assist — Issues CRITICAL

> **Data:** 2026-02-26  
> **Contexto:** GATE 5.3 — Sprint 5.3 Finalização  
> **PR Afetado:** #223

---

## 🎯 Problema Central

O workflow de integração com Gemini Code Assist possui um **impasse lógico** quando issues **CRITICAL** ou **HIGH** são detectados:

1. **Bloqueio Inicial:** Issues CRITICAL/HIGH bloqueiam o workflow (correto)
2. **Correção:** Desenvolvedor corrige os issues e faz push
3. **Re-review:** Gemini deve reavaliar e marcar issues como resolvidos
4. **Desbloqueio:** Workflow deveria liberar, mas **permanece bloqueado**

---

## 🔍 Análise do Fluxo Atual

### Jobs do Workflow (`.github/workflows/gemini-review.yml`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE REVISÃO                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. detect              → Detecta review do Gemini ou novo commit      │
│  2. poll-review         → Polling para review (se não detectado)       │
│  3. parse               → Extrai e categoriza issues                   │
│  4. upload-to-blob      → Upload JSON para Vercel Blob                 │
│  5. persist             → Persiste no Supabase via Vercel API          │
│  6. check-critical  ⚠️  → **BLOQUEIA** se CRITICAL/HIGH encontrados    │
│  7. notify-agents       → Notifica agents externos                     │
│  8. auto-fix            → Aplica correções automáticas (se aplicável)  │
│  9. validate            → Executa lint, tests, build                   │
│  10. apply-labels       → Aplica labels no PR                          │
│  11. summary            → Posta/atualiza resumo no PR                  │
│  12. trigger-rereview   → Trigger re-review em novos commits           │
│  13. create-issues  ❌  → **SÓ executa se NÃO houver blocking issues** │
│  14. check-resolutions  → Verifica resoluções via Vercel API           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Job Crítico: `check-critical` (linhas 636-693)

```yaml
check-critical:
  name: Check Critical/High Issues
  needs: [detect, parse, persist]
  if: always() && needs.persist.result == 'success'
  outputs:
    has_blocking_issues: ${{ steps.check.outputs.has_blocking_issues }}
    has_critical: ${{ steps.check.outputs.has_critical }}
    # ... outros outputs
```

**Comportamento:**
- Executa o script `check-critical-issues.cjs`
- Seta `has_blocking_issues=true` se encontrar CRITICAL ou HIGH (security/performance)
- Posta comentário de bloqueio no PR

### Job Afetado: `create-issues` (linhas 1025-1141)

```yaml
create-issues:
  name: Create GitHub Issues via Vercel API
  needs: [detect, parse, upload-to-blob, persist, check-critical]
  # ❌ SÓ executa se NÃO houver issues bloqueantes
  if: always() && ... && needs.check-critical.outputs.has_blocking_issues != 'true'
```

**Problema:** Este job é **skippado** quando há issues bloqueantes, mas não há mecanismo automático para:
1. Re-executar o `check-critical` após correções
2. Atualizar o status de `has_blocking_issues` quando issues são resolvidos

---

## 📋 Issues Detectados no PR #223

| Prioridade | Arquivo | Linha | Descrição | Correção Aplicada |
|------------|---------|-------|-----------|-------------------|
| 🚨 CRITICAL | `tasks.js` | 716 | `logSuccessfulNotification` faltando após envio de alerta crítico | ✅ Adicionada chamada correta |
| 🚨 CRITICAL | `tasks.js` | 745 | `logSuccessfulNotification` faltando após envio de alerta proativo | ✅ Adicionada chamada correta |
| 🚨 CRITICAL | `Consultation.jsx` | 132 | Função `uploadAndShare` não existe → corrigir para `shareReport` | ✅ Corrigido para `shareReport` com destructuring |
| ⚠️ MEDIUM | `Dashboard.jsx` | 863 | Estilos inline no botão — mover para CSS Modules | 🔜 Criar issue separada |

---

## 💡 Soluções Propostas

### Solução 1: Re-trigger Automático do Workflow (Recomendada)

**Modificar o job `trigger-rereview` para também re-executar o workflow completo:**

```yaml
trigger-rereview:
  name: Trigger Re-review
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request' && github.event.action == 'synchronize'
  steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Check and Trigger Re-review
      uses: actions/github-script@v7
      with:
        script: |
          const { shouldTriggerRereview, triggerRereview } = require('./.github/scripts/trigger-re-review.cjs');
          
          const shouldTrigger = await shouldTriggerRereview(
            context.payload.pull_request.number,
            github,
            context
          );
          
          if (shouldTrigger) {
            console.log('Alterações significativas detectadas, solicitando re-review...');
            await triggerRereview(
              context.payload.pull_request.number,
              github,
              context
            );
            
            // 🆕 NOVO: Disparar evento para re-executar workflow
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'gemini-review.yml',
              ref: context.payload.pull_request.head.ref,
              inputs: {
                pr_number: context.payload.pull_request.number.toString()
              }
            });
          }
```

**Vantagens:**
- Re-executa todo o workflow com novo commit
- `check-critical` reavalia issues do zero
- Não depende de estado anterior

**Desvantagens:**
- Pode criar loop se não houver mudanças significativas
- Custo de execução do workflow completo

---

### Solução 2: Verificação de Resolução no `check-critical`

**Modificar o script `check-critical-issues.cjs` para verificar se issues foram resolvidos:**

```javascript
// .github/scripts/check-critical-issues.cjs

async function checkCriticalIssues({ reviewFile, github, context, core, prNumber }) {
  // ... código existente ...
  
  // 🆕 NOVO: Verificar no Supabase se issues anteriores foram resolvidos
  const { data: resolvedIssues } = await supabase
    .from('gemini_reviews')
    .select('id, status, priority')
    .eq('pr_number', prNumber)
    .eq('status', 'resolved')
    .in('priority', ['CRITICAL', 'HIGH']);
  
  // Comparar com issues atuais
  const previouslyBlocking = resolvedIssues.filter(i => 
    ['CRITICAL', 'HIGH'].includes(i.priority)
  );
  
  if (previouslyBlocking.length > 0 && currentCritical.length === 0) {
    console.log('✅ Issues anteriormente bloqueantes foram resolvidos');
    core.setOutput('has_blocking_issues', 'false');
    return { hasBlockingIssues: false };
  }
  
  // ... resto do código ...
}
```

**Vantagens:**
- Mais preciso — verifica estado real no banco
- Não re-executa workflow inteiro

**Desvantagens:**
- Requer integração com Supabase no script
- Complexidade adicional

---

### Solução 3: Comando Manual `/gemini review`

**Implementar suporte a comando manual no workflow:**

```yaml
# Adicionar ao job detect
- name: Check for Manual Trigger
  id: manual
  uses: actions/github-script@v7
  with:
    script: |
      if (context.eventName === 'issue_comment') {
        const comment = context.payload.comment.body;
        const isManualTrigger = comment.includes('/gemini review');
        core.setOutput('manual_trigger', isManualTrigger);
      }

# Modificar condição do check-critical
if: always() && (needs.persist.result == 'success' || steps.manual.outputs.manual_trigger == 'true')
```

**Vantagens:**
- Controle manual pelo desenvolvedor
- Simplicidade de implementação

**Desvantagens:**
- Requer ação manual
- Pode ser esquecido

---

### Solução 4: Timeout com Reavaliação (Híbrida)

**Adicionar job de reavaliação automática após N minutos:**

```yaml
re-evaluate:
  name: Re-evaluate Critical Issues
  runs-on: ubuntu-latest
  needs: [check-critical]
  if: always() && needs.check-critical.outputs.has_blocking_issues == 'true'
  steps:
    - name: Wait for Corrections
      run: sleep 300  # 5 minutos
    
    - name: Re-check Issues
      uses: actions/github-script@v7
      with:
        script: |
          // Re-executar verificação
          // Se issues resolvidos, atualizar status
```

**Vantagens:**
- Automático após timeout
- Não requer intervenção manual

**Desvantagens:**
- Atraso na execução
- Recursos consumidos durante espera

---

## 🔧 Implementação Recomendada (Curto Prazo)

### Passo 1: Modificar `trigger-rereview` (Solução 1)

Adicionar dispatch de workflow após re-review ser solicitado.

### Passo 2: Adicionar Suporte a `/gemini review` (Solução 3)

Permitir re-trigger manual via comentário.

### Passo 3: Documentar Processo

Adicionar ao `GEMINI_INTEGRATION.md`:

```markdown
### Re-avaliação de Issues Bloqueantes

Quando issues CRITICAL/HIGH são detectados:

1. Faça as correções necessárias
2. Faça push dos commits
3. O workflow re-executará automaticamente (se alterações significativas)
4. Ou comente `/gemini review` para forçar re-avaliação
5. Aguarde o Gemini confirmar resolução
```

---

## 📊 Status do PR #223

| Item | Status |
|------|--------|
| Correções CRITICAL aplicadas | ✅ Sim |
| Push para branch | ✅ Sim |
| Re-review Gemini | ⏳ Aguardando |
| Merge disponível | ❌ Bloqueado até aprovação |

### Correções Aplicadas (Commit `013d31b`)

1. **tasks.js:717** — Adicionado `await logSuccessfulNotification(userId, null, 'stock_alert', { messageId: result.messageId })`
2. **tasks.js:746** — Adicionado `await logSuccessfulNotification(userId, null, 'proactive_stock_alert', { messageId: result.messageId })`
3. **Consultation.jsx:129** — Corrigido para `const { url: shareUrl } = await shareService.shareReport(pdfBlob, { filename: 'consulta-medica.pdf' })`

**Bônus:** Integração com DLQ adicionada para falhas nos envios de estoque proativo e crítico.

---

## 📝 Próximos Passos

1. **Aguardar re-review do Gemini** — Workflow deve re-executar automaticamente
2. **Se permanecer bloqueado:** Executar `/gemini review` manualmente no PR
3. **Após aprovação:** Merge com `--no-ff` e deleção da branch
4. **Pós-merge:** Validação completa com `npm run validate:full`

---

## 🔗 Referências

- [`.github/workflows/gemini-review.yml`](../.github/workflows/gemini-review.yml)
- [`docs/standards/GEMINI_INTEGRATION.md`](docs/standards/GEMINI_INTEGRATION.md)
- [PR #223](https://github.com/coelhotv/meus-remedios/pull/223)
- [`.github/scripts/check-critical-issues.cjs`](../.github/scripts/check-critical-issues.cjs)
