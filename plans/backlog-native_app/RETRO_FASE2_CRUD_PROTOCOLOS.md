# Retrospectiva — Fase 2 (CRUD Tratamentos) + Fase 2.5 (Status)

**Data:** 2026-05-18 (W20-W21)
**Duração:** Sprint T2.1 + T2.2 (A/B/C) + T2.3 (A/B) + PR final mãe→main + Fase 2.5 expansiva
**PRs consolidados:** #561 · #562 · #563 · #564 · #565 · #566 · #567 · #568 (PR final Fase 2) · #569 (DEVFLOW C5 Fase 2) · #570 (Fase 2.5)
**Knowledge base após Fase 2:** 186 R · 166 AP · 46 ADR · 20 CON

---

## 1. Pontos de Desvio

| # | Desvio | Sprint | Detecção | Custo |
|---|--------|--------|----------|-------|
| D1 | Listagem mobile escondia tratamentos não-`diário` (silencioso, server retornava 5, client mostrava 3) | T2.2 PR-B | PO em smoke ("acho coincidência os tratamentos visíveis serem todos `diario`") | Alto (3 ciclos de debug log + MCP Supabase) |
| D2 | Modal Android API 24 sem `statusBarTranslucent` deixava overlay truncado + inputs do form vazando | T2.2 PR-C | PO em smoke Android | Médio (sweep 3 sheets em PRs separados) |
| D3 | `formatDoseUnit` mapeava `dosage_unit` → "ml"/"comprimido"/"gotas" gerando bug semântico (Apidra 2ml dose=1 mostrava "1 ml" em vez de "1 unidade de 2ml") | T2.2 PR-B | PO em smoke | Médio (decisão ADR-046 + refactor helper + tests) |
| D4 | Input decimal `0,5` não aceito (eager parse apagava vírgula) | T2.2 PR-B | PO em smoke iOS | Médio (handleDoseChange com estados intermediários) |
| D5 | `useFormState.validate` lia values da frame anterior (race com `handleChange` async no submit) | T2.2 PR-C | Gemini PR #565 (HIGH) | Médio (extensão da API com `overrides`) |
| D6 | PR aberto antes de smoke PO (≥2 ciclos de fix + Gemini reply pós-PR) | T2.1 PR-A | PO sinalizou | Alto (processo) |
| D7 | Branch local outdated + spawn Sonnet portou arquivos manualmente da PR-A → duplicação ao tentar push da PR-B | T2.3 PR-B | Eu mesmo (lint clash) | Médio (reset hard + recriar branch) |
| D8 | `vitest.critical.config.js` faltava alias `@dosiq/core` — `validate:agent` falhava silencioso com "createProtocolRepository is not a function" | T2.3 PR-B | rodando tests críticos | Baixo (1 linha adicionada) |
| D9 | `ProtocolDetailScreen` reinventou delete inline (state isDeleting + service direto) quando `useProtocolDelete` já existia desde T2.10 | PR final #568 | Gemini PR #568 (HIGH) | Médio (refactor 30 LOC removidas) |
| D10 | `useProtocolStats` fazia `getById` só pra `time_schedule.length` quando Detail já tinha o protocol carregado | PR final #568 | Gemini PR #568 (MED) | Baixo (API hook trocada) |
| D11 | `useProtocolMutation.toggleActive` invalidava só `protocols-snapshot`, esquecendo `treatments-snapshot` (listagem) | Fase 2.5 #570 | Gemini PR #570 (MED) | Baixo (Promise.all com 2 keys) |
| D12 | Função `isProtocolActiveOnDate` ambígua — 2 implementações com mesmo nome em arquivos diferentes do mesmo package; barrel re-exportava a strict por engano | T2.2 PR-B | PO + MCP Supabase | Alto (descoberta D1) |
| D13 | Spec FASE 2 inicial não previu necessidade da Fase 2.5 (`active` flag + tabs); só descoberto em smoke do PR-A T2.3 | T2.3 | PO em smoke | Médio (sprint expansivo Fase 2.5) |
| D14 | Sheets mobile Modal sem padrão unificado — 3 sheets fix-by-fix (incluindo sweep retroativo nos da Fase 1) | T2.2 PR-C → T2.3 PR-A | PO + auto-iniciado por mim | Médio (sweep retroativo) |
| D15 | `WEEKDAYS`/`FREQUENCIES` faltavam re-export no barrel `packages/core/src/schemas/index.js` — `WeekdaySelector` crashou em runtime | T2.2 PR-A | PO em smoke | Baixo (3 linhas no barrel) |

