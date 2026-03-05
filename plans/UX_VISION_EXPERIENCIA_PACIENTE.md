# Visão de Experiência Unificada — Meus Remédios

**Data:** 04/03/2026
**Status:** Aprovada — em execução
**Versão:** 0.5

---

## 1. Diagnóstico: Onde Estamos

### O que está maduro
- Infraestrutura sólida (Supabase, Vercel, Telegram bot)
- Qualidade de código (89 regras, 32 anti-patterns, CI com Gemini review)
- Documentação abrangente (.memory, CLAUDE.md, post-mortems)
- Funcionalidades core entregues (CRUD, protocolos, estoque, logs, adesão)

### O que falta
A **experiência visual** não acompanhou a evolução da infra. Os dados existem, mas são apresentados como **listas e números**, não como **visualizações que contam uma história**.

### Problemas específicos

**P1: Dashboard sobrecarregado**
~8 blocos competindo por atenção: saudação, health score (card grande), sparkline, insight card, smart alerts, tratamentos (accordion), próximas doses, últimas doses, 2 FABs. O paciente que quer "tomar seus remédios da manhã" faz scroll e parsing visual.

**P2: Navegação por entidade, não por atividade**
BottomNav (Início, Remédios, Protocolos, Estoque, Histórico) reflete a modelagem de dados. "Protocolos" é jargão técnico. Remédios e Protocolos são steps de um mesmo processo (gerenciar tratamento).

**P3: Features de valor clínico escondidas**
Emergency Card, Modo Consulta, Exportação, Relatórios PDF — tudo no fundo de Settings. São features de alto valor tratadas como configurações.

**P4: Falta de visualização gráfica**
Estoque é uma lista textual com números. Não existe representação visual que identifique criticidade de relance. O sparkline de adesão é o único gráfico real.

**P5: Dead-ends e window.confirm**
Stock e History não têm navegação contextual (só BottomNav). Cascade creation (Med→Prot→Stock) usa `window.confirm()` nativo — quebra a experiência PWA.

**P6: Nenhuma surpresa ou deleite**
Fora o confetti de 100%, não há micro-interações que incentivem o uso diário. Nenhuma animação de progresso, nenhum badge, nenhum "parabéns pelo 7º dia de streak".

---

## 2. Filosofia da Evolução

### Princípio 1: Evoluir, não adicionar
Não criar views novas. Enriquecer as existentes com gráficos, animações, dados comparativos. O Histórico já tem calendário — dar cores de adesão a ele, não criar outro.

### Princípio 2: O accordion funciona — evoluir os gráficos
O TreatmentAccordion serve bem para registrar múltiplos protocolos no mesmo horário. Manter. A evolução é nos componentes visuais ao redor dele.

### Princípio 3: Transformar números em histórias visuais
"8 comprimidos (4 dias)" → barra horizontal com cor e projeção.
"85% de adesão" → ring gauge animado com tendência.
"R$187/mês" → mini-chart de distribuição por medicamento.

### Princípio 4: Surpreender e incentivar
Micro-animações ao registrar dose. Counter animado. Streak badges. Pulse em itens críticos. Gamificação sutil que recompensa disciplina.

---

## 3. Estrutura de Navegação Proposta

### BottomNav: 5 → 4 tabs

```
ATUAL (5 tabs):              PROPOSTA (4 tabs):
┌────┬────┬────┬────┬────┐   ┌──────┬──────┬──────┬──────┐
│Home│Rem.│Prot│Est.│Hist│   │ Hoje │Trat. │Est.  │Perfil│
└────┴────┴────┴────┴────┘   └──────┴──────┴──────┴──────┘
```

| Tab atual | → Tab nova | Justificativa |
|-----------|-----------|---------------|
| Início (Dashboard) | **Hoje** | Foco no dia-a-dia, ação imediata |
| Remédios + Protocolos | **Tratamento** | Fusão: paciente pensa em "tratamento", não em "entidade + regra" |
| Estoque | **Estoque** | Mantém, evolui visualmente + prescrições + custos |
| Histórico | → absorvido | Calendário/timeline vão para Perfil>Saúde. Últimas doses ficam em Hoje |
| Settings | **Perfil** | Evolui: agrupa saúde, dados, configurações. Ganha Emergency Card e Consulta |

---

## 4. Evolução de Cada Tela

### 4.1 TAB "HOJE" — Dashboard Evoluído

**Mantém intacto:** accordion, swipe, lote, FABs, SmartAlerts
**Evolui visualmente:**

