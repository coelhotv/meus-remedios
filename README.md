# 💊 Meu Remédio

**Aplicativo de gerenciamento de medicamentos em português brasileiro**

Gerencie seus medicamentos, protocolos de tratamento e estoque de forma simples e eficiente.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Funcionalidades (MVP)

- ✅ **Cadastro de Medicamentos**: Registre remédios com nome, laboratório, princípio ativo, dosagem e preço
- ✅ **Protocolos de Tratamento**: Crie protocolos com frequência e horários programados
- ✅ **Controle de Estoque**: Gerencie a quantidade de comprimidos disponíveis
- ✅ **Registro de Medicamentos Tomados**: Registre cada dose e veja o estoque diminuir automaticamente
- ✅ **Interface Moderna**: Design neon com glass-morphism e tema escuro

## 🚀 Roadmap Futuro

- 🔔 **Notificações**: Alertas para lembrar de tomar os medicamentos
- 🤖 **Comparação de Preços com IA**: Busca automática de preços em farmácias online brasileiras
- 🧠 **Sugestões de Protocolos com IA**: Recomendações baseadas em patologias identificadas
- 🔒 **Conformidade LGPD**: Criptografia e proteção de dados de saúde

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

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/SEU-USUARIO/meu-remedio.git
   cd meu-remedio
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure o Supabase**:
   - Siga o guia completo em [SETUP.md](./SETUP.md)
   - Crie um projeto no Supabase
   - Execute o SQL para criar as tabelas
   - Copie as credenciais

4. **Configure as variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e adicione suas credenciais do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-aqui
   ```

5. **Rode o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

6. **Acesse o app**:
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

## 🧪 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter ESLint
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

**Versão**: 0.1.0 (Piloto)  
**Última atualização**: Dezembro 2025
