import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LogForm from './LogForm'

// Mock Button since it's used in component
vi.mock('../ui/Button', () => ({
  default: ({ children, onClick, disabled, type }) => (
    <button onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  )
}))

// Mock ProtocolChecklistItem since it's used in component
vi.mock('../protocol/ProtocolChecklistItem', () => ({
  default: ({ protocol, isSelected, onToggle }) => (
    <div
      data-testid={`protocol-${protocol.id}`}
      className={isSelected ? 'selected' : ''}
      onClick={() => onToggle(protocol.id)}
    >
      {protocol.name}
    </div>
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
    expect(screen.getByRole('combobox', { name: /Protocolo/i })).toBeInTheDocument()
  })

  it('should validate form submission', async () => {
    const onSave = vi.fn()
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)

    // Attempt submit without selection
    fireEvent.click(screen.getByText('✅ Registrar Dose'))

    // Should not call save
    expect(onSave).not.toHaveBeenCalled()
    // Should show validation (though in this case button is probably disabled, let's check logic)
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
    fireEvent.change(screen.getByRole('combobox', { name: /Protocolo/i }), { target: { value: 'p1' } })

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
        taken_at: expect.any(String),
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
    expect(screen.getByRole('combobox', { name: /Plano de Tratamento/i })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: /Plano de Tratamento/i }), { target: { value: 'plan1' } })

    // Verify medicines are listed
    expect(screen.getByText('Aspirina')).toBeInTheDocument()

    // Submit
    const submitBtn = screen.getByText('✅ Registrar (1)')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          protocol_id: 'p1',
          medicine_id: 'm1',
          quantity_taken: 1,
          notes: '[Plan: Pós Almoço]' // Note format check
        })
      ]))
    })
  })

  it('should toggle between protocol and plan mode', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)

    // Default is protocol mode
    expect(screen.getByRole('combobox', { name: /Protocolo/i })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Plano de Tratamento/i })).not.toBeInTheDocument()

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))
    expect(screen.queryByRole('combobox', { name: /Protocolo/i })).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Plano de Tratamento/i })).toBeInTheDocument()

    // Switch back to protocol mode
    fireEvent.click(screen.getByText('💊 Único Remédio'))
    expect(screen.getByRole('combobox', { name: /Protocolo/i })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /Plano de Tratamento/i })).not.toBeInTheDocument()
  })

  it('should validate plan mode without plan selection', async () => {
    const onSave = vi.fn()
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))

    // Try to submit without selecting a plan
    const submitBtn = screen.getByText('✅ Registrar Dose')
    expect(submitBtn).toBeDisabled()
  })

  it('should validate plan mode without protocol selection', async () => {
    const onSave = vi.fn()
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))

    // Select plan
    fireEvent.change(screen.getByRole('combobox', { name: /Plano de Tratamento/i }), { target: { value: 'plan1' } })

    // Deselect the auto-selected protocol
    fireEvent.click(screen.getByTestId('protocol-p1'))

    // Try to submit without selecting protocols - button should be disabled
    const submitBtn = screen.getByRole('button', { name: /✅ Registrar/ })
    expect(submitBtn).toBeDisabled()
  })

  it('should handle custom quantity taken', async () => {
    const onSave = vi.fn().mockResolvedValue({})
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)

    // Select protocol
    fireEvent.change(screen.getByRole('combobox', { name: /Protocolo/i }), { target: { value: 'p1' } })

    // Change quantity
    const quantityInput = screen.getByLabelText(/Quantidade Tomada/i)
    fireEvent.change(quantityInput, { target: { value: '2' } })

    // Submit
    fireEvent.click(screen.getByText('✅ Registrar Dose'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity_taken: 2
        })
      )
    })
  })

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn()
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('should render with initial values for editing', () => {
    const initialValues = {
      id: 'log1',
      protocol_id: 'p1',
      taken_at: '2024-01-01T08:00',
      quantity_taken: 2,
      notes: 'Test note'
    }

    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} initialValues={initialValues} />)

    expect(screen.getByRole('combobox', { name: /Protocolo/i })).toHaveValue('p1')
    expect(screen.getByLabelText(/Quantidade Tomada/i)).toHaveValue(2)
    expect(screen.getByLabelText(/Observações/i)).toHaveValue('Test note')
  })

  it('should handle submit error', async () => {
    const errorMessage = 'Erro ao registrar'
    const onSave = vi.fn().mockRejectedValue(new Error(errorMessage))
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} onSave={onSave} />)

    // Select protocol
    fireEvent.change(screen.getByRole('combobox', { name: /Protocolo/i }), { target: { value: 'p1' } })

    // Submit
    fireEvent.click(screen.getByText('✅ Registrar Dose'))

    await waitFor(() => {
      expect(screen.getByText(`❌ ${errorMessage}`)).toBeInTheDocument()
    })
  })

  it('should disable plan mode when editing', () => {
    const initialValues = {
      id: 'log1',
      protocol_id: 'p1',
      taken_at: '2024-01-01T08:00',
      quantity_taken: 1,
      notes: 'Test note'
    }

    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} initialValues={initialValues} />)

    const planButton = screen.getByText('📁 Plano Completo')
    expect(planButton).toBeDisabled()
  })

  it('should auto-select protocols when plan is selected', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))

    // Select plan
    fireEvent.change(screen.getByRole('combobox', { name: /Plano de Tratamento/i }), { target: { value: 'plan1' } })

    // Verify protocol is auto-selected
    expect(screen.getByTestId('protocol-p1')).toHaveClass('selected')
  })

  it('should allow toggling protocol selection in plan mode', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))

    // Select plan
    fireEvent.change(screen.getByRole('combobox', { name: /Plano de Tratamento/i }), { target: { value: 'plan1' } })

    // Toggle protocol off
    fireEvent.click(screen.getByTestId('protocol-p1'))
    expect(screen.getByTestId('protocol-p1')).not.toHaveClass('selected')

    // Toggle protocol on
    fireEvent.click(screen.getByTestId('protocol-p1'))
    expect(screen.getByTestId('protocol-p1')).toHaveClass('selected')
  })

  it('should show medicine info when protocol is selected', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)

    // Select protocol
    fireEvent.change(screen.getByRole('combobox', { name: /Protocolo/i }), { target: { value: 'p1' } })

    expect(screen.getByText('💊 Medicamento:')).toBeInTheDocument()
    expect(screen.getByText('Aspirina')).toBeInTheDocument()
  })

  it('should show plan summary when plan is selected', () => {
    render(<LogForm protocols={mockProtocols} treatmentPlans={mockPlans} />)

    // Switch to plan mode
    fireEvent.click(screen.getByText('📁 Plano Completo'))

    // Select plan
    fireEvent.change(screen.getByRole('combobox', { name: /Plano de Tratamento/i }), { target: { value: 'plan1' } })

    expect(screen.getByText('Selecione os medicamentos tomados:')).toBeInTheDocument()
  })
})
