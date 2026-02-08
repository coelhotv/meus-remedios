# PRD Fase 6: Expansao Social e Resiliencia

**Versao:** 1.0  
**Status:** DRAFT  
**Data:** 08/02/2026  
**Fase do Roadmap:** 6 de 7  
**Baseline:** Fase 5 concluida (Relatorios + Calendario + Interacoes)  
**Principio:** Custo operacional R$ 0  

---

## 1. Visao Geral e Objetivos Estrategicos

A Fase 6 expande o Meus Remedios para casos de uso sociais (cuidadores, familia) e garante resiliencia com modo offline completo. Prepara a base de usuarios e funcionalidades para a eventual monetizacao na Fase 7.

### Objetivos Estrategicos

| ID | Objetivo | Metrica Primaria |
|----|----------|-----------------|
| OE6.1 | Permitir acompanhamento por cuidadores | Convites enviados > 15% usuarios |
| OE6.2 | Garantir funcionamento offline com sync | Sessoes offline rastreadas |
| OE6.3 | Suportar multiplos perfis na mesma conta | Multi-perfil adotado > 10% usuarios |
| OE6.4 | Aumentar retencao de longo prazo | Retencao D30 > 40% |

### Pre-requisitos

- Fase 5 concluida (relatorios para compartilhar com cuidador)
- Fase 4 concluida (PWA + Service Worker para offline)
- Supabase Free Tier com espaco disponivel (monitorar 500MB)
- RLS configurado e funcional

---

## 2. Escopo de Features

| ID | Feature | Prioridade | Story Points | Novas Dependencias |
|----|---------|------------|-------------|-------------------|
| F6.1 | Modo Cuidador | P0 | 21 | Nenhuma |
| F6.2 | Modo Offline-First com Sync | P0 | 21 | idb (~5KB) |
| F6.3 | Multi-perfil Familia | P1 | 13 | Nenhuma |
| F6.4 | Polish: Sistema de Cores Dinamico | P2 | 3 | Nenhuma |
| F6.5 | Polish: Modo Foco | P2 | 3 | Nenhuma |
| F6.6 | Polish: Health Rituals | P2 | 3 | Nenhuma |

**Esforco Total:** 64 story points  
**Novas dependencias npm:** idb (~5KB)  

### Fora de Escopo

- Notificacoes avancadas para cuidador (Fase 7)
- Chatbot IA (Fase 7)
- Monetizacao (Fase 7)
- Integracao com sistemas externos de saude

---

## 3. Descricao Detalhada de Features

### F6.1 Modo Cuidador

**Titulo:** Sistema de convite e acompanhamento read-only para cuidadores  
**Rastreabilidade:** Roadmap 2026 - Fase 6, P09  

**Descricao:**  
Permitir que o usuario convide um cuidador (familiar, profissional de saude) para acompanhar seu tratamento em modo read-only. O cuidador recebe um codigo de convite de 6 caracteres, vincula-se ao perfil do paciente e pode visualizar medicamentos, adesao e estoque. O cuidador tambem recebe notificacao no Telegram quando o paciente esquece uma dose.

**Requisitos Tecnicos:**

**Modelo de Dados (Supabase):**

```sql
CREATE TABLE caregiver_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code CHAR(6) NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days'
);

CREATE TABLE caregiver_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions TEXT[] DEFAULT ARRAY['read_medications', 'read_adherence', 'read_stock'],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(patient_id, caregiver_id)
);

ALTER TABLE caregiver_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own invites"
  ON caregiver_invites FOR ALL
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers read linked patients"
  ON caregiver_links FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Patients manage own links"
  ON caregiver_links FOR ALL
  USING (auth.uid() = patient_id);
```

**Componentes Frontend:**
- `src/components/caregiver/InviteGenerator.jsx` (gera codigo de 6 chars)
- `src/components/caregiver/InviteRedeemer.jsx` (cuidador insere codigo)
- `src/components/caregiver/CaregiverDashboard.jsx` (visao read-only)
- `src/components/caregiver/PatientSelector.jsx` (se cuidador de multiplos)
- `src/components/settings/CaregiverSettings.jsx` (gerenciar/revogar)

**Rotas:**
- `#/cuidador/convidar` - Gerar convite
- `#/cuidador/aceitar` - Inserir codigo
- `#/cuidador/dashboard/:patientId` - Dashboard read-only
- `#/perfil/cuidadores` - Gerenciar cuidadores vinculados