---

## 2. Causas-Raiz dos Desvios

### CR1 — Naming collision invisível em packages com `export *` (causa D1, D12)
`@dosiq/core/index.js` usa `export * from './utils/index.js'`. Duas funções com mesmo nome em arquivos diferentes (`adherenceLogic.js` strict vs `dateUtils.js` period-only) colidem silenciosamente — consumer importa a errada via o nome óbvio sem saber da outra. Bug ZERO surface em lint/types/tests; só aparece em uso real com semântica errada.

**Sintoma**: 5 tratamentos no DB → 3 visíveis no mobile (não-`diário` filtrados pela versão strict).

### CR2 — Spec inicial sub-estimada para mobile (causa D2, D3, D4, D14, D15)
EXEC_SPEC FASE 2 escrita com base na web — pattern de Modal RN diferente de modais HTML; helper de dose veio do web onde dosage_unit era exibido inline; decimal PT-BR não previsto; barrel exports não auditados antes do consumer mobile.

**Sintoma**: ~8 bugs detectados em smoke PO antes do PR-A ser mergeado.

### CR3 — PR aberto sem smoke PO (causa D6)
Hábito Fase 1 (push → PR imediato) não funciona em features mobile complexas onde bugs UI aparecem só em uso real. Adoptado R-234 após esse desvio.

**Sintoma**: 2 ciclos extras de fixes + replies Gemini pós-PR no PR-A T2.1.

### CR4 — Branch sync inadequado antes de spawn (causa D7)
Branch local `feat/crud-protocols` ficou outdated vs origin após merge do PR-A. Spawn Sonnet pra PR-B fez "pull manual" via cópia de arquivos novos da factory (que já existiam em origin), gerando duplicação ao tentar git push.

**Sintoma**: 15 min de reset hard + re-criar branch limpo + reaplicar diff web-only.

### CR5 — Config secundário não recebe propagação (causa D8)
`vitest.config.js` recebeu alias `@dosiq/core`. `vitest.critical.config.js` (CI agent) NÃO recebeu — descoberto só quando `validate:agent` falhou. Toda mudança em alias precisa propagar pra TODOS os configs vitest do app.

**Sintoma**: 1 ciclo extra de debug ("por que tests críticos falham se locais passam?").

### CR6 — Hook canônico não consultado antes de implementar (causa D9, D10)
ProtocolDetailScreen escreveu delete inline em vez de adotar `useProtocolDelete` (existia desde T2.10). useProtocolStats fazia getById redundante. R-235 nova fixa o pattern (grep por hook canônico antes de inline).

**Sintoma**: Gemini pegou em #568 PR final.

### CR7 — Cache invalidation incompleto (causa D11)
toggleActive (Fase 2.5) só invalidou `protocols-snapshot`, esquecendo `treatments-snapshot` que useTreatments usa. Pattern recorrente: cada mutation tem que invalidar TODOS os caches afetados, não só o do detalhe.

**Sintoma**: bug latente (refresh on focus salvaria, mas falha em rede instável).

### CR8 — Spec viva funcionou mas com gap pós-encerramento (causa D13)
EXEC_SPEC_FASE2 foi atualizada DURANTE execução (capture-as-you-go) mas a NECESSIDADE de uma Fase 2.5 só ficou óbvia depois do smoke G2 quando PO viu que mobile não expunha pausados/finalizados. Spec inicial não tinha esse gap como item explícito porque "se a web tem, achei que é óbvio incluir no mobile" — mas spec original Fase 2 cortava titulação + `active` toggle pra v1.

**Sintoma**: Fase 2.5 não estava no master plan original.

---

## 3. UPs/DOWNs Que Merecem Atenção

### 🟢 UPs

