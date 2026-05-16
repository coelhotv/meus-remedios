# Retrospectiva — Fase 1 CRUD Medicamentos Mobile

**Data:** 2026-05-16 (W20)
**Duração:** Fase 0 P.1/P.2/P.3 + Fase 1 M1.1/M1.2/M1.3 (W19→W20)
**PRs consolidados:** #548-#552 (Fase 0) · #555/#556/#557/#558 (Fase 1) · #559 (distill)
**Knowledge base final:** 183 R · 161 AP · 45 ADR · 20 CON

---

## 1. Pontos de Desvio

| # | Desvio | Sprint | Detecção | Custo |
|---|--------|--------|----------|-------|
| D1 | ~25 commits de iteração em M1.2 pós-validação PO (refinos UX em série) | M1.2 | PO em validação | Alto (review work + history poluído) |
| D2 | Opus violou R-010 (hook order) em 2 fixes incrementais (MedicineFormScreen + MedicineDetailScreen) | M1.2 | Gemini PR #556 | Médio (fix em 412cdaf8) |
| D3 | Opus violou R-010 mais 2x no PR #558 (MedicineAnvisaSheet + MedicinesListScreen) | M1.3+ | Gemini PR #558 | Médio (fix em 8b563d4a) |
| D4 | `state.json` esteve dessincronizado dos índices markdown desde 2026-04-26 (counter drift silencioso) | Distill | Gemini PR #559 | Baixo (auto-corrigido, mas escondido por 3 semanas) |
| D5 | Narrativa distill #559 dizia "additive only" mas contracts caiu 21→20 (contradição) | Distill | Gemini PR #559 | Baixo (fix em 4c3ba119) |
| D6 | Bottom sheet ANVISA: protótipo inicial fullscreen → mudou para sheet durante M2.2 | M1.2 | PO em validação | Médio (AnvisaSearchScreen criado e depois deletado) |
| D7 | Hard block delete (`MedicineDeleteBlockedSheet`) descoberto via mock após implementação | M1.2 | PO mostrou mock | Médio (refactor em 1 sprint) |
| D8 | Crash Android API 24 em rn-screens detectado tarde (em sim API 24, não validado em testes) | M1.2 | PO em sim Android | Médio (ADR-036 aplicado) |
| D9 | Decimal vírgula→ponto não previsto na spec (PT-BR digita "1,5") | M1.2 | PO em iOS | Baixo (handleDoseChange) |
| D10 | Mensagens Zod em inglês surgiram em produção mobile (locale não aplicado) | M1.2 | PO em iOS | Médio (R-232 + customError) |
| D11 | Tab "Tratamentos" presa em sub-screen após ENTER em MedicinesList (navegação aninhada) | M1.2 | PO em iOS | Baixo (listener tabPress) |
| D12 | Termo "Protocolos" presente em strings UI vs "Tratamentos" estabelecido | M1.2 | PO sugeriu trocar | Baixo (find+replace) |
| D13 | Subtitle do card = laboratório (info secundária) vs active_ingredient (composto) | M1.2 | PO em iOS | Baixo |
| D14 | Edit form: dose vazia ao carregar medicamento existente (number→string conversion) | M1.2 | PO em iOS | Baixo |
| D15 | Detail/Lista não atualizavam pós-edit/delete (sem useFocusEffect) | M1.2 | PO em iOS | Baixo |

---

## 2. Causas-Raiz dos Desvios

### CR1 — Mocks não 100% revisados antes do spawn (causa D1, D6, D7)
Mocks hi-fi entregues em paralelo à implementação. PO validava UI implementada e novos mocks apareciam (ex: `mock-medicamentos-apagar-bloqueio.png` mostrou hard block delete depois do delete simples já estar pronto). Cada novo mock gerava 2-5 commits de refino.

**Sintoma**: ~25 commits em M1.2 onde planejado eram ~10.

### CR2 — Opus pula ritual R-010 em mudanças "rápidas" (causa D2, D3)
Cavecrew (Sonnet/Haiku) recebe brief explícito (R-230) com R-010 destacado → zero violações. Opus, fazendo fixes incrementais "rápidos" pós-validação PO, adiciona hooks no lugar errado por proximidade visual à mudança ("colocar `useFocusEffect` perto do que ele afeta") em vez de respeitar blocos States→Memos→Effects→Handlers.

