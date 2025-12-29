import { useState, useEffect, useCallback } from 'react'
import { logService, protocolService } from '../services/api'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import LogForm from '../components/log/LogForm'
import LogEntry from '../components/log/LogEntry'
import './History.css'

export default function History() {
  const [logs, setLogs] = useState([])
  const [protocols, setProtocols] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')


  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [logsData, protocolsData] = await Promise.all([
        logService.getAll(100), // Últimos 100 registros
        protocolService.getActive()
      ])
      
      setLogs(logsData)
      setProtocols(protocolsData)
    } catch (err) {
      setError('Erro ao carregar histórico: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogMedicine = async (logData) => {
    try {
      await logService.create(logData)
      showSuccess('Medicamento registrado com sucesso! Estoque atualizado.')
      setIsModalOpen(false)
      await loadData()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  // Agrupar logs por data
  const groupLogsByDate = () => {
    const grouped = {}
    
    logs.forEach(log => {
      const date = new Date(log.taken_at).toLocaleDateString('pt-BR')
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(log)
    })
    
    return grouped
  }

  const groupedLogs = groupLogsByDate()
  const dates = Object.keys(groupedLogs).sort((a, b) => {
    const dateA = new Date(a.split('/').reverse().join('-'))
    const dateB = new Date(b.split('/').reverse().join('-'))
    return dateB - dateA
  })

  if (isLoading) {
    return (
      <div className="history-view">
        <Loading text="Carregando histórico..." />
      </div>
    )
  }

  return (
    <div className="history-view">
      <div className="history-header">
        <div>
          <h2>📝 Histórico</h2>
          <p className="history-subtitle">
            Registro completo de medicamentos tomados
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          ✅ Registrar Dose
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

      {logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>Nenhum registro ainda</h3>
          <p>Comece registrando sua primeira dose</p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            ✅ Registrar Primeira Dose
          </Button>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-stats">
            <div className="stat-card">
              <span className="stat-value">{logs.length}</span>
              <span className="stat-label">Doses Registradas</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{dates.length}</span>
              <span className="stat-label">Dias com Registro</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {logs.reduce((sum, log) => sum + log.quantity_taken, 0)}
              </span>
              <span className="stat-label">Comprimidos Tomados</span>
            </div>
          </div>

          <div className="history-timeline">
            {dates.map(date => (
              <div key={date} className="timeline-day">
                <div className="day-header">
                  <h3>{date}</h3>
                  <span className="day-count">
                    {groupedLogs[date].length} {groupedLogs[date].length === 1 ? 'dose' : 'doses'}
                  </span>
                </div>
                <div className="day-logs">
                  {groupedLogs[date].map(log => (
                    <LogEntry key={log.id} log={log} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <LogForm
          protocols={protocols}
          onSave={handleLogMedicine}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
