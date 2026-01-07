import { useState, useEffect, useCallback } from 'react'
import { logService, protocolService } from '../services/api'
import Button from '../components/ui/Button'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import LogForm from '../components/log/LogForm'
import Calendar from '../components/ui/Calendar'
import LogEntry from '../components/log/LogEntry'
import './History.css'

export default function History() {
  const [logs, setLogs] = useState([])
  const [protocols, setProtocols] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date())
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
      
      if (logsData.length > 0) {
        setSelectedCalendarDate(new Date(logsData[0].taken_at))
      }
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
      if (logData.id) {
        await logService.update(logData.id, logData)
        showSuccess('Registro atualizado com sucesso!')
      } else {
        await logService.create(logData)
        showSuccess('Medicamento registrado com sucesso! Estoque atualizado.')
      }
      setIsModalOpen(false)
      setEditingLog(null)
      await loadData()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const handleDeleteLog = async (id) => {
    try {
      await logService.delete(id)
      showSuccess('Registro removido e estoque restabelecido!')
      await loadData()
    } catch (err) {
      setError('Erro ao remover registro: ' + err.message)
    }
  }

  const handleEditClick = (log) => {
    setEditingLog(log)
    setIsModalOpen(true)
  }

  const handleOpenNewLog = () => {
    setEditingLog(null)
    setIsModalOpen(true)
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
        <Button variant="primary" onClick={handleOpenNewLog}>
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
          <Button variant="primary" onClick={handleOpenNewLog}>
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

          {/* Calendar Section */}
          <div className="history-calendar-section" style={{ 
            background: 'var(--bg-glass)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-8)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)', alignItems: 'start' }}>
              <Calendar 
                markedDates={logs.map(log => log.taken_at)} 
                selectedDate={selectedCalendarDate}
                onDayClick={(date) => setSelectedCalendarDate(date)}
              />
              
              <div className="day-details">
                <h4 style={{ marginBottom: 'var(--space-4)', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Doses de {selectedCalendarDate.toLocaleDateString('pt-BR')}
                </h4>
                
                {(() => {
                  const dayLogs = logs.filter(log => {
                    const d = new Date(log.taken_at)
                    return d.getFullYear() === selectedCalendarDate.getFullYear() &&
                           d.getMonth() === selectedCalendarDate.getMonth() &&
                           d.getDate() === selectedCalendarDate.getDate()
                  })

                  return dayLogs.length === 0 ? (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Nenhum registro selecionado
                    </p>
                  ) : (
                    <div className="day-logs-mini">
                      {dayLogs.map(log => (
                        <div 
                          key={log.id} 
                          onClick={() => handleEditClick(log)}
                          style={{ 
                            padding: 'var(--space-3)', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-2)',
                            borderLeft: '3px solid var(--accent-success)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{log.medicine?.name}</span>
                            <span>✏️</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            {new Date(log.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
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
                    <LogEntry 
                      key={log.id} 
                      log={log} 
                      onEdit={handleEditClick} 
                      onDelete={handleDeleteLog}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingLog(null)
        }}
      >
        <LogForm
          protocols={protocols}
          initialValues={editingLog}
          onSave={handleLogMedicine}
          onCancel={() => {
            setIsModalOpen(false)
            setEditingLog(null)
          }}
        />
      </Modal>
    </div>
  )
}
