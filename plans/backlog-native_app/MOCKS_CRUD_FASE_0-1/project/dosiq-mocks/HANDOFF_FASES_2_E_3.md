# HANDOFF — Dosiq Mobile · Mocks CRUD Hi-Fi (Fases 2 e 3)

> **Status atual**: ✅ **Fase 1 (Medicamentos)** entregue em `Dosiq · Fase 1 — Medicamentos.html`.
> **Pendente**: 🟠 **Fase 2 (Protocolos)** + 🟠 **Fase 3 (Estoque CRUD)**.
> **Para quem lê**: agente seguinte que continuará as mockups. Leia tudo antes de tocar em código.

---

## 1. Contexto do projeto

Dosiq é um app brasileiro de gestão de medicamentos (PWA web + native app em Expo). A native app está em MVP — só leitura de tratamentos/estoque, registro de doses. O PO aprovou um plano para **paridade CRUD com a web** em 6 fases. O usuário do Open Design pediu **mocks hi-fi** das novas experiências, partindo das 3 screens MVP existentes.

**Telas MVP que devem servir de base visual** (no upload):
- `uploads/androidxr-hoje.png` — Dashboard (saudação, anel de adesão azul 86%, card de pendência âmbar, agenda agrupada por período do dia)
- `uploads/androidxr-tratamentos.png` — Lista de tratamentos agrupados por plano terapêutico (emoji + cor por grupo)
- `uploads/androidxr-estoque.png` — Cards de estoque com badges BAIXO (âmbar) / NORMAL (verde) + estimativa em dias

**Especificações canônicas**: 
- `uploads/MASTER_PLAN_HIBRIDO_EVOLUCAO_CRUD.md` — visão estratégica.
- GitHub `coelhotv/dosiq` → `plans/backlog-native_app/`:
  - `EXEC_SPEC_FASE1_MEDICAMENTOS.md` (referência implementação)
  - `EXEC_SPEC_FASE2_PROTOCOLOS.md` ← **leia antes de Fase 2**
  - `EXEC_SPEC_FASE3_ESTOQUE.md` ← **leia antes de Fase 3**
  - `EXEC_SPEC_PRE_REQUISITOS.md` (form kit + ANVISA cache)
  - `INDEX_EXEC_SPECS.md`

---

## 2. Respostas-chave do PO (NÃO REPERGUNTE)

| Tema | Decisão |
|---|---|
| Fases pedidas nesta sessão | **1, 2, 3** (medicamentos, protocolos, estoque) |
| Navegação Medicamentos | **DECISÃO FINAL: A · Link compacto no topo** de Tratamentos (mantém 4 tabs). B foi descartado. |
| Busca ANVISA | **DECISÃO FINAL: B · Bottom sheet contextual** sobre o form. A (tela dedicada push) foi descartado. |
| Padrão de form | **Full-screen stack** + sticky save bar no rodapé |
| Como criar nova entidade | **Empty state com CTA grande** → depois **FAB** "+" estendido teal no canto inferior direito |
| TimeSchedulePicker | **2 variações**: A) lista vertical de chips, B) timeline visual de 24h |
| Delete c/ dependências | **Bottom sheet bloqueante** listando as dependências + atalho para resolver |
| Indicadores de estoque | **Explorar opções**: KPI horizontal, timeline com datas, expansão no card existente |
| Variações por tela principal | **2** (A/B principalmente em padrões de interação) |
| Direção visual | **Evoluir sutilmente** — mantém base MVP, adiciona micro-momentos, illustrations em empty state |
| Frame | **Android + iOS lado a lado em pontos críticos** (sob toggle `iosParity` no Tweaks) |
| Tweaks interativos | **Sim** — incluir painel Tweaks |
| Extras do PO | "Fase as entregas para economizar token; deixe handoff detalhado pro próximo agente" ← você está aqui |

---

## 3. Arquitetura dos arquivos que JÁ EXISTEM

Tudo vive em `dosiq-mocks/` (com a HTML raiz no projeto root):

```
dosiq-mocks/
  dosiq-tokens.jsx       ← cores, type scale, espaçamento, sombras (window.DOSIQ)
  dosiq-icons.jsx        ← 30 ícones SVG stroke-based (window.DosiqIcons)
  dosiq-primitives.jsx   ← T, DosiqScreen, DosiqAppBar, DosiqCard, DosiqBadge,
                           DosiqButton, DosiqTabBar, DosiqFAB, DosiqField,
                           DosiqInput, DosiqSelect, DosiqBottomSheet,
                           DosiqStripe, DosiqMedicineRow, DosiqDetailRow, etc.
  medicine-screens.jsx   ← TODAS as screens da Fase 1
  app.jsx                ← Composição em DesignCanvas + TweaksPanel
  design-canvas.jsx      ← starter (não modificar)
  android-frame.jsx      ← starter (não modificar)
  ios-frame.jsx          ← starter (não modificar)
  tweaks-panel.jsx       ← starter (não modificar)

Dosiq · Fase 1 — Medicamentos.html   ← entry point Fase 1
```

