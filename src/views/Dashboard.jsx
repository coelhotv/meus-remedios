import { useState, useEffect, useCallback } from 'react'
import { protocolService, logService, stockService, medicineService, treatmentPlanService } from '../services/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import LogForm from '../components/log/LogForm'
import LogEntry from '../components/log/LogEntry'
import StockIndicator from '../components/stock/StockIndicator'
import ProtocolChecklistItem from '../components/protocol/ProtocolChecklistItem'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const [activeProtocols, setActiveProtocols] = useState([])
  const [treatmentPlans, setTreatmentPlans] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [stockSummary, setStockSummary] = useState([])
  const [allMedicines, setAllMedicines] = useState([])
  const [expandedPlans, setExpandedPlans] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedProtocols, setSelectedProtocols] = useState({}) // { planId: [protocolIds] }


  const togglePlan = (planId) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }))
  }

  const toggleProtocolSelection = (planId, protocolId) => {
    setSelectedProtocols(prev => {
      const currentSelection = prev[planId] || []
      const isSelected = currentSelection.includes(protocolId)
      
      const newSelection = isSelected 
        ? currentSelection.filter(id => id !== protocolId)
        : [...currentSelection, protocolId]
        
      return {
        ...prev,
        [planId]: newSelection
      }
    })
  }

  const loadDashboardData = useCallback(async () => {
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
      setAllMedicines(medicines)
      setLastUpdated(new Date())
      
      // Initialize expandedPlans and selectedProtocols
      const initialExpandedState = {}
      const initialSelectionState = {}
      
      plans.forEach(plan => {
        initialExpandedState[plan.id] = false
        // Todos selecionados por padrão
        initialSelectionState[plan.id] = plan.protocols
          ?.filter(p => p.active)
          .map(p => p.id) || []
      })
      
      setExpandedPlans(initialExpandedState)
      setSelectedProtocols(initialSelectionState)
      
      // Calcular consumo diário por medicamento
      const dailyIntakeMap = {}
      protocols.forEach(p => {
        if (p.active) {
          const daily = (p.dosage_per_intake || 0) * (p.time_schedule?.length || 0)
          dailyIntakeMap[p.medicine_id] = (dailyIntakeMap[p.medicine_id] || 0) + daily
        }
      })
      
      // Carregar estoque para cada medicamento
      const stockPromises = medicines.map(async (medicine) => {
        const entries = await stockService.getByMedicine(medicine.id)
        const total = entries.reduce((sum, entry) => sum + entry.quantity, 0)
        const dailyIntake = dailyIntakeMap[medicine.id] || 0
        const daysRemaining = dailyIntake > 0 ? total / dailyIntake : Infinity
        const isLow = dailyIntake > 0 && daysRemaining < 4
        
        return { medicine, total, dailyIntake, daysRemaining, isLow }
      })
      
      const stockData = await Promise.all(stockPromises)
      const sortedStock = stockData
        .filter(item => item.total > 0)
        .sort((a, b) => {
          // Itens baixos primeiro, depois por dias restantes
          if (a.isLow && !b.isLow) return -1
          if (!a.isLow && b.isLow) return 1
          return a.daysRemaining - b.daysRemaining
        })
        
      setStockSummary(sortedStock)
      
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

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

  const handleTakeSelectedFromPlan = async (e, plan) => {
    e.stopPropagation()
    const selection = selectedProtocols[plan.id] || []
    const protocolsToTake = plan.protocols?.filter(p => p.active && selection.includes(p.id)) || []
    
    if (protocolsToTake.length === 0) return

    const logs = protocolsToTake.map(p => ({
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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia! ☀️'
    if (hour < 18) return 'Boa tarde! 🌤️'
    return 'Boa noite! 🌙'
  }

  if (isLoading) {
    return (
      <div className="dashboard-view">
        <Loading text="Carregando dashboard..." />
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header-premium">
        <div className="greeting-section">
          <h1>{getGreeting()}</h1>
          <p className="dashboard-subtitle">
            <span className="live-indicator"></span> 
            Atualizado em {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="quick-actions">
          <Button variant="primary" className="btn-log-dose" onClick={() => setIsModalOpen(true)}>
            <span className="btn-icon">➕</span> Registrar Dose
          </Button>
        </div>
      </div>

      <div className="dashboard-summary-row fade-in">
        <div className="summary-stat-card">
          <span className="stat-icon">💊</span>
          <div className="stat-content">
            <span className="stat-value">{activeProtocols.length}</span>
            <span className="stat-label">Protocolos Ativos</span>
          </div>
        </div>
        <div className="summary-stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-value">{treatmentPlans.length}</span>
            <span className="stat-label">Planos em Curso</span>
          </div>
        </div>
        <div className="summary-stat-card warning">
          <span className="stat-icon">⚠️</span>
          <div className="stat-content">
            <span className="stat-value">{stockSummary.filter(s => s.isLow).length}</span>
            <span className="stat-label">Acaba em breve</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="success-banner fade-in">
          ✨ {successMessage}
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
              <Card 
                key={plan.id} 
                className={`dashboard-card plan-card-dash ${expandedPlans[plan.id] ? 'expanded' : 'collapsed'}`}
              >
                <div className="card-header plan-header-dash" onClick={() => togglePlan(plan.id)}>
                  <div className="plan-title-area">
                    <span className={`expand-icon ${expandedPlans[plan.id] ? 'open' : ''}`}>▶</span>
                    <h3>📁 {plan.name}</h3>
                  </div>
                  <div className="plan-actions-dash">
                    <span className="plan-objective-dash">{plan.objective}</span>

                    <Button 
                      variant="primary" 
                      size="sm" 
                      onClick={(e) => handleTakeSelectedFromPlan(e, plan)}
                      disabled={!(selectedProtocols[plan.id]?.length > 0)}
                    >
                      {selectedProtocols[plan.id]?.length > 0 
                        ? `✅ Tomar (${selectedProtocols[plan.id].length})`
                        : '✅ Tomar Selecionados'}
                    </Button>
                  </div>
                </div>
                
                {expandedPlans[plan.id] && (
                  <div className="plan-summary-dash fade-in" style={{ padding: '0 var(--space-4) var(--space-4)' }}>
                    {plan.protocols?.filter(p => p.active).map(p => (
                      <ProtocolChecklistItem
                        key={p.id}
                        protocol={p}
                        isSelected={selectedProtocols[plan.id]?.includes(p.id) || false}
                        onToggle={(protocolId) => toggleProtocolSelection(plan.id, protocolId)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Catálogo de Medicamentos */}
        <Card className="dashboard-card medicines-card">
          <div className="card-header">
            <h3>💊 Medicamentos</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('medicines')}>
              Gerenciar
            </Button>
          </div>
          <div className="card-content-dash">
            {allMedicines.length === 0 ? (
              <div className="empty-message">
                <p>Nenhum remédio cadastrado</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate('medicines')}>
                  Cadastrar
                </Button>
              </div>
            ) : (
              <div className="item-list-dash">
                {allMedicines.slice(-8).reverse().map(medicine => (
                  <div key={medicine.id} className="summary-item-dash">
                    <div className="item-info-dash">
                      <h4>{medicine.name}</h4>
                      <div className="item-details-dash">
                        <span className="item-main-dash">{medicine.active_ingredient}</span>
                        <span className="item-lab-dash">{medicine.laboratory}</span>
                      </div>
                    </div>
                    <div className="item-right-dash">
                      <span className="dosage-highlight-dash">{medicine.dosage_per_pill}mg</span>
                      <span className="type-tag-dash">MED</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Protocolos Avulsos */}
        <Card className="dashboard-card protocols-card">
          <div className="card-header">
            <h3>📋 Protocolos Avulsos</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('protocols')}>
              Gerenciar
            </Button>
          </div>
          
          <div className="card-content-dash">
            {activeProtocols.filter(p => !p.treatment_plan_id).length === 0 ? (
              <div className="empty-message">
                <p>Nenhum protocolo avulso</p>
                <Button variant="outline" size="sm" onClick={() => onNavigate('protocols')}>
                  Criar
                </Button>
              </div>
            ) : (
              <div className="item-list-dash">
                {activeProtocols.filter(p => !p.treatment_plan_id).slice(0, 8).map(protocol => (
                  <div key={protocol.id} className="summary-item-dash">
                    <div className="item-info-dash">
                      <h4>{protocol.name}</h4>
                      <div className="item-details-dash">
                        <span className="item-main-dash">{protocol.medicine?.name}</span>
                        <span className="item-freq-dash">{protocol.frequency} • {protocol.dosage_per_intake} comp.</span>
                      </div>
                    </div>
                    <div className="item-schedule-dash">
                      {protocol.time_schedule?.slice(0, 2).map(time => (
                        <span key={time} className="time-mini-dash">{time}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Estoque */}
        <Card className="dashboard-card stock-card">
          <div className="card-header">
            <h3>
              📦 Estoque 
              {stockSummary.some(s => s.isLow) && <span className="badge-alert-mini">!</span>}
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('stock')}>
              Gerenciar
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
              {stockSummary.slice(0, 5).map(item => (
                <div key={item.medicine.id} className={`stock-item ${item.isLow ? 'low-stock-highlight' : ''}`}>
                  <div className="stock-info-dash">
                    <h4>
                      {item.isLow && <span className="warning-mini">⚠️</span>}
                      {item.medicine.name}
                    </h4>
                    <span className="stock-days-remaining">
                      {item.dailyIntake > 0 
                        ? `${Math.floor(item.daysRemaining)} dias restantes`
                        : 'Sem protocolo ativo'}
                    </span>
                  </div>
                  <StockIndicator quantity={item.total} isLow={item.isLow} />
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