| # | Tópico | Evidência | Por que importa |
|---|--------|-----------|-----------------|
| U1 | Cavecrew distribution ADR-044 escalou bem | 12+ spawns nas 2 fases sem retrabalho | Pattern Opus/Sonnet/Haiku validado em escala maior que Fase 1 |
| U2 | Wave orchestration com dependency graph | Fase 2.5: 4 waves paralelas, 9 spawns | Maximiza throughput; reduz tokens Opus em ~60% |
| U3 | Factory pattern replicado sem fricção | createProtocolRepository (Fase 2) + createTreatmentPlanRepository | R-231 + ADR-045 sólidos; pattern transferível pra Fase 3 |
| U4 | Parity tests pegaram zero bugs reais | 21 + 15 = 36 tests mocked client | Custo barato; confidence alta; web G3 sem regressão |
| U5 | Smoke PO antes PR (R-234) adoptado pós-D6 | 0 PRs com bug UI viva após adopção | Reduziu Gemini replies + fix-pack PRs |
| U6 | Helper canônico web↔mobile via @dosiq/core (Fase 2.5) | resolveTreatmentStatus 1 PR cobre 2 apps | Antes: lógica duplicada com risco de drift |
| U7 | Spec viva expandida com bloco "Cuidados aprendidos" | EXEC_SPEC_FASE2 §1 ganhou 11 patterns durante execução | Próxima sprint começa com guardrails explícitos |
| U8 | useFocusEffect(refresh) padrão obrigatório consolidado | Detecta mutations cross-screen | Combate cache stale entre listagens/detalhes |
| U9 | DEVFLOW C5 disciplinado (PR #569 + journal) | 4 APs + 3 R + 1 ADR + journal entry pós Fase 2 | Aprendizados não dependem de memória; persistem |
| U10 | MCP Supabase pra diagnóstico cross-platform | Identificou D1 em 1 query | Quando server retorna X e client mostra Y, MCP é mais rápido que log |
| U11 | Sonnet em tarefas mecânicas complexas | T3.3 (21 parity tests), T6 (useTreatments com 8 campos novos), T9 não aplicável | Sonnet ⭐⭐ entrega zero-shot em tarefas tipo "espelhe pattern X aplicando rules Y" |
| U12 | Sweep retroativo da AP-165 (statusBarTranslucent em sheets Fase 1) | 3 sheets corrigidos no mesmo PR (#566) | "Mistura escopo mas vale" — pattern de fix-pack distribuído sem PR separado |
| U13 | check-review skill com /jq inline_to | 4 PRs com replies estruturados | Audit trail completo + zero `gh pr comment` top-level |

### 🔴 DOWNs

| # | Tópico | Evidência | Por que importa |
|---|--------|-----------|-----------------|
| D1↑ | Naming collision em packages com `export *` (AP-164) | D1 + D12 | Próximo barrel com 2 funções mesmo nome → mesmo bug; CR1 mostra que lint não pega |
| D2↑ | Spec inicial mobile sub-estimada | D2/D3/D4/D14/D15 | 8+ bugs detectados em smoke = "spec não pensou no mobile". Fase 3 risco repetição |
| D3↑ | Hook canônico não consultado antes (CR6) | D9 + D10 | AP-160 (Opus pula ritual) tem novo sintoma — não é só R-010, é "ignorar infra existente" |
| D4↑ | Branch sync inadequado antes de spawn (CR4) | D7 | Sub-agent começa cold e refaz trabalho já feito; perda de tempo + risco de divergência |
| D5↑ | Config secundário não recebe propagação (CR5) | D8 | Vai bater de novo se config triplica (test:fast, test:integration etc) |
| D6↑ | Cache invalidation incompleto (CR7) | D11 | Toda mutation futura precisa lista explícita de caches afetados |

---

## 4. O Que Funcionou e Merece Ser Replicado

### Práticas Operacionais (replicar imediatamente em Fase 3)

1. **Wave orchestration com dependency graph** — antes de spawn, mapear tasks → dependências → waves. Maximiza spawn paralelo, minimiza Opus inline em coisas mecânicas.
2. **Smoke PO ANTES de `gh pr create` (R-234)** — push pra EAS worktree OK; PR aguarda smoke local. Reduz Gemini reply cycles.
3. **Spec viva com bloco "Cuidados aprendidos"** — EXEC_SPEC ganha §1 dedicada a patterns descobertos durante a fase; consumida em sprints seguintes.
4. **Hook canônico antes de inline (R-235)** — grep por `use*Delete`/`use*Mutation` existente; adotar com DI. Inline OK só se nenhum hook cobrir.
5. **Helper canônico em @dosiq/core para paridade web↔mobile** — pattern Fase 2.5 (resolveTreatmentStatus) é template pra qualquer derivação compartilhada (ex: stock status na Fase 3).
6. **Sweep retroativo no mesmo PR** quando bug pegado é pattern já presente em outros lugares do código (AP-165 sweep de 3 sheets).
7. **MCP Supabase pra diagnóstico cross-platform** — quando server e client divergem semanticamente, query direto no DB resolve em 1 turn vs N ciclos de log.
8. **Parity tests com Promise.all + mocked client** — 21+15 tests em vitest cobriram factory novo + adopção mobile sem custo de teste duplicado.
9. **Padronização "unidade(s)" sempre (ADR-046)** — helper sem if/else por enum elimina classe inteira de bugs semânticos. Apresentação fica em DataPills separadas.
10. **DEVFLOW C5 em PR separado pós-merge** — PR #569 só com memory updates evita scope creep no PR funcional + Gemini bypassa naturalmente.

### Padrões Técnicos (entrar em todas as próximas specs)

- **Bottom sheet mobile** = `<Modal statusBarTranslucent>` + `View spacer={StatusBar.currentHeight}` (Android) + `<SafeAreaView edges={['bottom']}>` no sheet (R-233).
- **useFormState.validate** aceita `overrides` opcional pra fix de race com `handleChange` async (AP-166).
- **Input numérico decimal** preserva estados intermediários (`"0,"`, `"."`, vazio) como string; coerce só no submit (AP-167).
- **Optimistic UI em toggle** = state local `override` + `setOverride(next)` antes da mutation + rollback no catch + `setOverride(null)` no success após refresh.
- **Cache invalidation explícita** — toda mutation lista TODOS os AsyncStorage keys afetados em `Promise.all`. Esquecer um = bug latente.
- **Barrel re-export crítico** — adicionar item novo em `schemas/index.js` ou `utils/index.js` sempre auditar contra consumers (`grep WEEKDAYS apps/mobile/src/...`).
- **Naming distintivo em packages** — se 2 funções fazem coisas diferentes mas se chamariam igual, renomear uma delas no export (ex: `isProtocolInPeriod` vs `isProtocolActiveOnDate`).

---

## 5. Gaps em Specs Existentes (corrigir antes de iniciar)

### EXEC_SPEC_FASE3_ESTOQUE.md

Lida rapidamente; provavelmente tem gaps análogos aos da Fase 2 inicial:

| # | Gap candidato | Risco |
|---|---|---|
| G1 | Verificar se modal de compra/registro entrada usa pattern R-233 (statusBarTranslucent) | Médio — mesmo bug API 24 |
| G2 | `formatStockUnit` ou similar deve seguir ADR-046 (sempre "unidade(s)") | Médio — risco bug semântico |
| G3 | Smoke PO antes PR explícito como pré-condição (R-234) | Baixo — já é cultura |
| G4 | Wave orchestration sugerida na spec (dependency graph upfront) | Baixo — já é prática |
| G5 | Helper canônico web↔mobile pra `stockStatus` (critical/low/normal/high) | Médio — sem helper, drift web↔mobile recorre |
| G6 | Refresh on focus em StockScreen + invalidation cross-screen (compra dispara recálculo em listagem de tratamentos com daysRemaining) | Alto — efeito cascata |
| G7 | Cuidado com cache key proliferation: `@dosiq/stock-snapshot` + `@dosiq/purchases-snapshot` + interação com `@dosiq/treatments-snapshot` | Alto — CR7 escala |
| G8 | Mocks Fase 3 revisados antes do spawn (MOCKS_APP_CRUD/export/fase-3/) | Médio — pattern CR2 recorre |

**Ação proposta**: revisar spec Fase 3 com esses gaps antes de iniciar; bumpar para v2 com bloco "Cuidados aprendidos pré-Fase 3".

---

## 6. Tópicos Adicionais (Outros Aprendizados)

### T1 — Designer não é bloqueante quando paridade web é clara (Fase 2.5)
PO perguntou: "preciso de mocks pra Fase 2.5 ou consegue adaptar do web?". Resposta: TabBar + Switch nativo + badges são padrões SO/web já validados; nenhum mock necessário. Custo evitado: ~3-5 dias de mock + revisão.

**Pattern**: quando expansão de feature já tem precedente visual claro (web ou design system tokens), seguir sem designer. Reservar designer pra layouts novos sem precedente.

### T2 — Wave orchestration manual ainda é melhor que auto
Pensar em wave-by-wave (Wave 1: X inline + Y spawn → Wave 2: Z spawn após X → ...) é mais eficiente que tentar spawn massa upfront e gerenciar bloqueios.

**Pattern**: dependency graph antes de spawn é parte do "Plan" mode mental — vale 5min de design pra economizar 30min de orchestration.

### T3 — Branch sync ritual antes de spawn (anti-D7)
Toda criação de branch nova OU spawn que pode tocar arquivos compartilhados:
1. `git fetch origin`
2. Confirmar que branch base local = origin
3. SE não, `git pull` ou reset hard antes de criar branch nova

**Ação proposta**: nova R-NNN "branch sync antes de spawn cavecrew".

### T4 — Auditoria de barrel exports antes de novo consumer (anti-D15)
Quando adicionar export novo em `packages/core/src/schemas/index.js` ou `utils/index.js`, grep nos consumers (`apps/mobile/src/...`, `apps/web/src/...`) pra ver se nome colide com outro export OU se algum consumer precisa o export que faltava.

**Ação proposta**: parte do brief R-230 quando spawn toca packages compartilhados.

### T5 — `vitest.critical.config.js` é segundo cidadão — checklist (anti-D8)
Sempre que adicionar/mudar alias em `vitest.config.js`, replicar em todos os configs vitest do app (critical, fast, integration). Idealmente refator pra compartilhar config via spread.

**Ação proposta**: spike futuro pra extrair `baseConfig` shared entre configs vitest.

### T6 — Cache invalidation matrix por mutation (anti-D11/CR7)
Cada mutation deve documentar (em comment ou JSDoc) quais snapshots invalida. Pattern:

```js
// Mutation X invalida:
//   - @dosiq/protocols-snapshot (detail/useProtocol)
//   - @dosiq/treatments-snapshot (listagem/useTreatments)
//   - @dosiq/stock-snapshot (se decrementa estoque)
```

Forçar autor a pensar explicitamente nos efeitos colaterais.

**Ação proposta**: incluir no template de mutation hook.

### T7 — Distill pode aguardar 2 fases (threshold 15 ainda válido)
Fase 2 + 2.5 + DEVFLOW C5 = 5+ journal entries. Threshold 15 não dispara distill. OK — distill manual quando makes sense, auto quando threshold dispara.

### T8 — RETRO + C5 em mesmo PR funcionou (anti-PR-overhead)
Anteriormente C5 vinha em PR separado pós-merge. Hoje testando combinar RETRO (doc) + C5 (memory) num PR único — menos overhead de Gemini review (1 PR vs 2) sem misturar escopo crítico (ambos são docs/memory).

**Avaliar**: se Gemini gera noise neste PR misto, voltar pra PRs separados.

### T9 — Counts atuais (validar após este PR)
- Antes deste PR: 186 R · 166 AP · 46 ADR · 20 CON
- Após este PR (estimativa): +2-3 R · +4 AP · +1 ADR · 0 CON

### T10 — Cobertura mobile vs web ainda assimétrica
Mobile: jest 148 tests. Web: vitest 530 críticos. Mobile tem ~28% da cobertura web. Tendência continuará desbalanceada até feature parity completa (Fase 6). Aceitável a curto prazo, monitorar.

---

## 7. Plano de Ação Imediato (antes de iniciar Fase 3)

| Ordem | Ação | Owner | Esforço | Bloqueia Fase 3? |
|-------|------|-------|---------|------------------|
| 1 | Aplicar plano R/AP/ADR novos da Fase 2.5 + retro (este PR) | Opus | 1h | ✅ SIM |
| 2 | Atualizar EXEC_SPEC_FASE3_ESTOQUE.md com G1-G8 desta retro | Opus | 1h | ✅ SIM |
| 3 | Confirmar mocks Fase 3 em `MOCKS_APP_CRUD/export/fase-3/` | Humano | 15min | ⚠️ Recomendado |
| 4 | Adicionar ritual "git fetch + sync antes de branch nova" no checklist DEVFLOW | Opus | 15min | ❌ Não |
| 5 | Spike: extrair `baseConfig` shared entre `vitest.config.js` + `vitest.critical.config.js` | Sonnet | 30min | ❌ Não |
| 6 | Cache invalidation matrix nos hooks de mutation (Fase 3 + retroativo) | Opus | 1h | ⚠️ Recomendado |
| 7 | Decidir formato distill pós-Fase 3 (manual ou auto via threshold) | Humano | 5min | ❌ Não |

---

## 8. Métricas Quantitativas

| Métrica | Fase 1 | Fase 2 + 2.5 | Δ |
|---------|--------|--------------|---|
| PRs entregues | 4 (+1 distill) | 9 (+1 C5) | +125% |
| Sub-sprints (PR-A/B/C) | 0 | 5 (T2.1/T2.2 A B C/T2.3 A B) | — |
| Sprints expansivos pós-spec | 0 | 1 (Fase 2.5) | — |
| Commits totais período | ~108 entries journal | ~150 entries journal (estimativa) | +40% |
| LOC net delta (último PR) | -157 | +5753/-634 (Fase 2 final) + 714/-110 (Fase 2.5) | maior |
| Tests adicionados Fase | +19 parity + 12 mobile | +36 parity + 13 helper + ajustes mocks | +85% |
| Lint errors nos arquivos novos | 0 | 0 | mantido |
| Gemini comments aplicados | 4 | 12 (sum #561-#570) | +200% |
| Gemini comments declinados | 4 | 0 (todos válidos!) | melhor |
| Cavecrew spawns | 5 (4 Haiku + 1 Sonnet) | 12+ (6 Sonnet + 4 Haiku + Opus inline em sensíveis) | +140% |
| Opus violações R-010 commitadas | 4 | 0 | -100% ✅ |
| Bugs descobertos em smoke PO | ~6 | ~10 | +66% (escopo maior) |
| Bugs descobertos pelo Gemini | 4 R-010 | 7 (race, transform, hook canônico, etc) | +75% |
| Rules adicionadas | 9 (R-189..R-232) | 3 (R-233/234/235) + 2-3 esta retro | menor (Fase mais focada em delivery) |
| APs adicionados | 10 (..AP-160) | 4 (AP-164/165/166/167) + 2-3 esta retro | menor |
| ADRs adicionadas | 2 (ADR-043/044) | 1 (ADR-046) | menor |
| Tempo total | ~5 dias úteis (W19-W20) | ~3 dias úteis (W20-W21) | -40% ✅ |

**Insight**: Fase 2+2.5 entregou ~2.5× mais PRs em 60% do tempo da Fase 1. Custo: bugs em smoke PO subiram com complexidade do domínio (titulação + status). Ganho: cavecrew distribution + spec viva + R-234 (smoke pré-PR) compensaram.

---

## 9. TL;DR Executivo

**Funcionou bem**: wave orchestration paralela, R-234 (smoke PO antes PR), helper canônico web↔mobile (Fase 2.5), sweep retroativo no mesmo PR (AP-165), MCP Supabase pra diagnóstico cross-platform, ADR-044 cavecrew escalou bem.

**Não funcionou**: spec inicial Fase 2 sub-estimou mobile (~10 bugs em smoke), naming collision invisível em `export *`, branch sync inadequado antes de spawn (D7), cache invalidation incompleto em mutations novas (D11), hook canônico ignorado em favor de inline (D9/D10).

**Bloqueadores para Fase 3 (resolver primeiro)**:
1. Aplicar memory updates desta retro (este PR)
2. Atualizar EXEC_SPEC_FASE3_ESTOQUE.md com G1-G8 + bloco "Cuidados aprendidos"
3. Mocks Fase 3 revisados + aprovados pelo PO

**Próximo passo recomendado**: aplicar plano §7 itens 1-2-3 antes de spawn T3.1.
