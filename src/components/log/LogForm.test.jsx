import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogForm from './LogForm'

// Mock Button since it's used in the component
vi.mock('../ui/Button', () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  )
}))

const mockProtocols = [
  { 
    id: 'p1', 
    name: 'Manhã', 
    dosage_per_intake: 1, 
    active: true,
    medicine_id: 'm1',
    medicine: { name: 'Aspirina' } 
  },
  { 
    id: 'p2', 
    name: 'Noite', 
    dosage_per_intake: 2, 
    active: true,
    medicine_id: 'm2',
    medicine: { name: 'Melatonina' } 
  }
]

const mockPlans = [
  {
    id: 'plan1',
    name: 'Pós Almoço',
    protocols: [
        { id: 'p1', name: 'Aspirina', dosage_per_intake: 1, active: true, medicine_id: 'm1' },
    ]
  },
  {
     id: 'plan2',
     name: 'Protocolo Vazio',
     protocols: []
  }
]

describe('LogForm', () => {
  it('should render form with protocol selection by default', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)
    expect(screen.getByText('Registrar Medicamento Tomado')).toBeInTheDocument()
    expect(screen.getByText('💊 Único Remédio')).toBeInTheDocument()
    expect(screen.getByLabelText(/Protocolo/i)).toBeInTheDocument()
  })

  it('should validate form submission', async () => {
    const onSave = vi.fn()
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)
    
    // Attempt submit without selection
    fireEvent.click(screen.getByText('✅ Registrar Dose'))
    
    // Should not call save
    expect(onSave).not.toHaveBeenCalled()
    // Should show validation (though in this case the button is probably disabled, let's check logic)
    // Looking at code: button has disabled={...}
    // So fireEvent.click might not do anything if disabled.
    // Let's check if button is disabled
    const submitBtn = screen.getByText('✅ Registrar Dose')
    expect(submitBtn).toBeDisabled()
  })

  it('should submit single protocol log', async () => {
    const onSave = vi.fn().mockResolvedValue({})
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)
    
    // Select protocol
    fireEvent.change(screen.getByLabelText(/Protocolo/i), { target: { value: 'p1' } })
    
    // Add note
    fireEvent.change(screen.getByLabelText(/Observações/i), { target: { value: 'Com dor' } })
    
    // Submit
    const submitBtn = screen.getByText('✅ Registrar Dose')
    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)
    
    await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith({
            protocol_id: 'p1',
            medicine_id: 'm1',
            quantity_taken: 1,
            notes: 'Com dor'
        })
    })
  })

  it('should switch to plan mode and submit bulk log', async () => {
    const onSave = vi.fn().mockResolvedValue({})
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)
    
    // Switch to Plan
    fireEvent.click(screen.getByText('📁 Plano Completo'))
    
    // Select plan
    expect(screen.getByLabelText(/Plano de Tratamento/i)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Plano de Tratamento/i), { target: { value: 'plan1' } })
    
    // Verify medicines are listed
    expect(screen.getByText('💊 Aspirina')).toBeInTheDocument()
    
    // Submit
    fireEvent.click(screen.getByText('✅ Registrar Dose'))
    
    await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                protocol_id: 'p1',
                medicine_id: 'm1',
                quantity_taken: 1,
                notes: '[Lote: Pós Almoço]' // Note format check
            })
        ]))
    })
  })
})
