import { useState } from 'react'
import Button from '../ui/Button'
import './MedicineForm.css'

export default function MedicineForm({ medicine, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: medicine?.name || '',
    laboratory: medicine?.laboratory || '',
    active_ingredient: medicine?.active_ingredient || '',
    dosage_per_pill: medicine?.dosage_per_pill || ''
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Limpa erro do campo quando usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    
    if (formData.dosage_per_pill && isNaN(formData.dosage_per_pill)) {
      newErrors.dosage_per_pill = 'Deve ser um número'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setIsSubmitting(true)
    
    try {
      // Converte strings vazias para null e números para o tipo correto
      const dataToSave = {
        name: formData.name.trim(),
        laboratory: formData.laboratory.trim() || null,
        active_ingredient: formData.active_ingredient.trim() || null,
        dosage_per_pill: formData.dosage_per_pill ? parseFloat(formData.dosage_per_pill) : null
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
    <form className="medicine-form" onSubmit={handleSubmit}>
      <h3>{medicine ? 'Editar Medicamento' : 'Novo Medicamento'}</h3>
      
      <div className="form-group">
        <label htmlFor="name">
          Nome do Remédio <span className="required">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Ex: Paracetamol"
          autoFocus
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="active_ingredient">Princípio Ativo</label>
        <input
          type="text"
          id="active_ingredient"
          name="active_ingredient"
          value={formData.active_ingredient}
          onChange={handleChange}
          placeholder="Ex: Paracetamol"
        />
      </div>

      <div className="form-group">
        <label htmlFor="laboratory">Laboratório</label>
        <input
          type="text"
          id="laboratory"
          name="laboratory"
          value={formData.laboratory}
          onChange={handleChange}
          placeholder="Ex: EMS, Medley, etc."
        />
      </div>

      <div className="form-group">
        <label htmlFor="dosage_per_pill">Dosagem por Comprimido (mg)</label>
        <input
          type="number"
          id="dosage_per_pill"
          name="dosage_per_pill"
          value={formData.dosage_per_pill}
          onChange={handleChange}
          className={errors.dosage_per_pill ? 'error' : ''}
          placeholder="500"
          step="0.01"
        />
        {errors.dosage_per_pill && <span className="error-message">{errors.dosage_per_pill}</span>}
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
          {isSubmitting ? 'Salvando...' : medicine ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  )
}
