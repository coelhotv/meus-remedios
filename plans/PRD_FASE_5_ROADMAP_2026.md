# PRD Fase 5: Valor Clinico e Exportacao

**Versao:** 1.0  
**Status:** DRAFT  
**Data:** 08/02/2026  
**Fase do Roadmap:** 5 de 7  
**Baseline:** Fase 4 concluida (PWA + Router + Push)  
**Principio:** Custo operacional R$ 0  

---

## 1. Visao Geral e Objetivos Estrategicos

A Fase 5 agrega valor clinico real ao Meus Remedios com relatorios exportaveis para medicos, exportacao de dados pessoais, calendario visual de doses e alertas inteligentes de interacao medicamentosa. Posiciona o produto como ferramenta de saude seria, nao apenas um lembrete de doses.

### Objetivos Estrategicos

| ID | Objetivo | Metrica Primaria |
|----|----------|-----------------|
| OE5.1 | Gerar relatorios clinicos exportaveis para consultas medicas | Downloads PDF > 20% usuarios/semana |
| OE5.2 | Garantir portabilidade de dados do usuario | Exports CSV/JSON > 10% usuarios |
| OE5.3 | Fornecer visao mensal intuitiva do historico de doses | Uso calendario > 30% sessoes |
| OE5.4 | Aumentar seguranca com alertas de interacao medicamentosa | Alertas exibidos rastreados |
| OE5.5 | Proatividade na reposicao de estoque via bot | Notificacoes de estoque enviadas |

### Pre-requisitos

- Fase 4 concluida (Hash Router para navegacao de relatorios, PWA para cache)
- adherenceService funcional com calculo por periodo
- Cache SWR operacional
- Bot Telegram com commandWrapper e middleware

---

## 2. Escopo de Features

| ID | Feature | Prioridade | Story Points | Novas Dependencias |
|----|---------|------------|-------------|-------------------|
| F5.1 | Relatorios PDF com Graficos | P0 | 13 | jspdf + jspdf-autotable (~300KB) |
| F5.2 | Exportacao de Dados CSV/JSON | P0 | 5 | Nenhuma (APIs nativas) |
| F5.3 | Compartilhamento de Relatorio via Link | P1 | 5 | Nenhuma |
| F5.4 | Calendario Visual de Doses | P0 | 8 | Nenhuma (SVG/CSS grid) |
| F5.5 | Notificacoes Proativas de Estoque no Bot | P1 | 3 | Nenhuma |
| F5.6 | Alertas de Interacao Medicamentosa | P1 | 13 | Nenhuma (base de dados local JSON) |

**Esforco Total:** 47 story points  
**Novas dependencias npm:** jspdf (~250KB), jspdf-autotable (~50KB)  

### Fora de Escopo

- Exportacao FHIR (eliminada por complexidade)
- Integracao com sistemas hospitalares
- Prescricao digital
- Qualquer feature com custo recorrente

---

## 3. Descricao Detalhada de Features

### F5.1 Relatorios PDF com Graficos

**Titulo:** Geracao de relatorios PDF client-side com graficos de adesao e dados clinicos  
**Rastreabilidade:** Roadmap 2026 - Fase 5, P08  

**Descricao:**  
Gerar relatorios PDF completos no client-side usando jsPDF, contendo dados de adesao, estoque, timeline de titulacao e graficos de tendencia. O relatorio e formatado para impressao A4 e pode ser compartilhado com medicos em consultas. Nenhum dado e enviado para servidor externo.

**Requisitos Tecnicos:**
- Instalar `jspdf` e `jspdf-autotable`
- Service `src/services/reportService.js` (geracao de PDF)
- Componente `src/components/reports/ReportGenerator.jsx` (UI de configuracao)
- Componente `src/components/reports/ReportPreview.jsx` (preview antes de gerar)
- Rota `#/relatorio` e `#/relatorio/:periodo`

**Estrutura do PDF:**

| Secao | Conteudo |
|-------|----------|
| Cabecalho | Nome do usuario, data de geracao, periodo |
| Resumo de Adesao | Score geral, score por protocolo, streak atual |
| Grafico de Tendencia | Adesao diaria dos ultimos 7/30/90 dias (SVG convertido) |
| Lista de Medicamentos | Nome, dosagem, frequencia, horarios |
| Historico de Doses | Tabela com data, medicamento, horario previsto, horario registrado, status |
| Estoque Atual | Medicamento, quantidade atual, dias restantes estimados |
| Timeline de Titulacao | Etapas concluidas, etapa atual, proxima etapa |
| Rodape | Disclaimer: "Este relatorio nao substitui orientacao medica" |