```
┌──────────────────────────────┐
│ Bom dia, André         🌙 👤 │
├──────────────────────────────┤
│  ┌─────────────────────────┐ │
│  │  HEALTH SCORE      85%  │ │  ← EV-01: ring gauge animado
│  │      ╭───╮              │ │    Framer Motion spring animation
│  │    ╭╯ 85 ╰╮   🔥 12d   │ │    Cor: vermelho→amarelo→verde→azul
│  │    ╰╮    ╭╯   streak   │ │    Click → detalhe (DailyDoseModal)
│  │      ╰───╯              │ │
│  │  ▁▂▃▅▇▅▇█▅▇▅▃▅▇▅▇█▅▇  │ │  ← EV-04: sparkline 7d inline
│  │  S  T  Q  Q  S  S  D   │ │    com tooltip on tap
│  └─────────────────────────┘ │
├──────────────────────────────┤
│ ⚠️ 2 alertas                 │  ← SmartAlerts (mantém)
│  🔴 Estoque zerado: Omep.   │
│  🟡 Prescrição vence: 12d   │
├──────────────────────────────┤
│ TRATAMENTO              2/3 │  ← MANTÉM accordion
│  ▶ Cardiovascular (3 meds)  │    SwipeRegisterItem intacto
│    → Losartana 08:00 [swipe]│    EV-05: micro-animação ao registrar
│    ✓ Metformina 08:00       │
│    → Losartana 22:00 [swipe]│
│  ▶ Suplementos (1 med)      │
│    ✓ Vitamina D 08:00       │
├──────────────────────────────┤
│ PRÓXIMAS DOSES               │  ← mantém
│  → Omeprazol 22:00   [swipe]│
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │ ESTOQUE RÁPIDO         │   │  ← EV-02: NOVO widget gráfico
│ │ Losart. ████░░░ 4d  🟡│   │    barras horizontais com cores
│ │ Metfor. ████████ 30d 🟢│   │    por nível de criticidade
│ │ Omepra. ░░░░░░░ 0d  🔴│   │    tap → navega para Estoque
│ │ Vit. D  ████████ 90d 🟢│   │    pulse em barras vermelhas
│ └────────────────────────┘   │
├──────────────────────────────┤
│ ÚLTIMAS DOSES                │  ← mantém (colapsável)
│  Losartana · há 3h           │
│  Vitamina D · há 3h          │
├──────────────────────────────┤
│  [+ Registro Manual]         │
│  [👨‍⚕️ Modo Consulta]          │
└──────────────────────────────┘
```

**Mudanças vs. Dashboard atual:**
| Elemento | Antes | Depois |
|----------|-------|--------|
| HealthScore | Card retangular grande | Ring gauge animado (EV-01) |
| Sparkline | Widget separado | Inline dentro do ring gauge card |
| InsightCard | Widget no Dashboard | Move para Perfil > Saúde |
| Accordion + Swipe | ✅ mantém | + micro-animações (EV-05) |
| "Estoque Rápido" | ❌ não existia | NOVO widget com barras (EV-02) |
| Últimas doses | Sempre visível | Colapsável |

### 4.2 TAB "TRATAMENTO" — Fusão Remédios + Protocolos

```
┌──────────────────────────────┐
│ Meu Tratamento     [+ Novo]  │
├──────────────────────────────┤
│ 📁 PLANOS                    │
│  ▶ Cardiovascular            │  ← EXISTENTE: plans accordion
│    Losartana · 2x/dia       │    mantém cards de protocolo
│    Metformina · 2x/dia      │    com edit/delete/pause
│  ▶ Suplementos               │
│    Vitamina D · 1x/dia      │
├──────────────────────────────┤
│ 📋 PROTOCOLOS AVULSOS        │  ← EXISTENTE: standalone protocols
│  Omeprazol · diário 22:00   │
│  [✏️] [⏸️]                    │
├──────────────────────────────┤
│ 💊 SEM PROTOCOLO             │  ← NOVO: meds sem protocolo
│  Dipirona                    │    com CTA "Criar protocolo →"
│  [Criar protocolo →]         │    (resolve P5: dead-end de meds)
├──────────────────────────────┤
│ ⏸️ INATIVOS (2)       [ver]  │  ← colapsado por padrão
└──────────────────────────────┘
```

**Wizard unificado de cadastro** (substitui window.confirm):
```
┌──────────────────────────────┐
│ Novo Tratamento        1/3   │
│ ●○○                         │
├──────────────────────────────┤
│ MEDICAMENTO                  │
│                              │
│ Nome: [Losartana           ] │
│ Tipo: [Comprimido        ▼] │
│ Dosagem: [50] [mg        ▼] │
│                              │
│        [Próximo →]           │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Novo Tratamento        2/3   │
│ ●●○                         │
├──────────────────────────────┤
│ COMO TOMAR                   │
│                              │
│ Frequência: [Diário      ▼] │
│ Horários: [08:00] [22:00]   │
│ Dose: [1] comprimido(s)     │
│ Início: [27/02/2026]        │
│                              │
│  [← Voltar] [Próximo →]     │
│             [Pular]          │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Novo Tratamento        3/3   │
│ ●●●                         │
├──────────────────────────────┤
│ ESTOQUE ATUAL                │
│                              │
│ Quantidade: [60] comprimidos │
│ Compra: [27/02/2026]        │
│ Preço unitário: [R$ 0,75]   │
│ Validade: [     ] (opcional) │
│                              │
│  [← Voltar] [Concluir]      │
│             [Pular]          │
└──────────────────────────────┘

┌──────────────────────────────┐
│ ✅ Pronto!                    │
│                              │
│ Losartana cadastrada com     │
│ protocolo diário (08:00,     │
│ 22:00) e 60 comprimidos      │
│ em estoque.                  │
│                              │
│ [Ir para Hoje]               │
│ [Cadastrar outro]            │
└──────────────────────────────┘
```

