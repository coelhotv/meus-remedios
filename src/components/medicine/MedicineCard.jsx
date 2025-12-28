import Card from '../ui/Card'
import Button from '../ui/Button'
import './MedicineCard.css'

export default function MedicineCard({ medicine, onEdit, onDelete }) {
  return (
    <Card className="medicine-card">
      <div className="medicine-header">
        <h4 className="medicine-name">{medicine.name}</h4>
        {medicine.active_ingredient && (
          <span className="medicine-ingredient">{medicine.active_ingredient}</span>
        )}
      </div>

      <div className="medicine-details">
        {medicine.laboratory && (
          <div className="detail-item">
            <span className="detail-label">🏭 Laboratório:</span>
            <span className="detail-value">{medicine.laboratory}</span>
          </div>
        )}
        
        {medicine.dosage_per_pill && (
          <div className="detail-item">
            <span className="detail-label">💊 Dosagem:</span>
            <span className="detail-value">{medicine.dosage_per_pill} mg</span>
          </div>
        )}
        
        {medicine.price_paid && (
          <div className="detail-item">
            <span className="detail-label">💰 Preço:</span>
            <span className="detail-value">R$ {parseFloat(medicine.price_paid).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="medicine-actions">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(medicine)}
        >
          ✏️ Editar
        </Button>
        <Button 
          variant="danger" 
          size="sm"
          onClick={() => onDelete(medicine)}
        >
          🗑️ Excluir
        </Button>
      </div>
    </Card>
  )
}