**Sintoma**: 4 violações R-010 detectadas pelo Gemini em 2 PRs (todas commitadas por Opus, nenhuma por cavecrew).

### CR3 — DEVFLOW state.json não tem auditoria automática contra índices (causa D4, D5)
Bumps de R-NNN/AP-NNN em sessions individuais nem sempre vêm acompanhados de increment em `state.json`. Distill leu state pré-existente como source of truth quando deveria reconciliar contra índices markdown.

**Sintoma**: Counters dessincronizados por 3 semanas (drift de até 11 itens).

### CR4 — Reviewer LLM corpus desatualizado (causa noise no review)
Gemini-Code-Assist treinado em snapshot anterior a Zod 4. Apontou bugs falsos em `zodSetup.js` (alegou `issue.type`/`issue.received` em vez de `origin`/`input` da Zod 4). Custou 1 reply + análise.

**Sintoma**: 1 false-positive HIGH em PR #558 (gasto ~10min).

### CR5 — Spec inicial otimista — UX revelada em validação (causa D6, D7, D9, D10, D11, D13)
Spec M1.2 não previu:
- vírgula decimal PT-BR
- locale Zod PT-BR
- tab navigation listener
- subtitle card (active_ingredient)
- delete hard block via dependências
- mudança fullscreen→sheet ANVISA

**Sintoma**: 18 regras UX consolidadas durante implementação (vs 9 na spec inicial).

### CR6 — Validação Android API 24 tardia (causa D8)
PO validou primeiro em iOS + Android moderno. API 24 (Android 7) é cenário legacy do Hermes que requer cuidado especial (ADR-036). Crash apareceu só na validação tardia.

**Sintoma**: 1 sprint adicional para aplicar JS stack pattern.

### CR7 — Cache miss entre sessões cavecrew (Haiku rodou 4x em sessões separadas)
Haiku rodou M1.6/M1.10/M2.3/M2.10 em sessões separadas; cada spawn começou cold sem reuso de contexto. Brief R-230 mitigou (zero retrabalho) mas custo de cold start mantém-se.

**Sintoma**: 4 sessões cavecrew em vez de 1 batch.

---

## 3. UPs/DOWNs Que Merecem Atenção

### 🟢 UPs

| # | Tópico | Evidência | Por que importa |
|---|--------|-----------|-----------------|
| U1 | Cavecrew Haiku 4/4 zero retrabalho | M1.6, M1.10, M2.3, M2.10 | Distribuição multi-modelo viável; reduz custo Opus em tarefas mecânicas |
| U2 | Sonnet zero-shot em M2.2 (MedicineAnvisaSheet) | 1 spawn → componente completo | Sonnet ⭐⭐ comprovado para UX complexa com lógica de state |
| U3 | Factory pattern `createMedicineRepository` + 19 parity tests | R-231 estabelecida | Replicável para Fase 2 (Protocolos), Fase 3 (Estoque) |
| U4 | Zod 4 locale + customError global (Dona Maria friendly) | R-232 estabelecida | Elimina duplicação de errorMap; pattern para 14 schemas |
| U5 | Hard block delete via dependências FK | AP-159 + `MedicineDeleteBlockedSheet` | Protege dados de saúde (tratamentos+estoque órfãos = problema crítico em sistema médico) |
| U6 | validate:agent 530/530 desde W17 | Zero regressão em 4 PRs | Kill switch funciona; CI confiável |
| U7 | Spec viva — capture-as-you-go | 9→18 regras UX em M1.2 | Doc evolui com implementação; não deteriora |
| U8 | PR final mãe→main consolidando sub-sprints | 3 PRs intermediários + 1 final | Revisão granular + entrega atômica |
| U9 | DEVFLOW journal captura aprendizados em tempo real | 108 entries em W17-W20 | Knowledge base não depende de "lembrar depois" |
| U10 | Gemini detectou bugs reais 4x (R-010 + math + narrative) | PRs #556/#558/#559 | Reviewer LLM agrega valor real apesar de noise ocasional |
| U11 | iOS + Android API 24 + iPhone físico validados | Pelo PO | Cobertura de cenários legacy real, não simulado apenas |

### 🔴 DOWNs