### 4.3 TAB "ESTOQUE" — Evolução Visual

```
┌──────────────────────────────┐
│ Meu Estoque          [+ Add] │
├──────────────────────────────┤
│ ┌────────────────────────┐   │
│ │ VISÃO GERAL            │   │  ← EV-02: barras de estoque
│ │                        │   │
│ │  Losart. ████░░░  4d 🟡│   │  ← barra dupla:
│ │  Metfor. ████████ 30d🟢│   │    escuro = atual
│ │  Omepra. ░░░░░░░  0d 🔴│   │    claro = projeção consumo
│ │  Vit. D  █████████90d🔵│   │    pulse no vermelho
│ │                        │   │
│ └────────────────────────┘   │
├──────────────────────────────┤
│ 📋 PRESCRIÇÕES (F5.9)        │  ← EV-07: timeline visual
│ ┌────────────────────────┐   │
│ │ Losart. ████████░░ 22d │   │  ← barra: início→hoje→fim
│ │ Omepra. ██████████ 12d │   │    verde>30d, amarelo≤30d,
│ │ Metfor. ─── contínuo ──│   │    vermelho=vencida
│ └────────────────────────┘   │
├──────────────────────────────┤
│ ❌ SEM ESTOQUE               │  ← EXISTENTE (mantém cards)
│  Omeprazol · 0 comprimidos  │
│  [+ Adicionar]               │
├──────────────────────────────┤
│ ⚠️ ACABA EM BREVE            │  ← EXISTENTE
│  Losartana · 8 cp (4 dias)  │
├──────────────────────────────┤
│ ✅ ESTOQUE OK                │  ← EXISTENTE
│  Metformina · 60 cp (30d)   │
│  Vitamina D · 90 cp (90d)   │
├──────────────────────────────┤
│ 💰 CUSTO MENSAL (F5.10)      │  ← EV-06: mini-chart de custo
│ ┌────────────────────────┐   │
│ │ Total: R$187/mês       │   │
│ │                        │   │
│ │ Losart.  ████████ R$45 │   │  ← barras horizontais
│ │ Metfor.  ██████   R$32 │   │    de distribuição
│ │ Omepra.  ████████ R$48 │   │
│ │ Vit. D   ████     R$22 │   │
│ │ Outros   ██████   R$40 │   │
│ │                        │   │
│ │ Projeção 3m:     R$561 │   │
│ └────────────────────────┘   │
└──────────────────────────────┘
```

### 4.4 TAB "PERFIL" — Evolução do Settings

```
┌──────────────────────────────┐
│ 👤 André                     │
│ andre@email.com              │
├──────────────────────────────┤
│ SAÚDE & HISTÓRICO            │
│ 📊 Minha Saúde →            │  ← sub-view com calendário,
│                              │    timeline, sparkline, insights,
│                              │    interações, custos detalhados
│ 🆘 Cartão de Emergência →   │  ← F5.8 (ganha destaque)
│ 👨‍⚕️ Modo Consulta →           │  ← F5.7 (ganha destaque)
├──────────────────────────────┤
│ RELATÓRIOS & DADOS           │
│ 📊 Relatório PDF →          │  ← F5.1
│ 📤 Exportar Dados →         │  ← F5.2
│ 🔗 Compartilhar →           │  ← F5.3
├──────────────────────────────┤
│ CONFIGURAÇÕES                │
│ 🤖 Telegram [Conectado ✅]   │
│ 🎨 Tema (claro/escuro)      │
│ 🔒 Alterar Senha            │
│ 🛠️ Admin DLQ                │
├──────────────────────────────┤
│ [Sair da Conta]              │
└──────────────────────────────┘
```

**"Minha Saúde"** (sub-view de Perfil — evolução do History):
```
┌──────────────────────────────┐
│ ← Minha Saúde               │
├──────────────────────────────┤
│ ADESÃO 30D       85% (+3%)  │
│ ▓▓▓▓▓▓▓▓░░                  │
│ 🔥 12d streak · Melhor: 28d │
├──────────────────────────────┤
│ ← Fev 2026 →                │
│ D  S  T  Q  Q  S  S         │  ← EV-03: heat map de adesão
│        🟢 🟢 🟡 🟢          │    (evolução do calendar existente)
│ 🟢 🟢 🔴 🟢 🟢 🟡 🟢        │    click → detalhe por protocolo
│ 🟢 ●  ·  ·  ·  ·  ·        │
├──────────────────────────────┤
│ SPARKLINE 30D                │  ← EV-04: sparkline ampliada
│ ▁▂▃▅▇▅▇█▅▇▅▃▅▇▅▇█▅▇▅▁▃▅▇  │    com tooltip on tap
│ 28/01─────────────────27/02  │
├──────────────────────────────┤
│ INSIGHTS                     │
│ 💡 Quartas: -15% vs média   │
│ 💡 Horário noturno: +8%     │
├──────────────────────────────┤
│ ⚠️ INTERAÇÕES (F5.6)        │
│ Losartana × AINEs: moderada │
│ [Ver detalhes →]             │
├──────────────────────────────┤
│ 💰 CUSTO DETALHADO (F5.10)  │
│ R$187/mês · Projeção: R$561 │
│ [Ver breakdown →]            │
├──────────────────────────────┤
│ TIMELINE DE DOSES            │  ← EXISTENTE: do History
│ 27/02 ─── 3 doses           │    edit/delete mantidos
│  Losartana 08:00 ✓ [✏️][🗑️] │
│  Metformina 08:00 ✓         │
│  Losartana 22:00 ✓          │
│ 26/02 ─── 2 doses           │
│ [ver mais...]                │
├──────────────────────────────┤
│ STATS DO MÊS                │  ← EXISTENTE: do History
│ 📊 68 doses · 24 dias · 136cp│
├──────────────────────────────┤
│ [✅ Registrar Dose]           │
└──────────────────────────────┘
```

