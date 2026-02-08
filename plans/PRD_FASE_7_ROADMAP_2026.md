# PRD Fase 7: Inteligencia e Monetizacao (Condicional)

**Versao:** 1.0  
**Status:** DRAFT  
**Data:** 08/02/2026  
**Fase do Roadmap:** 7 de 7  
**Baseline:** Fase 6 concluida (Cuidador + Offline + Multi-perfil)  
**Principio:** Custo operacional R$ 1-20/mes (primeira fase com custo variavel)  
**Condicional:** Ativacao depende de gatilhos de validacao  

---

## 1. Visao Geral e Objetivos Estrategicos

A Fase 7 e a unica fase condicional do roadmap. Introduz inteligencia artificial (chatbot), backup criptografado, notificacoes avancadas para cuidadores e importacao via OCR. E a primeira fase que aceita custo operacional variavel, justificado pela base de usuarios validada.

### Gatilhos de Ativacao

| Gatilho | Meta | Status |
|---------|------|--------|
| Usuarios registrados | >= 100 | Pendente |
| Usuarios ativos mensais | >= 50 | Pendente |
| Receita mensal potencial validada | >= R$ 500 | Pendente |
| Instalacoes PWA | >= 30% dos usuarios mobile | Pendente |

**Regra:** Ativar Fase 7 quando pelo menos 2 dos 4 gatilhos forem atingidos.

### Objetivos Estrategicos

| ID | Objetivo | Metrica Primaria |
|----|----------|-----------------|
| OE7.1 | Oferecer assistente IA para duvidas sobre medicamentos | > 2 perguntas/dia/usuario |
| OE7.2 | Garantir seguranca de dados com backup criptografado | > 30% usuarios com backup ativo |
| OE7.3 | Aumentar valor para cuidadores com relatorios automaticos | > 50% cuidadores recebem relatorio semanal |
| OE7.4 | Simplificar cadastro de medicamentos via OCR | > 80% acuracia na identificacao |
| OE7.5 | Validar modelo freemium | > 5% conversao para plano pago |

### Pre-requisitos

- Fase 6 concluida (Cuidador, Offline, Multi-perfil)
- Gatilhos de ativacao atingidos
- Conta Groq API configurada (free tier: 30 req/min)
- Decisao sobre modelo de monetizacao (freemium vs doacao)

---

## 2. Escopo de Features

| ID | Feature | Prioridade | Story Points | Custo Estimado |
|----|---------|------------|-------------|---------------|
| F7.1 | Chatbot IA com Groq | P0 | 13 | R$ 0-5/mes (free tier) |
| F7.2 | Backup Automatico Criptografado | P1 | 8 | R$ 0-5/mes (storage) |
| F7.3 | Notificacoes Avancadas Cuidador | P1 | 5 | R$ 0 (Telegram) |
| F7.4 | Importacao via Foto OCR | P2 | 21 | R$ 0-10/mes (API OCR) |

**Esforco Total:** 47 story points  
**Custo Operacional Estimado:** R$ 1-20/mes  

### Fora de Escopo

- Prescricao digital ou integracao com farmacias
- Modelo de assinatura complexo (manter simples)
- IA generativa para recomendacoes medicas (risco regulatorio)
- Integracao com wearables (Apple Health, Google Fit)

---

## 3. Descricao Detalhada de Features

### F7.1 Chatbot IA com Groq

**Titulo:** Assistente IA para duvidas sobre medicamentos usando Groq API  
**Rastreabilidade:** Roadmap 2026 - Fase 7, C01  

**Descricao:**  
Chatbot integrado ao app e ao bot Telegram que responde duvidas sobre medicamentos do usuario. Usa Groq API (LLaMA 3) para respostas rapidas e gratuitas (free tier). Contexto limitado aos medicamentos cadastrados do usuario. Inclui disclaimer medico obrigatorio em todas as respostas.

**Requisitos Tecnicos:**

**Backend (Vercel Serverless):**
- Endpoint `api/chat/ask.js` (POST)
- Integracao com Groq SDK (`groq-sdk`)
- System prompt com contexto dos medicamentos do usuario
- Rate limiting: 10 perguntas/hora/usuario
- Historico de conversa: ultimas 5 mensagens (contexto)
- Timeout: 10s por resposta