**Notificacoes Telegram para Cuidador:**
- Dose esquecida (t+30min sem registro): "O paciente {nome} esqueceu {medicamento} as {horario}"
- Estoque critico (< 3 dias): "Estoque de {medicamento} do paciente {nome} esta critico"

**Criterios de Aceitacao:**
- [ ] Codigo de convite de 6 caracteres alfanumericos gerado
- [ ] Convite expira em 7 dias se nao aceito
- [ ] Cuidador ve dashboard read-only (sem poder registrar doses)
- [ ] Cuidador ve: medicamentos, score de adesao, estoque, calendario
- [ ] Cuidador NAO ve: configuracoes, dados pessoais alem do nome
- [ ] Paciente pode revogar acesso do cuidador a qualquer momento
- [ ] Cuidador recebe notificacao Telegram de dose esquecida (t+30min)
- [ ] RLS garante isolamento de dados entre pacientes
- [ ] Maximo 5 cuidadores por paciente

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-6.1.1 | Paciente | Vai em Perfil -> "Convidar cuidador" -> codigo "A3F7K2" gerado -> envia para familiar |
| UC-6.1.2 | Cuidador | Recebe codigo -> abre app -> "Aceitar convite" -> insere "A3F7K2" -> vinculado ao paciente |
| UC-6.1.3 | Cuidador | Abre app -> seleciona paciente -> ve dashboard read-only com score e medicamentos |
| UC-6.1.4 | Cuidador | Recebe notificacao Telegram: "Maria esqueceu Losartana as 08:00" |
| UC-6.1.5 | Paciente | Vai em Perfil -> "Cuidadores" -> revoga acesso de cuidador -> cuidador perde acesso imediatamente |

**Dependencias:** Supabase (novas tabelas), Bot Telegram, Hash Router  
**Impacto Financeiro:** R$ 0 (Supabase free tier, Telegram gratuito)  

---

### F6.2 Modo Offline-First com Sync

**Titulo:** Funcionamento completo offline com sincronizacao automatica ao reconectar  
**Rastreabilidade:** Roadmap 2026 - Fase 6, N03  

**Descricao:**  
Permitir que o app funcione completamente offline, armazenando dados em IndexedDB e sincronizando automaticamente quando a conexao for restabelecida. Essencial para usuarios com conexao instavel ou que usam o app em locais sem internet (ex: hospital, aviao).

**Requisitos Tecnicos:**
- Instalar `idb` (wrapper leve para IndexedDB, ~5KB)
- Service `src/services/offlineService.js` (CRUD local + fila de sync)
- Service `src/services/syncService.js` (reconciliacao com Supabase)
- Hook `src/hooks/useOnlineStatus.js` (detecta online/offline)
- Componente `src/components/ui/OfflineIndicator.jsx` (banner de status)

**Arquitetura Offline:**

```
[App] -> [offlineService (IndexedDB)] -> [syncService] -> [Supabase]
                                              |
                                    [Fila de operacoes pendentes]
```

**Stores IndexedDB:**

| Store | Dados | Sync Direction |
|-------|-------|---------------|
| medications | Medicamentos do usuario | Bidirecional |
| protocols | Protocolos ativos | Bidirecional |
| dose_logs | Registros de dose | Push (local -> server) |
| stock | Movimentacoes de estoque | Push (local -> server) |
| sync_queue | Operacoes pendentes | Local only |
| cache_meta | Timestamps de ultima sync | Local only |

**Estrategia de Sync:**
- **Pull:** Ao conectar, busca dados atualizados do Supabase (delta por `updated_at`)
- **Push:** Envia operacoes da fila de sync em ordem cronologica
- **Conflito:** Last-write-wins baseado em `updated_at` (simplicidade sobre complexidade)
- **Retry:** Operacoes falhadas permanecem na fila com backoff exponencial (max 3 tentativas)

