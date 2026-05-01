# Plano: Modernização do ESLint — Dosiq Monorepo

## Contexto

O ESLint do Dosiq foi configurado quando o projeto era uma SPA simples. Hoje é um monorepo (`apps/web`, `apps/mobile`, `api/`, `server/`, `packages/`) mas o `eslint.config.js` ainda reflete a configuração original: sem validação de imports, sem regras de Node.js, mobile completamente excluído.

**O problema central** é que agentes IA com contexto limitado ou sem raciocínio avançado introduzem débitos técnicos específicos que o ESLint atual não captura:
- Imports para arquivos que não existem
- Caminhos relativos longos em vez de aliases
- `console.log` em código de produção
- Violação do padrão de datas (R-020) com `new Date('YYYY-MM-DD')`
- Imports cruzando fronteiras de domínio (web importando server/)
- Aliases definidos no Vite mas desconhecidos pelo ESLint (8 de 16 aliases sem cobertura)

---

## Estado Atual (Gaps Identificados)

| Gap | Impacto | Regra DEVFLOW Violada |
|-----|---------|----------------------|
| 8 aliases do Vite não mapeados no ESLint (`@services`, `@calendar`, `@emergency`, etc.) | ESLint não valida esses imports | R-002 |
| Sem `eslint-plugin-import-x` — imports para arquivos inexistentes não geram erro | Agentes inventam caminhos | R-003 |
| 30+ `console.log` em produção sem `NODE_ENV` guard | Logs de debug vão para prod | R-116 |
| `new Date('YYYY-MM-DD')` sem hora em 6+ arquivos de teste | Bug de timezone BRT | R-020 |
| `apps/mobile` completamente excluído do ESLint | Zero proteção para app nativa | — |
| `server/` sem regras Node.js específicas | `process.exit()`, imports errados | R-041 |
| Sem detecção de dependências circulares | Loops de import silenciosos | — |
| Sem regra de cross-boundary (web → server) | Acoplamento indevido | — |

---

## Solução: 4 Fases Incrementais

### Fase 1 — Foundation: Import Validation (Crítica)

**Objetivo:** Fazer o ESLint conhecer todos os paths reais do monorepo e rejeitar imports inválidos.

**Instalações:**
```bash
npm install -D eslint-plugin-import-x
```
> `eslint-plugin-import-x` é o fork oficial compatível com ESLint 9 flat config.

**Mudanças em `eslint.config.js`:**

1. **Sincronizar todos os 16 aliases** do `vite.config.js` com o `settings` do ESLint:
   - Faltando hoje: `@services`, `@calendar`, `@emergency`, `@prescriptions`, `@schemas`, `@utils`, `@design-tokens`, `@dosiq/core`
   - Usar `eslint-import-resolver-custom-alias` ou `eslint-import-resolver-alias` com os mesmos paths do Vite

2. **Adicionar regras de import:**
   ```js
   'import-x/no-unresolved': 'error'        // R-003: arquivos inexistentes
   'import-x/no-cycle': ['warn', { maxDepth: 5 }]  // dependências circulares
   'import-x/no-extraneous-dependencies': 'error'  // pacotes fora do package.json
   ```

3. **Adicionar `no-restricted-imports` cross-boundary:**
   ```js
   // apps/web não pode importar de server/ ou api/ diretamente
   // tests em apps/web não devem importar ../../../../../../server/
   ```
   Pattern: `{ group: ['**/server/**'], message: 'Web não pode importar de server/. Use a API REST.' }`

**Arquivo crítico:** `/eslint.config.js` — bloco `settings` e novo bloco `rules` para `import-x/*`

---

### Fase 2 — AI Agent Guardrails (Alta Prioridade)

**Objetivo:** Capturar automaticamente os padrões de erro mais frequentes de agentes IA.

**Regras a adicionar:**

#### 2a. `no-console` — enforce R-116
```js
// Produção: erro em console.log, permitir console.error e console.warn
'no-console': ['error', { allow: ['error', 'warn'] }]

// Override para testes (glob: **/__tests__/**):
'no-console': 'off'
```

