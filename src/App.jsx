import { useState } from 'react'
import './styles/index.css'
import Button from './components/ui/Button'
import Card from './components/ui/Card'
import Loading from './components/ui/Loading'

function App() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="container" style={{ paddingTop: 'var(--space-8)' }}>
      <header style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h1 className="gradient-text">Meu Remédio</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Gerencie seus medicamentos com facilidade
        </p>
      </header>

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
            <Button variant="primary">Adicionar Remédio</Button>
          </div>
        </Card>

        <Card>
          <h3>📋 Protocolos</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Crie protocolos de tratamento
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="secondary">Criar Protocolo</Button>
          </div>
        </Card>

        <Card>
          <h3>📦 Estoque</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Controle seu estoque de medicamentos
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="outline">Ver Estoque</Button>
          </div>
        </Card>
      </div>

      <Card style={{ textAlign: 'center' }}>
        <h3>🎨 Teste de Componentes</h3>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-4)', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: 'var(--space-4)'
        }}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <Button 
            variant="primary" 
            onClick={() => setIsLoading(!isLoading)}
          >
            {isLoading ? 'Esconder' : 'Mostrar'} Loading
          </Button>
        </div>

        {isLoading && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Loading />
          </div>
        )}
      </Card>

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