**System Prompt:**

```
Voce e um assistente de saude do app Meus Remedios. Voce ajuda o usuario 
a entender seus medicamentos, horarios e possiveis efeitos colaterais.

REGRAS OBRIGATORIAS:
1. SEMPRE inclua o disclaimer: "Esta informacao nao substitui orientacao medica."
2. NUNCA recomende iniciar, parar ou alterar dosagem de medicamentos.
3. NUNCA faca diagnosticos.
4. Responda APENAS sobre os medicamentos listados abaixo.
5. Se a pergunta nao for sobre medicamentos, responda educadamente que 
   so pode ajudar com duvidas sobre medicamentos.
6. Respostas em portugues brasileiro, linguagem acessivel.

Medicamentos do usuario:
{medications_context}
```

**Frontend:**
- Componente `src/components/chat/ChatInterface.jsx`
- Componente `src/components/chat/ChatMessage.jsx`
- Componente `src/components/chat/ChatInput.jsx`
- Rota `#/assistente`
- Historico local (localStorage, ultimas 50 mensagens)
- Indicador de "digitando..." durante resposta

**Bot Telegram:**
- Comando `/perguntar {texto}` ou `/p {texto}`
- Resposta formatada em MarkdownV2
- Disclaimer inline em todas as respostas

**Criterios de Aceitacao:**
- [ ] Chatbot responde em < 5s
- [ ] Disclaimer presente em TODAS as respostas
- [ ] Contexto limitado aos medicamentos do usuario
- [ ] Rate limit de 10 perguntas/hora/usuario
- [ ] Recusa educada para perguntas fora do escopo
- [ ] Nunca recomenda alterar tratamento
- [ ] Funciona via web e Telegram
- [ ] Historico de conversa persistido localmente
- [ ] Fallback gracioso se Groq API indisponivel
- [ ] Feedback positivo/negativo por resposta (thumbs up/down)

**Exemplos de Interacao:**

| Pergunta | Resposta Esperada |
|----------|------------------|
| "Posso tomar Losartana com cafe?" | "A Losartana pode ser tomada com ou sem alimentos. O cafe nao interfere significativamente na absorcao. Esta informacao nao substitui orientacao medica." |
| "Qual o efeito colateral do Ibuprofeno?" | "Os efeitos colaterais mais comuns do Ibuprofeno incluem dor de estomago, nausea e tontura. Se sentir algum efeito colateral, consulte seu medico. Esta informacao nao substitui orientacao medica." |
| "Estou com dor de cabeca, o que tomo?" | "Nao posso recomendar medicamentos. Consulte seu medico ou farmaceutico para orientacao sobre dor de cabeca. Esta informacao nao substitui orientacao medica." |
| "Qual a capital da Franca?" | "Desculpe, so posso ajudar com duvidas sobre seus medicamentos. Posso ajudar com algo sobre Losartana, Ibuprofeno ou seus outros medicamentos?" |

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-7.1.1 | Usuario | Abre `#/assistente` -> digita "Posso tomar Losartana a noite?" -> resposta em < 5s com disclaimer |
| UC-7.1.2 | Usuario | No Telegram: `/perguntar efeito colateral losartana` -> resposta formatada |
| UC-7.1.3 | Usuario | Faz pergunta fora do escopo -> recusa educada |
| UC-7.1.4 | Usuario | Groq API fora do ar -> mensagem "Assistente temporariamente indisponivel" |
| UC-7.1.5 | Usuario | Da thumbs down em resposta -> feedback registrado para melhoria |

**Dependencias:** Groq API (free tier), Vercel Serverless, Bot Telegram  
**Impacto Financeiro:** R$ 0-5/mes (Groq free tier: 30 req/min, 14.4K tokens/min)  

---

### F7.2 Backup Automatico Criptografado

**Titulo:** Backup automatico dos dados do usuario com criptografia client-side  
**Rastreabilidade:** Roadmap 2026 - Fase 7, C02  

**Descricao:**  
Sistema de backup automatico que exporta todos os dados do usuario em formato JSON criptografado. A chave de criptografia e derivada de uma senha escolhida pelo usuario (PBKDF2 + AES-256-GCM). O backup e armazenado no Supabase Storage (free tier: 1GB). Restauracao possivel em qualquer dispositivo com a senha correta.