**Convenção importante**: NÃO use `const styles = {…}` em arquivos compartilhados — colisão de escopo no Babel global. Use inline styles ou nomes únicos.

**Convenção de tokens**: tudo vive em `window.DOSIQ` — `DOSIQ.color.*`, `DOSIQ.type.*`, `DOSIQ.space.*`, `DOSIQ.radius.*`, `DOSIQ.shadow.*`. NÃO invente cores novas; reuse os pares soft/strong já definidos.

**Convenção de fonte**: `system-ui` stack. NÃO use Inter, Roboto, Fraunces.

---

## 4. Paleta canônica (NÃO desviar)

```
bg          #f4f5f7      surface     #ffffff
ink         #0f172a      inkMuted    #475569      inkSubtle  #94a3b8
border      #e2e8f0      borderSoft  #eef2f6

primary       #0f766e   ← teal (tab ativa, "Tomar", botões primários, ícones)
primarySoft   #ccfbf1   primaryBg   #ecfdf5   ← bg de cards "em foco"
amber         #f59e0b   ← CTA "Confirmar agora" (pendências), NÃO use como primary
warningSoft   #fef3c7   warningSoftFg #b45309   ← badge BAIXO
successSoft   #dcfce7   successSoftFg #15803d   ← badge NORMAL
dangerSoft    #fee2e2   dangerSoftFg  #b91c1c
infoRing      #3b82f6   ← anel de adesão (não use em outras coisas)
```

---

## 5. Como rodar / iterar

1. Abra `Dosiq · Fase 1 — Medicamentos.html` no preview.
2. O Tweaks panel (canto inferior direito) controla as variações A/B e a paridade iOS.
3. Para criar **Fase 2 / Fase 3**, crie uma **nova HTML root** análoga:
   - `Dosiq · Fase 2 — Protocolos.html`
   - `Dosiq · Fase 3 — Estoque CRUD.html`
   - Reutilize `dosiq-tokens.jsx`, `dosiq-icons.jsx`, `dosiq-primitives.jsx`.
   - Crie `protocol-screens.jsx` e `stock-screens.jsx` análogos a `medicine-screens.jsx`.
   - Crie um `app-fase2.jsx` e `app-fase3.jsx` análogos a `app.jsx`.

**Não junte tudo num único arquivo** — cada fase deve ter seu HTML, para que cada um seja entregue independentemente como asset revisável.

---

## 6. CHECKLIST FASE 2 — PROTOCOLOS

Leia primeiro `EXEC_SPEC_FASE2_PROTOCOLOS.md`. Screens a entregar:

### 6.1 Entrada
- `ProtocolsTabExpand` — Tela `Tratamentos` populada (igual MVP), mas cada item de tratamento dentro do grupo agora é **clicável e leva ao ProtocolDetail**. Adicione um botão "Novo protocolo" no card de grupo OU FAB global na tab.

### 6.2 Detalhe do protocolo
- `ProtocolDetailScreen` — Header com nome do medicamento, dosagem, status (Estável / Em titulação read-only). Sections:
  - **Dosagem**: dose por tomada
  - **Frequência**: diário/semanal + lista de horários (chips)
  - **Período**: data início, data fim (ou "Sem prazo")
  - **Plano terapêutico**: link clicável
  - **Notas**
- Hero com o medicamento associado (clicável → MedicineDetail da Fase 1).

### 6.3 Form de protocolo — A TELA MAIS COMPLEXA DO APP
Multi-seção, full-screen stack. Sections:
1. **Medicamento** → componente `MedicineSelector` (push para tela de seleção da lista do user; cria-novo no rodapé)
2. **Nome do Protocolo** (input)
3. **Dosagem por tomada** (input numérico + sufixo da unidade do medicamento ex "un.")
4. **Frequência** → `FormSelect` (diário / semanal / personalizado)
   - Se `semanal` ou `personalizado`: aparece `WeekdaySelector` (7 chips D S T Q Q S S)
5. **Horários** → `TimeSchedulePicker` ← **2 VARIAÇÕES**:
   - **A · Lista vertical de chips**: cada horário em chip grande "08:00" + botão "+ Adicionar horário" abaixo (abre time picker nativo)
   - **B · Timeline visual de 24h**: barra horizontal 0h→24h com bolinhas teal nos horários; tap em qualquer ponto adiciona/remove
