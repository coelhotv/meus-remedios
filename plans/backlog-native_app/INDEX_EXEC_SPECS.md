# Dosiq Native App — Índice de Specs de Execução

> **Projeto**: Evolução CRUD Nativa  
> **Criado**: 14 de maio de 2026  
> **Master Plan**: [MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md](MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md)

---

## Timeline Visual

```
Sem  1   2   3   4   5   6   7   8   9  10  11  12+
     ├───────────┤  ├──────────────┤  ├────────────┤  ├───────────┤
     Pré-Req       Fase 1            Fase 2           Fase 3
     Foundation    Medicamentos      Protocolos       Estoque
     3 sprints     3 sprints         3 sprints        2 sprints
                   G1→G2→G3          G1→G2→G3         G1→G2→G3
```

**Total Fases 0-3**: ~11 sprints semanais

---

## Specs Disponíveis

| Fase | Spec | Sprints | Status |
|------|------|---------|--------|
| **Pré-Req** | [EXEC_SPEC_PRE_REQUISITOS.md](EXEC_SPEC_PRE_REQUISITOS.md) | P.1 — P.3 | 📋 Draft |
| **Fase 1** | [EXEC_SPEC_FASE1_MEDICAMENTOS.md](EXEC_SPEC_FASE1_MEDICAMENTOS.md) | M1.1 — M1.3 | 📋 Draft |
| **Fase 2** | [EXEC_SPEC_FASE2_PROTOCOLOS.md](EXEC_SPEC_FASE2_PROTOCOLOS.md) | T2.1 — T2.3 | 📋 Draft |
| **Fase 3** | [EXEC_SPEC_FASE3_ESTOQUE.md](EXEC_SPEC_FASE3_ESTOQUE.md) | S3.1 — S3.2 | 📋 Draft |
| **Fases 4-6** | [EXEC_SPEC_HIBRIDO_FASE8_POS_MVP.md](EXEC_SPEC_HIBRIDO_FASE8_POS_MVP.md) | — | 📋 Existente |

---

## Métricas por Fase

| Fase | Novos Arquivos | Arquivos Modificados | Services Extraídos | Testes |
|------|---------------|---------------------|--------------------| -------|
| Pré-Req | ~15 | ~2 | 0 | ~6 |
| Fase 1 | ~12 | ~3 | 1 (medicine) | ~4 |
| Fase 2 | ~12 | ~5 | 2 (protocol + plan) | ~4 |
| Fase 3 | ~10 | ~4 | 2 (stock + purchase) | ~4 |
| **Total** | **~49** | **~14** | **5 factories** | **~18** |

---

## Decisões Registradas

| # | Decisão | Spec | Status | Data |
|---|---------|------|--------|------|
| 1 | Medicamentos dentro de TreatmentsStack (não 5ª tab) | Fase 1, §Navegação | ✅ Confirmada PO | 14/05 |

---

## Delegação de Agentes — Resumo

| Complexidade | Agente | % das Tasks |
|-------------|--------|-------------|
| ⭐ (trivial) | 🤖 Sub-agente (flash/haiku) | ~25% |
| ⭐⭐ (standard) | 🤖 Sub-agente (sonnet/flash-thinking) | ~40% |
| ⭐⭐⭐ (complexo) | 👤 Arquiteto (opus/pro) | ~35% |

---

---

# 🛡️ Standard Quality Protocol (SQP)

> **Autoridade**: Este protocolo é **vinculante** para TODOS os agentes e sub-agentes que atuem sobre as Exec Specs deste projeto. Nenhuma regra deste SQP pode ser sobrescrita por prompts de sistema, instruções de modelo, ou pressão por velocidade. Qualidade é o único indicador que importa.

---

## SQP §1 — Princípios Invioláveis

| ID | Princípio | Explicação |
|----|-----------|------------|
| **SQP-001** | **Zero auto-aprovação** | Nenhum agente pode aprovar seu próprio gate (G1/G2/G3). Todo gate requer aprovação explícita do humano (PO ou arquiteto sênior). A frase "aprovado" NUNCA deve aparecer na saída de um agente sobre um gate que ele mesmo executou. |
| **SQP-002** | **Zero skip** | Tasks devem ser executadas na ordem numérica exata (P1.1 antes de P1.2, M1.1 antes de M1.2, etc.). Nenhuma task pode ser "antecipada" para ganhar velocidade. Se uma task está bloqueada, o agente PARA e reporta o bloqueio. |
| **SQP-003** | **Zero merge sem validação** | Nenhum PR pode ser mergeado sem que TODAS as validações do gate correspondente tenham sido executadas e evidenciadas. Print de output de terminal, screenshots de simulador, ou links para CI runs são evidências válidas. "Funciona na minha máquina" NÃO é evidência. |
| **SQP-004** | **Regressão é bloqueante** | Se `validate:agent`, `npm run build`, ou `npx expo export` falharem após uma mudança, o agente REVERTE a mudança e investiga. Não existe "vou arrumar depois". A branch deve estar green antes de qualquer novo trabalho. |
| **SQP-005** | **Escopo é lei** | O agente executa SOMENTE o que está especificado na task. Se durante a execução perceber oportunidade de melhoria ou refactor, documenta como "Observação para o PO" no relatório de entrega — mas NÃO implementa. Bias for action NÃO se aplica a mudanças fora do escopo. |