**Criterios de Aceitacao:**
- [ ] App carrega e exibe dados offline (IndexedDB)
- [ ] Registro de dose funciona offline (salvo localmente + fila de sync)
- [ ] Indicador visual de modo offline visivel
- [ ] Sync automatico ao reconectar (sem acao do usuario)
- [ ] Conflitos resolvidos com last-write-wins
- [ ] Fila de sync visivel nas configuracoes (X operacoes pendentes)
- [ ] Dados sincronizados corretamente apos reconexao
- [ ] Performance: leitura IndexedDB < 50ms
- [ ] Tamanho maximo IndexedDB: 50MB (cleanup automatico de logs > 90 dias)

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-6.2.1 | Usuario | Perde conexao -> banner "Modo offline" aparece -> continua usando app normalmente |
| UC-6.2.2 | Usuario | Registra dose offline -> dose salva localmente -> reconecta -> sync automatico -> dose aparece no Supabase |
| UC-6.2.3 | Usuario | Abre app sem internet -> ve medicamentos e historico do cache local |
| UC-6.2.4 | Usuario | Reconecta apos 2 dias offline -> 15 operacoes sincronizadas -> confirmacao visual |
| UC-6.2.5 | Usuario | Conflito: editou medicamento offline e online -> versao mais recente prevalece |

**Dependencias:** PWA + Service Worker (F4.2), idb  
**Impacto Financeiro:** R$ 0  

---

### F6.3 Multi-perfil Familia

**Titulo:** Gerenciar medicamentos de multiplas pessoas na mesma conta  
**Rastreabilidade:** Roadmap 2026 - Fase 6, N10  

**Descricao:**  
Permitir que um usuario gerencie medicamentos de multiplas pessoas (ex: filhos, pais idosos) na mesma conta, alternando entre perfis. Cada perfil tem seus proprios medicamentos, protocolos, historico e score de adesao.

**Requisitos Tecnicos:**

**Modelo de Dados:**

```sql
CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  avatar_color TEXT DEFAULT '#6366f1',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profiles"
  ON profiles FOR ALL
  USING (auth.uid() = user_id);
```

- Adicionar coluna `profile_id` nas tabelas existentes (medications, protocols, dose_logs, stock)
- Migrar dados existentes para perfil primario
- Componente `src/components/profiles/ProfileSwitcher.jsx`
- Componente `src/components/profiles/ProfileManager.jsx`
- Hook `src/hooks/useActiveProfile.js`
- Contexto global com perfil ativo (filtra todas as queries)

**Criterios de Aceitacao:**
- [ ] Usuario pode criar ate 5 perfis
- [ ] Alternancia entre perfis em < 500ms
- [ ] Cada perfil tem dados isolados (medicamentos, doses, estoque)
- [ ] Perfil primario criado automaticamente na migracao
- [ ] Dashboard, calendario e relatorios filtram por perfil ativo
- [ ] Notificacoes do bot incluem nome do perfil
- [ ] Perfil pode ser editado (nome, cor) e excluido (com confirmacao)
- [ ] Dados do perfil excluido sao removidos permanentemente

**Casos de Uso:**

| UC | Ator | Fluxo |
|----|------|-------|
| UC-6.3.1 | Usuario | Cria perfil "Mae" -> cadastra medicamentos da mae -> alterna entre "Eu" e "Mae" |
| UC-6.3.2 | Usuario | Abre dashboard -> ve dados do perfil ativo -> toca no seletor -> alterna para "Filho" |
| UC-6.3.3 | Usuario | Recebe notificacao bot: "[Mae] Hora do Losartana 50mg" |
| UC-6.3.4 | Usuario | Gera relatorio PDF -> relatorio inclui nome do perfil no cabecalho |

**Dependencias:** F6.1 (modelo de dados compativel), Supabase (migracao)  
**Impacto Financeiro:** R$ 0  

---

### F6.4 Polish: Sistema de Cores Dinamico

**Titulo:** Cores de accent personalizaveis por perfil  
**Rastreabilidade:** Roadmap 2026 - Fase 6, P05  

**Descricao:**  
Permitir que cada perfil tenha uma cor de accent personalizada, facilitando a distincao visual entre perfis. Simplificacao do sistema de cores dinamico original (que previa cores por periodo do dia).

**Requisitos Tecnicos:**
- Paleta de 8 cores pre-definidas para escolha
- Cor aplicada via CSS custom property `--accent-primary`
- Persistida no campo `avatar_color` do perfil

**Criterios de Aceitacao:**
- [ ] 8 opcoes de cor disponiveis
- [ ] Cor aplicada imediatamente ao selecionar
- [ ] Contraste WCAG AA mantido com todas as opcoes
- [ ] Cor persiste entre sessoes

**Dependencias:** F6.3 (Multi-perfil), F3.5 (Tema)  
**Impacto Financeiro:** R$ 0  

---

### F6.5 Polish: Modo Foco

**Titulo:** Modo simplificado que exibe apenas as proximas doses  
**Rastreabilidade:** Roadmap 2026 - Fase 6, P15  