---

## 5. Catálogo de Evoluções Visuais (Design System)

### EV-01: Ring Gauge de Health Score
- **Onde:** Hoje (Dashboard)
- **Substitui:** HealthScoreCard retangular
- **Técnica:** SVG `<circle>` com `stroke-dasharray` + Framer Motion `animate={{ pathLength }}`
- **Cor:** Gradiente por score (vermelho <50 → amarelo 50-69 → verde 70-84 → azul 85+)
- **Dados internos:** Score %, streak count, trend arrow
- **Interação:** Click → expande detalhe com DailyDoseModal
- **Animação:** Spring on mount (`{ type: "spring", stiffness: 60 }`)

### EV-02: Barras de Estoque com Projeção
- **Onde:** Hoje ("Estoque Rápido") + Estoque ("Visão Geral")
- **Substitui:** Nada (é adição)
- **Técnica:** `<div>` com `width: ${percent}%` + 2 tons via `opacity`
  - Tom escuro (opacity 1.0) = estoque atual
  - Tom claro (opacity 0.3) = projeção de consumo (quando zera)
- **Escala:** Normalizado em 30 dias (30d = 100%)
- **Cores:** `--color-critical` (<7d), `--color-warning` (7-14d), `--color-success` (14-30d), `--color-info` (>30d)
- **Interação:** Tap → navega para Estoque com medicamento focado
- **Animação:** Stagger entrance (Framer Motion `staggerChildren: 0.05`)
- **Extra:** Pulse CSS animation em barras vermelhas (`@keyframes pulse { 50% { opacity: 0.7 } }`)

### EV-03: Calendário com Heat Map de Adesão
- **Onde:** Perfil > Minha Saúde (evolução do Calendar existente)
- **Substitui:** Calendar com dots simples
- **Técnica:** Background-color dos dias baseado em adesão%
  - 🟢 100% completo
  - 🟡 1-99% parcial
  - 🔴 0% perdido (tinha doses esperadas)
  - ⚪ sem doses esperadas
  - Cinza: futuro
- **Dados:** `doseCalendarService.calculateMonthlyDoseMap()`
- **Interação:** Click no dia → painel inferior com status por protocolo
- **Animação:** Fade-in dos dias com stagger

### EV-04: Sparkline Interativa
- **Onde:** Hoje (inline no ring gauge card) + Saúde (sparkline 30d ampliada)
- **Evolui:** SparklineAdesao existente
- **Técnica:** SVG `<polyline>` com gradient fill
- **Interação:** Tap num ponto → tooltip com data + % adesão + doses tomadas/esperadas
- **Variante Hoje:** Compacta (7 dias, sem tooltip)
- **Variante Saúde:** Ampliada (30 dias, com tooltip, com eixo X de datas)

### EV-05: Micro-animações de Dose
- **Onde:** Hoje (SwipeRegisterItem, HealthScore)
- **O que adiciona:** Feedback visual ao registrar dose

| Momento | Animação | Técnica |
|---------|----------|---------|
| Swipe confirmado | Check mark com bounce | Framer Motion `scale: [0, 1.2, 1]` |
| Counter atualiza | Number flip | Framer Motion `AnimatePresence` + slide up |
| Ring gauge atualiza | Score sobe com spring | Framer Motion `animate={{ pathLength }}` |
| 100% do dia | Confetti (já existe) | Mantém |
| Milestone streak | Badge pulsante | `scale: [1, 1.15, 1]` loop 3x |

### EV-06: Custo como Mini-Chart
- **Onde:** Estoque (seção "Custo Mensal")
- **Técnica:** Barras horizontais com label e valor
- **Dados:** `unit_price × daily_intake × 30` por medicamento
- **Interação:** Tap → expande com projeção 3/6/12 meses e histórico de compras
- **Estado vazio:** "Adicione preços no estoque para ver custos" com CTA

### EV-07: Prescrições como Timeline Visual
- **Onde:** Estoque (seção "Prescrições")
- **Técnica:** Barra horizontal representando `start_date → end_date`
  - Posição do "hoje" marcada com linha vertical
  - Segmento antes de hoje = preenchido
  - Segmento depois de hoje = outline/claro
