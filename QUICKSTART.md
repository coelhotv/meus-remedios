# 🎉 Meus Remédios - Início Rápido

## ✅ O que já está pronto

### 1. Projeto Inicializado
- ✅ Vite + React configurado
- ✅ Supabase client instalado e configurado
- ✅ Git inicializado com commit inicial
- ✅ Servidor de desenvolvimento rodando em http://localhost:5173

### 2. Design System Premium
- ✅ Tema neon com cores vibrantes (cyan, magenta, purple)
- ✅ Glass-morphism effects e animações suaves
- ✅ Responsivo mobile-first

### 3. Features Ativas (V1.0.0)
- ✅ **Testes Unitários**: Suíte Vitest garantindo integridade dos cálculos.
- ✅ **Planos de Tratamento**: Agrupamento de medicamentos complexos.
- ✅ **Titulação de Dose**: Controle de Dose Alvo e Status.
- ✅ **Ações em Lote**: Botão "Tomar Todas" para planos.
- ✅ **Estoque Inteligente**: Cálculo de custo médio ponderado.

---

## 🚦 Próximos Passos

### Passo 1: Configurar Supabase (OBRIGATÓRIO)

**Você precisa fazer isso antes de continuar o desenvolvimento!**

1. Acesse https://supabase.com e crie uma conta (use sua conta do GitHub)
2. Crie um novo projeto chamado "meu-remedio"
3. No Supabase, vá em **SQL Editor** → **New query**
4. Cole o SQL consolidado abaixo e clique em **Run**:

```sql
-- 1. Medicamentos
CREATE TABLE medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  laboratory TEXT,
  active_ingredient TEXT,
  dosage_per_pill NUMERIC,
  dosage_unit TEXT DEFAULT 'mg',
  type TEXT DEFAULT 'medicine',
  price_paid NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- 2. Planos de Tratamento
CREATE TABLE treatment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  objective TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- 3. Protocolos (com Titulação)
CREATE TABLE protocols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  frequency TEXT,
  time_schedule JSONB,
  dosage_per_intake NUMERIC,
  target_dosage NUMERIC,
  titration_status TEXT DEFAULT 'estável',
  titration_schedule JSONB,
  current_stage_index INTEGER DEFAULT 0,
  stage_started_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- 4. Estoque
CREATE TABLE stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  purchase_date DATE,
  expiration_date DATE,
  unit_price NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- 5. Logs
CREATE TABLE medicine_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID REFERENCES protocols(id) ON DELETE SET NULL,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantity_taken NUMERIC NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
);

-- Índices
CREATE INDEX idx_protocols_medicine ON protocols(medicine_id);
CREATE INDEX idx_protocols_plan ON protocols(treatment_plan_id);
CREATE INDEX idx_stock_medicine ON stock(medicine_id);
CREATE INDEX idx_logs_protocol ON medicine_logs(protocol_id);
CREATE INDEX idx_logs_medicine ON medicine_logs(medicine_id);
CREATE INDEX idx_logs_taken_at ON medicine_logs(taken_at DESC);
```

#### Obter as credenciais:

1. No Supabase, vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJ...` (chave longa)

#### Configurar o arquivo .env:

1. Abra o arquivo `.env` no projeto
2. Cole suas credenciais:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
3. Salve o arquivo

---

### Passo 2: Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `meu-remedio`
3. Visibilidade: **Private**
4. NÃO marque "Add a README file"
5. Clique em "Create repository"

6. No terminal, execute (substitua SEU-USUARIO):
   ```bash
   cd /Users/coelhotv/.gemini/antigravity/playground/glacial-photosphere/meu-remedio
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/meu-remedio.git
   git push -u origin main
   ```

---

### Passo 3: Testar o App Localmente

1. O servidor já está rodando em http://localhost:5173
2. Você deve ver:
   - Título "Meu Remédio" com gradiente neon
   - 3 cards: Medicamentos, Protocolos, Estoque
   - Seção de teste de componentes com botões coloridos
   - Tema escuro com efeitos neon

3. Teste os botões e veja as animações!

---

### Passo 4: Desenvolvimento das Features

**Agora você pode me pedir para desenvolver as funcionalidades principais:**

1. **Tela de Medicamentos**:
   - Formulário para adicionar/editar remédios
   - Lista de medicamentos cadastrados
   - Detalhes de cada medicamento

2. **Tela de Protocolos**:
   - Formulário multi-step para criar protocolos
   - Seleção de medicamento
   - Configuração de frequência e horários
   - Lista de protocolos ativos

3. **Tela de Estoque**:
   - Adicionar entrada de estoque
   - Visualizar quantidade disponível
   - Histórico de compras

4. **Dashboard Principal**:
   - Protocolos ativos do dia
   - Botão rápido para registrar medicamento tomado
   - Indicador de estoque baixo
   - Histórico recente

5. **Sistema de Logging**:
   - Formulário rápido para registrar dose
   - Histórico de medicamentos tomados
   - Timeline visual

---

## 🎯 Comandos Úteis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Parar servidor (Ctrl+C no terminal)

# Ver status do Git
git status

# Fazer commit de mudanças
git add .
git commit -m "Descrição das mudanças"
git push

# Build de produção
npm run build

# Executar testes unitários
npm test
```

---

## ❓ Perguntas Frequentes

### O app não está carregando
- Verifique se o servidor está rodando (`npm run dev`)
- Verifique se as variáveis de ambiente estão configuradas no `.env`
- Abra o console do navegador (F12) para ver erros

### Erro de conexão com Supabase
- Verifique se as credenciais no `.env` estão corretas
- Verifique se o projeto do Supabase está ativo
- Verifique se as tabelas foram criadas corretamente

### Como atualizar o design?
- Edite `src/styles/tokens.css` para mudar cores e espaçamentos
- Edite `src/styles/index.css` para mudar estilos globais

---

## 🎨 Próxima Feature Sugerida

**Recomendo começar com a tela de Medicamentos**, pois é a base para tudo:

1. Criar formulário de cadastro
2. Criar lista de medicamentos
3. Implementar edição e exclusão
4. Testar integração com Supabase

**Me avise quando estiver pronto para continuar!** 🚀
