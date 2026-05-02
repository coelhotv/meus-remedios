import CronogramaPeriodo from '@dashboard/components/CronogramaPeriodo'
import StockAlertInline from '@dashboard/components/StockAlertInline'
import DashboardEmptyState from './DashboardEmptyState'

export default function DashboardColumnRight({
  scheduleAllDoses,
  today,
  handleRegisterDoseQuick,
  complexityMode,
  now,
  contextLoading,
  onNavigate,
  criticalStockItems
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      {/* Cronograma do Dia */}
      {scheduleAllDoses.length > 0 && (
        <section aria-label="Cronograma de hoje">
          <div style={{ marginBottom: '1rem' }}>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display, Public Sans, sans-serif)',
                fontSize: 'var(--text-title-lg, 1.125rem)',
                fontWeight: '600',
                color: 'var(--color-on-surface)',
              }}
            >
              Cronograma de Hoje
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontFamily: 'var(--font-body, Lexend, sans-serif)',
                fontSize: 'var(--text-label-md, 0.75rem)',
                color: 'var(--color-outline)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '600',
              }}
            >
              {today}
            </p>
          </div>
          <CronogramaPeriodo
            allDoses={scheduleAllDoses}
            onRegister={(dose) =>
              handleRegisterDoseQuick(dose.medicineId, dose.protocolId, dose.dosagePerIntake)
            }
            variant={complexityMode === 'simple' ? 'simple' : 'complex'}
            now={now}
          />
        </section>
      )}

      {/* Empty State */}
      {scheduleAllDoses.length === 0 && !contextLoading && (
        <DashboardEmptyState onNavigate={onNavigate} />
      )}

      {/* Stock Alert (Simple Mode: Bottom) */}
      {complexityMode !== 'complex' && criticalStockItems.length > 0 && (
        <section style={{ marginTop: 'auto' }} aria-label="Alertas de estoque">
          <StockAlertInline
            criticalItems={criticalStockItems}
            onNavigateToStock={() => onNavigate?.('stock')}
          />
        </section>
      )}
    </div>
  )
}
