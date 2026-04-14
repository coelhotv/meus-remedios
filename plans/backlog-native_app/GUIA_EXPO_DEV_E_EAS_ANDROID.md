# Guia Pratico - Expo.dev e EAS para Android

> **Contexto:** Meus Remedios hybrid/native | Fase 5 MVP de produto
> **Data:** 2026-04-14
> **Escopo deste guia:** configurar o projeto no `expo.dev`, validar o setup real do repositório e gerar builds Android para testes e publicação na Google Play

---

## 1. Objetivo

Este guia existe para que o maintainer consiga:

1. conectar o app mobile do projeto ao `expo.dev`
2. usar o `EAS Build` sem improviso
3. gerar builds Android coerentes com os perfis do repositório
4. chegar pronto ao envio para a Google Play

Este guia **não cobre**:

- push nativo fim a fim
- `expo-notifications`
- iOS/App Store Connect

Isso é intencional: pela `EXEC_SPEC_HIBRIDO_FASE5_MVP_PRODUTO.md`, o MVP da Fase 5 ainda não inclui push nativo operacional.

---

## 2. Estado atual do repositório

O app mobile já possui base suficiente para subir no ecossistema Expo:

- `apps/mobile/app.config.js` é o arquivo canônico de configuração
- `apps/mobile/eas.json` já existe
- os perfis de build atuais são `development`, `preview` e `production`
- os identificadores oficiais já estão definidos

### Identidade atual por ambiente

| Perfil | Nome | Slug | Android package |
|---|---|---|---|
| `development` | `Meus Remedios Dev` | `meus-remedios-dev` | `com.coelhotv.meusremedios.dev` |
| `preview` | `Meus Remedios Preview` | `meus-remedios-preview` | `com.coelhotv.meusremedios.preview` |
| `production` | `Meus Remedios` | `meus-remedios` | `com.coelhotv.meusremedios` |

### Leitura correta desses perfis

- `development`: uso local com dev client
- `preview`: distribuição interna para testes reais
- `production`: build `.aab` voltada para Google Play

---

## 3. Pré-requisitos antes de mexer em qualquer coisa

Antes de abrir o `expo.dev`, confirme estes itens:

- conta Expo criada com o mesmo e-mail que você pretende manter no projeto
- conta Google Play Console já aprovada
- Node e npm funcionando no ambiente local
- acesso ao diretório `apps/mobile`
- variáveis públicas disponíveis para o app mobile

### Variáveis esperadas hoje

O app mobile usa:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_ENV`

### Regra importante

Pacotes compartilhados não devem ler `process.env` diretamente. A leitura pública do ambiente mobile já está centralizada em:

- `apps/mobile/app.config.js`
- `apps/mobile/src/platform/config/nativePublicAppConfig.js`

---

## 4. Passo a passo - primeira conexão com o Expo

### Passo 1 - entrar na pasta correta

```bash
cd "/Users/coelhotv/Library/Mobile Documents/com~apple~CloudDocs/git/meus-remedios/apps/mobile"
```

### Passo 2 - instalar dependências do mobile

Se ainda não instalou no monorepo:

```bash
npm install
```

Se o workspace raiz já está instalado, siga.

### Passo 3 - autenticar no Expo

Use a CLI atual:

```bash
npx eas-cli@latest login
```

Se preferir checar antes:

```bash
npx eas-cli@latest whoami
```

### Passo 4 - vincular este app a um projeto EAS

Como o repositório já tem app configurado, o próximo passo é criar ou linkar o projeto no EAS:

```bash
npx eas-cli@latest init
```

O comportamento esperado:

- a CLI cria ou vincula o projeto no Expo
- um `projectId` é associado ao app
- o `projectId` passa a existir dentro de `expo.extra.eas.projectId`

### Passo 5 - validar se o vínculo ficou correto

```bash
npx eas-cli@latest project:info
```

Você deve ver um projeto com nome coerente com `Meus Remedios` e ligado ao diretório `apps/mobile`.

### Passo 6 - revisar o `app.config.js`

Depois do `init`, abra e confira:

- `name`
- `slug`
- `scheme`
- `android.package`
- `version`
- `android.versionCode`
- `extra.eas.projectId`

### Resultado esperado desta etapa

Ao final, o projeto deve estar visível no dashboard do `expo.dev` e o app local deve estar oficialmente ligado a ele.

---

## 5. Passo a passo - organizar ambientes no Expo/EAS

### Objetivo

Evitar o erro clássico de primeiro app mobile: buildar o app certo com ambiente errado.

### Passo 1 - criar variáveis por ambiente no Expo

No dashboard do Expo, cadastre variáveis coerentes com os três perfis:

- `development`
- `preview`
- `production`

Para este projeto, comece com:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_APP_ENV`