- **Cores:** Verde (>30d restantes), Amarelo (≤30d), Vermelho (vencida)
- **Caso especial:** `end_date: null` = barra infinita com label "contínuo"
- **Interação:** Tap → navega para protocolo

### EV-08: Pulse em Itens Críticos
- **Onde:** SmartAlerts, Estoque (itens sem estoque), Prescrições (vencidas)
- **Técnica:** `@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.7 } }` 2s infinite
- **Alternativa:** Framer Motion `scale: [1, 1.02, 1]` com `repeat: Infinity`
- **Objetivo:** Chamar atenção sem ser invasivo

---

## 6. Mapa de Conexões Entre Telas

```
           HOJE ←─────────── PERFIL
            │                   │
      [swipe dose]         [minha saúde →]
      [modo consulta]      [emergency]
      [estoque rápido→]    [tratamento →]
      [alertas→]           [relatórios]
            │                   │
            ├── TRATAMENTO ─────┤
            │  [wizard]         │
            │  [edit prot.]     │
            │                   │
            └── ESTOQUE ────────┘
               [prescrições]
               [custo]
               [add estoque]
```

**Fluxos cross-tela:**
- Hoje > "Estoque Rápido" tap na barra 🔴 → Estoque (scroll para aquele med)
- Hoje > SmartAlert "Estoque Baixo" → Estoque
- Hoje > SmartAlert "Prescrição" → Tratamento (protocolo específico)
- Hoje > SmartAlert "Dose Atrasada" → LogForm pré-preenchido
- Hoje > Ring Gauge click → DailyDoseModal
- Estoque > "Custo" tap → expande seção com detalhe
- Estoque > Prescrição tap → Tratamento (protocolo)
- Perfil > "Minha Saúde" → sub-view completa
- Perfil > Calendário dia click → detalhe por protocolo
- Tratamento > "+Novo" → Wizard 3 passos
- Tratamento > "Sem protocolo" CTA → Wizard step 2

---

## 7. Features da Fase 5 — Onde Moram

| Feature | Tela | Tipo de evolução |
|---------|------|-----------------|
| F5.4 Calendário Visual | **Saúde** (ex-History) | EV-03: heat map no calendar existente |
| F5.8 Emergency Card | **Perfil** | Destaque visual (sai do fundo de Settings) |
| F5.9 Prescrições | **Estoque** | EV-07: timeline visual como nova seção |
| F5.2 Export CSV/JSON | **Perfil** | Seção "Relatórios & Dados" |
| F5.1 PDF Reports | **Perfil** | Seção "Relatórios & Dados" |
| F5.3 Compartilhar | **Perfil** + Consulta | Integrado ao fluxo PDF/Consulta |
| F5.7 Modo Consulta | **Perfil** + FAB Hoje | Destaque em Perfil, mantém FAB |
| F5.5 Bot Proativo | Background | Sem mudança visual |
| F5.10 Custos | **Estoque** + **Saúde** | EV-06: mini-chart em ambas |
| F5.6 Interações | **Saúde** + Wizard | Alertas severity-coded em Saúde |

**Evoluções visuais (não features, mas design):**
| Evolução | Tela | Impacto |
|----------|------|---------|
| EV-01 Ring Gauge | Hoje | Substitui HealthScoreCard |
| EV-02 Barras Estoque | Hoje + Estoque | Widget gráfico de criticidade |
| EV-04 Sparkline interativa | Hoje + Saúde | Tooltip + dados comparativos |
| EV-05 Micro-animações | Hoje | Check, counter flip, streak badge |
| EV-08 Pulse | Hoje + Estoque | Atenção em itens críticos |

---

## 8. Métricas de Sucesso

| Métrica | Antes | Depois esperado |
|---------|-------|----------------|
| Scroll para registrar primeira dose | ~3 telas | ≤1 tela |
| Tempo para identificar estoque crítico | Navegar para Estoque | Visível no Dashboard |
| Ação após alerta de prescrição | Nenhuma (Settings) | Navega para Tratamento |
| Motivação visual ao registrar dose | Confetti em 100% apenas | Check + counter + streak + confetti |
| Entendimento de adesão mensal | Número (85%) | Ring gauge + sparkline + heat map |

---

## 9. Refinamentos v0.4 — Janelas Temporais, Agrupamento e Escalabilidade

### 9.1 Janelas Temporais Deslizantes (vs. Blocos Rígidos)

**Problema:** Blocos fixos (Manhã 7-12h, Tarde 12-18h, Noite 18-23h) não refletem a realidade do paciente. Quem acordou tarde e perdeu a dose das 08:00 não quer vê-la enterrada numa seção "Manhã" já encerrada.

**Solução: Janela Deslizante centrada no "agora"**

A tab "Hoje" organiza doses em 3 zonas temporais **relativas ao horário atual**, não absolutas:

```
┌──────────────────────────────┐
│ Bom dia, André         🌙 👤 │
│ ╭───╮ 85%  🔥 12d           │  ← ring gauge compacto
│ ╰───╯                       │
├──────────────────────────────┤
│ ⏰ ATRASADAS (-2h)     1 ⚠️  │  ← Zona 1: now - 2h → now
│  ⚠ Losartana 08:00    [reg] │    Destaque visual vermelho/laranja
│                              │    CTA "Registrar Atrasado"
├──────────────────────────────┤
│ ▶ AGORA                2/3  │  ← Zona 2: now → now + 1h
│  ✓ Metformina 10:00         │    (horários dentro do intervalo
│  → Vitamina D 10:00  [swipe]│    imediato de ação)
│  → AAS 10:00         [swipe]│
├──────────────────────────────┤
│ ⏳ PRÓXIMAS (+4h)      0/2  │  ← Zona 3: now + 1h → now + 4h
│  ○ Omeprazol 14:00          │    Visual mais suave (cinza/outline)
│  ○ Metformina 14:00         │    "Daqui a 3h"
├──────────────────────────────┤
│ 📋 MAIS TARDE          0/2  │  ← Zona 4: restante do dia
│  ○ Losartana 22:00          │    Colapsado por padrão
│  ○ Omeprazol 22:00          │    Expandir para ver
└──────────────────────────────┘
```

**Algoritmo de zonas:**

```
Zona          │ Regra                    │ Visual        │ Comportamento
──────────────┼──────────────────────────┼───────────────┼─────────────────
ATRASADAS     │ scheduled < now          │ 🟠 bg-warning │ Sempre expandida
              │ AND scheduled >= now-2h  │ pulse sutil   │ CTA "Registrar"
              │ AND não registrada       │               │
──────────────┼──────────────────────────┼───────────────┼─────────────────
AGORA         │ scheduled >= now         │ 🟢 bg-primary │ Sempre expandida
              │ AND scheduled < now+1h   │ bold          │ Swipe para registrar
──────────────┼──────────────────────────┼───────────────┼─────────────────
PRÓXIMAS      │ scheduled >= now+1h      │ ⚪ bg-muted   │ Expandida se ≤4 itens
              │ AND scheduled < now+4h   │ text-muted    │ Colapsada se >4 itens
──────────────┼──────────────────────────┼───────────────┼─────────────────
MAIS TARDE    │ scheduled >= now+4h      │ ⚪ bg-subtle  │ Colapsada por padrão
              │ (restante do dia)        │ text-light    │ Counter badge "(3)"
──────────────┼──────────────────────────┼───────────────┼─────────────────
REGISTRADAS   │ já registrada hoje       │ ✅ line-thru  │ Seção final, colapsada
              │                          │ text-muted    │ "3 doses registradas ✓"
```

**Por que funciona melhor que blocos fixos:**
- Às 09:30 o paciente vê: Losartana 08:00 como "ATRASADA" (perdeu), Metformina 10:00 como "AGORA" (prioridade), Omeprazol 14:00 como "PRÓXIMA"
- Às 14:15 as zonas se recalculam: Metformina 10:00 some (>2h atrás ou já registrada), Omeprazol 14:00 é "AGORA", Losartana 22:00 é "PRÓXIMA"
- O paciente nunca precisa interpretar em qual "período do dia" ele está — a interface faz isso por ele

**Integração com accordion:** Dentro de cada zona temporal, as doses são agrupadas pelo accordion de tratamento quando houver mais de um protocolo no mesmo horário (ver seção 9.2).

### 9.2 Visão Dual: Temporal (Ação) + Tratamento (Contexto)

**Problema:** Abandonar o agrupamento por plano de tratamento perde contexto clínico. O "quarteto fantástico" para ICFEr agrupa 4 medicamentos com um *propósito*, e o paciente quer ver esse propósito — "tomei para o quê mesmo?"

**Solução: View primária temporal + contexto de tratamento inline**

A organização padrão é **temporal** (zonas deslizantes), mas cada dose carrega um **badge de contexto** e o accordion continua disponível:

```
┌──────────────────────────────┐
│ ▶ AGORA               3/5   │
│                              │
│  🫀 Losartana    08:00 [swp] │  ← badge 🫀 = plano Cardiovascular
│  🫀 Metformina   08:00 [swp] │    badge ao lado do nome
│  🫀 AAS          08:00 [swp] │    toque no badge → expande info
│  💊 Vitamina D   08:00 [swp] │  ← badge 💊 = plano Suplementos
│  ○ Omeprazol    10:00       │  ← sem badge = protocolo avulso
│                              │
│  [LOTE: 🫀 Cardiovascular]   │  ← botão de lote por plano
│  [LOTE: Tudo 08:00]         │  ← botão de lote por horário
└──────────────────────────────┘
```

**Badge de tratamento:**

```
Plano                 │ Badge │ Cor
──────────────────────┼───────┼──────────
Cardiovascular        │ 🫀    │ vermelho
Diabetes              │ 🩸    │ azul
Suplementos           │ 💊    │ verde
Sem plano (avulso)    │ (nenhum) │ cinza
```

- Os badges são definidos pelo usuário ao criar/editar o plano de tratamento
- Cada plano pode ter um emoji e uma cor
- Tap no badge: tooltip/mini-card com nome do plano + médico responsável + objetivo

**Toggle de visualização (para pacientes com muitos meds):**

```
┌──────────────────────────────┐
│ AGORA      [⏰ Hora│📋 Plano] │  ← toggle no header da zona
└──────────────────────────────┘
```

