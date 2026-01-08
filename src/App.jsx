import { useState } from 'react'
import './styles/index.css'
import Button from './components/ui/Button'
import Medicines from './views/Medicines'
import Stock from './views/Stock'
import Protocols from './views/Protocols'
import Dashboard from './views/Dashboard'
import History from './views/History'
import TestConnection from './components/TestConnection'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [showDebug, setShowDebug] = useState(false)
  const [initialProtocolParams, setInitialProtocolParams] = useState(null)
  const [initialStockParams, setInitialStockParams] = useState(null)

  // Shared navigation header for sub-views
  const renderNav = () => (
    <div style={{ 
      padding: 'var(--space-4)', 
      borderBottom: '1px solid var(--border-color)',
      marginBottom: 'var(--space-6)',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(10px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
        ← Voltar ao Dashboard
      </Button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px', borderRadius: '6px' }} />
        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>
          Meus Remédios
        </div>
      </div>
    </div>
  )

  const navigateToProtocol = (medicineId) => {
    setInitialProtocolParams({ medicineId })
    setCurrentView('protocols')
  }

  const navigateToStock = (medicineId) => {
    setInitialStockParams({ medicineId })
    setCurrentView('stock')
  }

  // View Routing
  if (currentView === 'medicines') {
    return (
      <div>
        {renderNav()}
        <Medicines onNavigateToProtocol={navigateToProtocol} />
      </div>
    )
  }

  if (currentView === 'stock') {
    return (
      <div>
        {renderNav()}
        <Stock 
          initialParams={initialStockParams}
          onClearParams={() => setInitialStockParams(null)}
        />
      </div>
    )
  }

  if (currentView === 'protocols') {
    return (
      <div>
        {renderNav()}
        <Protocols 
          initialParams={initialProtocolParams} 
          onClearParams={() => setInitialProtocolParams(null)}
          onNavigateToStock={navigateToStock}
        />
      </div>
    )
  }

  if (currentView === 'history') {
    return (
      <div>
        {renderNav()}
        <History />
      </div>
    )
  }

  // Default: Dashboard
  return (
    <div className="app-container">
      <Dashboard onNavigate={(view, params) => {
        if (view === 'stock' && params?.medicineId) {
          setInitialStockParams({ medicineId: params.medicineId })
        } else if (view === 'protocols' && params?.medicineId) {
          setInitialProtocolParams({ medicineId: params.medicineId })
        }
        setCurrentView(view)
      }} />
      
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
        <img src="/logo.png" alt="Logo" style={{ width: '40px', marginBottom: 'var(--space-2)', borderRadius: '10px', opacity: 0.8 }} />
        <p>Meus Remédios v1.1.0</p>
        
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

        <p style={{ marginTop: 'var(--space-2)' }}>
          ✨ Desenvolvido com React + Vite + Supabase
        </p>
      </footer>
    </div>
  )
}

export default App