**Descricao:**  
Modo de visualizacao simplificado que oculta widgets, alertas e informacoes secundarias, exibindo apenas as proximas doses pendentes em tela cheia. Util para usuarios idosos ou com dificuldade visual.

**Requisitos Tecnicos:**
- Componente `src/components/dashboard/FocusMode.jsx`
- Toggle acessivel no dashboard (icone de olho)
- Fonte aumentada (1.5x), alto contraste, apenas proximas 3 doses
- Persistencia da preferencia em localStorage

**Criterios de Aceitacao:**
- [ ] Exibe apenas proximas doses pendentes
- [ ] Fonte aumentada e alto contraste
- [ ] Toggle facil de acessar e entender
- [ ] Swipe-to-take funciona no modo foco
- [ ] Preferencia persistida

**Dependencias:** SwipeRegisterItem (HCC)  
**Impacto Financeiro:** R$ 0  

---

### F6.6 Polish: Health Rituals

**Titulo:** Agrupamento de doses em rituais nomeados (ex: "Rotina da Manha")  
**Rastreabilidade:** Roadmap 2026 - Fase 6, P16  

**Descricao:**  
Permitir que o usuario agrupe doses do mesmo horario em "rituais" nomeados, facilitando a organizacao mental. Ex: "Rotina da Manha" agrupa Losartana 8h + Vitamina D 8h. Puramente visual/organizacional, sem impacto no modelo de dados de protocolos.

**Requisitos Tecnicos:**
- Persistencia em localStorage (agrupamento visual apenas)
- Componente `src/components/dashboard/RitualGroup.jsx`
- Drag-and-drop para organizar doses dentro de rituais (Framer Motion reorder)

**Criterios de Aceitacao:**
- [ ] Usuario pode criar ritual com nome customizado
- [ ] Doses do mesmo horario sugeridas automaticamente
- [ ] Registro em lote do ritual (todas as doses de uma vez)
- [ ] Persistido em localStorage

**Dependencias:** TreatmentAccordion (HCC), Framer Motion  
**Impacto Financeiro:** R$ 0  

---

## 4. Requisitos Nao-Funcionais

| Requisito | Especificacao | Metrica |
|-----------|--------------|---------|
| Performance | Alternancia de perfil | < 500ms |
| Performance | Leitura IndexedDB | < 50ms |
| Performance | Sync apos reconexao | < 10s para 50 operacoes |
| Seguranca | RLS em tabelas de cuidador | Isolamento total entre pacientes |
| Seguranca | Codigo de convite | 6 chars alfanumericos, expira em 7 dias |
| Privacidade | Cuidador read-only | Sem acesso a configuracoes ou dados pessoais |
| Resiliencia | Modo offline | App funcional sem internet |
| Resiliencia | Conflitos de sync | Last-write-wins sem perda de dados |
| Armazenamento | IndexedDB | Max 50MB, cleanup automatico > 90 dias |
| Armazenamento | Supabase | Monitorar uso do free tier (500MB) |

---

## 5. Plano de Testes

### 5.1 Testes Unitarios (Vitest)

| Componente | Cenarios |
|------------|----------|
| InviteGenerator | Gera codigo valido, expiracao, unicidade |
| InviteRedeemer | Aceita codigo valido, rejeita expirado, rejeita invalido |
| CaregiverDashboard | Exibe dados read-only, nao permite edicao |
| offlineService | CRUD IndexedDB, fila de sync, cleanup |
| syncService | Push operacoes, pull delta, resolucao de conflitos |
| useOnlineStatus | Detecta online/offline, transicoes |
| ProfileSwitcher | Alterna perfil, filtra dados, cria/exclui perfil |
| useActiveProfile | Retorna perfil ativo, filtra queries |

### 5.2 Testes de Integracao

| Cenario | Validacao |
|---------|-----------|
| Convite cuidador end-to-end | Gera codigo -> cuidador aceita -> ve dashboard read-only |
| Revogacao de cuidador | Paciente revoga -> cuidador perde acesso imediatamente |
| Offline + sync | Registra doses offline -> reconecta -> dados sincronizados |
| Conflito de sync | Edita offline e online -> versao mais recente prevalece |
| Multi-perfil + dashboard | Alterna perfil -> dashboard mostra dados do perfil correto |
| Multi-perfil + relatorio | Gera PDF -> cabecalho mostra nome do perfil |

### 5.3 Testes Manuais Obrigatorios