**Periodos Disponiveis:**

| Periodo | Label | Dados Incluidos |
|---------|-------|----------------|
| 7d | Ultima semana | Detalhado (todas as doses) |
| 30d | Ultimo mes | Resumido (adesao diaria) |
| 90d | Ultimo trimestre | Agregado (adesao semanal) |

**Criterios de Aceitacao:**
- [ ] PDF gerado em < 3s para periodo de 30 dias
- [ ] PDF formatado para A4 com margens adequadas
- [ ] Grafico de tendencia renderizado corretamente no PDF
- [ ] Tabelas com quebra de pagina automatica
- [ ] Disclaimer presente no rodape de todas as paginas
- [ ] Preview disponivel antes de gerar/baixar
- [ ] Funciona offline (dados do cache)
- [ ] Nome do arquivo: `meus-remedios-relatorio-{periodo}-{data}.pdf`

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.1.1 | Usuario | Navega para `#/relatorio` -> seleciona periodo 30d -> preview -> clica "Baixar PDF" -> arquivo salvo |
| UC-5.1.2 | Usuario | Gera PDF -> compartilha com medico via WhatsApp/email |
| UC-5.1.3 | Usuario | Gera PDF offline -> dados do cache utilizados -> disclaimer de dados potencialmente desatualizados |

**Dependencias:** jsPDF, adherenceService, Hash Router  
**Impacto Financeiro:** R$ 0 (geracao client-side)  

---

### F5.2 Exportacao de Dados CSV/JSON

**Titulo:** Exportacao completa de dados do usuario em formato CSV e JSON  
**Rastreabilidade:** Roadmap 2026 - Fase 5, N01  

**Descricao:**  
Permitir ao usuario exportar todos os seus dados em formato CSV ou JSON. Atende ao principio de portabilidade de dados e transparencia. Inclui medicamentos, protocolos, historico de doses, estoque e configuracoes.

**Requisitos Tecnicos:**
- Service `src/services/exportService.js`
- Metodos: `exportCSV()`, `exportJSON()`, `exportAll(format)`
- Componente `src/components/settings/DataExport.jsx`
- Usar APIs nativas: `Blob`, `URL.createObjectURL`, `<a download>`
- Nenhuma dependencia externa necessaria

**Dados Exportaveis:**

| Entidade | Campos | Formato CSV | Formato JSON |
|----------|--------|-------------|-------------|
| Medicamentos | id, nome, dosagem, forma, notas | medicamentos.csv | medicamentos.json |
| Protocolos | id, nome, medicamentos, horarios, titulacao | protocolos.csv | protocolos.json |
| Historico de Doses | id, medicamento, data, horario_previsto, horario_registrado, status | historico_doses.csv | historico_doses.json |
| Estoque | id, medicamento, quantidade, data_entrada, validade | estoque.csv | estoque.json |
| Configuracoes | tema, notificacoes, onboarding | - | configuracoes.json |

**Criterios de Aceitacao:**
- [ ] Export CSV gera arquivo valido abrivel em Excel/Google Sheets
- [ ] Export JSON gera arquivo valido e formatado (pretty-print)
- [ ] Todos os dados do usuario incluidos (sem dados de outros usuarios)
- [ ] Encoding UTF-8 com BOM para compatibilidade Excel
- [ ] Nomes de arquivo: `meus-remedios-{entidade}-{data}.{ext}`
- [ ] Opcao de exportar tudo em ZIP (opcional, se viavel sem lib externa)
- [ ] Funciona offline (dados do cache)

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.2.1 | Usuario | Vai em Perfil -> "Exportar dados" -> seleciona CSV -> seleciona entidades -> download |
| UC-5.2.2 | Usuario | Exporta JSON completo -> usa para backup manual |
| UC-5.2.3 | Usuario | Exporta historico CSV -> abre no Excel -> analisa padroes |

**Dependencias:** Nenhuma  
**Impacto Financeiro:** R$ 0  

---

### F5.3 Compartilhamento de Relatorio via Link

**Titulo:** Gerar link temporario para compartilhar relatorio com medico  
**Rastreabilidade:** Roadmap 2026 - Fase 5, N05  

**Descricao:**  
Permitir ao usuario gerar um link temporario (hash-based, sem servidor) que contem um snapshot dos dados de adesao. O link codifica os dados em base64 no proprio hash da URL, sem necessidade de armazenamento server-side. Valido enquanto a URL existir (sem expiracao tecnica, mas com aviso de "dados de {data}").