| # | Tópico | Evidência | Por que importa |
|---|--------|-----------|-----------------|
| D1↑ | Opus R-010 violations recorrentes | AP-160 | Padrão sistemático, não acidente isolado; precisa fix de processo |
| D2↑ | ~25 commits de iteração em M1.2 | git log | Inflate review surface + scope creep durante sprint |
| D3↑ | DEVFLOW counter drift silencioso por 3 semanas | D4 + D5 | Bug de processo escondido; sem alarme automático |
| D4↑ | Mocks não-completos antes de spawn | D1, D6, D7 | Pattern recorrente; precisa de stage explícito "mocks frozen" |
| D5↑ | Reviewer LLM corpus desatualizado | D4 (Zod 3) | Vai recorrer com libs novas (RN 0.79, Expo 53, Zod 4); custo de reply |
| D6↑ | Crash legacy Android detectado tarde | D8 | Testes não cobrem API 24; precisa CI matrix? |
| D7↑ | Termo inconsistente "Protocolos" vs "Tratamentos" em UI | D12 | Indica que glossary não foi consultado durante spawn |
| D8↑ | Cold start cavecrew x4 (Haiku separado) | CR7 | Não é problema agora, mas escala se Fase 2/3 tiver mais tarefas mecânicas |

---

## 4. O Que Funcionou e Merece Ser Replicado

### Práticas Operacionais (replicar imediatamente em Fase 2)

1. **Brief cavecrew R-230 (6 itens obrigatórios)** — comprovado: zero retrabalho em 4 spawns Haiku
2. **Distribuição multi-modelo Opus / Sonnet ⭐⭐ / Haiku ⭐ mecânico** — economiza Opus para arquitetura
3. **Factory pattern + DI** (`createXRepository`) em `@dosiq/core/repositories/` para qualquer CRUD compartilhado web↔mobile
4. **Parity tests com mocked Supabase client** — 19 tests cobriram CRUD de 2 apps (não duplicar testes por plataforma)
5. **Zod 4 locale + customError global** via `z.config()` em `@dosiq/core/zodSetup.js` — não duplicar errorMap por schema
6. **Hard block delete** quando há dependências FK — pattern `XDeleteBlockedSheet` + `preCheck` no hook delete
7. **`useFocusEffect(refresh)`** em listas/detalhes para refresh pós-edit/create/delete
8. **PR strategy: sub-sprints → mãe → main** — 3 PRs intermediários + 1 final atómico para gate fechando fase
9. **Spec viva (capture-as-you-go)** — atualizar EXEC_SPEC durante implementação, não só no fim
10. **Smoke checklist E2E PO** (`MEDICINES_G3_SMOKE_CHECKLIST.md`) — documento canônico para validação humana
11. **`/check-review` + replies inline (jq + `in_reply_to`)** — audit trail completo no Gemini
12. **DEVFLOW C5 obrigatório pós-merge** — R-NNN, AP-NNN, ADR-NNN, journal entry, state bump
13. **`useMedicineMutation` wrapper pattern** com Toast + cache invalidation centralizado

### Padrões Técnicos (entrar em todas as próximas specs)

- `z.coerce.number()` para campos numéricos de form (TextInput sempre retorna string)
- Mensagens Zod overridem só quando regra dá info útil (ex: "max 200 caracteres") — resto delega para customError global
- `validateXCreate` (não `partial()`) em edit forms quando regras de obrigatoriedade não devem cair
- AsyncStorage cache + TTL no mobile (24h em useMedicines pattern)
- JS stack (`createStackNavigator`) em vez de native para evitar rn-screens API 24 crash (ADR-036)
- Comment "// States (R-010 — States → Memos → Effects → Handlers)" no início de cada componente para forçar ritual
- Decimal vírgula→ponto normalize em tempo real para campos PT-BR

---

## 5. Validação Rápida — Spec Fase 2 (Gaps Pré-Existentes)

Lida `plans/backlog-native_app/EXEC_SPEC_FASE2_PROTOCOLOS.md`. Gaps identificados:

### Gaps Críticos (corrigir antes de iniciar Fase 2)