#### 2b. `no-restricted-syntax` — enforce R-020 (datas)
Captura o padrão `new Date('YYYY-MM-DD')` sem componente de hora:
```js
{
  selector: "NewExpression[callee.name='Date'][arguments.0.type='Literal']",
  // + regex para verificar se é YYYY-MM-DD sem 'T'
  message: "Use parseLocalDate() ou new Date('YYYY-MM-DDT00:00:00'). R-020: new Date('YYYY-MM-DD') = UTC midnight = dia anterior em BRT."
}
```
> Implementado via `no-restricted-syntax` com seletor AST, ou plugin custom lightweight.

#### 2c. Aliases obrigatórios — enforce R-002
Instalar `eslint-plugin-no-relative-import-paths`:
```bash
npm install -D eslint-plugin-no-relative-import-paths
```
```js
'no-relative-import-paths/no-relative-import-paths': [
  'warn',
  { allowSameFolder: true, rootDir: 'apps/web/src', prefix: '@' }
]
```
> Converte `../../../shared/...` em `@shared/...` automaticamente com `--fix`.

#### 2d. `import-x/order` — enforce ordem de imports (CLAUDE.md)
```js
'import-x/order': ['warn', {
  groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
  pathGroups: [{ pattern: '@/**', group: 'internal' }],
  alphabetize: { order: 'asc', caseInsensitive: true }
}]
```

**Arquivos afetados:** regras se aplicam a `apps/web/src/**/*.{js,jsx}` por padrão.

---

### Fase 3 — Escopo de Monorepo

**Objetivo:** Regras específicas por domínio — server, api, packages, mobile.

#### 3a. `server/` — Node.js strictness
Novo bloco no `eslint.config.js` para `files: ['server/**/*.js']`:
```js
// Usar `eslint-plugin-n` para Node.js
'n/no-process-exit': 'error'           // R-041: nunca process.exit()
'n/no-missing-require': 'error'        // imports Node.js inexistentes
'no-console': 'off'                    // server usa logger próprio, mas warn em console.log
```

#### 3b. `api/` — Vercel serverless rules
Bloco para `files: ['api/**/*.js', '!api/**/_*/**']`:
```js
'no-restricted-syntax': [
  'error',
  { selector: "CallExpression[callee.object.name='process'][callee.property.name='exit']",
    message: 'R-041: Nunca use process.exit() em Vercel functions. Throw Error.' }
]
// Customização: lembrete visual sobre o limite de 12 funções (como jsdoc ou comment lint)
```

#### 3c. `apps/mobile` — React Native ESLint
Adicionar `apps/mobile` de volta ao ESLint com perfil específico:
```bash
npm install -D @react-native/eslint-config --workspace @dosiq/mobile
```
Bloco no `eslint.config.js` para `files: ['apps/mobile/**/*.{js,jsx,ts,tsx}']` com:
- Globals React Native (`__DEV__`, etc.)
- `react-hooks` rules (já globais, mas confirmar cobertura)
- `no-console: ['warn', { allow: ['error', 'warn'] }]` — `__DEV__` guard preferido no RN

#### 3d. `packages/*` — Library mode
Bloco para `files: ['packages/*/src/**/*.js']`:
```js
'no-console': 'error'     // packages não devem logar diretamente
'import-x/no-cycle': 'error'  // packages são mais sensíveis a ciclos
```

---

### Fase 4 — Integração e CI

**Objetivo:** Garantir que as novas regras se integrem ao pipeline existente.

1. **Atualizar `.lintstagedrc.js`** para incluir o novo scope mobile:
   ```js
   "apps/mobile/**/*.{js,jsx,ts,tsx}": ["eslint --fix"]
   ```

2. **Adicionar script `lint:fix`** na raiz:
   ```json
   "lint:fix": "eslint . --fix"
   ```

