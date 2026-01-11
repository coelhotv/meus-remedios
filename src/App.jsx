import { useState } from 'react'
import './styles/index.css'
import Medicines from './views/Medicines'
import Stock from './views/Stock'
import Protocols from './views/Protocols'
import Dashboard from './views/Dashboard'
import History from './views/History'
import TestConnection from './components/TestConnection'
import BottomNav from './components/BottomNav'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [showDebug, setShowDebug] = useState(false)
  const [initialProtocolParams, setInitialProtocolParams] = useState(null)
  const [initialStockParams, setInitialStockParams] = useState(null)

  const navigateToProtocol = (medicineId) => {
    setInitialProtocolParams({ medicineId })
    setCurrentView('protocols')
  }

  const navigateToStock = (medicineId) => {
    setInitialStockParams({ medicineId })
    setCurrentView('stock')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'medicines':
        return <Medicines onNavigateToProtocol={navigateToProtocol} />
      case 'stock':
        return (
          <Stock 
            initialParams={initialStockParams}
            onClearParams={() => setInitialStockParams(null)}
          />
        )
      case 'protocols':
        return (
          <Protocols 
            initialParams={initialProtocolParams} 
            onClearParams={() => setInitialProtocolParams(null)}
            onNavigateToStock={navigateToStock}
          />
        )
      case 'history':
        return <History />
      case 'dashboard':
      default:
        return (
          <Dashboard onNavigate={(view, params) => {
            if (view === 'stock' && params?.medicineId) {
              setInitialStockParams({ medicineId: params.medicineId })
            } else if (view === 'protocols' && params?.medicineId) {
              setInitialProtocolParams({ medicineId: params.medicineId })
            }
            setCurrentView(view)
          }} />
        )
    }
  }

  return (
    <div className="app-container">
      <main style={{ paddingBottom: '80px', minHeight: '100vh', position: 'relative' }}>
        {renderCurrentView()}
        
        {showDebug && (
          <div style={{ padding: '0 var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <TestConnection />
          </div>
        )}
        
        <footer style={{ 
          textAlign: 'center', 
          marginTop: 'var(--space-8)',
          paddingBottom: 'var(--space-8)',
          color: 'var(--text-tertiary)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <span 
            onClick={() => setShowDebug(!showDebug)} 
            style={{ 
              cursor: 'pointer', 
              opacity: 0.1, 
              fontSize: '10px',
              display: 'block',
              margin: '4px 0'
            }}
          >
            {showDebug ? '[-] hide debug' : '[+] check system'}
          </span>
        </footer>
      </main>

      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  )
}

export default App
