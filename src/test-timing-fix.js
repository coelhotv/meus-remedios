/**
 * Arquivo de teste para validar fix do timing issue
 * Este arquivo contém erros de lint intencionais para testar:
 * 1. Se o polling aguarda os comentários inline do Gemini
 * 2. Se o parsing detecta os issues corretamente
 * 3. Se o output estruturado é gerado
 */

// Erro intencional: variável não utilizada
const unusedTestVariable = 'this should trigger a lint warning'

// Erro intencional: console.log em produção
console.log('Debug message that should be removed')

// Função com formatação incorreta
function badlyFormattedFunction(x,y) {
  return x+y
}

export default badlyFormattedFunction