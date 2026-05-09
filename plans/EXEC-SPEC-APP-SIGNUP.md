# Plano: Mobile — Fluxos Iniciais + Política de Privacidade

## Context

Sprint para evoluir o app mobile em 3 frentes:
1. **Landing → Login** melhorado: botão de retorno à Landing + link "Esqueci minha senha"
2. **Landing → Cadastro** novo: fluxo completo com confirmação por email
3. **Perfil → Política de Privacidade**: abrir política via in-app browser (`expo-web-browser`)

**Decisão de arquitetura:** auth permanece em `authService.js` mobile (tem Zod + tradução PT-BR que a web não tem). Consolidação no `@dosiq/core` é deferida para sprint separada — registrar como ADR-042.

---

## Nova Dependência

```bash
npx expo install expo-web-browser
```

`expo-web-browser` → `WebBrowser.openBrowserAsync(url)`:
- iOS: Safari View Controller (in-app, sem sair do app)
- Android: Chrome Custom Tabs (in-app, sem sair do app)
- Usuário pode compartilhar/abrir externamente pelo menu nativo do browser embutido

---

## Escopo de Entregas

### Arquivos a criar
| Arquivo | Descrição |
|---------|-----------|
| `apps/mobile/src/screens/SignupScreen.jsx` | Formulário de cadastro + estado pós-signup |
| `apps/mobile/src/screens/ForgotPasswordScreen.jsx` | Formulário de recuperação + estado pós-envio |
| `apps/mobile/src/platform/auth/__tests__/authService.test.js` | Testes Jest para novas funções |
| `docs/supabase-email-config.md` | Guia completo de configuração de email + templates HTML no Supabase |

### Arquivos a modificar
| Arquivo | O que muda |
|---------|-----------|
| `apps/mobile/src/platform/auth/authService.js` | + `signUpWithEmail`, + `sendPasswordReset` |
| `apps/mobile/src/navigation/routes.js` | + `SIGNUP`, `FORGOT_PASSWORD` |
| `apps/mobile/src/navigation/Navigation.jsx` | Registrar 2 novas screens no stack unauthenticated |
| `apps/mobile/src/screens/LandingScreen.jsx` | `handleCreateAccount` → `navigate(ROUTES.SIGNUP)` |
| `apps/mobile/src/screens/LoginScreen.jsx` | + back button para Landing; + link "Esqueci minha senha" |
| `apps/mobile/src/features/profile/screens/ProfileScreen.jsx` | Ativar botão "Privacidade e dados" via `expo-web-browser` |
| `.agent/memory/DECISIONS_INDEX.md` | Registrar ADR-042 (auth no core — deferido) |

---

## Design das Telas

### SignupScreen
- Mesmo padrão visual do LoginScreen (bg mint, logo, `dosiq`, KeyboardAvoidingView)
- Campos: Email | Senha (toggle eye) | Confirmar Senha (toggle eye)
- Validação Zod: email válido, senha ≥ 8 chars, senhas idênticas
- Submit → `signUpWithEmail()` → `supabase.auth.signUp()`
- **Sucesso:** substituir form por estado "Verifique seu email" com instrução + botão "Ir para Login"
- Erros PT-BR: "Email já cadastrado", "Senha muito fraca", "Muitas tentativas"
- Link rodapé: "Já tenho conta" → `navigate(ROUTES.LOGIN)`

### ForgotPasswordScreen
- Padrão visual consistente (bg mint, logo 80x80, título "Recuperar senha")
- Campo: Email
- Submit → `sendPasswordReset()` → `supabase.auth.resetPasswordForEmail(email)`
- **Sucesso:** estado "Email enviado" + instrução + botão "Voltar para Login"
- Link: "Lembrei minha senha" → `goBack()`

### LoginScreen (delta)
- Adicionar header com botão `← Voltar` → `navigation.goBack()` (volta à Landing)
- Adicionar link "Esqueci minha senha" entre campo senha e botão → `navigate(ROUTES.FORGOT_PASSWORD)`

