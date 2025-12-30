import './ProtocolChecklistItem.css'

export default function ProtocolChecklistItem({ protocol, isSelected, onToggle }) {
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const currentTime = getCurrentTime()

  return (
    <div 
      className={`protocol-checklist-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(protocol.id)}
    >
      <div className="checklist-left">
        <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
          {isSelected && '✓'}
        </div>
        <div className="checklist-info">
          <span className="checklist-name">💊 {protocol.name}</span>
          <div className="checklist-meta">
            <span className={`titration-badge ${protocol.titration_status}`}>
              {protocol.titration_status === 'titulando' ? '📈 Titulando' : 'Estável'}
            </span>
            <span className="dosage-badge">
              {protocol.dosage_per_intake} {protocol.dosage_per_intake === 1 ? 'comp.' : 'comps.'}
            </span>
          </div>
        </div>
      </div>

      <div className="checklist-right">
        <div className="time-pills">
          {protocol.time_schedule?.map(t => (
            <span 
              key={t} 
              className={`time-pill ${t <= currentTime ? 'past' : ''}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