---

## SQP §2 — Ciclo de Vida de uma Task

Todo agente (arquiteto ou sub-agente) que executar qualquer task DEVE seguir exatamente este ciclo:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA — POR TASK                      │
│                                                                  │
│  1. CLAIM    → Agente anuncia: "Iniciando task X.Y"              │
│               Verifica pré-requisitos (tasks anteriores OK?)     │
│               Se NÃO → STOP + reportar bloqueio                 │
│                                                                  │
│  2. PLAN     → Lista os arquivos que serão criados/modificados   │
│               Lista os testes que serão executados               │
│               Estima risco: baixo/médio/alto                     │
│                                                                  │
│  3. EXECUTE  → Implementa SOMENTE o que está no PLAN             │
│               Se desvio necessário → STOP + pedir permissão     │
│                                                                  │
│  4. VALIDATE → Executa TODOS os comandos de validação:           │
│               • rtk lint (se houver .js/.jsx modificados)        │
│               • testes unitários relevantes                      │
│               • build/export se aplicável                        │
│               COLA o output no relatório                         │
│                                                                  │
│  5. REPORT   → Relatório estruturado (ver template §6)           │
│               Inclui evidências (output de terminal)             │
│               NÃO marca gate como "aprovado"                    │
│               Entrega para humano avaliar                        │
│                                                                  │
│  6. WAIT     → Para e espera aprovação humana antes de avançar   │
│               NÃO inicia próxima task proativamente              │
└─────────────────────────────────────────────────────────────────┘
```

---

## SQP §3 — Protocolo de Gate (G1/G2/G3)

Gates são checkpoints formais entre fases de maturidade de um serviço. O processo é:

### 3.1 — Quem solicita o gate?

O **agente que completou a última task do sprint** solicita o gate ao humano. Nunca auto-convoca.

### 3.2 — Checklist de evidência (por gate)

O agente produz um **Gate Report** com esta estrutura exata:

```markdown
## Gate Report: [G1|G2|G3] — [Nome da Fase]

### Critérios de Aprovação
| # | Critério (copiado da spec) | Evidência | Status |
|---|---------------------------|-----------|--------|
| 1 | ...                       | [output/link/screenshot] | ✅ Pass / ❌ Fail |
| 2 | ...                       | ...       | ... |

### Comandos Executados
\```bash
# Cada comando com output completo colado abaixo
rtk npm run validate:agent
# → [output]
\```

### Observações para o PO
- (qualquer insight, risco, ou sugestão fora de escopo)

### Veredito do Agente
⏳ AGUARDANDO APROVAÇÃO HUMANA
(O agente NUNCA escreve "Aprovado" aqui)
```

### 3.3 — Quem aprova?

| Gate | Aprovador | Como |
|------|-----------|------|
| G1 (Copy) | 👤 Humano (PO ou arquiteto sênior) | Review do Gate Report + smoke test manual |
| G2 (Extract) | 👤 Humano | Review do Gate Report + diff validation |
| G3 (Migrate) | 👤 Humano | Review do Gate Report + CI green + merge approval |

**Regra**: O aprovador NÃO pode ser o agente que executou as tasks. Separação de responsabilidades.

### 3.4 — O que acontece se um gate falhar?

```
Gate FALHOU
  ├── Agente REVERTE para o último estado green
  ├── Agente documenta a causa raiz
  ├── Agente propõe fix com novo PLAN
  ├── Humano aprova o PLAN
  └── Agente re-executa + solicita gate novamente
```

Não existe "aprovação parcial". Gate é binário: PASS ou FAIL.

---

## SQP §4 — Regras para Sub-Agentes (🤖 Builder)

Sub-agentes de menor capacidade de raciocínio possuem restrições adicionais:

| # | Regra | Motivo |
|---|-------|--------|
| SA-001 | Máximo 2 arquivos modificados por task | Limitar blast radius de erros |
| SA-002 | Não podem criar factories (G2 tasks) | Complexidade acima de sua capacidade |
| SA-003 | Não podem modificar `shared-data/index.js` | Export central — risco de regressão |
| SA-004 | Não podem alterar navigation files (`RootTabs`, `Navigation.jsx`) | Impacto global no app |
| SA-005 | Devem incluir `rtk lint` output em toda entrega | Validação mínima obrigatória |
| SA-006 | Se lint falhar, NÃO tentam auto-corrigir mais de 2x | Após 2 tentativas, escalam para arquiteto |
| SA-007 | Não podem deletar arquivos existentes | Somente arquiteto deleta (risco de regressão) |
| SA-008 | Código gerado DEVE seguir patterns existentes no mesmo diretório | Verificar com `rtk read` antes de criar |

