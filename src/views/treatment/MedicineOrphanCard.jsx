import './Treatment.css'

export default function MedicineOrphanCard({ medicine, onCreateProtocol, onDeleteMedicine }) {
  return (
    <div className="medicine-orphan-card">
      <div className="medicine-orphan-card__info">
        <div className="medicine-orphan-card__header">
          <span className="medicine-orphan-card__name">{medicine.name}</span>
          {onDeleteMedicine && (
            <button
              className="medicine-orphan-card__delete"
              onClick={() => onDeleteMedicine(medicine)}
              title="Deletar medicamento"
            >
              ❌
            </button>
          )}
        </div>
        <span className="medicine-orphan-card__detail">
          {medicine.dosage_per_pill}
          {medicine.dosage_unit} · {medicine.type || 'comprimido'}
        </span>
      </div>
      {onCreateProtocol && (
        <button className="medicine-orphan-card__cta" onClick={() => onCreateProtocol(medicine)}>
          Criar protocolo →
        </button>
      )}
    </div>
  )
}
