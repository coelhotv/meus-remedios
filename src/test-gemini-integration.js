/**
 * Arquivo de teste para integração do Gemini Code Assist
 * Este arquivo contém erros de lint intencionais para testar:
 * 1. Trigger automático do Gemini
 * 2. Parsing de comentários
 * 3. Auto-fix de lint errors
 */

// Erro intencional: variável não utilizada
const unusedVariable = 'this variable is never used'

// Erro intencional: falta de ponto e vírgula (se configurado)
const missingSemicolon = 'missing semicolon'

// Erro intencional: console.log em código de produção
console.log('This should not be in production code')

// Função com erro de formatação
function testFunction(x, y) {
  return x + y
}

export default testFunction
