# Configuração de Emails Transacionais — Supabase + Dosiq

Guia para configurar templates de email branded para confirmação de cadastro e recuperação de senha.

---

## 1. Localização

**Supabase Dashboard → Authentication → Email Templates**

Dois templates obrigatórios:
- `Confirm signup` — enviado após `supabase.auth.signUp()`
- `Reset password` — enviado após `supabase.auth.resetPasswordForEmail()`

---

## 2. Template: Confirm Signup

**Subject:**
```
Confirme seu cadastro no Dosiq
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 24px; background: #f0fdfb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #006A5E; padding: 32px 24px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .content h2 { font-size: 22px; color: #006A5E; margin: 0 0 16px; }
    .content p { font-size: 16px; color: #555; margin: 0 0 16px; }
    .btn { display: inline-block; background: #006A5E; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .btn-wrap { text-align: center; margin: 24px 0; }
    .fallback { font-size: 13px; color: #999; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e5; word-break: break-all; }
    .footer { background: #f5f5f5; padding: 20px 24px; text-align: center; font-size: 13px; color: #999; border-top: 1px solid #e5e5e5; }
    .footer a { color: #006A5E; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="logo">dosiq</p>
    </div>
    <div class="content">
      <h2>Bem-vindo ao Dosiq!</h2>
      <p>Obrigado por se cadastrar. Clique no botão abaixo para confirmar seu email e ativar sua conta.</p>
      <div class="btn-wrap">
        <a href="{{ .ConfirmationURL }}" class="btn">Confirmar Email</a>
      </div>
      <p class="fallback">
        Ou copie este link no seu navegador:<br/>
        <span style="color: #006A5E;">{{ .ConfirmationURL }}</span>
      </p>
      <p style="font-size: 13px; color: #999; margin-top: 16px;">Este link expira em 24 horas.</p>
    </div>
    <div class="footer">
      Dosiq — Inteligência em Doses<br/>
      <a href="https://dosiq.vercel.app/politica-de-privacidade">Política de Privacidade</a>
    </div>
  </div>
</body>
</html>
```

---

## 3. Template: Reset Password

**Subject:**
```
Recupere sua senha do Dosiq
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 24px; background: #f0fdfb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #006A5E; padding: 32px 24px; text-align: center; }
    .logo { font-size: 32px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .content h2 { font-size: 22px; color: #006A5E; margin: 0 0 16px; }
    .content p { font-size: 16px; color: #555; margin: 0 0 16px; }
    .btn { display: inline-block; background: #006A5E; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .btn-wrap { text-align: center; margin: 24px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 14px; color: #92400e; margin: 16px 0; }
    .fallback { font-size: 13px; color: #999; margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e5e5; word-break: break-all; }
    .footer { background: #f5f5f5; padding: 20px 24px; text-align: center; font-size: 13px; color: #999; border-top: 1px solid #e5e5e5; }
    .footer a { color: #006A5E; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="logo">dosiq</p>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha.</p>
      <div class="btn-wrap">
        <a href="{{ .ConfirmationURL }}" class="btn">Criar Nova Senha</a>
      </div>
      <div class="warning">
        <strong>Segurança:</strong> Se você não solicitou esta recuperação, ignore este email. Sua conta permanecerá segura.
      </div>
      <p class="fallback">
        Ou copie este link no seu navegador:<br/>
        <span style="color: #006A5E;">{{ .ConfirmationURL }}</span>
      </p>
      <p style="font-size: 13px; color: #999; margin-top: 16px;">Este link expira em 24 horas.</p>
    </div>
    <div class="footer">
      Dosiq — Inteligência em Doses<br/>
      <a href="https://dosiq.vercel.app/politica-de-privacidade">Política de Privacidade</a>
    </div>
  </div>
</body>
</html>
```

---

## 4. Variáveis de Template Supabase

| Variável | Descrição |
|----------|-----------|
| `{{ .ConfirmationURL }}` | Link completo de confirmação/reset gerado pelo Supabase |
| `{{ .Email }}` | Email do usuário (disponível mas não obrigatório) |

---

## 5. Configuração de URLs

**Dashboard → Authentication → URL Configuration**

| Campo | Valor |
|-------|-------|
| Site URL | `https://dosiq.vercel.app` |
| Additional Redirect URLs | `https://dosiq.vercel.app/auth/callback` |
| Additional Redirect URLs | `dosiq://auth/callback` (deep link mobile) |

---

## 6. SMTP (Opcional)

Por padrão, Supabase usa seu email transacional built-in (adequado para desenvolvimento e tráfego baixo).

Para produção com alto volume, configure SMTP via **Dashboard → Authentication → SMTP Settings**:

**Opção recomendada — Resend:**
- Host: `smtp.resend.com`
- Port: `587`
- Username: `resend`
- Password: `re_xxxxxxxxxxxxxxxx` (API key do Resend)
- Sender: domínio verificado no Resend

**Alternativa — SendGrid:**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: chave API do SendGrid

---

## 7. Teste Manual

### Via Dashboard

1. **Supabase Dashboard → Authentication → Email Templates**
2. Selecionar template → clicar **"Send test email"** (disponível no painel de cada template)
3. Verificar: assunto, branding, botão CTA, link alternativo, footer

### Via Dashboard (teste end-to-end)

1. **Authentication → Users → [email do usuário]**
2. Clicar **"Send recovery email"** para testar reset de senha

### Via app

1. Tela de cadastro → cadastrar com email válido → verificar email recebido
2. Tela de recuperação → solicitar reset → verificar email recebido
3. Clicar no link → verificar redirecionamento correto

---

## 8. Checklist Pré-Deploy

- [ ] Template "Confirm signup": subject + HTML corretos
- [ ] Template "Reset password": subject + HTML + warning block corretos
- [ ] Ambos templates: logo dosiq visível, botão verde (#006A5E), footer com política
- [ ] Site URL configurada: `https://dosiq.vercel.app`
- [ ] Redirect URLs incluem `dosiq://auth/callback`
- [ ] SMTP configurado (se tráfego > limite Supabase built-in)
- [ ] Teste manual de ambos templates enviado e visualizado
- [ ] Deep link `dosiq://auth/callback` testado em device físico

---

## 9. Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|---------------|------|
| Email não chega | SMTP misconfigured ou rate limit | Verificar logs em Dashboard → Auth → Logs |
| Link 404 após clique | Site URL incorreta | Corrigir URL Configuration |
| `dosiq://` não abre app | Redirect URL não registrada | Adicionar em Additional Redirect URLs |
| Email sem branding | Template padrão ainda ativo | Salvar template customizado no Dashboard |
