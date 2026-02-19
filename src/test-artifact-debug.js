/**
 * Arquivo de teste para validar debug do artifact upload
 * Este arquivo contém erros de lint intencionais para testar:
 * 1. Se o debug step lista os arquivos corretamente
 * 2. Se o artifact é encontrado no upload
 */

// Erro intencional: variável não utilizada
const debugTestVariable = 'this should trigger a lint warning'

// Erro intencional: console.log em produção
console.log('Debug message for artifact test')

export default debugTestVariable
