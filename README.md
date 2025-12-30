# 💊 Meus Remédios

**Aplicativo de gerenciamento de medicamentos em português brasileiro**

Gerencie seus medicamentos, protocolos de tratamento e estoque de forma simples e eficiente. Agora com suporte a **Planos de Tratamento complexos** e **Titulação de Dose**.

![Version](https://img.shields.io/badge/version-0.6.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Funcionalidades (V0.6.0)

- ✅ **UX Unificada de Doses**: Experiência visual consistente entre Dashboard e Modal para registro de medicamentos.
- ✅ **Ações Inteligentes**: Botões dinâmicos que indicam a quantidade exata de itens selecionados para registro.
- ✅ **Precisão Financeira**: Suporte a 3 casas decimais para controle preciso de custos unitários.
- ✅ **Fluxo Otimizado**: Criação de protocolos sugerida automaticamente após o cadastro de medicamentos.
- ✅ **Dashboard Inteligente**: Interface premium Neo-Glass com indicadores live e saudações dinâmicas.
- ✅ **Garantia de Qualidade**: Suíte de testes unitários com Vitest (Services e UI).
- ✅ **Custo de Oportunidade**: Regra de estoque baixo baseada em dias de cobertura.
- ✅ **Suporte à Titulação**: Defina doses alvo e acompanhe o status de ajuste medicamentoso.
- ✅ **Planos de Tratamento**: Agrupe medicamentos em protocolos complexos.
- ✅ **Interface Premium**: Design neon com glass-morphism e tema escuro nativo.

## 🚀 Roadmap Futuro

- 🔔 **Notificações**: Alertas para lembrar de tomar os medicamentos.
- 🤖 **IA Médico-Assistente**: Insights sobre os protocolos com base em diretrizes médicas.
- 📊 **Relatórios de Titulação**: Gráficos de evolução da dosagem ao longo do tempo.
- 🔒 **Backup Criptografado**: Exportação e importação de dados de forma segura.

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + REST API)
- **Styling**: CSS Vanilla com design system customizado
- **Deployment**: Vercel (frontend) + Supabase (backend)
- **Custo**: R$ 0 (tier gratuito)

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Conta no Vercel (gratuita, opcional para deploy)
- Conta no GitHub (gratuita, para versionamento)

### Passo a Passo

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/SEU-USUARIO/meu-remedio.git
    cd meu-remedio
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure o Supabase**:
    - Siga o guia completo em [SETUP.md](./SETUP.md)
    - Crie um projeto no Supabase
    - Execute o SQL para criar as tabelas
    - Copie as credenciais

4.  **Configure as variáveis de ambiente**:
    ```bash
    cp .env.example .env
    ```
    
    Edite o arquivo `.env` e adicione suas credenciais do Supabase:
    ```
    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    VITE_SUPABASE_ANON_KEY=sua-chave-aqui
    ```

5.  **Rode o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```

6.  **Acesse o app**:
    Abra [http://localhost:5173](http://localhost:5173) no navegador

---

## 📚 Documentação

- **[SETUP.md](./SETUP.md)**: Guia completo de configuração do Supabase, GitHub e Vercel
- **[docs/database-schema.md](./docs/database-schema.md)**: Esquema do banco de dados (em breve)
- **[docs/user-guide.md](./docs/user-guide.md)**: Guia do usuário em português (em breve)

---

## 🏗️ Estrutura do Projeto

```
meu-remedio/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes reutilizáveis (Button, Card, Loading)
│   │   ├── medicine/        # Componentes de medicamentos
│   │   ├── protocol/        # Componentes de protocolos
│   │   ├── stock/           # Componentes de estoque
│   │   └── log/             # Componentes de registro
│   ├── lib/
│   │   └── supabase.js      # Cliente Supabase
│   ├── services/
│   │   └── api.js           # Serviços de API (CRUD)
│   ├── styles/
│   │   ├── tokens.css       # Design tokens (cores, espaçamentos)
│   │   └── index.css        # Estilos globais
│   ├── views/               # Páginas principais
│   ├── App.jsx              # Componente principal
│   └── main.jsx             # Entry point
├── docs/                    # Documentação
├── .env.example             # Template de variáveis de ambiente
├── SETUP.md                 # Guia de configuração
└── README.md                # Este arquivo
```

---

## 🎨 Design System

O app usa um design system customizado com:

- **Cores Neon**: Cyan (#00f0ff), Magenta (#ff00ff), Purple (#b000ff)
- **Tema Escuro**: Suporte automático baseado nas preferências do sistema
- **Glass-morphism**: Efeitos de vidro com blur e transparência
- **Animações**: Transições suaves e micro-interações
- **Responsivo**: Mobile-first design

---

## 🧪 Garantia de Qualidade

O projeto utiliza uma suíte de testes unitários moderna para garantir a confiabilidade das regras de negócio:

- **Framework**: [Vitest](https://vitest.dev/) (Velocidade e compatibilidade com Vite)
- **Library**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Cobertura**: Services (API/Lógica de Negócio) e Componentes Críticos.

## 🧪 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter ESLint
npm test             # Executa a suíte de testes unitários (Vitest)
```

---

## 🚀 Deploy

### Deploy no Vercel

1. Conecte seu repositório GitHub ao Vercel
2. Configure as variáveis de ambiente no dashboard do Vercel
3. Deploy automático a cada push na branch `main`

Veja instruções detalhadas em [SETUP.md](./SETUP.md#passo-4-deploy-no-vercel)

---

## 🤝 Contribuindo

Este é um projeto piloto em desenvolvimento. Sugestões e feedback são bem-vindos!

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 👨‍💻 Desenvolvedor

Desenvolvido com ❤️ usando Google Antigravity

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação em [SETUP.md](./SETUP.md)
2. Abra uma issue no GitHub
3. Entre em contato com o desenvolvedor

---

**Versão**: 0.6.0 (Piloto)  
**Última atualização**: Dezembro 2025