No modo **📋 Plano**, a zona mostra o accordion tradicional:

```
┌──────────────────────────────┐
│ ▶ AGORA (modo plano)   3/5  │
│                              │
│ ▼ 🫀 Cardiovascular    3/3   │  ← accordion por plano (EXISTENTE)
│   ✓ Losartana    08:00       │    com swipe + lote
│   ✓ Metformina   08:00       │
│   → AAS          08:00 [swp] │
│                              │
│ ▶ 💊 Suplementos       0/1   │
│                              │
│ ▶ Avulsos              0/1   │
└──────────────────────────────┘
```

**Comportamento inteligente do toggle:**
- Default: modo `⏰ Hora` (mais direto para ação)
- Se o paciente tem ≤3 medicamentos no mesmo horário: modo Hora (sem necessidade de agrupar)
- Se o paciente tem >5 medicamentos no mesmo horário: sugere modo Plano automaticamente (UI-hint)
- A última escolha do paciente é persistida em localStorage

**Lote inteligente:**
- No modo Hora: "Registrar todos do horário 08:00" → bulk register
- No modo Plano: "Registrar todo Cardiovascular" → bulk register do plano
- Ambos disponíveis sempre, toggle só muda a organização visual

### 9.3 Escalabilidade: De 1 Remédio a 12 Doses/Dia

**Problema:** A UI que funciona para 2 medicamentos pode ser verbosa demais para 10, e a UI condensada para 10 pode ser confusa para quem tem 2.

**Solução: Progressive Disclosure com 3 "modos" automáticos**

O sistema detecta a complexidade do paciente e adapta a UI:

```
Complexidade  │ Critério (v0.5)    │ Adaptação UI
──────────────┼────────────────────┼──────────────────────
SIMPLES       │ ≤3 medicamentos    │ Expansão total, cards grandes
              │                    │ Sem toggle hora/plano
              │                    │ Badges inline (sem tooltip)
              │                    │ Ring gauge proeminente
──────────────┼────────────────────┼──────────────────────
MODERADO      │ 4-6 medicamentos   │ Cards médios
              │                    │ Toggle hora/plano disponível
              │                    │ Zonas colapsáveis
              │                    │ Estoque rápido: top 4 críticos
──────────────┼────────────────────┼──────────────────────
COMPLEXO      │ 7+ medicamentos    │ Cards compactos (1 linha)
              │                    │ Toggle padrão = modo Plano
              │                    │ Zonas PRÓXIMAS colapsadas
              │                    │ Progress bar por zona
              │                    │ Estoque rápido: só críticos
              │                    │ Lote é ação primária
```

**Wireframe: Paciente SIMPLES (2 meds, 2 doses/dia)**

```
┌──────────────────────────────┐
│ Bom dia, André               │
│ ┌──────────────────────────┐ │
│ │     ╭─────╮              │ │  ← ring gauge grande (mais espaço)
│ │   ╭╯ 100 ╰╮  Perfeito!  │ │    motivação: mensagem de incentivo
│ │   ╰╮  %  ╭╯  🔥 12 dias │ │
│ │     ╰─────╯              │ │
│ │  ▁▃▅▇▅▇█▅▇▅▇█▅          │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ▶ AGORA                     │
│ ┌──────────────────────────┐ │
│ │ 💊 Losartana  50mg       │ │  ← card grande com detalhes
│ │    1 comprimido · 08:00  │ │    nome, dosagem, hora
│ │    Hipertensão           │ │    contexto do plano
│ │              [Registrar →]│ │    botão em vez de swipe
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ 💊 Omeprazol  20mg       │ │
│ │    1 cápsula · 08:00     │ │
│ │              [Registrar →]│ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ⏳ NOITE (22:00)         0/1 │
│  ○ Losartana 22:00          │
├──────────────────────────────┤
│ ✅ NENHUMA ATRASADA          │  ← seção vazia = positiva
└──────────────────────────────┘
```

**Wireframe: Paciente COMPLEXO (10 meds, 12 doses/dia)**

```
┌──────────────────────────────┐
│ André              ╭───╮ 85%│  ← ring gauge inline (compacto)
│ 🔥 12d             ╰───╯    │    maximizar espaço vertical
├──────────────────────────────┤
│ ⚠️ 1 atrasada                │
│  ⚠ Losartana 08:00    [reg] │  ← 1 linha por dose (compacto)
├──────────────────────────────┤
│ ▶ AGORA             3/5  ▓▓░│  ← progress bar inline
│ ┌──────────────────────────┐ │
│ │ ▼ 🫀 Cardio        2/3   │ │  ← modo Plano por padrão
│ │   ✓ Losartana · ✓ AAS    │ │    2 por linha (compacto)
│ │   → Metformina     [swp] │ │
│ │ ▶ 🩸 Diabetes      0/1   │ │
│ │ ▶ 💊 Suplementos   1/1 ✅│ │  ← plano completo = colapsado
│ └──────────────────────────┘ │
│ [LOTE: Registrar 2 restantes]│  ← CTA proeminente
├──────────────────────────────┤
│ ⏳ PRÓXIMAS (+4h)      0/4 ▼│  ← colapsado com counter
├──────────────────────────────┤
│ 📋 MAIS TARDE          0/3 ▼│  ← colapsado com counter
├──────────────────────────────┤
│ ✅ 4 registradas hoje     ▼  │  ← colapsado
├──────────────────────────────┤
│ ESTOQUE  ░░Omep.🔴 ░Losart.🟡│ ← só críticos, inline
└──────────────────────────────┘
```

