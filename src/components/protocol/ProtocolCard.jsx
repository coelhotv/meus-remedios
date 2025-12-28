import Card from '../ui/Card'
import Button from '../ui/Button'
import './ProtocolCard.css'

export default function ProtocolCard({ protocol, onEdit, onToggleActive, onDelete }) {
  const formatTime = (time) => {
    return time // Already in HH:MM format
  }

  return (
    <Card className={`protocol-card ${!protocol.active ? 'inactive' : ''}`}>
      <div className="protocol-header">
        <div>
          <h4 className="protocol-name">{protocol.name}</h4>
          <span className="protocol-medicine">
            {protocol.medicine?.name} 
            {protocol.medicine?.dosage_per_pill && ` (${protocol.medicine.dosage_per_pill}mg)`}
          </span>
        </div>
        <div className={`protocol-status ${protocol.active ? 'active' : 'inactive'}`}>
          {protocol.active ? '✅ Ativo' : '⏸️ Pausado'}
        </div>
      </div>

      <div className="protocol-details">
        <div className="detail-item">
          <span className="detail-label">📅 Frequência:</span>
          <span className="detail-value">{protocol.frequency}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">💊 Dosagem:</span>
          <span className="detail-value">
            {protocol.dosage_per_intake} {protocol.dosage_per_intake === 1 ? 'comprimido' : 'comprimidos'}
            {protocol.target_dosage && (
              <span className="titration-progress"> (Alvo: {protocol.target_dosage}mg)</span>
            )}
          </span>
        </div>

        {protocol.titration_status && protocol.titration_status !== 'estável' && (
          <div className="detail-item titration">
            <span className={`titration-badge ${protocol.titration_status}`}>
              {protocol.titration_status === 'titulando' ? '📈 Titulando' : '🎯 Alvo Atingido'}
            </span>
          </div>
        )}
        
        {protocol.time_schedule && protocol.time_schedule.length > 0 && (
          <div className="detail-item schedule">
            <span className="detail-label">⏰ Horários:</span>
            <div className="schedule-times">
              {protocol.time_schedule.map(time => (
                <span key={time} className="time-badge">
                  {formatTime(time)}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {protocol.notes && (
          <div className="detail-item notes">
            <span className="detail-label">📝 Observações:</span>
            <p className="detail-value">{protocol.notes}</p>
          </div>
        )}
      </div>

      <div className="protocol-actions">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(protocol)}
        >
          ✏️ Editar
        </Button>
        <Button 
          variant={protocol.active ? 'ghost' : 'secondary'} 
          size="sm"
          onClick={() => onToggleActive(protocol)}
        >
          {protocol.active ? '⏸️ Pausar' : '▶️ Ativar'}
        </Button>
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => onDelete(protocol)}
        >
          🗑️ Excluir
        </Button>
      </div>
    </Card>
  )
}