6. **Período** → 2 date pickers (início obrigatório, fim opcional)
7. **Plano terapêutico** → `TreatmentPlanSelector` com opção inline "Criar novo" (input expandido com nome + emoji + cor)
8. **Observações** (textarea)

Estados: criar vazio, editar preenchido, validation error (campo obrigatório vazio com mensagem inline).

### 6.4 Selectors auxiliares
- `MedicineSelectorScreen` — tela de seleção que usa as primitivas da lista de medicamentos. Item clicável devolve `medicine_id`.
- `TreatmentPlanInlineCreate` — estado expandido do selector com 4 swatches de cor (rosa, verde, vermelho, azul, âmbar) + emoji picker simplificado + nome.

### 6.5 Delete protocolo c/ dependências
- Bottom sheet semelhante ao da Fase 1, listando: doses registradas nos últimos 7 dias (`X doses`), com aviso "Excluir o protocolo NÃO apaga o histórico de doses".

### 6.6 Variações solicitadas
- Form: **A** chips empilhados (mais espaço, mais escaneável) vs **B** timeline (mais visual, requer menos rolagem).
- iOS parity em: ProtocolForm + ProtocolDetail.

### 6.7 Tweaks panel
```
[Visão geral]
  Form layout: chips | timeline
  Plano selector: dropdown | inline-create-default
[Comparativos]
  Paridade iOS: on/off
```

---

## 7. CHECKLIST FASE 3 — ESTOQUE CRUD

Leia primeiro `EXEC_SPEC_FASE3_ESTOQUE.md`. A tela MVP de Estoque vira o "hub", com push para detalhes, histórico, ajuste manual, form de compra.

### 7.1 Stock Screen (hub) — expansão do MVP
Mesma estrutura do MVP, mas cada card agora é **clicável** → `StockDetailScreen`. Adicione:
- Filtro/sort header (Todos / Baixo / Vencendo) — chips
- FAB estendido "Registrar compra" → abre seletor de medicamento → `PurchaseFormScreen`

### 7.2 Stock Detail Screen — **3 VARIAÇÕES dos indicadores**
Header: nome do medicamento + saldo grande + badge BAIXO/NORMAL. Depois, indicadores em uma das 3 variações:

- **A · KPI Row** — 4 cards lado a lado horizontalmente: "Saldo", "Consumo/dia", "Dias", "Custo médio". Match com a estética dos badges atuais.
- **B · Timeline de reposição** — Barra horizontal mostrando hoje → data prevista de fim de estoque → data sugerida de reposição. Verde / amarelo / vermelho conforme tempo restante.
- **C · Card existente expandido** — Mantém o card de estoque atual (Saldo: 16 unidades + badge BAIXO), mas adiciona uma seção colapsável "Indicadores" que se abre com os mesmos números, mais discreto.

Abaixo, "Histórico de compras" — `PurchaseCard`s empilhados (ver 7.3).

### 7.3 Purchase Form Screen
Full-screen stack. Sections:
- **Medicamento** (pré-selecionado, read-only com link "Trocar")
- **Quantidade e preço**: 2 inputs lado a lado (qtd / R$ unitário)
- **Datas**: data da compra (default hoje), validade (opcional)
- **Detalhes opcionais**: farmácia, laboratório (autocomplete simples), lote, notas

Botão primário: "Registrar compra" — exibe toast "+ 30 un. adicionadas ao estoque" no retorno.

### 7.4 Purchase History Screen
Lista vertical de `PurchaseCard`s — cada um com: data | qtd original / qtd restante | R$ unitário | farmácia | badge "Vence em X dias" se aplicável | swipe-to-delete (mas bloqueia se compra parcialmente consumida; usa o mesmo padrão de bottom sheet bloqueante).

### 7.5 Stock Adjustment Screen
Form curto:
- Tipo: "Acertar saldo" (input para novo valor) vs "Adicionar/remover" (delta + radio + / -)
- Motivo: select (perda, doação, descarte por validade, outro)
- Notas

### 7.6 Indicadores nos cálculos (apenas visual)
Mock numbers — não calcule de verdade. Use estes:
- SeloZok 50mg → Saldo 16, BAIXO, 8 dias, custo médio R$ 0,89
- Espirolactona 25mg → Saldo 17, NORMAL, 17 dias, R$ 0,42
- Atorvastatina 80mg → Saldo 18, NORMAL, 18 dias, R$ 1,12

### 7.7 Variações solicitadas
- Indicadores: 3 variações (A KPI row, B timeline, C card expandido) **lado a lado na mesma seção do canvas**.
- Form purchase: 1 versão polida.
- iOS parity em: StockDetail + PurchaseForm.

