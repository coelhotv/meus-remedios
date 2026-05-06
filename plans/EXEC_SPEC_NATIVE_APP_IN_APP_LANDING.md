# Exec Spec: Native App In-App Landing Page

> **Status:** Exec spec para implementacao futura
> **Produto:** Dosiq mobile app
> **Plataforma alvo:** React Native / Expo
> **Referencia visual:** `/Users/coelhotv/Library/Mobile Documents/com~apple~CloudDocs/git/app-landing.png`
> **Objetivo:** criar a primeira view exibida apos o carregamento do app, antes da autenticacao, como landing page in-app para usuarios novos e antigos.

---

## 1. Resultado esperado

Ao abrir o app mobile:

1. O app deve restaurar/verificar sessao existente.
2. Enquanto a verificacao esta pendente, manter estado de loading atual.
3. Se houver sessao ativa, entrar direto no shell autenticado (`ROUTES.TABS`).
4. Se nao houver sessao ativa, exibir a nova landing page in-app.
5. Na landing, CTA `Entrar` leva para a view de autenticacao existente.
6. CTA `Criar Conta` fica como placeholder ate fluxo de cadastro existir.

Regra de produto:

- usuarios antigos sem sessao ativa tambem devem ver esta landing antes do login.
- usuarios ja autenticados nao devem ver landing.
- nenhum fluxo real de cadastro deve ser implementado nesta etapa.

---

## 2. Arquivos alvo provaveis

Antes de modificar qualquer arquivo existente, aplicar regra do projeto:

```bash
find src -name "*Landing*" -type f
find apps/mobile/src -name "*Login*" -type f
rg "ROUTES\\.LOGIN|LoginScreen|createNativeStackNavigator" apps/mobile/src
```

Arquivos de navegacao:

- `apps/mobile/src/navigation/Navigation.jsx`
- `apps/mobile/src/navigation/routes.js`

Nova view:

- `apps/mobile/src/screens/LandingScreen.jsx`

Testes:

- `apps/mobile/src/screens/__tests__/LandingScreen.test.jsx`
- ajustar testes existentes de navegacao se houver cobertura para estado sem sessao.

Opcional, se o design final justificar:

- `apps/mobile/src/shared/components/landing/LandingMetricCard.jsx`
- `apps/mobile/src/shared/components/landing/LandingSponsorStrip.jsx`

Evitar:

- alterar fluxo autenticado das tabs.
- inserir logica de dominio clinico na landing.
- criar service/hook novo para dados ficticios.
- implementar cadastro real ou chamada Supabase para `Criar Conta`.

---

## 3. Contrato de navegacao

Adicionar rota canonica:

```js
LANDING: 'Landing'
```

Fluxo sem sessao:

```txt
session === undefined -> loading atual
session === null      -> Landing
Landing.Entrar       -> Login
Landing.CriarConta   -> placeholder sem cadastro real
session object        -> Tabs
```

Stack sem sessao esperado:

```jsx
<>
  <Stack.Screen name={ROUTES.LANDING} component={LandingScreen} />
  <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
  <Stack.Screen name={ROUTES.SMOKE} component={SmokeScreen} />
</>
```

Acao `Entrar`:

```js
navigation.navigate(ROUTES.LOGIN)
```

Acao `Criar Conta`:

- manter botao visualmente ativo conforme mock.
- nao criar conta.
- comportamento aceito nesta etapa:
  - abrir `Alert.alert('Em breve', 'Cadastro pelo app ainda nao esta disponivel.')`, ou
  - registrar evento e permanecer na landing.
- preferencia: `Alert.alert`, pois comunica estado real sem criar fluxo morto.

---

## 4. Requisitos visuais

Basear implementacao no mock hi-fi anexo.

### 4.1. Estrutura vertical

Tela deve ter:

1. Topo com marca `dosiq`: **Composto pelo ícone de checkmark verde (extrair do `apps/web/public/dosiq-logo-verde.svg` ou das variações em `apps/web/public/app-icons`) seguido pelo wordmark escrito em texto ("dosiq") utilizando a fonte `Comfortaa`, exatamente como implementado na `LoginScreen.jsx` (`fontFamily: typography.fontFamily.brand`)**.
2. Hero mock de produto com cards empilhados **(dentro de um container com fundo cinza claro e bordas arredondadas)**:
   - card de adesao `80%`: **Implementar um indicador circular simples (pode ser via `react-native-svg` ou `<View>` estilizada com bordas)** para o gráfico, texto `Hoje`, `Adesao excelente!`
   - card de proxima dose com `PROXIMA DOSE`, horario `08:00 AM`, medicamento `Atorvastatina`, detalhe `10mg • 1 Comprimido`. **O ícone de medicamento deve ter um container com fundo azul claro/translúcido.**