| # | Gap | Onde | Risco | Sugestão |
|---|-----|------|-------|----------|
| G1 | Factory location divergente | T3.1 diz `packages/shared-data/src/services/createProtocolRepository.js` | Inconsistência com R-231 (`@dosiq/core/repositories/`) | Mover para `@dosiq/core/repositories/createProtocolRepository.js` |
| G2 | `advanceTitrationStage` na factory mesmo postergada | T3.1 | Carrega código não-usado no mobile bundle | Decidir: factory base sem titration + extensão titration separada, OU incluir e mobile não chama |
| G3 | Parity tests não explícitos | T3.3 só diz "testes dos factories" | Sem 19+ tests cobrindo CRUD identidade web↔mobile | Espelhar pattern `createMedicineRepository.test.js` (mocked client) |
| G4 | Delete sem referência a AP-159 + `XDeleteBlockedSheet` | T2.8 "Delete com verificação (doses registradas)" | Pode implementar warning leve em vez de hard block | Especificar: `ProtocolDeleteBlockedSheet` + preCheck (doses registradas + dependentes de plano) |
| G5 | Spec não menciona R-010 ritual para 8 seções | T2.5 ProtocolFormScreen | Risco AP-160 amplificado (mais hooks = mais chance de violação) | Brief de spawn deve incluir bloco template States→Memos→Effects→Handlers |

### Gaps Médios

| # | Gap | Onde | Sugestão |
|---|-----|------|----------|
| G6 | `useProtocolMutation` sem referência ao pattern `useMedicineMutation` | T2.7 | Indicar reuso de Toast + cache invalidation |
| G7 | `TimeSchedulePicker` sem menção a `FormTimePicker` do Form Kit | T2.1 | Reusar primitivos da Fase 0 (`FormTimePicker` existe) |
| G8 | Sem smoke checklist E2E PO | Fase 2 | Criar `docs/operations/PROTOCOLS_G3_SMOKE_CHECKLIST.md` |
| G9 | Refinements cross-campo sem aviso de AP-156 | linha 175 menciona "validate() final" | Explicitar: `validate()` usa schema completo (não pick); validateField precisa do pattern `useFormState.validateField` |
| G10 | Mensagens Zod não menciona reuso de R-232 (customError global) | Schemas protocol/treatmentPlan | Confirmar que `@dosiq/core/zodSetup.js` cobre todos os códigos novos (datetime, array min/max) ou adicionar |
| G11 | Estado atual de `TreatmentsScreen` não referenciado | T1.4 | TreatmentsScreen recebeu refinos M1.2 (link Medicamentos topo/rodapé, complexity heuristic) — spec deve atualizar baseline |
| G12 | Mocks de Fase 2 não localizados | Sem path | Documentar `MOCKS_APP_CRUD/export/*protocolo*.png` ou solicitar mocks antes do spawn |
| G13 | PR strategy não explícita | Sem menção | Adotar padrão Fase 1: 3 sub-PRs → mãe → main |
| G14 | v0.3.9 sem critério de bump | linha 9 | Especificar em qual sprint/PR ocorre o bump (provavelmente T3 final) |

### Gaps Menores

| # | Gap | Onde | Sugestão |
|---|-----|------|----------|
| G15 | Pré-condição "Fase 1 completa" sem novos artefatos | linha 6 | Listar: R-231 (factory pattern), R-232 (Zod locale), AP-159 (delete hard block), AP-160 (R-010 violation pattern) |
| G16 | Brief cavecrew não menciona R-230 | Seção Delegação | Adicionar referência: "Todo spawn segue R-230 (6 itens obrigatórios)" |
| G17 | Validação Android API 24 não obrigatória | Quality Gates | Adicionar critério G1: "Smoke test em Android API 24 sem crash rn-screens" |
| G18 | Locale Zod testes | Sem menção | Garantir que `protocolSchema` + `treatmentPlanSchema` emitem mensagens PT-BR friendly para casos de array vazio, datetime inválido, FK obrigatória |

---

## 6. Tópicos Adicionais (Outros Aprendizados)

### T1 — Refinar mocks ANTES do spawn (anti-D1)
Estabelecer estado "mocks frozen" como gate explícito antes de spawn. Se PO entregar mock novo durante sprint, vira backlog (não commit no mesmo PR). Reduz commits-de-iteração e melhora lead time.

**Ação proposta**: adicionar checklist na spec — "[ ] Mocks revisados e aprovados pelo PO"; spec sem este check não pode iniciar implementação.

