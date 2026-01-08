import { useState, useEffect, useCallback } from 'react'
import { protocolService, logService, stockService, medicineService, treatmentPlanService } from '../services/api'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Modal from '../components/ui/Modal'
import LogForm from '../components/log/LogForm'
import Calendar from '../components/ui/Calendar'
import LogEntry from '../components/log/LogEntry'
import StockIndicator from '../components/stock/StockIndicator'
import ProtocolChecklistItem from '../components/protocol/ProtocolChecklistItem'
import TitrationTransitionAlert from '../components/protocol/TitrationTransitionAlert'
import { calculateTitrationData } from '../utils/titrationUtils'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const [activeProtocols, setActiveProtocols] = useState([])
  const [treatmentPlans, setTreatmentPlans] = useState([])
  const [recentLogs, setRecentLogs] = useState([])
  const [stockSummary, setStockSummary] = useState([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null)
  const [allMedicines, setAllMedicines] = useState([])
  const [expandedPlans, setExpandedPlans] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedProtocols, setSelectedProtocols] = useState({}) // { planId: [protocolIds] }
  const [dismissedTransitions, setDismissedTransitions] = useState(new Set()) // Track dismissed alerts


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
        logService.getAll(100), // More logs for calendar markers
        medicineService.getAll()
      ])
      
      // Enrich protocols with titration data
      const enrichedProtocols = protocols.map(p => ({
        ...p,
        titration_scheduler_data: calculateTitrationData(p)
      }))
      
      // Enrich plans with protocol titration data
      const enrichedPlans = plans.map(plan => ({
        ...plan,
        protocols: plan.protocols?.map(p => ({
           ...p,
           titration_scheduler_data: calculateTitrationData(p)
        }))
      }))

      setActiveProtocols(enrichedProtocols)
      setTreatmentPlans(enrichedPlans)
      setRecentLogs(logs)
      setAllMedicines(medicines)
      setLastUpdated(new Date())
      
      // Initialize expandedPlans and selectedProtocols
      const initialExpandedState = {}
      const initialSelectionState = {}
      
      enrichedPlans.forEach(plan => {
        initialExpandedState[plan.id] = false
        // Todos selecionados por padrão
        initialSelectionState[plan.id] = plan.protocols
          ?.filter(p => p.active)
          .map(p => p.id) || []
      })
      
      setExpandedPlans(initialExpandedState)
      setSelectedProtocols(initialSelectionState)

      if (logs.length > 0 && !selectedCalendarDate) {
        setSelectedCalendarDate(new Date(logs[0].taken_at))
      }
      
      // Calcular consumo diário por medicamento
      const dailyIntakeMap = {}
      enrichedProtocols.forEach(p => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentional: only load once on mount

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const handleLogMedicine = async (logData) => {
    try {
      if (Array.isArray(logData)) {
        await logService.createBulk(logData)
        showSuccess('Lote de medicamentos registrado com sucesso!')
      } else if (logData.id) {
        await logService.update(logData.id, logData)
        showSuccess('Registro atualizado com sucesso!')
      } else {
        await logService.create(logData)
        showSuccess('Medicamento registrado com sucesso!')
      }
      setIsModalOpen(false)
      setEditingLog(null)
      await loadDashboardData()
    } catch (err) {
      throw new Error(err.message)
    }
  }

  function handleEditClick(log) {
    setEditingLog(log)
    setIsModalOpen(true)
  }

  function handleOpenNewLog() {
    setEditingLog(null)
    setIsModalOpen(true)
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

  const handleAdvanceTitration = async (protocolId, isFinalStage) => {
    try {
      await protocolService.advanceTitrationStage(protocolId, isFinalStage)
      
      if (isFinalStage) {
        showSuccess('🎯 Protocolo de titulação concluído com sucesso!')
      } else {
        showSuccess('🚀 Avançado para a próxima etapa de titulação!')
      }
      
      // Remove from dismissed list if it was there
      setDismissedTransitions(prev => {
        const newSet = new Set(prev)
        newSet.delete(protocolId)
        return newSet
      })
      
      await loadDashboardData()
    } catch (err) {
      setError('Erro ao avançar etapa: ' + err.message)
      console.error(err)
    }
  }

  const handleDismissTransition = (protocolId) => {
    setDismissedTransitions(prev => new Set(prev).add(protocolId))
  }

  const showSuccess = (message) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(''), 3000)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia! ☀️'
    if (hour < 18) return 'Boa tarde! 🌤️'
    return 'Boa noite! 🌙'
  }

  const displayDate = selectedCalendarDate || new Date()
  const selectedDayLogs = recentLogs.filter(log => {
    const d = new Date(log.taken_at)
    return d.getFullYear() === displayDate.getFullYear() &&
           d.getMonth() === displayDate.getMonth() &&
           d.getDate() === displayDate.getDate()
  })

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
        <div className="greeting-section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '16px', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }} />
          <div>
            <h1>{getGreeting()}</h1>
            <p className="dashboard-subtitle">
              <span className="live-indicator"></span> 
              Atualizado em {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="quick-actions">
          <Button variant="primary" className="btn-log-dose" onClick={handleOpenNewLog}>
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

      {/* Titration Transition Alerts */}
      {activeProtocols
        .filter(p => 
          p.titration_scheduler_data?.isTransitionDue && 
          !dismissedTransitions.has(p.id)
        )
        .map(protocol => (
          <TitrationTransitionAlert
            key={protocol.id}
            protocol={protocol}
            onAdvance={handleAdvanceTitration}
            onDismiss={handleDismissTransition}
          />
        ))
      }


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
                      <span className="dosage-highlight-dash">
                        {medicine.dosage_per_pill ? `${medicine.dosage_per_pill}${medicine.dosage_unit || 'mg'}` : (medicine.type === 'supplement' ? 'Sup.' : 'N/A')}
                      </span>
                      <span className="type-tag-dash">{medicine.type === 'supplement' ? 'SUP' : 'MED'}</span>
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
                  <ProtocolChecklistItem
                    key={protocol.id}
                    protocol={protocol}
                    isSelected={false} // Display only mostly
                    onToggle={() => {}} // No interaction for now in this list
                  />
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Estoque */}
        {/* Ações Rápidas secundário removido - já existe no header */}
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
                <div 
                  key={item.medicine.id} 
                  className={`stock-item clickable-replenish ${item.isLow ? 'low-stock-highlight' : ''}`}
                  onClick={() => onNavigate('stock', { medicineId: item.medicine.id })}
                >
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

        {/* Calendário de Doses */}
        <Card className="dashboard-card history-card full-width">
          <div className="card-header">
            <h3>📅 Ciclo de Doses</h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('history')}>
              Ver Histórico Completo
            </Button>
          </div>
          
          <div className="card-content-dash" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-8)', alignItems: 'start' }}>
              <Calendar 
                markedDates={recentLogs.map(log => log.taken_at)} 
                selectedDate={selectedCalendarDate}
                onDayClick={(date) => setSelectedCalendarDate(date)}
              />
              
              <div className="recent-activity">
                <h4 style={{ marginBottom: 'var(--space-4)', fontSize: '13px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  {displayDate.toLocaleDateString('pt-BR')} 
                  {displayDate.toDateString() === new Date().toDateString() ? ' (Hoje)' : ''}
                </h4>
                
                {selectedDayLogs.length === 0 ? (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      Nenhum registro neste dia
                    </p>
                  ) : (
                    <div className="logs-timeline-mini">
                      {selectedDayLogs.map(log => (
                        <div 
                          key={log.id} 
                          onClick={() => handleEditClick(log)}
                          style={{ 
                            padding: 'var(--space-3)', 
                            background: 'rgba(255,255,255,0.03)', 
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-2)',
                            borderLeft: '3px solid var(--accent-success)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          className="clickable-log-item"
                        >
                          <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{log.medicine?.name}</span>
                            <span style={{ opacity: 0.5, fontSize: '11px' }}>✏️</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {new Date(log.taken_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {log.quantity_taken && ` • ${log.quantity_taken} ${log.quantity_taken === 1 ? 'dose' : 'doses'}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingLog(null)
        }}
      >
        <LogForm
          protocols={activeProtocols}
          treatmentPlans={treatmentPlans}
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