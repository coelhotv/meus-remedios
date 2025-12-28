import { useState, useEffect } from 'react'
import { protocolService, logService, stockService, medicineService } from '../services/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import LogForm from '../components/log/LogForm'
import LogEntry from '../components/log/LogEntry'
import StockIndicator from '../components/stock/StockIndicator'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const [activeProtocols, setActiveProtocols] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [stockSummary, setStockSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadDashboardData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [protocols, logs, medicines] = await Promise.all([
        protocolService.getActive(),
        logService.getAll(10), // Últimos 10 registros
        medicineService.getAll()
      ])
      
      setActiveProtocols(protocols)
      setRecentLogs(logs)
      
      // Carregar estoque para cada medicamento
      const stockPromises = medicines.map(async (medicine) => {
        const entries = await stockService.getByMedicine(medicine.id)
        const total = entries.reduce((sum, entry) => sum + entry.quantity, 0)
        return { medicine, total }
      })
      
      const stockData = await Promise.all(stockPromises)
      setStockSummary(stockData.filter(item => item.total > 0))
      
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogMedicine = async (logData) => {
    try {
      await logService.create(logData)
      showSuccess('Medicamento registrado com sucesso! Estoque atualizado.')
      setIsModalOpen(false)
      await loadDashboardData()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (isLoading) {
    return (
      <div className="dashboard-view">
        <Loading text="Carregando dashboard..." />
      </div>
    )
  }

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div>
          <h2>🏠 Dashboard</h2>
          <p className="dashboard-subtitle">
            Visão geral dos seus medicamentos
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


      <div className="dashboard-grid">
        {/* Catálogo de Medicamentos */}
        <Card className="dashboard-card medicines-card">
          <div className="card-header">
            <h3>💊 Catálogo</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('medicines')}>
              Gerenciar
            </Button>
          </div>
          <div className="medicines-summary">
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
              Cadastre novos remédios e consulte o seu catálogo.
            </p>
            <Button variant="outline" size="sm" onClick={() => onNavigate('medicines')}>
              Ver Medicamentos
            </Button>
          </div>
        </Card>

        {/* Protocolos Ativos */}
        <Card className="dashboard-card protocols-card">
          <div className="card-header">
            <h3>📋 Protocolos Ativos</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('protocols')}>
              Ver todos
            </Button>
          </div>
          
          {activeProtocols.length === 0 ? (
            <div className="empty-message">
              <p>Nenhum protocolo ativo</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('protocols')}>
                Criar Protocolo
              </Button>
            </div>
          ) : (
            <div className="protocols-list">
              {activeProtocols.slice(0, 3).map(protocol => (
                <div key={protocol.id} className="protocol-item">
                  <div className="protocol-info-dash">
                    <h4>{protocol.name}</h4>
                    <span className="protocol-medicine-dash">{protocol.medicine?.name}</span>
                  </div>
                  <div className="protocol-schedule">
                    {protocol.time_schedule && protocol.time_schedule.map(time => (
                      <span 
                        key={time} 
                        className={`time-badge-dash ${time <= getCurrentTime() ? 'past' : ''}`}
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Estoque */}
        <Card className="dashboard-card stock-card">
          <div className="card-header">
            <h3>📦 Estoque</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
              Ver todos
            </Button>
          </div>
          
          {stockSummary.length === 0 ? (
            <div className="empty-message">
              <p>Nenhum estoque cadastrado</p>
              <Button variant="outline" size="sm" onClick={() => onNavigate('stock')}>
                Adicionar Estoque
              </Button>
            </div>
          ) : (
            <div className="stock-list">
              {stockSummary.slice(0, 3).map(item => (
                <div key={item.medicine.id} className="stock-item">
                  <div className="stock-info-dash">
                    <h4>{item.medicine.name}</h4>
                  </div>
                  <StockIndicator quantity={item.total} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Histórico Recente */}
        <Card className="dashboard-card history-card full-width">
          <div className="card-header">
            <h3>📝 Histórico Recente</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
              Ver todos
            </Button>
          </div>
          
          {recentLogs.length === 0 ? (
            <div className="empty-message">
              <p>Nenhum registro ainda</p>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
                Registrar Primeira Dose
              </Button>
            </div>
          ) : (
            <div className="logs-timeline">
              {recentLogs.slice(0, 5).map(log => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <LogForm
          protocols={activeProtocols}
          onSave={handleLogMedicine}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
