/**
 * AdherenceBar7d — Barra de adesão de 7 dias com indicador visual colorido
 * Mostra: preenchimento baseado em score (0-100%), cor contextual (verde/âmbar/vermelho)
 */
export default function AdherenceBar7d({ score }) {
  const pct = Math.round(Math.max(0, Math.min(100, score ?? 0)))
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="adherence-bar7d" title={`Adesão 7d: ${pct}%`}>
      <div className="adherence-bar7d__track">
        <div className="adherence-bar7d__fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="adherence-bar7d__label" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}