### T2 — Lint custom rule para R-010 (anti-D2/D3 = AP-160)
ESLint não tem regra nativa para ordem semântica de hooks por categoria. Investigar:
- `eslint-plugin-react-hooks` cobre `rules-of-hooks` (não ordem categórica)
- Possível plugin customizado: `dosiq/hooks-order-by-category`
- Alternativa low-tech: comentário template obrigatório (`// States (R-010 — States → Memos → Effects → Handlers)`) — Sonnet/Haiku replicam, Opus precisa engajar.

**Ação proposta**: spike de 1h para avaliar plugin custom; fallback é template comment obrigatório em todos os componentes de Fase 2.

### T3 — D5 self-clean profundo obrigatório (anti-D4)
Distill atual reconciliou counters mas não identificou QUAL CON-NNN foi removido (-1). Próximo distill deve incluir D5 profundo:
1. Scan `memory/contracts/[cat]/*.md` files
2. Cross-check com `CONTRACTS_INDEX.md` entries
3. Identificar discrepâncias (file existe sem entry, ou entry sem file)
4. Atualizar índices com `status: "archived"` para arquivos órfãos

**Ação proposta**: criar AP-161 "DEVFLOW counter drift entre state.json e índices" + R-NNN "D5 self-clean profundo é obrigatório em distill, não opcional".

### T4 — Reviewer noise mitigation (anti-CR4)
Gemini referenciará Zod 3 enquanto corpus não atualizar. Reduzir custo de reply:
- Macro de reply "@gemini-code-assist Zod 4 — issue shape mudou: `origin`/`input` (v4) vs `type`/`received` (v3). Validado empiricamente."
- Adicionar nota nas specs: "Reviewer pode flagar APIs de libs novas; validar antes de aplicar."

### T5 — CI matrix para Android API 24 (anti-D8)
Crash legacy detectado em validação PO. Investigar custo de adicionar Android API 24 ao CI:
- EAS Build já compila para mínimo SDK 24
- Detox ou Maestro para smoke em emulador API 24
- Custo: ~15min adicional de CI

**Ação proposta**: spike em Fase 3 (não bloqueia Fase 2).

### T6 — Glossary canônico (anti-D7/D12)
"Tratamentos" (UI) vs "protocols" (variáveis JS) vs "treatments" (variáveis JS legados). Doc canônico em `docs/reference/GLOSSARY.md` com tabela termo UI ↔ termo código ↔ contexto, consultado em todo spawn (parte do brief R-230).

**Ação proposta**: criar GLOSSARY.md em Fase 2 sprint 1.

### T7 — Batch cavecrew sessions (anti-CR7)
Em vez de 4 spawns Haiku separados, considerar 1 spawn com 4 tarefas mecânicas em sequência. Risco: contexto inflando; mitigado se brief lista as 4 tasks com referências independentes.

**Ação proposta**: testar em T1.4-T1.6 (3 tasks Builder consecutivas) — 1 spawn Haiku com 3 tasks.

### T8 — Performance baseline mobile (não medido)
Nunca medimos cold start, JS bundle size, ou time-to-interactive antes/depois da Fase 1. Sem baseline = sem detectar regressões.

**Ação proposta**: Fase 2 sprint 1 → adicionar instrumentação básica (`react-native-performance` ou `Bundle Visualizer`). Capture baseline antes de novas features.

### T9 — Decisão `@dosiq/core` vs `packages/shared-data` (anti-G1)
Spec Fase 2 menciona `packages/shared-data/src/services/`. Fase 1 (R-231) estabeleceu `@dosiq/core/repositories/`. Dois locations divergentes para mesma classe de código.

**Ação proposta**: decidir em ADR-045 antes de Fase 2 — manter `@dosiq/core/repositories/` (R-231) e desativar `shared-data` para repositórios, OU migrar tudo para `shared-data`.

### T10 — Acumular journal entries para next distill (cap)
Threshold = 15. Fase 2 estimada 3 sprints × ~3 entries/sprint = 9 entries. Distill auto-trigger só após Fase 2 + parte de Fase 3. Considerar baixar threshold para 10 se DEVFLOW for fonte de verdade ativa.

**Ação proposta**: avaliar pós-Fase 2.