**Requisitos Tecnicos:**

**Criptografia (Web Crypto API):**
- Derivacao de chave: PBKDF2 (100.000 iteracoes, SHA-256)
- Criptografia: AES-256-GCM
- Salt unico por backup (armazenado no header do arquivo)
- IV unico por operacao de criptografia
- Zero dependencias externas (Web Crypto API nativa)

**Backend:**
- Supabase Storage bucket `backups` (privado, RLS)
- Politica: usuario so acessa seus proprios backups
- Limite: 1 backup por usuario (sobrescreve anterior)
- Tamanho maximo: 5MB por backup

**Frontend:**
- Service `src/services/backupService.js`
- Metodos: `createBackup(password)`, `restoreBackup(file, password)`, `scheduleAutoBackup()`
- Componente `src/components/settings/BackupSettings.jsx`
- Componente `src/components/settings/RestoreBackup.jsx`
- Auto-backup semanal (se habilitado, senha salva em memoria apenas durante sessao)

**Estrutura do Backup:**

```json
{
  "version": "1.0",
  "created_at": "2026-02-08T10:00:00Z",
  "salt": "base64...",
  "iv": "base64...",
  "data": "encrypted_base64..."
}
```

**Dados Incluidos no Backup:**
- Medicamentos
- Protocolos
- Historico de doses (ultimos 365 dias)
- Estoque
- Perfis
- Configuracoes
- Rituais (localStorage)

**Criterios de Aceitacao:**
- [ ] Backup criptografado com AES-256-GCM
- [ ] Chave derivada com PBKDF2 (100K iteracoes)
- [ ] Restauracao funcional com senha correta
- [ ] Erro claro com senha incorreta (sem revelar dados parciais)
- [ ] Auto-backup semanal (se habilitado)
- [ ] Tamanho do backup < 5MB
- [ ] Upload para Supabase Storage com RLS
- [ ] Download e restauracao funcional em outro dispositivo
- [ ] Indicador visual de ultimo backup realizado
- [ ] Opcao de backup manual a qualquer momento

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-7.2.1 | Usuario | Vai em Perfil -> Backup -> define senha -> "Criar backup" -> upload para Supabase |
| UC-7.2.2 | Usuario | Novo dispositivo -> "Restaurar backup" -> insere senha -> dados restaurados |
| UC-7.2.3 | Usuario | Habilita auto-backup -> backup semanal automatico (domingo 3h) |
| UC-7.2.4 | Usuario | Tenta restaurar com senha errada -> erro "Senha incorreta" |

**Dependencias:** Supabase Storage (free tier), Web Crypto API  
**Impacto Financeiro:** R$ 0-5/mes (Supabase Storage free: 1GB)  

---

### F7.3 Notificacoes Avancadas Cuidador

**Titulo:** Relatorios semanais automaticos e alertas criticos para cuidadores  
**Rastreabilidade:** Roadmap 2026 - Fase 7, C04  

**Descricao:**  
Expandir o sistema de cuidador (F6.1) com relatorios semanais automaticos e alertas criticos. O cuidador recebe no Telegram um resumo semanal da adesao do paciente e alertas imediatos para situacoes criticas (3+ doses consecutivas perdidas, estoque zerado).

**Requisitos Tecnicos:**

**Cron Jobs (Vercel):**
- `api/cron/caregiver-weekly-report.js` (executa domingos 9h)
- `api/cron/caregiver-critical-alerts.js` (executa a cada 6h)

**Relatorio Semanal (Telegram):**

```
📊 Relatorio Semanal - {nome_paciente}
Periodo: {data_inicio} a {data_fim}

Adesao Geral: {score}%
Doses Tomadas: {tomadas}/{total}
Streak Atual: {streak} dias
Estoque Critico: {medicamentos_criticos}

Detalhes por medicamento:
- Losartana 50mg: {score}% ({tomadas}/{total})
- Ibuprofeno 400mg: {score}% ({tomadas}/{total})
```

**Alertas Criticos:**

| Alerta | Condicao | Urgencia |
|--------|----------|----------|
| Doses consecutivas perdidas | >= 3 doses seguidas sem registro | Alta |
| Estoque zerado | Quantidade = 0 | Alta |
| Adesao semanal critica | Score < 50% na semana | Media |

