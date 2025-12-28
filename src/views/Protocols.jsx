import { useState, useEffect } from 'react'
import { medicineService, protocolService } from '../services/api'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import ProtocolForm from '../components/protocol/ProtocolForm'
import ProtocolCard from '../components/protocol/ProtocolCard'
import './Protocols.css'

export default function Protocols() {
  const [medicines, setMedicines] = useState([])
  const [protocols, setProtocols] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProtocol, setEditingProtocol] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [medicinesData, protocolsData] = await Promise.all([
        medicineService.getAll(),
        protocolService.getAll()
      ])
      
      setMedicines(medicinesData)
      setProtocols(protocolsData)
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    if (medicines.length === 0) {
      setError('Cadastre um medicamento antes de criar protocolos')
      return
    }
    setEditingProtocol(null)
    setIsModalOpen(true)
  }

  const handleEdit = (protocol) => {
    setEditingProtocol(protocol)
    setIsModalOpen(true)
  }

  const handleSave = async (protocolData) => {
    try {
      if (editingProtocol) {
        await protocolService.update(editingProtocol.id, protocolData)
        showSuccess('Protocolo atualizado com sucesso!')
      } else {
        await protocolService.create(protocolData)
        showSuccess('Protocolo criado com sucesso!')
      }
      
      setIsModalOpen(false)
      setEditingProtocol(null)
      await loadData()
    } catch (err) {
      throw new Error('Erro ao salvar protocolo: ' + err.message)
    }
  }

  const handleToggleActive = async (protocol) => {
    try {
      await protocolService.update(protocol.id, { active: !protocol.active })
      showSuccess(`Protocolo ${!protocol.active ? 'ativado' : 'pausado'} com sucesso!`)
      await loadData()
    } catch (err) {
      setError('Erro ao atualizar protocolo: ' + err.message)
      console.error(err)
    }
  }

  const handleDelete = async (protocol) => {
    if (!window.confirm(`Tem certeza que deseja excluir o protocolo "${protocol.name}"?`)) {
      return
    }

    try {
      await protocolService.delete(protocol.id)
      showSuccess('Protocolo excluído com sucesso!')
      await loadData()
    } catch (err) {
      setError('Erro ao excluir protocolo: ' + err.message)
      console.error(err)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Separar protocolos ativos e inativos
  const activeProtocols = protocols.filter(p => p.active)
  const inactiveProtocols = protocols.filter(p => !p.active)

  if (isLoading) {
    return (
      <div className="protocols-view">
        <Loading text="Carregando protocolos..." />
      </div>
    )
  }

  return (
    <div className="protocols-view">
      <div className="protocols-header">
        <div>
          <h2>📋 Protocolos</h2>
          <p className="protocols-subtitle">
            Gerencie seus protocolos de tratamento
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          ➕ Criar Protocolo
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
          <div className="empty-icon">📋</div>
          <h3>Nenhum medicamento cadastrado</h3>
          <p>Cadastre medicamentos primeiro para criar protocolos</p>
        </div>
      ) : protocols.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>Nenhum protocolo criado</h3>
          <p>Crie seu primeiro protocolo de tratamento</p>
          <Button variant="primary" onClick={handleAdd}>
            ➕ Criar Primeiro Protocolo
          </Button>
        </div>
      ) : (
        <div className="protocols-content">
          {/* Protocolos ativos */}
          {activeProtocols.length > 0 && (
            <div className="protocols-section">
              <h3 className="section-title active">
                ✅ Protocolos Ativos ({activeProtocols.length})
              </h3>
              <div className="protocols-grid">
                {activeProtocols.map(protocol => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Protocolos inativos */}
          {inactiveProtocols.length > 0 && (
            <div className="protocols-section">
              <h3 className="section-title inactive">
                ⏸️ Protocolos Pausados ({inactiveProtocols.length})
              </h3>
              <div className="protocols-grid">
                {inactiveProtocols.map(protocol => (
                  <ProtocolCard
                    key={protocol.id}
                    protocol={protocol}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProtocol(null)
        }}
      >
        <ProtocolForm
          medicines={medicines}
          protocol={editingProtocol}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingProtocol(null)
          }}
        />
      </Modal>
    </div>
  )
}