**Requisitos Tecnicos:**
- Service `src/services/shareService.js`
- Metodo: `generateShareLink(reportData)` -> URL com dados em hash
- Rota `#/compartilhado/:data` (decodifica e exibe relatorio read-only)
- Componente `src/components/reports/SharedReport.jsx` (visualizacao publica)
- Dados comprimidos com `btoa()` (base64) - limite pratico ~2KB de dados
- Versao resumida do relatorio (score, streak, ultimos 7 dias)

**Criterios de Aceitacao:**
- [ ] Link gerado copiavel para clipboard (Web Share API ou fallback)
- [ ] Link abre visualizacao read-only do relatorio resumido
- [ ] Nenhum dado armazenado no servidor para compartilhamento
- [ ] Aviso de data de geracao visivel no relatorio compartilhado
- [ ] Dados sensiveis (nome completo) nao incluidos no link
- [ ] Funciona em qualquer navegador (sem necessidade de login)

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.3.1 | Usuario | Gera relatorio -> clica "Compartilhar" -> link copiado -> envia para medico via WhatsApp |
| UC-5.3.2 | Medico | Recebe link -> abre no navegador -> ve resumo de adesao do paciente |

**Dependencias:** F5.1 (ReportGenerator), Hash Router  
**Impacto Financeiro:** R$ 0  

---

### F5.4 Calendario Visual de Doses

**Titulo:** Visao mensal de calendario com status de doses por dia  
**Rastreabilidade:** Roadmap 2026 - Fase 5, N08  

**Descricao:**  
Calendario visual mensal mostrando o status de adesao de cada dia com cores semanticas. Permite ao usuario identificar padroes de falha (dias da semana, periodos) e ter uma visao macro do tratamento. Implementado com CSS Grid e SVG, sem dependencia externa.

**Requisitos Tecnicos:**
- Componente `src/components/calendar/DoseCalendar.jsx`
- Componente `src/components/calendar/CalendarDay.jsx`
- CSS Grid para layout do calendario (7 colunas)
- Rota `#/calendario` e `#/calendario/:mes`
- Navegacao entre meses (setas ou swipe)
- Dados do adherenceService agrupados por dia

**Cores por Status:**