**Criterios de Aceitacao:**
- [ ] Relatorio semanal enviado todo domingo as 9h
- [ ] Relatorio inclui score, doses, streak e estoque
- [ ] Alerta critico enviado em ate 6h apos condicao
- [ ] Cuidador pode desativar relatorio semanal
- [ ] Cuidador pode desativar alertas criticos
- [ ] Paciente pode desativar envio para cuidador especifico
- [ ] Formatacao MarkdownV2 no Telegram

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-7.3.1 | Cuidador | Domingo 9h -> recebe relatorio semanal no Telegram -> ve que adesao caiu para 60% |
| UC-7.3.2 | Cuidador | Paciente perde 3 doses seguidas -> cuidador recebe alerta critico -> liga para paciente |
| UC-7.3.3 | Paciente | Desativa relatorio semanal para cuidador especifico -> cuidador para de receber |

**Dependencias:** F6.1 (Modo Cuidador), Vercel Cron, Bot Telegram  
**Impacto Financeiro:** R$ 0  

---

### F7.4 Importacao via Foto OCR

**Titulo:** Cadastro de medicamento via foto da caixa/receita usando OCR  
**Rastreabilidade:** Roadmap 2026 - Fase 7, N07  

**Descricao:**  
Permitir que o usuario tire uma foto da caixa do medicamento ou da receita medica e o sistema extraia automaticamente o nome do medicamento e a dosagem. Usa OCR (Tesseract.js client-side ou API externa) para reconhecimento de texto. Resultado apresentado para confirmacao antes de cadastrar.

**Requisitos Tecnicos:**

**Opcao A: Client-side (Tesseract.js) - Preferida (custo R$ 0)**
- Instalar `tesseract.js` (~2MB worker, lazy loaded)
- Processamento 100% no dispositivo do usuario
- Modelo portugues (`por`) para melhor acuracia
- Tempo estimado: 3-8s por imagem

**Opcao B: API Externa (Google Vision / AWS Textract) - Fallback**
- Endpoint `api/ocr/extract.js` (proxy para API)
- Custo: ~R$ 0.01 por imagem
- Tempo estimado: 1-3s por imagem

**Frontend:**
- Componente `src/components/import/PhotoImport.jsx`
- Componente `src/components/import/CameraCapture.jsx` (acesso a camera)
- Componente `src/components/import/OCRResult.jsx` (resultado para confirmacao)
- Rota `#/importar/foto`

**Fluxo de Processamento:**

```
[Camera/Galeria] -> [Pre-processamento (crop, contraste)]
    -> [OCR (Tesseract.js)] -> [Regex para extrair nome + dosagem]
    -> [Fuzzy match com base de medicamentos conhecidos]
    -> [Resultado para confirmacao do usuario]
    -> [Cadastro do medicamento]
```

**Base de Medicamentos Conhecidos:**
- JSON local com ~5.000 medicamentos mais comuns no Brasil
- Campos: nome_comercial, principio_ativo, dosagens_comuns
- Usado para fuzzy matching e autocomplete

**Criterios de Aceitacao:**
- [ ] Acesso a camera funcional (com permissao)
- [ ] Upload de foto da galeria como alternativa
- [ ] OCR identifica nome do medicamento com > 80% acuracia
- [ ] OCR identifica dosagem com > 70% acuracia
- [ ] Resultado apresentado para confirmacao (editavel)
- [ ] Fuzzy match sugere medicamento mais proximo
- [ ] Processamento em < 8s (client-side) ou < 3s (API)
- [ ] Funciona com fotos de caixas e receitas impressas
- [ ] Fallback manual se OCR falhar
- [ ] Lazy loading do worker Tesseract (nao impacta bundle inicial)

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-7.4.1 | Usuario | Toca "Importar foto" -> tira foto da caixa -> OCR extrai "Losartana 50mg" -> confirma -> medicamento cadastrado |
| UC-7.4.2 | Usuario | Foto da receita -> OCR extrai 3 medicamentos -> confirma cada um -> todos cadastrados |
| UC-7.4.3 | Usuario | Foto com baixa qualidade -> OCR falha -> usuario digita manualmente (fallback) |
| UC-7.4.4 | Usuario | OCR extrai "Losartan" -> fuzzy match sugere "Losartana" -> usuario confirma |