### Sugestão prática

Use valores assim:

- `development` -> `development`
- `preview` -> `preview`
- `production` -> `production`

### Passo 2 - documentar quem aponta para quê

Registre internamente:

- se `preview` usa o mesmo Supabase do `production` ou um projeto separado
- quem tem permissão para alterar variáveis
- qual perfil é permitido para testes com usuários externos

### Recomendação para MVP

Se você ainda está no primeiro ciclo de publicação, mantenha:

- `development`: ambiente livre para desenvolvimento
- `preview`: staging para QA e closed testing
- `production`: produção real

---

## 6. Passo a passo - gerar builds Android

## 6.1. Build de desenvolvimento

Use quando quiser um dev client próprio.

```bash
npx eas-cli@latest build --platform android --profile development
```

Esse perfil gera build de distribuição interna com `developmentClient`.

Use quando:

- precisar testar no aparelho
- quiser depurar com mais controle do que o Expo Go

## 6.2. Build de preview

Use para QA, validação de fluxo e distribuição interna.

```bash
npx eas-cli@latest build --platform android --profile preview
```

Use quando:

- quiser entregar APK/AAB interno para testers
- estiver validando antes de subir algo na Play Console

## 6.3. Build de produção

Use para Google Play.

```bash
npx eas-cli@latest build --platform android --profile production
```

### O que esperar

- build Android para distribuição
- incremento automático de versão no perfil `production`
- artefato apropriado para submissão na Google Play

### Regra simples

Para Play Store, pense assim:

- `preview` = testar
- `production` = publicar

---

## 7. Sequência operacional recomendada para este projeto

Se eu estivesse configurando do zero hoje, seguiria exatamente esta ordem:

1. `eas login`
2. `eas init`
3. validar `project:info`
4. cadastrar env vars no Expo
5. rodar build `preview`
6. instalar e validar no Android físico
7. corrigir problemas de runtime
8. rodar build `production`
9. subir `.aab` na Play Console em teste interno
10. só depois preparar release aberta/produção

---

## 8. Checklist de validação antes do primeiro build de produção

- `app.config.js` com `android.package = com.coelhotv.meusremedios`
- `version = 1.0.0` coerente com o MVP inicial
- `android.versionCode` pronto para começar em `1`
- `icon.png` aceitável para loja e launcher
- login funcionando
- tela Hoje funcionando
- registrar dose funcionando
- tratamentos funcionando
- estoque funcionando
- perfil/settings funcionando
- vínculo Telegram definido ou conscientemente adiado

---

## 9. Como decidir quando usar Expo Go, dev build e build de loja

### Expo Go

Use só para exploração rápida, se o fluxo atual do app permitir.

### Development build

Use para desenvolvimento real do app.

### Preview build

Use para QA, stakeholders e teste funcional em aparelho.

### Production build

Use somente quando:

- o fluxo principal está estável
- você já validou no mínimo login, dashboard, dose, tratamentos e estoque

---

## 10. Problemas comuns no primeiro setup

## 10.1. Projeto não aparece corretamente no Expo

Causa provável:

- `eas init` não foi concluído
- diretório errado ao rodar a CLI

Correção:

- volte para `apps/mobile`
- rode `npx eas-cli@latest init`
- confirme com `project:info`

## 10.2. Build sobe com identidade errada

Causa provável:

- `EAS_BUILD_PROFILE` incorreto
- confusão entre `preview` e `production`

Correção:

- sempre explicitar `--profile`
- conferir nome/slug/package antes da build

## 10.3. Build conecta no backend errado

Causa provável:

- variáveis públicas não configuradas por ambiente

Correção:

- revisar env vars no Expo
- confirmar `EXPO_PUBLIC_APP_ENV`

## 10.4. Tentação de configurar push agora

Não faça isso nesta fase.

Pelo recorte da Fase 5:

- não é hora de `expo-notifications`
- não é hora de registrar token Expo
- não é hora de dispatcher multicanal

Isso entra na Fase 6.

---

## 11. Definição prática de pronto para avançar

Considere o setup Expo/EAS pronto quando estes 6 critérios estiverem verdes:

1. projeto visível no `expo.dev`
2. `projectId` persistido no app
3. build `preview` concluída
4. app instalado e testado em Android real
5. build `production` concluída sem erro
6. `.aab` pronta para upload na Google Play Console

---

## 12. Próximo passo depois deste guia

Depois de concluir este guia, siga imediatamente para:

- `plans/backlog-native_app/GUIA_GOOGLE_PLAY_CONSOLE_MVP_ANDROID.md`

E, antes de publicar a ficha da loja:

- `plans/backlog-native_app/GUIA_ASO_E_CONTEUDOS_PLAY_STORE.md`