**Lógica de adaptação automática:**

```javascript
// DECISÃO v0.5: threshold baseado apenas em quantidade de medicamentos ativos
// (não em doses/dia — irrelevante pra complexidade visual)
function getComplexityMode(activeMedicines) {
  const count = activeMedicines.length

  if (count <= 3) return 'simple'
  if (count <= 6) return 'moderate'
  return 'complex'    // 7+ medicamentos
}
```

**Adaptações por complexidade:**

| Elemento | Simple | Moderate | Complex |
|----------|--------|----------|---------|
| Ring Gauge | Grande, centralizado | Médio, com sparkline | Inline, 1 linha |
| Card de dose | 3 linhas (nome+dosagem+contexto) | 2 linhas (nome+hora) | 1 linha (nome · hora) |
| Modo padrão | Hora (poucos itens) | Hora (toggle visível) | Plano (toggle visível) |
| Botão registrar | Botão explícito "Registrar →" | Swipe | Swipe + Lote proeminente |
| Zonas futuras | Sempre expandidas | Expandidas se ≤4 | Colapsadas com badge |
| Estoque rápido | Todos os meds | Top 5 por criticidade | Só críticos (🔴🟡) |
| SmartAlerts | Sempre expandidos | Badge com contagem | Badge com contagem |

**Override manual:** O paciente pode forçar um modo em Perfil > Configurações > "Densidade da interface" (Confortável / Normal / Compacto). A detecção automática é apenas o default.

---

## 10. Impacto no Tab "HOJE" — Wireframe Consolidado v0.4

Integrando as 3 evoluções (janelas deslizantes + contexto de plano + escalabilidade), o Dashboard "Hoje" fica:

```
┌──────────────────────────────┐
│ André               ╭───╮85%│  ← adapta tamanho por complexidade
│ 🔥 12d  ▁▃▅▇▅▇█    ╰───╯   │    sparkline + ring gauge
├──────────────────────────────┤
│ ⚠️ 2 alertas          [ver]  │  ← badge colapsado (complex mode)
├──────────────────────────────┤
│ ⚠ ATRASADAS           1  🟠 │  ← Zona deslizante (now - 2h)
│  ⚠ Losartana 08:00 🫀 [reg] │    badge de plano + CTA
├──────────────────────────────┤
│ ▶ AGORA          [⏰│📋] 3/5│  ← toggle hora/plano
│  🫀 Metformina 10:00  [swp] │    (ou accordion, depende do toggle)
│  🫀 AAS         10:00  [swp] │
│  💊 Vit. D      10:00  [swp] │
│  [LOTE: 3 pendentes]        │
├──────────────────────────────┤
│ ⏳ PRÓXIMAS (+4h)    0/2  ▼  │  ← colapsado em complex mode
├──────────────────────────────┤
│ 📋 MAIS TARDE        0/3  ▼  │  ← colapsado
├──────────────────────────────┤
│ ✅ 4 registradas      [ver]  │
├──────────────────────────────┤
│ EST. ░Omep.🔴 ░Losar.🟡     │  ← estoque rápido (só críticos)
├──────────────────────────────┤
│ [+ Manual] [👨‍⚕️ Consulta]    │
└──────────────────────────────┘
```

---

## 11. Decisões Finalizadas (v0.5)

| Decisão | Resolução | Justificativa |
|---------|-----------|---------------|
| Badges de planos | **Usuário escolhe** emoji+cor ao criar/editar plano. Sugerir opções default no wizard (🫀❤️💊🧠🦴) | Personalização aumenta engajamento |
| Threshold complexidade | **Só quantidade de medicamentos:** ≤3 simples, 4-6 moderado, 7+ complexo | Doses/dia é irrelevante — a tela se adapta à quantidade de itens |
| Janela de atrasadas | **2h fixo inicialmente.** Avaliar uso e ajustar se necessário | YAGNI — não criar configuração antes de ter evidência |

## 12. Plano de Execução

**Spec de orquestração completa:** `plans/EXEC_SPEC_UX_EVOLUTION.md`

| Onda | Escopo | Risco | Executor |
|------|--------|-------|----------|
| **1. Componentes Visuais** | EV-01 a EV-06 (ring gauge, barras estoque, sparkline, micro-animações, custo) | Baixo | Sonnet / qualquer agente |
| **2. Lógica + Hooks** | Zonas deslizantes, toggle hora/plano, progressive disclosure, badges de plano | Médio | Sonnet + CLAUDE.md |
| **3. Navegação** | 5→4 tabs, Tratamento (fusão), Perfil (evolução Settings), wizard cadastro | Alto | Sonnet + supervisão Opus |

---

*Documento aprovado — última atualização: 04/03/2026*
