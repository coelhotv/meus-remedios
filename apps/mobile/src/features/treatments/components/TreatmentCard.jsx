// TreatmentCard.jsx — card de exibição de um tratamento/protocolo
// R-166: UX Parity P-011

import { View, Text, StyleSheet } from 'react-native'
import SectionCard from '../../../shared/components/ui/SectionCard'
import StatusBadge from '../../../shared/components/ui/StatusBadge'
import { colors, spacing } from '../../../shared/styles/tokens'

/**
 * @param {{
 *   treatment: {
 *     name: string,
 *     frequency: string,
 *     time_schedule: string[],
 *     dosage_per_intake: number,
 *     titration_status: string,
 *     medicine: { name: string, type: string }
 *   }
 * }} props
 */
export default function TreatmentCard({ treatment }) {
  const { name, frequency, time_schedule, dosage_per_intake, titration_status, medicine } = treatment

  // Mapeamento de status da titulação para o badge (estáveis na web usam verde)
  const getStatusType = (status) => {
    switch (status) {
      case 'estável': return 'success'
      case 'ajustando': return 'warning'
      case 'desmamando': return 'info'
      default: return 'neutral'
    }
  }

  // Tradução do campo frequency para exibição (P-011 Paridade)
  const getFrequencyLabel = (freq) => {
    const map = {
      'diário': 'Todos os dias',
      'dias_alternados': 'Dias alternados',
      'semanal': 'Uma vez por semana',
      'quando_necessário': 'Quando necessário',
      'personalizado': 'Personalizado'
    }
    return map[freq] || freq
  }

  return (
    <SectionCard 
      title={medicine?.name || name}
      headerAction={<StatusBadge label={titration_status} type={getStatusType(titration_status)} />}
    >
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Frequência:</Text>
          <Text style={styles.value}>{getFrequencyLabel(frequency)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Dose:</Text>
          <Text style={styles.value}>{dosage_per_intake} {medicine?.type || 'unid.'}</Text>
        </View>

        {time_schedule && time_schedule.length > 0 && (
          <View style={styles.scheduleContainer}>
            <Text style={styles.label}>Horários:</Text>
            <View style={styles.timesList}>
              {time_schedule.map((time, idx) => (
                <View key={idx} style={styles.timeTag}>
                  <Text style={styles.timeText}>{time}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </SectionCard>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  scheduleContainer: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  timesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  timeTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  timeText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '700',
  },
})
