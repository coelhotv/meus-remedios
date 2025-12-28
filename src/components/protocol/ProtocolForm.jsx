import { useState } from 'react'
import Button from '../ui/Button'
import './ProtocolForm.css'

export default function ProtocolForm({ medicines, protocol, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    medicine_id: protocol?.medicine_id || '',
    name: protocol?.name || '',
    frequency: protocol?.frequency || '',
    time_schedule: protocol?.time_schedule || [],
    dosage_per_intake: protocol?.dosage_per_intake || '',
    notes: protocol?.notes || '',
    active: protocol?.active !== undefined ? protocol.active : true
  })
  
  const [timeInput, setTimeInput] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const addTime = () => {
    if (!timeInput) return
    
    if (formData.time_schedule.includes(timeInput)) {
      setErrors({ time_schedule: 'Horário já adicionado' })
      return
    }
    
    setFormData(prev => ({
      ...prev,
      time_schedule: [...prev.time_schedule, timeInput].sort()
    }))
    setTimeInput('')
    setErrors(prev => ({ ...prev, time_schedule: '' }))
  }

  const removeTime = (time) => {
    setFormData(prev => ({
      ...prev,
      time_schedule: prev.time_schedule.filter(t => t !== time)
    }))
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.medicine_id) {
      newErrors.medicine_id = 'Selecione um medicamento'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome do protocolo é obrigatório'
    }
    
    if (!formData.frequency.trim()) {
      newErrors.frequency = 'Frequência é obrigatória'
    }
    
    if (formData.time_schedule.length === 0) {
      newErrors.time_schedule = 'Adicione pelo menos um horário'
    }
    
    if (!formData.dosage_per_intake || formData.dosage_per_intake <= 0) {
      newErrors.dosage_per_intake = 'Dosagem deve ser maior que zero'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      const dataToSave = {
        medicine_id: formData.medicine_id,
        name: formData.name.trim(),
        frequency: formData.frequency.trim(),
        time_schedule: formData.time_schedule,
        dosage_per_intake: parseFloat(formData.dosage_per_intake),
        notes: formData.notes.trim() || null,
        active: formData.active
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
    <form className="protocol-form" onSubmit={handleSubmit}>
      <h3>{protocol ? 'Editar Protocolo' : 'Novo Protocolo'}</h3>
      
      <div className="form-group">
        <label htmlFor="medicine_id">
          Medicamento <span className="required">*</span>
        </label>
        <select
          id="medicine_id"
          name="medicine_id"
          value={formData.medicine_id}
          onChange={handleChange}
          className={errors.medicine_id ? 'error' : ''}
          disabled={!!protocol} // Não permite mudar medicamento ao editar
        >
          <option value="">Selecione um medicamento</option>
          {medicines.map(medicine => (
            <option key={medicine.id} value={medicine.id}>
              {medicine.name} {medicine.dosage_per_pill ? `(${medicine.dosage_per_pill}mg)` : ''}
            </option>
          ))}
        </select>
        {errors.medicine_id && <span className="error-message">{errors.medicine_id}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="name">
          Nome do Protocolo <span className="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Ex: Paracetamol para dor"
          autoFocus={!protocol}
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="frequency">
            Frequência <span className="required">*</span>
          </label>
          <input
            type="text"
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            className={errors.frequency ? 'error' : ''}
            placeholder="Ex: 2x ao dia, a cada 8 horas"
          />
          {errors.frequency && <span className="error-message">{errors.frequency}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dosage_per_intake">
            Comprimidos por Vez <span className="required">*</span>
          </label>
          <input
            type="number"
            id="dosage_per_intake"
            name="dosage_per_intake"
            value={formData.dosage_per_intake}
            onChange={handleChange}
            className={errors.dosage_per_intake ? 'error' : ''}
            placeholder="1"
            min="0.5"
            step="0.5"
          />
          {errors.dosage_per_intake && <span className="error-message">{errors.dosage_per_intake}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="time_input">
          Horários <span className="required">*</span>
        </label>
        <div className="time-input-group">
          <input
            type="time"
            id="time_input"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            className={errors.time_schedule ? 'error' : ''}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addTime}
          >
            ➕ Adicionar
          </Button>
        </div>
        {errors.time_schedule && <span className="error-message">{errors.time_schedule}</span>}
        
        {formData.time_schedule.length > 0 && (
          <div className="time-schedule-list">
            {formData.time_schedule.map(time => (
              <div key={time} className="time-chip">
                <span>{time}</span>
                <button 
                  type="button" 
                  onClick={() => removeTime(time)}
                  className="remove-time"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="notes">Observações</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Informações adicionais sobre o protocolo..."
          rows="3"
        />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
          />
          <span>Protocolo ativo</span>
        </label>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : protocol ? 'Atualizar' : 'Criar Protocolo'}
        </Button>
      </div>
    </form>
  )
}