3. Headline:
   - `Sua saude sob`
   - `controle, sem`
   - `complicacoes.`
4. Destaque na palavra `controle`: A palavra deve estar na cor verde (`tokens.brand.primary`) **E com um sublinhado espesso (underline)**. Pode ser implementado via `textDecorationLine` ou uma `<View>` posicionada absolutamente abaixo do texto.
5. Copy:
   - `O dosiq ajuda voce a gerenciar seus medicamentos, estoque e adesao em um so lugar. Gratuito e portatil.`
6. Faixa de beneficios:
   - **Layout**: Em linha (`flexDirection: 'row'`), `justifyContent: 'space-between'`.
   - O texto superior (`100%`, `Offline`, `Gratis`) deve ser maior e em negrito (bold).
   - O texto inferior (`SEGURO`, `ACESSO`, `PARA SEMPRE`) deve ser menor e em uppercase.
7. Espaco patrocinado:
   - **Layout**: O container deve ter uma borda cinza fina (`borderWidth: 1`, `borderColor: tokens.border.default`).
   - label `ESPACO PATROCINADO`
   - marcas placeholder `BIO-HEALTH` e `PHARMA-CORE`. **Devem ter ícones ao lado (ex: escudo e maleta médica do `Ionicons`).**
8. Barra inferior fixa com CTAs:
   - **Layout**: CTAs devem ficar lado a lado (`flexDirection: 'row'`), dividindo a largura.
   - primario `Criar Conta` (fundo preenchido).
   - secundario `Entrar` com estilo ghost (sem fundo, apenas texto e ícone em azul).

### 4.2. Layout

Direcao:

- `SafeAreaView` externa.
- `ScrollView` para conteudo principal.
- bottom action bar fixa fora do scroll.
- conteudo deve deixar espaco inferior suficiente para nao ficar oculto pela action bar.
- usar `KeyboardAvoidingView` somente na tela de login, nao na landing.

Dimensoes recomendadas:

- largura maxima visual do conteudo: `100%`, com padding horizontal consistente.
- hero mock: largura aproximada de `82%` a `88%` da tela, centralizado.
- cards internos com radius entre `24` e `32`, sombra leve/elevation baixa.
- bottom action bar com altura estavel entre `96` e `116`, respeitando safe area.

Responsividade:

- iPhone SE / telas pequenas: conteudo deve rolar, CTAs sempre visiveis.
- telas grandes: manter hierarquia centralizada, sem esticar cards demais.
- Android: evitar dependencias de blur pesado; sombras devem degradar bem.

---

## 5. Tokens e estilo

Usar tokens existentes quando possivel:

- `colors`
- `spacing`
- `typography`

Se tokens atuais nao cobrirem a landing, criar apenas constantes locais na tela ou pequenos tokens semanticos em escopo controlado.

Cores alvo do mock:

| Uso | Valor aproximado / Token sugerido |
|-----|-----------------------------------|
| Brand green | `tokens.brand.primary` (`#006A5E`) |
| Text primary | `tokens.text.primary` (`#1a1c1e`) |
| Text secondary | `tokens.text.secondary` (`#44474e`) |
| Muted text | `tokens.text.muted` (`#8e9199`) |
| Background | `tokens.bg.screen` (`#f8fafb`) |
| Card | `tokens.bg.card` (`#ffffff`) |
| Secondary CTA blue | `tokens.colors.primary[600]` (`#005db6`) |

Tipografia:

- **Obrigatório:** O wordmark "dosiq" no topo deve ser renderizado como `<Text>` utilizando a fonte `Comfortaa` (`typography.fontFamily.brand`), seguindo exatamente o mesmo estilo e padrão já estabelecido na `LoginScreen.jsx`.
- headline pode usar peso alto com `System`/token bold caso Comfortaa prejudique leitura.
- evitar letter spacing negativo.
- texto deve caber em portugues sem truncamento.

Icones:

- usar `Ionicons` ja presente no mobile.
- `Criar Conta`: icone `person-add-outline` ou equivalente.
- `Entrar`: icone `log-in-outline` ou similar.
- Card dose: icone medico/remedio disponivel em `Ionicons` (ex: `medical-outline`).
- Espaço Patrocinado: ícones `shield-checkmark-outline` e `medkit-outline` ou equivalentes.

---

## 6. Conteudo e acessibilidade

Textos finais desta etapa:

```txt
dosiq
Sua saude sob controle, sem complicacoes.
O dosiq ajuda voce a gerenciar seus medicamentos, estoque e adesao em um so lugar. Gratuito e portatil.
100% SEGURO
Offline ACESSO
Gratis PARA SEMPRE
ESPACO PATROCINADO
BIO-HEALTH
PHARMA-CORE
Criar Conta
Entrar
```

Acessibilidade obrigatoria:

