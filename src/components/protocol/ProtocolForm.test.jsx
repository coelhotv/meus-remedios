import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProtocolForm from './ProtocolForm'

describe('ProtocolForm', () => {
  const mockMedicines = [
    { id: '1', name: 'Medicine A', dosage_per_pill: 50, dosage_unit: 'mg' }
  ]
  
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  it('renders correctly for a new protocol', () => {
    render(
      <ProtocolForm 
        medicines={mockMedicines} 
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )
    
    expect(screen.getByText('Novo Protocolo')).toBeDefined()
    expect(screen.getByLabelText(/Nome do Protocolo/i)).toBeDefined()
  })

  it('renders correctly for editing an existing protocol', () => {
    const mockProtocol = {
      id: 'p1',
      name: 'Existing Protocol',
      medicine_id: '1',
      frequency: 'Once a day',
      time_schedule: ['08:00'],
      dosage_per_intake: 1,
      active: true
    }

    render(
      <ProtocolForm 
        medicines={mockMedicines} 
        protocol={mockProtocol}
        onSave={mockOnSave} 
        onCancel={mockOnCancel} 
      />
    )
    
    expect(screen.getByText('Editar Protocolo')).toBeDefined()
  })
})
