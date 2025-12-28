import { useState } from 'react'
import './styles/index.css'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import TestConnection from './components/TestConnection'
import Medicines from './views/Medicines'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  // Render different views based on currentView state
  if (currentView === 'medicines') {
    return (
      <div>
        {/* Simple navigation */}
        <div style={{ 
          padding: 'var(--space-4)', 
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 'var(--space-6)'
        }}>
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
            ← Voltar ao Dashboard
          </Button>
        </div>
        <Medicines />
      </div>
    )
  }

  // Dashboard view
  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
      <header style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 className="gradient-text">Meu Remédio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gerencie seus medicamentos com facilidade
        </p>
      </header>

      {/* Test Supabase Connection */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <TestConnection />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)'
      }}>
        <Card>
          <h3>💊 Medicamentos</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Cadastre e gerencie seus remédios
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="primary" onClick={() => setCurrentView('medicines')}>
              Gerenciar Medicamentos
            </Button>
          </div>
        </Card>

        <Card>
          <h3>📋 Protocolos</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Crie protocolos de tratamento
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" disabled>
              Em Breve
            </Button>
          </div>
        </Card>

        <Card>
          <h3>📦 Estoque</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Controle seu estoque de medicamentos
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="outline" disabled>
              Em Breve
            </Button>
          </div>
        </Card>
      </div>

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
