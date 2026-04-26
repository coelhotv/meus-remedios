# Exec Spec — Sprint N1.4: Mobile Deeplink Real em usePushNotifications

> **Sprint:** N1.4  
> **Wave:** N1 — Agrupamento por Treatment Plan + Bulk Mobile  
> **Status:** PRONTO PARA EXECUÇÃO  
> **Agente recomendado:** 🟢 Avançado (Sonnet)  
> **Master Spec:** [`EXEC_SPEC_WAVE_N1_GROUPING.md`](./EXEC_SPEC_WAVE_N1_GROUPING.md)  
> **Estimativa:** ~3h

---

## 1. Objetivo

Substituir o stub `console.log` em `usePushNotifications.js` por navegação real via `navigationRef`, cobrindo dois cenários críticos:

1. **Foreground / background tap:** app em uso ou suspenso → notificação tocada → navegar para `ROUTES.TODAY` com params
2. **Cold start:** app matado → usuário toca push → app abre → `ROUTES.TODAY` com params (sem tela vazia)

---

## 2. Arquivos a Modificar

| Arquivo | Tipo de mudança |
|---------|----------------|
| `apps/mobile/src/navigation/Navigation.jsx` | Mover `navigationRef` para nível de módulo + exportar |
| `apps/mobile/src/platform/notifications/usePushNotifications.js` | Importar `navigationRef`, implementar deeplink + cold start |

**Arquivo a criar:**
| Arquivo | Tipo |
|---------|------|
| `apps/mobile/src/platform/notifications/__tests__/usePushNotifications.test.js` | Testes Jest |

---

## 3. Decisão Arquitetural — navigationRef no Nível de Módulo

A spec master diz "apenas exportar" o `useRef(null)` existente, mas `useRef` criado **dentro de um componente** não pode ser exportado — é local à instância e recriado a cada render.

**Solução correta (padrão React Navigation):**
- Criar `navigationRef` como `createRef()` no nível do módulo em `Navigation.jsx`
- Passar para `<NavigationContainer ref={navigationRef}>`
- Exportar a ref nomeada: `export { navigationRef }`

Isso é o padrão oficial documentado em `@react-navigation/native` e não requer ADR formal (não quebra contratos, é puramente aditivo).

---

## 4. Implementação Detalhada

### 4.1 — Navigation.jsx

**Mudanças:**

1. Substituir `import { useEffect, useState, useRef } from 'react'` por `import { useEffect, useState, createRef } from 'react'`
2. Criar ref no nível do módulo (antes do componente):
   ```js
   export const navigationRef = createRef()
   ```
3. Remover `const navigationRef = useRef(null)` de dentro do componente
4. Manter `ref={navigationRef}` no `<NavigationContainer>` — funciona igual

**Resultado:** `navigationRef` exportado, comportamento idêntico ao atual.

---

### 4.2 — usePushNotifications.js

**Mudanças:**

1. Adicionar import:
   ```js
   import { navigationRef } from '../../navigation/Navigation'
   ```

2. Adicionar constante de mapeamento de screens (após imports):
   ```js
   const SCREEN_TO_ROUTE = {
     'bulk-plan': ROUTES.TODAY,
     'bulk-misc': ROUTES.TODAY,
     'dose-individual': ROUTES.TODAY,
   }
   ```
   Importar `ROUTES` de `'../../navigation/routes'`.

3. Extrair helper de navegação (após os imports/constantes):
   ```js
   function navigateFromPush(navigation) {
     if (!navigation?.screen) {
       // Fallback: ROUTES.TODAY sem params
       navigation = { screen: 'dose-individual', params: {} }
     }
     const { screen, params } = navigation
     const targetRoute = SCREEN_TO_ROUTE[screen] ?? ROUTES.TODAY

     if (navigationRef.current?.isReady()) {
       navigationRef.current.navigate(targetRoute, params)
     } else {
       // Aguardar navigator ficar pronto (cold start tardio — raro mas possível)
       const unsubscribe = navigationRef.current?.addListener?.('state', () => {
         navigationRef.current.navigate(targetRoute, params)
         unsubscribe?.()
       })
     }
   }
   ```

4. Substituir o stub (linhas 53–68 atuais) pelo handler real:
   ```js
   // Handler de tap em notificação (foreground / background)
   notificationSubscription = Notifications.addNotificationResponseReceivedListener(
     (response) => {
       const navigation = response.notification.request.content.data?.navigation
       navigateFromPush(navigation)
     }
   )
   ```