| Status | Cor | Significado |
|--------|-----|------------|
| 100% adesao | Verde (#10b981) | Todas as doses tomadas |
| 50-99% adesao | Amarelo (#f59e0b) | Algumas doses perdidas |
| 1-49% adesao | Laranja (#f97316) | Maioria das doses perdidas |
| 0% adesao | Vermelho (#ef4444) | Nenhuma dose tomada |
| Sem dados | Cinza (#6b7280) | Dia futuro ou sem protocolo |
| Hoje | Borda accent (#6366f1) | Dia atual destacado |

**Criterios de Aceitacao:**
- [ ] Calendario exibe mes completo com dias corretos
- [ ] Cores refletem adesao real do dia
- [ ] Navegacao entre meses funcional (setas e swipe)
- [ ] Toque em dia abre detalhe das doses do dia
- [ ] Responsivo em viewports >= 320px
- [ ] Legenda de cores visivel
- [ ] Performance: renderizacao < 100ms por mes

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.4.1 | Usuario | Navega para `#/calendario` -> ve mes atual -> identifica padrao de falha nas segundas-feiras |
| UC-5.4.2 | Usuario | Toca em dia amarelo -> ve quais doses foram perdidas naquele dia |
| UC-5.4.3 | Usuario | Navega para mes anterior -> compara adesao entre meses |

**Dependencias:** adherenceService, Hash Router  
**Impacto Financeiro:** R$ 0  

---

### F5.5 Notificacoes Proativas de Estoque no Bot

**Titulo:** Bot envia alerta automatico quando estoque esta proximo do fim  
**Rastreabilidade:** Roadmap 2026 - Fase 5, N09  

**Descricao:**  
O bot Telegram envia notificacao proativa quando o estoque de um medicamento esta previsto para acabar em 7 dias ou menos. Calculo baseado no consumo diario do protocolo ativo. Enviado uma vez por dia (manha) para evitar spam.

**Requisitos Tecnicos:**
- Cron job Vercel `api/cron/stock-alerts.js` (executa 1x/dia as 8h)
- Query Supabase: estoque atual / doses diarias <= 7
- Mensagem formatada em MarkdownV2 com inline button "Ver Estoque"
- Inline button abre deep link `#/estoque`
- Respeitar preferencia de notificacao do usuario
- Rate limit: 1 alerta por medicamento por dia

**Criterios de Aceitacao:**
- [ ] Alerta enviado quando estoque <= 7 dias de consumo
- [ ] Mensagem inclui nome do medicamento e dias restantes
- [ ] Inline button "Ver Estoque" abre app na tela de estoque
- [ ] Maximo 1 alerta por medicamento por dia
- [ ] Nao envia se usuario desativou notificacoes de estoque
- [ ] Cron job executa em < 10s para todos os usuarios

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.5.1 | Usuario | Recebe mensagem no Telegram: "Estoque baixo: Losartana - restam 5 dias" -> toca "Ver Estoque" -> app abre em `#/estoque` |
| UC-5.5.2 | Usuario | Compra medicamento -> atualiza estoque -> alerta nao enviado no dia seguinte |

**Dependencias:** Bot Telegram, Vercel Cron, Deep Linking (F4.1)  
**Impacto Financeiro:** R$ 0  

---

### F5.6 Alertas de Interacao Medicamentosa

**Titulo:** Sistema de alertas de interacao medicamentosa baseado em base de dados local  
**Rastreabilidade:** Roadmap 2026 - Fase 5, N02  

**Descricao:**  
Sistema que verifica interacoes conhecidas entre os medicamentos do usuario e exibe alertas no dashboard. Baseado em uma base de dados JSON local (sem API externa) com as interacoes mais comuns. Diferenciador competitivo que agrega valor clinico real.

**Requisitos Tecnicos:**
- Base de dados `src/data/drugInteractions.json` (interacoes mais comuns)
- Service `src/services/interactionService.js`
- Metodo: `checkInteractions(medications)` -> lista de alertas
- Componente `src/components/alerts/InteractionAlert.jsx`
- Integracao com SmartAlerts existente (prioridade media)
- Base inicial: ~200 interacoes mais comuns (expandivel)

**Estrutura da Base de Dados:**

```json
{
  "interactions": [
    {
      "drug_a": "losartana",
      "drug_b": "ibuprofeno",
      "severity": "moderate",
      "description": "Ibuprofeno pode reduzir o efeito anti-hipertensivo da Losartana",
      "recommendation": "Evitar uso prolongado. Consulte seu medico.",
      "source": "Anvisa"
    }
  ]
}
```

**Niveis de Severidade:**

| Nivel | Cor | Acao |
|-------|-----|------|
| severe | Vermelho (#ef4444) | Alerta critico no topo do dashboard |
| moderate | Amarelo (#f59e0b) | Alerta informativo no SmartAlerts |
| mild | Azul (#3b82f6) | Nota informativa (expandivel) |

**Criterios de Aceitacao:**
- [ ] Interacoes verificadas ao cadastrar novo medicamento
- [ ] Interacoes verificadas ao abrir dashboard (cache de resultado)
- [ ] Alerta exibido com severidade, descricao e recomendacao
- [ ] Disclaimer: "Consulte seu medico. Este alerta e informativo."
- [ ] Base de dados local (sem chamadas externas)
- [ ] Busca case-insensitive e com normalizacao de acentos
- [ ] Base inicial com >= 200 interacoes documentadas

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-5.6.1 | Usuario | Cadastra Ibuprofeno -> ja tem Losartana -> alerta "Interacao moderada" exibido |
| UC-5.6.2 | Usuario | Abre dashboard -> SmartAlerts mostra "1 interacao medicamentosa detectada" -> expande -> ve detalhes |
| UC-5.6.3 | Usuario | Remove medicamento -> alerta de interacao desaparece |

**Dependencias:** SmartAlerts (HCC), medicationService  
**Impacto Financeiro:** R$ 0  

---

## 4. Requisitos Nao-Funcionais

| Requisito | Especificacao | Metrica |
|-----------|--------------|---------|
| Performance | Geracao de PDF | < 3s para 30 dias |
| Performance | Renderizacao calendario | < 100ms por mes |
| Performance | Verificacao de interacoes | < 50ms |
| Seguranca | Dados no link compartilhado | Sem nome completo ou dados sensiveis |
| Privacidade | Geracao de PDF | 100% client-side, zero upload |
| Privacidade | Base de interacoes | Local, sem chamadas externas |
| Acessibilidade | Calendario | Navegavel por teclado, cores + icones |
| Acessibilidade | PDF | Texto selecionavel (nao imagem) |
| Compatibilidade | PDF download | Chrome, Safari, Firefox (mobile + desktop) |
| Bundle Size | jsPDF + autotable | Lazy loaded, nao impacta bundle inicial |

---

## 5. Plano de Testes

### 5.1 Testes Unitarios (Vitest)

| Componente | Cenarios |
|------------|----------|
| reportService | Gera PDF valido, inclui todas as secoes, respeita periodo, disclaimer presente |
| exportService | CSV valido, JSON valido, UTF-8 BOM, todos os dados incluidos |
| shareService | Gera link, decodifica link, limite de tamanho, dados sensiveis excluidos |
| DoseCalendar | Renderiza mes correto, cores por status, navegacao entre meses |
| interactionService | Detecta interacao conhecida, ignora desconhecida, case-insensitive |
| stock-alerts cron | Calcula dias restantes, envia alerta, respeita rate limit |

### 5.2 Testes de Integracao

| Cenario | Validacao |
|---------|-----------|
| Gerar PDF + preview | Seleciona periodo -> preview renderiza -> PDF baixado com dados corretos |
| Export + reimport | Exporta JSON -> dados completos e validos |
| Calendario + detalhe | Toca em dia -> detalhe mostra doses corretas |
| Interacao + cadastro | Cadastra medicamento com interacao -> alerta exibido no dashboard |
| Estoque + bot | Estoque baixo -> cron executa -> mensagem recebida no Telegram |

### 5.3 Cobertura Alvo

| Metrica | Meta |
|---------|------|
| Cobertura de linhas | > 85% (novos componentes) |
| Cobertura de branches | > 80% |
| Interacoes na base | >= 200 pares documentados |

---

## 6. Indicadores de Sucesso

| KPI | Baseline | Meta | Ferramenta |
|-----|----------|------|------------|
| Downloads PDF/semana | 0 | > 20% usuarios | Analytics local |
| Exports de dados | 0 | > 10% usuarios | Analytics local |
| Uso calendario visual | 0 | > 30% sessoes | Analytics local |
| Links compartilhados | 0 | > 5% usuarios | Analytics local |
| Alertas interacao exibidos | 0 | Tracking de ocorrencias | Analytics local |
| Notificacoes estoque enviadas | 0 | Tracking | Supabase query |
| Cobertura de testes | > 82% | > 85% | Vitest coverage |

---

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| jsPDF bundle size impacta carregamento | Media | Medio | Lazy loading (dynamic import), so carrega quando usuario acessa relatorios |
| Base de interacoes incompleta gera falsa seguranca | Alta | Alto | Disclaimer claro em todos os alertas, fonte citada, recomendacao de consultar medico |
| Link compartilhado com dados desatualizados | Media | Baixo | Data de geracao visivel, aviso "dados de {data}" |
| Calendario com muitos dias sem dados confunde usuario | Baixa | Baixo | Legenda clara, empty state para meses sem dados |
| Cron de estoque falha silenciosamente | Media | Medio | Logging no Vercel, alerta manual se cron nao executa em 48h |
| PDF nao renderiza corretamente em todos os dispositivos | Media | Medio | Testes em multiplos dispositivos, fallback para HTML printavel |

---

## 8. Cronograma de Implementacao

| Ordem | Feature | Dependencia | Story Points |
|-------|---------|-------------|-------------|
| 1 | F5.4 Calendario Visual | adherenceService, Hash Router | 8 |
| 2 | F5.2 Exportacao CSV/JSON | Nenhuma | 5 |
| 3 | F5.1 Relatorios PDF | jsPDF (instalar), adherenceService | 13 |
| 4 | F5.3 Compartilhamento via Link | F5.1 | 5 |
| 5 | F5.5 Notificacoes Estoque Bot | Deep Linking, Bot | 3 |
| 6 | F5.6 Alertas Interacao | SmartAlerts, base JSON | 13 |

---

## 9. Definicao de Pronto (DoD)

- [ ] Codigo implementado e revisado
- [ ] Testes unitarios passando com cobertura > 85%
- [ ] PDF gerado corretamente em Chrome, Safari e Firefox
- [ ] Exportacao CSV abrivel em Excel sem problemas de encoding
- [ ] Calendario responsivo e acessivel
- [ ] Base de interacoes com >= 200 pares documentados
- [ ] Disclaimer presente em relatorios e alertas de interacao
- [ ] Cron de estoque funcional no Vercel
- [ ] Sem regressao em funcionalidades existentes
- [ ] jsPDF lazy loaded (nao impacta bundle inicial)

---

*Documento elaborado em 08/02/2026*  
*Referencia: Roadmap 2026 v3.0 - Fase 5*  
*Proxima revisao: apos conclusao da Fase 5*