**Dependencias:** Tesseract.js (client-side) ou API OCR (server-side)  
**Impacto Financeiro:** R$ 0 (Tesseract.js) ou R$ 0-10/mes (API externa)  

---

## 4. Modelo de Monetizacao (Proposta)

### 4.1 Freemium

| Tier | Preco | Features |
|------|-------|----------|
| Free | R$ 0 | Todas as features atuais (Fases 1-6) |
| Premium | R$ 9,90/mes | Chatbot IA ilimitado, backup automatico, OCR ilimitado, relatorios avancados cuidador |

### 4.2 Alternativa: Doacao

| Modelo | Implementacao |
|--------|--------------|
| "Pague o que quiser" | Botao de doacao via Pix (sem gateway) |
| Sponsor | Link para GitHub Sponsors |

### 4.3 Decisao

A decisao entre freemium e doacao sera tomada com base nos dados de engajamento coletados nas Fases 3-6. Se o engajamento for alto (DAU/MAU > 30%), freemium. Se for moderado, doacao.

**Implementacao tecnica do paywall (se freemium):**
- Feature flags em localStorage + Supabase
- Verificacao client-side (confianca no usuario, sem DRM complexo)
- Upgrade via Stripe Checkout (hosted page, sem PCI compliance)

---

## 5. Requisitos Nao-Funcionais

| Requisito | Especificacao | Metrica |
|-----------|--------------|---------|
| Performance | Resposta chatbot | < 5s |
| Performance | OCR client-side | < 8s |
| Performance | Backup criptografia | < 3s para 5MB |
| Seguranca | Criptografia backup | AES-256-GCM + PBKDF2 100K |
| Seguranca | Groq API key | Server-side only (Vercel env) |
| Seguranca | Dados do chatbot | Nenhum dado persistido no Groq |
| Privacidade | OCR client-side | Zero upload de imagens |
| Privacidade | Chatbot | Historico local only |
| Disponibilidade | Chatbot | Fallback gracioso se API indisponivel |
| Disponibilidade | OCR | Fallback manual sempre disponivel |
| Custo | Total operacional | R$ 1-20/mes maximo |
| Regulatorio | Chatbot | Disclaimer obrigatorio, sem diagnosticos |

---

## 6. Plano de Testes

### 6.1 Testes Unitarios (Vitest)

| Componente | Cenarios |
|------------|----------|
| ChatInterface | Envia mensagem, recebe resposta, exibe disclaimer, rate limit |
| backupService | Criptografa, descriptografa, senha errada, formato invalido |
| OCRResult | Exibe resultado, permite edicao, fuzzy match |
| caregiver-weekly-report | Gera relatorio correto, formata MarkdownV2 |
| caregiver-critical-alerts | Detecta 3+ doses perdidas, estoque zerado |

### 6.2 Testes de Integracao

| Cenario | Validacao |
|---------|-----------|
| Chatbot end-to-end | Pergunta -> API Groq -> resposta com disclaimer |
| Backup + restore | Cria backup -> novo dispositivo -> restaura com senha -> dados corretos |
| OCR + cadastro | Foto -> OCR -> confirmacao -> medicamento cadastrado corretamente |
| Relatorio cuidador | Cron executa -> cuidador recebe relatorio no Telegram |
| Alerta critico | 3 doses perdidas -> cuidador recebe alerta em < 6h |

### 6.3 Testes de Seguranca

| Cenario | Validacao |
|---------|-----------|
| Backup com senha errada | Erro claro, sem dados parciais revelados |
| Groq API key exposure | Key nunca exposta no client-side |
| Rate limiting chatbot | 11a pergunta na hora bloqueada |
| RLS backup storage | Usuario A nao acessa backup do usuario B |

### 6.4 Cobertura Alvo

| Metrica | Meta |
|---------|------|
| Cobertura de linhas | > 88% (novos componentes) |
| Cobertura de branches | > 82% |
| Testes de seguranca | >= 5 cenarios |

---

## 7. Indicadores de Sucesso