- CTAs com `accessibilityRole="button"`.
- `Criar Conta` com label explicito informando indisponibilidade temporaria se usar Alert.
- `Entrar` com label `Entrar na conta`.
- cards decorativos do hero devem ser legiveis por screen reader ou marcados como nao acessiveis se duplicarem texto informativo.
- contraste minimo AA para texto principal e botoes.
- nao depender apenas de cor para comunicar acao.

---

## 7. Analytics

Se analytics ja estiver disponivel e barato de plugar:

- evento ao visualizar landing: `landing_viewed`
- evento ao tocar entrar: `landing_login_pressed`
- evento ao tocar criar conta placeholder: `landing_signup_placeholder_pressed`

Nao bloquear implementacao se taxonomy oficial ainda nao existir.

Se adicionar eventos:

- registrar em `apps/mobile/src/platform/analytics/analyticsEvents.js`
- manter nomes sem PII.
- nao enviar email, nome ou dados clinicos.

---

## 8. Implementacao sugerida

### Passo 1 - Criar rota

- Adicionar `ROUTES.LANDING` em `routes.js`.
- Importar `LandingScreen` em `Navigation.jsx`.

### Passo 2 - Ajustar stack sem sessao

- Trocar entrada inicial sem sessao de `LoginScreen` para `LandingScreen`.
- Manter `LoginScreen` acessivel via `navigation.navigate(ROUTES.LOGIN)`.
- Preservar `SmokeScreen` como diagnostico.

### Passo 3 - Criar `LandingScreen`

Responsabilidades da tela:

- renderizar composicao visual.
- navegar para login.
- exibir placeholder de cadastro.
- opcionalmente registrar eventos.

Nao fazer:

- chamada Supabase.
- leitura de cache clinico.
- criacao real de conta.

### Passo 4 - Testar

Cobertura minima:

- renderiza headline e CTAs.
- pressionar `Entrar` chama `navigate(ROUTES.LOGIN)`.
- pressionar `Criar Conta` nao navega para rota inexistente e mostra placeholder.
- stack sem sessao inicia em `ROUTES.LANDING`.

---

## 9. Estados

Landing nao deve depender de dados remotos.

Estados aceitos:

| Estado | Comportamento |
|--------|---------------|
| Normal | landing completa |
| Cadastro indisponivel | Alert apos `Criar Conta` |
| Sessao restaurada | navega/renderiza Tabs via fluxo atual |
| Sem sessao | landing |
| Erro ao restaurar sessao | manter comportamento atual: `setSession(null)` e mostrar landing |

Nao criar loading interno para landing.

---

## 10. Quality gates

Executar a partir da raiz do repo:

```bash
npm run validate:agent
```

Se precisar de validacao mobile mais rapida durante desenvolvimento:

```bash
npm run test --workspace=@dosiq/mobile
```

Verificacoes manuais obrigatorias:

- abrir app sem sessao: landing aparece primeiro.
- tocar `Entrar`: abre login existente.
- tocar `Criar Conta`: placeholder aparece, sem crash, sem rota inexistente.
- login bem-sucedido: app segue para tabs.
- app com sessao persistida: pula landing e login.
- tela pequena: conteudo rola e CTAs nao cobrem texto.
- Android e iOS: safe area e bottom bar corretas.

---

## 11. Criterios de aceite

Implementacao esta pronta quando:

- `LandingScreen` existe e segue mock hi-fi.
- `ROUTES.LANDING` foi adicionado.
- fluxo sem sessao inicia em landing.
- `Entrar` navega para `LoginScreen`.
- `Criar Conta` e placeholder explicito, sem cadastro real.
- usuarios autenticados continuam indo direto para `RootTabs`.
- testes cobrem CTAs e roteamento basico.
- `npm run validate:agent` passa ou falhas externas sao documentadas.

---

## 12. Fora de escopo

- cadastro real.
- onboarding multi-step.
- recuperacao de senha.
- termos de uso / privacidade dentro da landing.
- integracao real com patrocinadores.
- experimentos A/B.
- alteracao de identidade Expo, bundle id ou assets de loja.

---

## 13. Handoff para agente executor

Comando sugerido:

```bash
/devflow coding "Native in-app landing page"
```

Contexto minimo a carregar:

- este arquivo inteiro.
- `apps/mobile/src/navigation/Navigation.jsx`
- `apps/mobile/src/navigation/routes.js`
- `apps/mobile/src/screens/LoginScreen.jsx`
- `apps/mobile/src/shared/styles/tokens.js`
- mock hi-fi: `/Users/coelhotv/Library/Mobile Documents/com~apple~CloudDocs/git/app-landing.png`

Regra final:

- esta etapa entrega landing pre-auth. Cadastro fica somente como intencao visual e placeholder operacional.