### ProfileScreen (delta)
- Tornar "Privacidade e dados" clicável (remover estilo disabled)
- `onPress` → `WebBrowser.openBrowserAsync('https://dosiq.vercel.app/politica-de-privacidade')`
- Import: `import * as WebBrowser from 'expo-web-browser'`

---

## authService.js — Novas Funções

```javascript
// signUpWithEmail(email, password, confirmPassword)
// Schema Zod: email + password (min 8) + confirmPassword (refine equal)
// → supabase.auth.signUp({ email, password })
// Erros mapeados:
//   'User already registered'          → "Email já cadastrado. Faça login."
//   'Password should be at least'      → "Senha deve ter no mínimo 8 caracteres"
//   'rate limit'                        → "Muitas tentativas. Tente mais tarde"
// → { success: true } | { success: false, error: string }

// sendPasswordReset(email)
// Schema Zod: email válido
// → supabase.auth.resetPasswordForEmail(email)
// Nota: Supabase sempre retorna sucesso (não revela se email existe — by design)
// → { success: true } | { success: false, error: string }
```

---

## Guia Supabase — docs/supabase-email-config.md

O guia deve cobrir:

1. **Onde configurar**: Supabase Dashboard → Authentication → Email Templates
2. **Templates a configurar**:
   - `Confirm signup` — enviado após `auth.signUp()`
   - `Reset password` — enviado após `resetPasswordForEmail()`
   - `Magic Link` (opcional, deixar documentado mesmo que não usado)
3. **Conteúdo de cada template HTML branded** (cores: `#006A5E`, fonte sistema, logo URL):
   - Header com logo dosiq (usar URL pública do ícone do app)
   - CTA button estilizado com `background-color: #006A5E`
   - Footer com nome da empresa e link para política
4. **Configuração SMTP**: usar Supabase default (SendGrid) ou SMTP próprio
5. **Redirect URLs**: configurar `Site URL` + `Additional Redirect URLs` para deep link `dosiq://`
6. **Teste manual**: Dashboard → Authentication → Users → [email] → Send recovery email

---

## Testes Jest (authService.test.js)

Seguir padrão de `profileService.test.js`:
- Mock `@platform/supabase/nativeSupabaseClient` via `jest.mock`
- Testar `signUpWithEmail`: email inválido, senha < 8, senhas diferentes, sucesso, erro supabase ("User already registered")
- Testar `sendPasswordReset`: email inválido, sucesso, erro supabase
- `afterEach(() => jest.clearAllMocks())`

---

## Sequência de Implementação (C3)

**Executar com spawn de sub-agentes Haiku para tarefas isoladas (economia de tokens):**

| Passo | Tarefa | Executor |
|-------|--------|----------|
| 1 | Criar branch `feature/mobile/auth-flows` | agente principal |
| 2 | `authService.js` — novas funções | agente principal (lógica crítica) |
| 3 | `authService.test.js` — testes Jest | sub-agente Haiku |
| 4 | `routes.js` — 2 novas rotas | sub-agente Haiku |
| 5 | `SignupScreen.jsx` — tela completa | agente principal (UX complexa) |
| 6 | `ForgotPasswordScreen.jsx` — tela completa | sub-agente Haiku (padrão simples) |
| 7 | `Navigation.jsx` — registrar screens | sub-agente Haiku |
| 8 | `LandingScreen.jsx` — conectar botão | sub-agente Haiku |
| 9 | `LoginScreen.jsx` — back + forgot link | sub-agente Haiku |
| 10 | `ProfileScreen.jsx` — ativar privacidade | sub-agente Haiku |
| 11 | `docs/supabase-email-config.md` — guia | sub-agente Haiku |
| 12 | `DECISIONS_INDEX.md` — ADR-042 | agente principal |
| 13 | C4: lint + testes + DoD | agente principal |
| 14 | Commit + push + PR | agente principal |