### 7.8 Tweaks panel
```
[Indicadores]
  Estilo: kpi-row | timeline | card-expandido
[Hub]
  Filtros visíveis: on/off
[Comparativos]
  Paridade iOS: on/off
```

---

## 8. Padrões visuais consolidados (use sem reinventar)

### Cards
- `DosiqCard` — bg #fff, radius lg (16px), shadow card. Sem border na maioria dos casos.
- Spacing interno: 16-20px nas laterais, 14-18px vertical.

### Botões
- Primário cheio teal `#0f766e` → use em CTAs principais.
- "Confirmar agora" filled amber → SÓ para confirmação de doses pendentes (não use noutro lugar).
- Secundário outline teal.
- Destrutivo soft (`DosiqButton variant="dangerSoft"`) para "Excluir".

### Forms
- Sticky save bar SEMPRE no rodapé absolute, bg white, border-top borderSoft.
- Cancelar à esquerda (neutral), Salvar à direita (primary, flex:2 para dar peso).
- Inputs altura 50, radius md, focus border teal.
- Labels acima do input, 13px / 500, color inkMuted.

### Status & Badges
- Badges sempre soft (bg + fg de mesmo hue, fg ~600). Pill radius. Uppercase 11.5px / 700 / letter-spacing 0.04em.

### Empty states
- Centralizados na viewport. Ilustração circular suave 140x140 (bg radial gradient primarySoft → white) com SVG primitivo (NÃO desenhe muito detalhe). Heading + texto curto + CTA grande + microcopy de support.

### Bottom sheets
- Radius top 24px, sombra `DOSIQ.shadow.sheet` ascendente.
- Handle (drag indicator) 40x4 cinza centralizado no topo.
- Quando bloqueante: ícone redondo de status (warning/danger soft) acima do título.

### Tweaks panel
- Use `<TweaksPanel title="…">` da starter — não recrie.
- Padrão de naming: `Variantes`, `Comparativos` como seções.

---

## 9. Quality bar antes de chamar `done`

1. ✅ Cada screen renderiza dentro de Android frame 400x836 OU iOS 388x836 (sem overflow).
2. ✅ A entrada vem da tab correspondente do MVP (Tratamentos para Fase 2, Estoque para Fase 3).
3. ✅ NENHUMA nova cor inventada — só do `window.DOSIQ`.
4. ✅ NENHUMA emoji-as-icon (use SVG do `window.DosiqIcons`); a exceção é o emoji do plano terapêutico do MVP, que é parte do conteúdo do user.
5. ✅ Tweaks panel funciona — alterna entre variações vivas.
6. ✅ data-screen-label em cada artboard para contexto de comentários (formato `"NN Nome · variante"`).
7. ✅ Console limpo (apenas o warning do Babel transformer, esperado).
8. ✅ `fork_verifier_agent` ao final.

---

## 10. Comandos sugeridos para o próximo agente

```
# 1. Re-leia os EXEC_SPECs da fase que vai atacar
github_read_file coelhotv/dosiq main plans/backlog-native_app/EXEC_SPEC_FASE2_PROTOCOLOS.md
# (ou FASE3_ESTOQUE)

# 2. Visualize a Fase 1 entregue como referência visual
show_html "Dosiq · Fase 1 — Medicamentos.html"

# 3. Para começar a Fase 2:
#    a. Crie dosiq-mocks/protocol-screens.jsx (copie a estrutura de medicine-screens.jsx)
#    b. Crie dosiq-mocks/app-fase2.jsx
#    c. Crie "Dosiq · Fase 2 — Protocolos.html"
#    d. Iterate até pixel-perfect, depois `done` + `fork_verifier_agent`
```

---

## 11. O que NÃO fazer

- ❌ Não recrie tokens, ícones, primitivas. Reuse os existentes.
- ❌ Não tente implementar lógica real (validação Zod, supabase calls, etc). Estes são MOCKS visuais.
- ❌ Não adicione filler/data-slop — só os dados que aparecem nos EXEC_SPECs ou nos screenshots MVP.
- ❌ Não invente features fora dos EXEC_SPECs. v1 de mobile NÃO tem titulação editável, NÃO tem PDF, NÃO tem chatbot.
- ❌ Não junte Fase 2 + Fase 3 num único HTML — separe por fase.
- ❌ Não use Inter, Roboto, Fraunces. system-ui stack.
- ❌ Não use icone emoji para UI (☮ ✦ etc); SÓ para o conteúdo do user no plano terapêutico.

---

Boa sorte 🍀. — Agente Fase 1
