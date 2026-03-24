/**
 * useRedesign — hook para consumir o feature flag do redesign "Santuário Terapêutico".
 *
 * Retorna { isRedesignEnabled, toggleRedesign }.
 * Para ativar o redesign, acessar a app com ?redesign=1 na URL.
 *
 * Exportado separadamente de RedesignContext para seguir o padrão de hooks do projeto.
 */
export { useRedesign } from '@shared/contexts/RedesignContext'