### T11 — Mocks: criar pasta dedicada para Fase 2
`MOCKS_APP_CRUD/export/` mistura mocks de medicamentos + protocolos + estoque. Subdividir em `MOCKS_APP_CRUD/export/protocolos/` etc. melhora discovery.

### T12 — Documentação canônica `FORM_KIT.md` precisa update
Form Kit recebeu novos primitivos durante Fase 1 (Toast, DeleteConfirmation). Confirmar que docs/reference/FORM_KIT.md cobre o estado atual antes de Fase 2 começar a consumir.

---

## 7. Plano de Ação Imediato (antes de iniciar Fase 2)

| Ordem | Ação | Owner | Esforço | Bloqueia Fase 2? |
|-------|------|-------|---------|------------------|
| 1 | Atualizar EXEC_SPEC_FASE2 com G1-G18 desta retro | Opus | 2h | ✅ SIM |
| 2 | Decidir `@dosiq/core/repositories` vs `shared-data` (ADR-045) | Humano | 30min | ✅ SIM |
| 3 | Criar `docs/reference/GLOSSARY.md` | Opus | 1h | ⚠️ Recomendado |
| 4 | Criar `docs/operations/PROTOCOLS_G3_SMOKE_CHECKLIST.md` (esqueleto) | Opus | 1h | ⚠️ Recomendado |
| 5 | Confirmar/atualizar `docs/reference/FORM_KIT.md` | Opus | 30min | ⚠️ Recomendado |
| 6 | Documentar AP-161 (DEVFLOW counter drift) | Opus | 30min | ❌ Não |
| 7 | Verificar mocks Fase 2 disponíveis em `MOCKS_APP_CRUD/export/` | Humano | 15min | ✅ SIM (ver T1) |
| 8 | Subdividir mocks por fase (`/medicamentos/`, `/protocolos/`, `/estoque/`) | Opus | 30min | ❌ Não |
| 9 | Spike: lint custom rule R-010 (1h timebox) | Opus | 1h | ❌ Não |

---

## 8. Métricas Quantitativas

| Métrica | Valor | Observação |
|---------|-------|------------|
| PRs entregues (Fase 1) | 4 (#555/#556/#557/#558) | + #559 distill |
| Commits totais período | ~108 entries journal | ~25 commits só em M1.2 (iteração UX) |
| LOC net delta consumers (G3) | -157 LOC | Factory reduziu duplicação |
| Tests adicionados | +19 parity + 12 mobile re-pass | 530/530 web mantido |
| Lint errors nos arquivos novos | 0 | Brief R-230 + lint round-trip funcionou |
| Gemini comments aplicados | 4 (R-010 x4) | 2 PRs #556 + #558 |
| Gemini comments declinados | 4 (Zod 3, useMemo retorno, complexity, useMedicines memo) | Justificados |
| Cavecrew Haiku spawns | 4 | 0 retrabalho |
| Cavecrew Sonnet spawns | 1 | 0 retrabalho |
| Opus violações R-010 commitadas | 4 (AP-160) | Detectadas pelo Gemini |
| Rules adicionadas (Fase 1) | 9 (R-189..R-232) | R-231/R-232 são desta retro |
| APs adicionados (Fase 1) | 10 (AP-076..AP-160) | AP-159/AP-160 são desta retro |
| ADRs adicionadas | 2 (ADR-043/044) | |
| Tempo total Fase 1 | ~5 dias úteis (W19-W20) | Estimativa retroativa |

---

## 9. TL;DR Executivo

**Funcionou bem**: cavecrew + factory pattern + Zod 4 locale + spec viva. Replicar em Fase 2.

**Não funcionou**: Opus pulando R-010 em fixes incrementais (AP-160), mocks tardios (~25 commits M1.2), DEVFLOW state drift silencioso.

**Bloqueadores para Fase 2 (resolver primeiro)**:
1. ADR-045 — decidir factory location (`@dosiq/core` vs `shared-data`)
2. Atualizar EXEC_SPEC_FASE2 com 18 gaps identificados
3. Confirmar mocks de protocolos disponíveis e revisados PO

**Próximo passo recomendado**: aplicar plano de ação §7 itens 1-2-7 antes de iniciar Fase 2 sprint T2.1.