| Cenario | Dispositivo |
|---------|-------------|
| Modo offline completo | Android Chrome (modo aviao) |
| Sync apos reconexao | Android Chrome (toggle wifi) |
| Convite cuidador via Telegram | Android + iOS |
| Alternancia de perfil | Mobile + Desktop |

### 5.4 Cobertura Alvo

| Metrica | Meta |
|---------|------|
| Cobertura de linhas | > 85% (novos componentes) |
| Cobertura de branches | > 80% |
| Testes E2E offline | >= 5 cenarios |

---

## 6. Indicadores de Sucesso

| KPI | Baseline | Meta | Ferramenta |
|-----|----------|------|------------|
| Convites de cuidador enviados | 0 | > 15% usuarios | Supabase query |
| Cuidadores ativos | 0 | > 10% usuarios com cuidador | Supabase query |
| Sessoes offline | 0 | Tracking de ocorrencias | Service Worker events |
| Operacoes sincronizadas | 0 | Tracking | syncService logs |
| Multi-perfil adotado | 0 | > 10% usuarios | Supabase query |
| Retencao D30 | N/A | > 40% | Analytics local |
| Cobertura de testes | > 85% | > 87% | Vitest coverage |

---

## 7. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Supabase Free Tier atingir 500MB com novas tabelas | Media | Alto | Monitorar uso, cleanup de logs antigos, considerar self-hosted |
| Complexidade do sync offline gerar bugs | Alta | Alto | Estrategia simples (last-write-wins), testes E2E extensivos, rollback manual |
| IndexedDB nao disponivel em navegadores antigos | Baixa | Medio | Feature detection, fallback para modo online-only |
| Cuidador abusa do acesso (compartilha dados) | Baixa | Medio | Permissoes granulares, log de acesso, revogacao facil |
| Migracao de dados para multi-perfil causa perda | Media | Alto | Backup antes da migracao, migracao reversivel, perfil primario automatico |
| Conflitos de sync frequentes com multiplos dispositivos | Media | Medio | UI clara mostrando "ultima atualizacao", opcao de resolver manualmente |

---

## 8. Migracoes de Banco de Dados

### Novas Tabelas

```sql
-- caregiver_invites (descrito na secao F6.1)
-- caregiver_links (descrito na secao F6.1)
-- profiles (descrito na secao F6.3)
```

### Alteracoes em Tabelas Existentes

```sql
ALTER TABLE medications ADD COLUMN profile_id UUID REFERENCES profiles(id);
ALTER TABLE protocols ADD COLUMN profile_id UUID REFERENCES profiles(id);
ALTER TABLE dose_logs ADD COLUMN profile_id UUID REFERENCES profiles(id);
ALTER TABLE stock ADD COLUMN profile_id UUID REFERENCES profiles(id);

-- Migracao: criar perfil primario e vincular dados existentes
-- (script de migracao detalhado a ser criado na implementacao)
```

---

## 9. Cronograma de Implementacao

| Ordem | Feature | Dependencia | Story Points |
|-------|---------|-------------|-------------|
| 1 | F6.2 Modo Offline-First | PWA (F4.2), idb | 21 |
| 2 | F6.1 Modo Cuidador | Supabase (novas tabelas), Bot | 21 |
| 3 | F6.3 Multi-perfil Familia | F6.1 (modelo compativel), migracao | 13 |
| 4 | F6.4 Cores Dinamicas | F6.3, F3.5 | 3 |
| 5 | F6.5 Modo Foco | SwipeRegisterItem | 3 |
| 6 | F6.6 Health Rituals | TreatmentAccordion | 3 |

---

## 10. Definicao de Pronto (DoD)

- [ ] Codigo implementado e revisado
- [ ] Testes unitarios passando com cobertura > 85%
- [ ] Testes E2E offline passando (>= 5 cenarios)
- [ ] Migracoes SQL aplicadas e RLS validado
- [ ] Modo offline funcional em Android Chrome
- [ ] Sync automatico testado com multiplos cenarios de conflito
- [ ] Convite de cuidador funcional end-to-end
- [ ] Multi-perfil com migracao de dados existentes
- [ ] Sem regressao em funcionalidades existentes
- [ ] Supabase usage monitorado (< 400MB apos migracao)

---

*Documento elaborado em 08/02/2026*  
*Referencia: Roadmap 2026 v3.0 - Fase 6*  
*Proxima revisao: apos conclusao da Fase 6*