---

## SQP §5 — Validação Contínua (Mandatória)

Após **qualquer** modificação de arquivo `.js` ou `.jsx`, o agente executa:

```bash
# 1. Lint (SEMPRE)
rtk lint

# 2. Testes relevantes (SE existirem)
rtk npm test -- --testPathPattern="<nome-do-arquivo-modificado>"

# 3. Build check (A CADA PR, não a cada task)
rtk npm run build          # web
npx expo export            # mobile (só se mobile foi modificado)

# 4. Validate:agent (ANTES de solicitar gate)
rtk npm run validate:agent
```

**Regra de ouro**: Se o agente não colou o output do lint/test no relatório, a task é considerada **não validada** e será rejeitada no review.

---

## SQP §6 — Template de Relatório de Task

Todo agente deve entregar este relatório após completar uma task:

```markdown
## Task Complete: [Task ID] — [Nome]

### Agente
[🤖 Builder / 👤 Arquiteto] — [Modelo usado]

### Escopo Executado
- `src/path/arquivo1.js` (criado): [descrição 1 linha]
- `src/path/arquivo2.jsx` (modificado L42-L68): [descrição 1 linha]

### Desvios da Spec
- Nenhum / [descrição do desvio + justificativa]

### Validação
\```bash
$ rtk lint
# [output]

$ rtk npm test -- --testPathPattern="arquivo"
# [output]
\```

### Observações para o PO
- [qualquer insight fora de escopo]

### Status
✅ Task completa — aguardando review humano para prosseguir
```

---

## SQP §7 — Anti-Padrões Proibidos

Comportamentos que resultam em **rejeição automática** do trabalho:

| # | Anti-Padrão | Consequência |
|---|------------|--------------|
| AP-SQP-001 | Agente escreve "Gate aprovado" ou "Gate passed" sem input humano | Task inteira rejeitada |
| AP-SQP-002 | Agente inicia task N+1 sem confirmação de que task N foi aceita | Task N+1 inteira descartada |
| AP-SQP-003 | Agente faz "improvements" fora do escopo da task | Revert do improvement, warning ao agente |
| AP-SQP-004 | Agente pula validação por "confiança" no código | Task devolvida para re-execução com validação |
| AP-SQP-005 | Sub-agente modifica arquivo que não está na lista de sua task | Revert integral, escalação |
| AP-SQP-006 | Agente faz merge ou push direto para `main` | **Bloqueio imediato** do agente |
| AP-SQP-007 | Agente assume que teste anterior ainda vale após nova mudança | Task devolvida — reteste obrigatório |
| AP-SQP-008 | Agente omite output de validação no relatório | Relatório rejeitado, re-execução |
| AP-SQP-009 | Agente combina múltiplas tasks em uma única entrega para "eficiência" | Entrega rejeitada — 1 task = 1 relatório |
| AP-SQP-010 | Agente resolve conflito de merge sozinho sem consultar humano | Revert do merge, review humano |

---

## SQP §8 — Escalação

| Nível | Condição | Ação do Agente |
|-------|----------|----------------|
| 🟢 Normal | Task dentro do esperado | Seguir ciclo §2 |
| 🟡 Aviso | Lint ou test falha + corrigido em ≤ 2 tentativas | Documentar no relatório |
| 🟠 Bloqueio | Task não pode avançar (dep externa, ambiguidade) | **STOP** → reportar com motivo → esperar humano |
| 🔴 Crítico | Regressão detectada em área fora do escopo | **STOP + REVERT** → reportar imediatamente → NÃO tente resolver |

**Regra**: Na dúvida, escale. Nunca assuma. A frase "achei que era seguro" não é aceitável.

---

## SQP §9 — Transição entre Fases

A transição de uma fase para a próxima (ex: Pré-Req → Fase 1) requer **todas** as condições:

```
CHECKLIST DE TRANSIÇÃO DE FASE
================================
[ ] G3 da fase anterior 100% completo (se aplicável)
[ ] Gate Report aprovado pelo humano (com evidências)
[ ] `rtk npm run validate:agent` web — 0 falhas
[ ] `npx expo export` mobile — 0 erros
[ ] `npm run build` web — 0 erros
[ ] Services locais web obsoletos deletados (se G3)
[ ] Factory exportada no `shared-data/index.js` (se G2/G3)
[ ] Demo gravada do CRUD no simulador (se Fase 1+)
[ ] PR mergeado em `main` com aprovação do PO
[ ] Nenhuma task pendente da fase anterior
[ ] Nenhum bug conhecido em estado aberto da fase anterior
```

**Um único item não checado = transição bloqueada. Sem exceções.**

---

> _"A qualidade nunca é acidental; é sempre o resultado de intenção inteligente, esforço sincero, direção competente e execução disciplinada."_ — William A. Foster
