import { useState } from 'react'
import Button from '../ui/Button'
import './LogForm.css'

export default function LogForm({ protocols, treatmentPlans = [], onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'protocol', // 'protocol' or 'plan'
    protocol_id: '',
    treatment_plan_id: '',
    notes: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProtocol = protocols.find(p => p.id === formData.protocol_id)
  const selectedPlan = treatmentPlans.find(p => p.id === formData.treatment_plan_id)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (formData.type === 'protocol' && !formData.protocol_id) {
      newErrors.protocol_id = 'Selecione um protocolo'
    }
    
    if (formData.type === 'plan' && !formData.treatment_plan_id) {
      newErrors.treatment_plan_id = 'Selecione um plano'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      if (formData.type === 'protocol') {
        const protocol = protocols.find(p => p.id === formData.protocol_id)
        const dataToSave = {
          protocol_id: formData.protocol_id,
          medicine_id: protocol.medicine_id,
          quantity_taken: protocol.dosage_per_intake,
          notes: formData.notes.trim() || null
        }
        await onSave(dataToSave)
      } else {
        // Plan bulk log
        const plan = treatmentPlans.find(p => p.id === formData.treatment_plan_id)
        const activeProtocols = plan.protocols?.filter(p => p.active) || []
        
        if (activeProtocols.length === 0) {
          throw new Error('Este plano não possui protocolos ativos')
        }

        const logsToSave = activeProtocols.map(p => ({
          protocol_id: p.id,
          medicine_id: p.medicine_id,
          quantity_taken: p.dosage_per_intake,
          notes: `[Lote: ${plan.name}] ${formData.notes.trim()}`.trim()
        }))
        
        await onSave(logsToSave)
      }
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
      
      <div className="log-type-toggle">
        <button 
          type="button" 
          className={formData.type === 'protocol' ? 'active' : ''}
          onClick={() => setFormData(prev => ({ ...prev, type: 'protocol' }))}
        >
          💊 Único Remédio
        </button>
        <button 
          type="button" 
          className={formData.type === 'plan' ? 'active' : ''}
          onClick={() => setFormData(prev => ({ ...prev, type: 'plan' }))}
          disabled={treatmentPlans.length === 0}
        >
          📁 Plano Completo
        </button>
      </div>

      {formData.type === 'protocol' ? (
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
      ) : (
        <div className="form-group">
          <label htmlFor="treatment_plan_id">
            Plano de Tratamento <span className="required">*</span>
          </label>
          <select
            id="treatment_plan_id"
            name="treatment_plan_id"
            value={formData.treatment_plan_id}
            onChange={handleChange}
            className={errors.treatment_plan_id ? 'error' : ''}
          >
            <option value="">Selecione um plano</option>
            {treatmentPlans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.protocols?.filter(p => p.active).length || 0} remédios)
              </option>
            ))}
          </select>
          {errors.treatment_plan_id && <span className="error-message">{errors.treatment_plan_id}</span>}
        </div>
      )}

      {selectedProtocol && formData.type === 'protocol' && (
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
        </div>
      )}

      {selectedPlan && formData.type === 'plan' && (
        <div className="protocol-info">
          <p className="plan-summary-title">Medicamentos incluídos:</p>
          <div className="plan-medicines-list">
            {selectedPlan.protocols?.filter(p => p.active).map(p => (
              <div key={p.id} className="plan-med-item">
                <span>💊 {p.name}</span>
                <span>{p.dosage_per_intake} comp.</span>
              </div>
            ))}
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
