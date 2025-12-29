import { useState, useEffect } from 'react'
import { medicineService } from '../services/api'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import MedicineForm from '../components/medicine/MedicineForm'
import MedicineCard from '../components/medicine/MedicineCard'
import './Medicines.css'

export default function Medicines() {
  const [medicines, setMedicines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')


  const loadMedicines = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await medicineService.getAll()
      setMedicines(data)
    } catch (err) {
      setError('Erro ao carregar medicamentos: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMedicines()
  }, [])

  const handleAdd = () => {
    setEditingMedicine(null)
    setIsModalOpen(true)
  }

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine)
    setIsModalOpen(true)
  }

  const handleSave = async (medicineData) => {
    try {
      if (editingMedicine) {
        await medicineService.update(editingMedicine.id, medicineData)
        showSuccess('Medicamento atualizado com sucesso!')
      } else {
        await medicineService.create(medicineData)
        showSuccess('Medicamento cadastrado com sucesso!')
      }
      
      setIsModalOpen(false)
      setEditingMedicine(null)
      await loadMedicines()
    } catch (err) {
      throw new Error('Erro ao salvar medicamento: ' + err.message)
    }
  }

  const handleDelete = async (medicine) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${medicine.name}"?`)) {
      return
    }

    try {
      await medicineService.delete(medicine.id)
      showSuccess('Medicamento excluído com sucesso!')
      await loadMedicines()
    } catch (err) {
      setError('Erro ao excluir medicamento: ' + err.message)
      console.error(err)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <div className="medicines-view">
        <Loading text="Carregando medicamentos..." />
      </div>
    )
  }

  return (
    <div className="medicines-view">
      <div className="medicines-header">
        <div>
          <h2>💊 Medicamentos</h2>
          <p className="medicines-subtitle">
            Gerencie seus medicamentos cadastrados
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          ➕ Adicionar Medicamento
        </Button>
      </div>

      {successMessage && (
        <div className="success-banner fade-in">
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div className="error-banner fade-in">
          ❌ {error}
        </div>
      )}

      {medicines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💊</div>
          <h3>Nenhum medicamento cadastrado</h3>
          <p>Comece adicionando seu primeiro medicamento</p>
          <Button variant="primary" onClick={handleAdd}>
            ➕ Adicionar Primeiro Medicamento
          </Button>
        </div>
      ) : (
        <div className="medicines-grid">
          {medicines.map(medicine => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMedicine(null)
        }}
      >
        <MedicineForm
          medicine={editingMedicine}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingMedicine(null)
          }}
        />
      </Modal>
    </div>
  )
}