3. **Atualizar `validate:quick`** para ser mais rigoroso:
   - Já roda `npm run lint` — as novas regras serão capturadas automaticamente

4. **Documentar regras no DEVFLOW:**
   - `R-211`: ESLint import-x/no-unresolved obrigatório (R-003 automatizado)
   - `R-212`: ESLint no-console enforced em produção (R-116 automatizado)
   - `AP-126`: new Date('YYYY-MM-DD') agora bloqueado em lint (R-020 automatizado)

---

## Estrutura Final do `eslint.config.js`

```
eslint.config.js
├── [0] globalIgnores — dist, coverage, node_modules
├── [1] Base (shared) — all *.{js,jsx}
│       eslint:recommended + import-x + react-hooks + react-refresh
│       Aliases sync (16 paths)
│       no-restricted-imports (regressões Wave 9)
├── [2] Web Production — apps/web/src/**
│       no-console: error (allow error, warn)
│       no-restricted-syntax: new Date(string sem T)
│       no-relative-import-paths
│       import-x/order
│       import-x/no-unresolved
│       import-x/no-cycle
├── [3] Tests override — **/__tests__/**
│       no-console: off
│       no-restricted-syntax: warn (não error)
├── [4] Server — server/**
│       globals.node
│       n/no-process-exit: error
├── [5] API — api/** (excluindo api/**/_*)
│       globals.node
│       no-process-exit via no-restricted-syntax
├── [6] Mobile — apps/mobile/**
│       globals react-native
│       react-hooks
│       no-console: warn
├── [7] Packages — packages/*/src/**
│       no-console: error
│       import-x/no-cycle: error
```

---

## Packages a Instalar

| Package | Versão | Motivo |
|---------|--------|--------|
| `eslint-plugin-import-x` | ^4.x | Import validation, cycle detection (ESLint 9 native) |
| `eslint-import-resolver-alias` | ^1.x | Sync aliases Vite → ESLint |
| `eslint-plugin-no-relative-import-paths` | ^1.x | Enforce uso de aliases |
| `eslint-plugin-n` | ^17.x | Node.js rules para server/ e api/ |

> `@react-native/eslint-config` é opcional — pode usar globals simples do RN sem o config completo.

---

## Arquivos Críticos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `/eslint.config.js` | Reestruturar em 7 blocos conforme acima |
| `/.lintstagedrc.js` | Adicionar glob para mobile |
| `/package.json` | Adicionar `lint:fix` script + novas devDependencies |

---

## Verificação (Como Testar)

1. **Rodar lint após as mudanças:**
   ```bash
   npm run lint 2>&1 | head -100   # deve mostrar novos erros nos 30+ console.log
   ```

2. **Verificar que os aliases são resolvidos:**
   ```bash
   # Deve mostrar 0 erros de no-unresolved para @shared, @features, etc.
   npx eslint apps/web/src/features/dashboard/ --rule '{"import-x/no-unresolved": "error"}'
   ```

3. **Verificar cross-boundary:**
   ```bash
   # O teste com ../../../../../../server/ deve gerar erro
   npx eslint apps/web/src/services/api/__tests__/proactiveStockAlerts.test.js
   ```

4. **Testar autofix de imports relativos:**
   ```bash
   npm run lint:fix -- apps/web/src/shared/components/pwa/InstallPrompt.jsx
   ```

5. **CI:** `npm run validate:quick` deve continuar passando após os fixes automáticos.

---

## Ordem de Execução Recomendada

1. Instalar packages (sem quebrar nada ainda)
2. Fase 1: Sync de aliases + `import-x` (pode gerar warnings — corrigir antes de prosseguir)
3. Fase 2a: `no-console` como `warn` primeiro, migrar para `error` após limpar os 30+ casos
4. Fase 2b: `no-restricted-syntax` para datas (principalmente warning em testes)
5. Fase 2c: `no-relative-import-paths` com `--fix` automático
6. Fase 3: Blocos de server/api/mobile (menores, menos impacto)
7. Fase 4: Atualizar CI e documentar no DEVFLOW