5. Adicionar handler de **cold start** no início de `setupPush()` (antes da lógica de token), após verificar que `isMounted`:
   ```js
   // Cold start: verificar se havia notificação pendente quando o app foi aberto
   const lastResponse = await Notifications.getLastNotificationResponseAsync()
   if (lastResponse && isMounted) {
     const navigation = lastResponse.notification.request.content.data?.navigation
     navigateFromPush(navigation)
   }
   ```

---

### 4.3 — Testes Jest

Framework: **Jest + jest-expo** (confirmado em `apps/mobile/package.json`). Usar `jest.fn()`, não `vi.fn()`.

Arquivo: `apps/mobile/src/platform/notifications/__tests__/usePushNotifications.test.js`

Cenários obrigatórios:
1. **Tap foreground com `bulk-plan`:** navigationRef pronto → `navigate(ROUTES.TODAY, params)` chamado
2. **Tap foreground com `bulk-misc`:** idem, params corretos
3. **Tap com `dose-individual`:** idem
4. **Tap sem `navigation` no payload:** fallback → navega para `ROUTES.TODAY` sem params
5. **Cold start com resposta pendente:** `getLastNotificationResponseAsync` retorna response → `navigateFromPush` chamado
6. **Cold start sem resposta pendente:** `getLastNotificationResponseAsync` retorna null → sem chamada de navigate
7. **navigationRef não pronto:** `isReady()` retorna false → `addListener('state', ...)` chamado

---

## 5. Acceptance Criteria (DoD)

- [ ] `navigationRef` exportado de `Navigation.jsx` e importável sem erro de módulo
- [ ] Tap em push com `navigation.screen = 'bulk-plan'` → `navigationRef.current.navigate(ROUTES.TODAY, params)` chamado
- [ ] Tap em push com `navigation.screen = 'bulk-misc'` → mesmo comportamento
- [ ] Tap em push sem `navigation.screen` → fallback navega para `ROUTES.TODAY`
- [ ] Cold start com notificação pendente → `getLastNotificationResponseAsync` processa e navega
- [ ] Cold start sem notificação pendente → sem erro, sem navegação espúria
- [ ] Stub `console.log` das linhas 58–65 removido completamente
- [ ] `__DEV__` logs preservados para debugging (podem coexistir com a lógica real)
- [ ] Todos os 7 cenários de teste passando: `npm test -- usePushNotifications`
- [ ] `npm run lint` limpo nos 2 arquivos modificados

---

## 6. Contratos Tocados

| Contrato | Status |
|----------|--------|
| Nenhum CON-NNN cobre `usePushNotifications` ou `Navigation.jsx` | Sem contract gateway |

Mudança é puramente aditiva (novo export + substituição de stub). Sem breaking changes.

---

## 7. Regras Aplicáveis

| Regra | Relevância |
|-------|-----------|
| R-193 | Checklist de extensão ao adicionar novo notification kind (N1.4 usa os kinds criados em N1.1) |
| R-164 | Navigation 3 estados obrigatórios (não simplificar o fluxo auth-aware) |
| Padrão RN | `createRef` no nível de módulo para `NavigationContainer` — padrão oficial |

---

## 8. Quality Gates

```bash
# Lint (rodar antes de cada commit)
cd /Users/coelhotv/git-icloud/dosiq && npm run lint

# Testes (apenas o arquivo novo)
cd /Users/coelhotv/git-icloud/dosiq/apps/mobile && npm test -- usePushNotifications --watchAll=false

# Validação completa (antes do push)
cd /Users/coelhotv/git-icloud/dosiq && npm run validate:agent
```

---

## 9. Commits Esperados

1. `feat(mobile): exportar navigationRef de Navigation.jsx (nível de módulo)`
2. `feat(mobile): deeplink real em usePushNotifications — foreground + cold start`
3. `test(mobile): testes Jest para deeplink em usePushNotifications`

---

## 10. Risco Principal

**Cold start timing:** `getLastNotificationResponseAsync` deve ser chamado depois de `setupPush()` ter registrado o handler de permissão, mas `navigationRef` pode ainda não estar pronto se o Navigator ainda não montou. O helper `navigateFromPush` já trata isso via `addListener('state', ...)` como fallback — o risco é coberto.

**Verificação manual recomendada** (Sprint N1.8):
- Matar o app no dispositivo físico
- Enviar push via Expo CLI ou cron
- Tocar a notificação
- Verificar que `BulkDoseRegisterModal` abre (ainda não existe em N1.4, mas a navegação para `ROUTES.TODAY` com params deve funcionar)
