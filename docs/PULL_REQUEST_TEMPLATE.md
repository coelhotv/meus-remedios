# 📦 Template de Pull Request

> **⚠️ INSTRUÇÕES DE USO**
> 
> Este é um **template estrutural** para criação de Pull Requests.
> 
> - **NÃO** copie e cole o conteúdo diretamente
> - **SUBSTITUA** todos os exemplos pelo conteúdo real da sua PR
> - **ADAPTE** as seções conforme necessário para o escopo da sua PR
> - **REMOVA** seções que não se aplicam
> - **MANTENHA** a estrutura e formatação para consistência

---

## 🎯 Resumo

<!-- 
  Descreva brevemente o que esta PR entrega.
  
  Exemplos:
  - "Esta PR implementa a Fase X do roadmap, focada em..."
  - "Esta PR corrige o bug #123 que causava..."
  - "Esta PR refatora o componente X para melhorar..."
-->

[Descreva aqui o resumo da sua PR]

---

## 📋 Tarefas Implementadas

<!-- 
  Liste as tarefas implementadas com checkboxes.
  Use ✅ para itens concluídos e ⬜ para itens pendentes.
  
  Exemplo de estrutura:
  
  ### ✅ Nome da Tarefa 1
  - [x] Subtarefa concluída
  - [x] Outra subtarefa
  - [ ] Subtarefa pendente (se houver)
-->

### ✅ [Nome da Tarefa 1]
- [x] [Descrição da subtarefa]
- [x] [Descrição da subtarefa]

### ✅ [Nome da Tarefa 2]
- [x] [Descrição da subtarefa]
- [x] [Descrição da subtarefa]

---

## 📊 Métricas de Melhoria

<!-- 
  Inclua métricas quantitativas quando possível.
  Use tabela para comparar antes/depois.
  
  Exemplo:
  
  | Métrica | Antes | Depois | Melhoria |
  |---------|-------|--------|----------|
  | Tempo de carregamento | ~2s | ~100ms | 95% |
  | Cobertura de testes | ~10% | ~75% | +65% |
-->

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| [Nome da métrica] | [Valor anterior] | [Valor novo] | [Percentual/Fator] |

---

## 🔧 Arquivos Principais

<!-- 
  Liste os arquivos principais modificados/criados.
  Use estrutura de árvore para melhor visualização.
  
  Exemplo:
  
  src/
  ├── components/
  │   └── NovoComponente.jsx
  ├── services/
  │   └── novoService.js
  └── styles/
      └── novoComponente.css
-->

```
[Liste aqui os arquivos principais modificados/criados]
```

---

## ✅ Checklist de Verificação

### Código
- [ ] Todos os testes passam (`npm test` ou `npm run test:critical`)
- [ ] Lint sem erros (`npm run lint`)
- [ ] Build bem-sucedido (`npm run build`)
- [ ] Type checking passa (se aplicável)

### Funcionalidade
- [ ] [Funcionalidade específica 1 testada]
- [ ] [Funcionalidade específica 2 testada]
- [ ] [Caso de edge testado]

### Performance
- [ ] [Métrica de performance 1 verificada]
- [ ] [Métrica de performance 2 verificada]

### Documentação
- [ ] README atualizado (se necessário)
- [ ] JSDoc em funções públicas
- [ ] Migrations documentadas (se aplicável)

---

## 🚀 Como Testar

<!-- 
  Forneça instruções claras para testar a PR localmente.
  Inclua comandos específicos e passos manuais se necessário.
  
  Exemplo:
  
  ```bash
  # 1. Instalar dependências
  npm install

  # 2. Executar testes
  npm run test:critical

  # 3. Verificar lint
  npm run lint

  # 4. Build de produção
  npm run build

  # 5. Testar localmente
  npm run dev
  ```
-->

```bash
[Comandos para testar a PR]
```

---

## 🔗 Issues Relacionadas

<!-- 
  Linke issues relacionadas usando keywords do GitHub.
  
  - Closes #123 - fecha a issue automaticamente
  - Fixes #123 - corrige a issue automaticamente
  - Related to #123 - apenas relaciona
-->

- Closes #[número da issue]
- Related to #[número da issue]

---

## 📝 Notas para Reviewers

<!-- 
  Adicione notas específicas para quem vai revisar a PR.
  Destaque pontos de atenção e áreas que precisam de foco.
  
  Exemplo:
  
  1. **Testes:** Foco nos testes de integração do módulo X
  2. **Performance:** Verificar benchmark em `docs/`
  3. **Segurança:** Validar inputs do formulário Y
  4. **UX:** Testar em dispositivo móvel real
-->

1. **[Área de foco 1]:** [Descrição do que verificar]
2. **[Área de foco 2]:** [Descrição do que verificar]

---

## 🏷️ Versão

<!-- 
  Indique o tipo de versão e tag sugerida.
  
  - **Major** (X.0.0): Breaking changes
  - **Minor** (0.X.0): Novas funcionalidades
  - **Patch** (0.0.X): Bug fixes
-->

**Tipo:** [Major/Minor/Patch] (`[versão atual]` → `[nova versão]`)
**Tag sugerida:** `v[nova versão]`

---

/cc @reviewers