**Regra de spawn — CRÍTICO (AP-133 / R-218):**
- Sub-agentes Haiku recebem o plano completo + arquivo alvo + contexto mínimo necessário
- Sub-agentes **NUNCA commitam, NUNCA pushão, NUNCA criam PR** — apenas retornam conteúdo de arquivo
- Agente principal revisa cada arquivo retornado, aplica via Edit, roda lint, então commita
- Se sub-agente tentar qualquer operação git → rejeitar output e fazer manualmente
- Todos commits vão para branch `feature/mobile/auth-flows` — **NUNCA para main diretamente**

---

## Critérios de Aceite (C4 DoD)

- [ ] `npx expo install expo-web-browser` executado e `package.json` atualizado
- [ ] "Criar conta" na Landing navega para SignupScreen (sem Alert)
- [ ] SignupScreen: Zod bloqueia submit com email inválido, senha < 8, senhas diferentes
- [ ] SignupScreen: após signup, exibe estado "Verifique seu email"
- [ ] SignupScreen: erro "email já cadastrado" exibido em PT-BR
- [ ] SignupScreen: link "Já tenho conta" navega para LoginScreen
- [ ] LoginScreen: botão "← Voltar" navega de volta para Landing
- [ ] LoginScreen: link "Esqueci minha senha" navega para ForgotPasswordScreen
- [ ] ForgotPasswordScreen: após envio, exibe estado "Email enviado"
- [ ] ForgotPasswordScreen: botão retorno volta ao Login
- [ ] ProfileScreen: "Privacidade e dados" abre in-app browser (Safari View / Chrome Custom Tab)
- [ ] Nenhuma rota hardcoded — sempre via `ROUTES.*`
- [ ] `npm test -- --testPathPattern=authService` passa sem erros
- [ ] `npx eslint src/` no workspace mobile sem erros

---

## Verificação

```bash
# Instalar dependência
cd apps/mobile && npx expo install expo-web-browser

# Testes authService
cd apps/mobile && npm test -- --testPathPattern=authService --verbose

# Lint
cd apps/mobile && npx eslint src/screens/SignupScreen.jsx src/screens/ForgotPasswordScreen.jsx src/platform/auth/authService.js src/features/profile/screens/ProfileScreen.jsx

# Verificar rotas
grep -n "SIGNUP\|FORGOT" apps/mobile/src/navigation/routes.js apps/mobile/src/navigation/Navigation.jsx

# Verificar WebBrowser no Profile
grep -n "WebBrowser\|openBrowserAsync" apps/mobile/src/features/profile/screens/ProfileScreen.jsx
```

---

## Processo Git — Controle Estrito (R-060 / R-218 / AP-133)

```
1.  CREATE branch: git checkout -b feature/mobile/auth-flows
2.  Implementar C3 (sub-agentes Haiku apenas para GERAR conteúdo de arquivo — sem git)
3.  LINT antes de cada commit: cd apps/mobile && npx eslint <arquivos alterados>
4.  CORRIGIR lint antes de prosseguir (zero tolerância a lint errors em commit)
5.  COMMIT por etapa lógica: git commit -m "feat(mobile): ..."
6.  Repetir 2-5 para cada entrega
7.  PUSH: git push -u origin feature/mobile/auth-flows
8.  CREATE PR: gh pr create (título + descrição completa)
9.  ⏸  STOP — aguardar Gemini review completar
10. Aplicar sugestões do Gemini se houver
11. ⏸  STOP — AGUARDAR APROVAÇÃO EXPLÍCITA DO USUÁRIO
12. Usuário faz merge (agente NUNCA auto-merge — R-060)
13. DEVFLOW C5 pós-merge
```

**Invariantes que não podem ser quebradas:**
- Branch `feature/mobile/auth-flows` existe antes de qualquer commit
- Zero commits diretos na `main`
- Zero merges sem aprovação humana explícita
- Gemini review obrigatório antes de pedir aprovação