| KPI | Baseline | Meta | Ferramenta |
|-----|----------|------|------------|
| Uso chatbot | 0 | > 2 perguntas/dia/usuario | Supabase query |
| Satisfacao chatbot | 0 | > 70% thumbs up | Analytics local |
| Backups ativos | 0 | > 30% usuarios | Supabase Storage |
| Restauracoes bem-sucedidas | 0 | > 95% taxa de sucesso | Analytics local |
| Cuidadores com relatorio semanal | 0 | > 50% cuidadores | Supabase query |
| Alertas criticos enviados | 0 | Tracking | Cron logs |
| OCR acuracia | 0 | > 80% nome, > 70% dosagem | Analytics local |
| Conversao freemium | 0 | > 5% | Stripe dashboard |
| Custo operacional | R$ 0 | < R$ 20/mes | Groq + Supabase dashboards |
| Cobertura de testes | > 87% | > 90% | Vitest coverage |

---

## 8. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Groq free tier descontinuado | Media | Alto | Alternativas: Cloudflare Workers AI (free), Ollama self-hosted, OpenRouter |
| Chatbot da resposta medica incorreta | Media | Critico | Disclaimer obrigatorio, system prompt restritivo, feedback loop, revisao periodica |
| Tesseract.js lento em dispositivos antigos | Alta | Medio | Timeout de 15s, fallback manual, opcao de API externa |
| Custo operacional excede R$ 20/mes | Baixa | Medio | Rate limiting agressivo, cache de respostas comuns, monitoramento diario |
| Baixa conversao freemium | Alta | Medio | Modelo de doacao como alternativa, features free generosas |
| Regulatorio: chatbot interpretado como aconselhamento medico | Baixa | Critico | Disclaimer em todas as respostas, termos de uso claros, nunca recomendar tratamento |
| Web Crypto API nao disponivel em navegadores antigos | Baixa | Medio | Feature detection, fallback para backup nao-criptografado com aviso |
| Supabase Storage atingir 1GB | Media | Medio | Limite 1 backup/usuario, compressao, cleanup de backups antigos |

---

## 9. Consideracoes Regulatorias

### LGPD

| Aspecto | Tratamento |
|---------|-----------|
| Chatbot | Historico local only, nenhum dado persistido no Groq |
| Backup | Criptografado com chave do usuario, servidor nao tem acesso |
| OCR | Processamento client-side (Tesseract.js), imagem nunca enviada |
| Cuidador | Consentimento explicito do paciente, revogacao a qualquer momento |

### Regulatorio Saude

| Aspecto | Tratamento |
|---------|-----------|
| Chatbot | NAO e dispositivo medico, NAO faz diagnostico, disclaimer obrigatorio |
| Interacoes | Informativo apenas, fonte citada, recomendacao de consultar medico |
| OCR | Ferramenta de conveniencia, usuario confirma todos os dados |

---

## 10. Cronograma de Implementacao

| Ordem | Feature | Dependencia | Story Points |
|-------|---------|-------------|-------------|
| 1 | F7.1 Chatbot IA Groq | Groq API, Vercel Serverless | 13 |
| 2 | F7.2 Backup Criptografado | Supabase Storage, Web Crypto | 8 |
| 3 | F7.3 Notificacoes Avancadas Cuidador | F6.1 (Cuidador), Vercel Cron | 5 |
| 4 | F7.4 Importacao OCR | Tesseract.js, Camera API | 21 |

---

## 11. Definicao de Pronto (DoD)

- [ ] Codigo implementado e revisado
- [ ] Testes unitarios passando com cobertura > 88%
- [ ] Testes de seguranca passando (criptografia, RLS, API keys)
- [ ] Chatbot com disclaimer em 100% das respostas
- [ ] Backup criptografado funcional (criar + restaurar)
- [ ] OCR com > 80% acuracia em testes com 50 imagens
- [ ] Relatorio semanal cuidador funcional
- [ ] Custo operacional monitorado e < R$ 20/mes
- [ ] Sem regressao em funcionalidades existentes
- [ ] Modelo de monetizacao definido e implementado (se aplicavel)
- [ ] Termos de uso atualizados com disclaimers do chatbot

---

*Documento elaborado em 08/02/2026*  
*Referencia: Roadmap 2026 v3.0 - Fase 7*  
*NOTA: Esta fase e CONDICIONAL. Ativacao depende dos gatilhos de validacao.*  
*Proxima revisao: quando gatilhos de ativacao forem atingidos*
