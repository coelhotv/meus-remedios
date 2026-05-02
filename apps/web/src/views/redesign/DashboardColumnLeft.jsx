import DashboardHeader from './DashboardHeader'
import PriorityDoseCard from '@dashboard/components/PriorityDoseCard'
import InsightCardRedesign from '@dashboard/components/InsightCardRedesign'
import ReminderSuggestionRedesign from '@features/protocols/components/ReminderSuggestionRedesign'

export default function DashboardColumnLeft({
  userName,
  adherenceScore,
  totals,
  streak,
  getMotivationalMessage,
  urgentDoses,
  handleRegisterDoseQuick,
  handleRegisterDosesAll,
  currentInsight,
  onNavigate,
  reminderSuggestionData,
  handleReminderAccept,
  setDismissedSuggestionId
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        alignItems: 'center',
      }}
    >
      {/* Header + Ring de Adesão */}
      <DashboardHeader
        userName={userName}
        adherenceScore={adherenceScore}
        remainingDoses={totals.remaining}
        streak={streak}
        getMotivationalMessage={getMotivationalMessage}
      />

      {/* Priority Dose Card — 1-Click Registration */}
      {urgentDoses.length > 0 && (
        <div style={{ width: '100%' }}>
          <PriorityDoseCard
            doses={urgentDoses}
            onRegister={(dose) =>
              handleRegisterDoseQuick(dose.medicineId, dose.protocolId, dose.dosagePerIntake)
            }
            onRegisterAll={handleRegisterDosesAll}
            variant="priority"
          />
        </div>
      )}

      {/* Insight Card */}
      {currentInsight && (
        <div style={{ width: '100%' }}>
          <InsightCardRedesign
            insight={currentInsight}
            onAction={(insight) => {
              if (insight.action?.navigate) onNavigate?.(insight.action.navigate)
            }}
            onDismiss={() => {}}
          />
        </div>
      )}

      {/* Reminder Suggestion */}
      {reminderSuggestionData && (
        <div style={{ width: '100%' }}>
          <ReminderSuggestionRedesign
            suggestion={reminderSuggestionData.suggestion}
            protocolId={reminderSuggestionData.protocolId}
            protocolName={reminderSuggestionData.protocolName}
            onAccept={handleReminderAccept}
            onDismiss={() => setDismissedSuggestionId(reminderSuggestionData.protocolId)}
          />
        </div>
      )}
    </div>
  )
}
