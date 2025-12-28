import { useState, useEffect } from 'react'
import { protocolService, logService, stockService, medicineService, treatmentPlanService } from '../services/api'
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
  const [treatmentPlans, setTreatmentPlans] = useState([])
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
      
      const [protocols, plans, logs, medicines] = await Promise.all([
        protocolService.getActive(),
        treatmentPlanService.getAll(),
        logService.getAll(10), // Últimos 10 registros
        medicineService.getAll()
      ])
      
      setActiveProtocols(protocols)
      setTreatmentPlans(plans)
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
      if (Array.isArray(logData)) {
        await logService.createBulk(logData)
        showSuccess('Lote de medicamentos registrado com sucesso!')
      } else {
        await logService.create(logData)
        showSuccess('Medicamento registrado com sucesso!')
      }
      setIsModalOpen(false)
      await loadDashboardData()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  const handleTakeAllFromPlan = async (plan) => {
    const activeProtocols = plan.protocols?.filter(p => p.active) || []
    if (activeProtocols.length === 0) return

    const logs = activeProtocols.map(p => ({
      protocol_id: p.id,
      medicine_id: p.medicine_id,
      quantity_taken: p.dosage_per_intake,
      notes: `[Ação Rápida: ${plan.name}]`
    }))

    await handleLogMedicine(logs)
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
        {/* Planos de Tratamento (Destaque) */}
        {treatmentPlans.length > 0 && (
          <div className="treatment-plans-grid full-width">
            {treatmentPlans.map(plan => (
              <Card key={plan.id} className="dashboard-card plan-card-dash">
                <div className="card-header">
                  <h3>📁 {plan.name}</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="plan-objective-dash">{plan.objective}</span>
                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={() => handleTakeAllFromPlan(plan)}
                      disabled={!plan.protocols?.some(p => p.active)}
                    >
                      ✅ Tomar Todas
                    </Button>
                  </div>
                </div>
                <div className="plan-summary-dash">
                  {plan.protocols?.filter(p => p.active).map(p => (
                    <div key={p.id} className="plan-protocol-item-dash">
                      <span>💊 {p.name}</span>
                      <div className="protocol-meta-dash">
                        <span className={`status-tag-dash ${p.titration_status}`}>
                          {p.titration_status === 'titulando' ? '📈 Titulando' : '✅'}
                        </span>
                        <div className="plan-times-dash">
                          {p.time_schedule?.map(t => (
                            <span key={t} className={`time-mini-dash ${t <= getCurrentTime() ? 'past' : ''}`}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

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
              Ver Catálogo
            </Button>
          </div>
        </Card>

        {/* Protocolos Isolados */}
        <Card className="dashboard-card protocols-card">
          <div className="card-header">
            <h3>📋 Protocolos {treatmentPlans.length > 0 ? 'Avulsos' : 'Ativos'}</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('protocols')}>
              Ver todos
            </Button>
          </div>
          
          {activeProtocols.filter(p => !p.treatment_plan_id).length === 0 ? (
            <div className="empty-message">
              <p>Nenhum protocolo avulso</p>
            </div>
          ) : (
            <div className="protocols-list">
              {activeProtocols.filter(p => !p.treatment_plan_id).slice(0, 3).map(protocol => (
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
          treatmentPlans={treatmentPlans}
          onSave={handleLogMedicine}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
