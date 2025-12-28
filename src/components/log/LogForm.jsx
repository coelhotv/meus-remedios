import { useState } from 'react'
import Button from '../ui/Button'
import './LogForm.css'

export default function LogForm({ protocols, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    protocol_id: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProtocol = protocols.find(p => p.id === formData.protocol_id)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.protocol_id) {
      newErrors.protocol_id = 'Selecione um protocolo'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      const protocol = protocols.find(p => p.id === formData.protocol_id)
      
      const dataToSave = {
        protocol_id: formData.protocol_id,
        medicine_id: protocol.medicine_id,
        quantity_taken: protocol.dosage_per_intake,
        notes: formData.notes.trim() || null
      }
      
      await onSave(dataToSave)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="log-form" onSubmit={handleSubmit}>
      <h3>Registrar Medicamento Tomado</h3>
      
      <div className="form-group">
        <label htmlFor="protocol_id">
          Protocolo <span className="required">*</span>
        </label>
        <select
          id="protocol_id"
          name="protocol_id"
          value={formData.protocol_id}
          onChange={handleChange}
          className={errors.protocol_id ? 'error' : ''}
          autoFocus
        >
          <option value="">Selecione um protocolo</option>
          {protocols.map(protocol => (
            <option key={protocol.id} value={protocol.id}>
              {protocol.name} - {protocol.medicine?.name}
            </option>
          ))}
        </select>
        {errors.protocol_id && <span className="error-message">{errors.protocol_id}</span>}
      </div>

      {selectedProtocol && (
        <div className="protocol-info">
          <div className="info-item">
            <span className="info-label">💊 Medicamento:</span>
            <span className="info-value">{selectedProtocol.medicine?.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">📊 Quantidade:</span>
            <span className="info-value">
              {selectedProtocol.dosage_per_intake} {selectedProtocol.dosage_per_intake === 1 ? 'comprimido' : 'comprimidos'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">📅 Frequência:</span>
            <span className="info-value">{selectedProtocol.frequency}</span>
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="notes">Observações (opcional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Ex: Tomei com água, após café da manhã..."
          rows="3"
        />
      </div>

      {errors.submit && (
        <div className="error-banner">
          ❌ {errors.submit}
        </div>
      )}

      <div className="form-actions">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          disabled={isSubmitting || !formData.protocol_id}
        >
          {isSubmitting ? 'Registrando...' : '✅ Registrar Dose'}
        </Button>
      </div>
    </form>
  )
}
