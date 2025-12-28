import { useState } from 'react'
import './styles/index.css'
import Button from './components/ui/Button'
import Medicines from './views/Medicines'
import Stock from './views/Stock'
import Protocols from './views/Protocols'
import Dashboard from './views/Dashboard'
import History from './views/History'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')

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
      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--accent-primary)' }}>
        Meu Remédio Piloto
      </div>
    </div>
  )

  // View Routing
  if (currentView === 'medicines') {
    return (
      <div>
        {renderNav()}
        <Medicines />
      </div>
    )
  }

  if (currentView === 'stock') {
    return (
      <div>
        {renderNav()}
        <Stock />
      </div>
    )
  }

  if (currentView === 'protocols') {
    return (
      <div>
        {renderNav()}
        <Protocols />
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
      <Dashboard onNavigate={(view) => setCurrentView(view)} />
      
      <footer style={{ 
        textAlign: 'center', 
        marginTop: 'var(--space-8)',
        paddingBottom: 'var(--space-8)',
        color: 'var(--text-tertiary)',
        fontSize: 'var(--font-size-sm)'
      }}>
        <p>Meu Remédio v0.1.0 - Piloto</p>
        <p style={{ marginTop: 'var(--space-2)' }}>
          ✨ Desenvolvido com React + Vite + Supabase
        </p>
      </footer>
    </div>
  )
}

export default App
