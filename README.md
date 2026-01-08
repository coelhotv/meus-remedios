# 💊 Meus Remédios

**Aplicativo de gerenciamento de medicamentos em português brasileiro**

Gerencie seus medicamentos, protocolos de tratamento e estoque de forma simples e eficiente. Agora com suporte a **Planos de Tratamento complexos** e **Titulação de Dose**.

![Version](https://img.shields.io/badge/version-1.1.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

![Cron job status](https://api.cron-job.org/jobs/7138089/fd84db3734b009c6/status-1.svg)

---

## 🎯 Funcionalidades (V1.1.0)

- ✅ **Calendário Interativo**: Visualização mensal de doses tomadas com navegação e seleção de data.
- ✅ **Histórico Completo**: Visualização detalhada integrada ao calendário com suporte a edições rápidas.
- ✅ **Edição e Exclusão**: Flexibilidade total para ajustar registros passados com restauração automática de estoque.
- ✅ **Registros Retroativos**: Registro de doses em qualquer data/hora com ajuste de fuso horário local.
- ✅ **UX Unificada**: Experiência consistente entre Dashboard, Calendário e Modais.
- ✅ **Ações Inteligentes**: Botões dinâmicos e registro em lote para planos de tratamento.
- ✅ **Precisão Financeira**: Suporte a 3 casas decimais para controle rigoroso de custos.
- ✅ **Dashboard Premium**: Interface Neo-Glass com indicadores live e saudações dinâmicas.
- ✅ **Notificações via Telegram**: Lembretes em tempo real com botões interativos para registro de dose.
- ✅ **Agendamento Inteligente**: Sistema de checagem a cada minuto via Vercel Cron.
- ✅ **Garantia de Qualidade**: Suíte de testes unitários com Vitest.

## 🚀 Roadmap Futuro

- 🤖 **IA Médico-Assistente**: Insights sobre os protocolos com base em diretrizes médicas.
- 📊 **Relatórios de Titulação**: Gráficos de evolução da dosagem ao longo do tempo.
- 🔒 **Backup Criptografado**: Exportação e importação de dados de forma segura.

---

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + REST API)
- **Styling**: CSS Vanilla com design system customizado
- **Deployment**: Vercel (Frontend, API Webhooks & Cron Jobs) + Supabase (Database)
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
npm run bot          # Inicia o bot do Telegram localmente (para desenvolvimento)
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

**Versão**: 1.1.0 (Official Release)  
**Última atualização**: Janeiro 2026
