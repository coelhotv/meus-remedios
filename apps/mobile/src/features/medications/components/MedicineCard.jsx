// MedicineCard.jsx — card de medicamento (Sprint M1.1 Fase 1)

import { Pressable, View, Text, StyleSheet } from 'react-native'
import { Pill, PillBottle } from 'lucide-react-native'
import { colors, spacing, borderRadius, shadows, typography } from '@shared/styles/tokens'
import { selectionTap } from '@shared/utils/haptics'

export default function MedicineCard({ medicine, onPress }) {
  const {
    name,
    type,
    dosage_per_pill,
    dosage_unit,
    laboratory,
    active_protocols_count = 0,
  } = medicine ?? {}

  const isSupplement = type === 'suplemento'
  const Icon = isSupplement ? PillBottle : Pill
  const iconColor = isSupplement ? colors.supplement[500] : colors.primary[500]
  const iconBg = isSupplement ? colors.supplement[50] : colors.primary[50]
  const doseColor = isSupplement ? colors.supplement[700] : colors.primary[700]

  const handlePress = () => {
    selectionTap()
    onPress?.()
  }

  const hasDose = dosage_per_pill != null && dosage_unit
  const protocolsLabel =
    active_protocols_count > 0
      ? `${active_protocols_count} ${active_protocols_count === 1 ? 'protocolo ativo' : 'protocolos ativos'}`
      : 'Sem protocolos ativos'

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Medicamento ${name}`}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Icon size={20} color={iconColor} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {name}
          {hasDose && (
            <Text style={[styles.inlineDose, { color: doseColor }]}>
              {' '}({dosage_per_pill}{dosage_unit})
            </Text>
          )}
        </Text>
      </View>

      {laboratory ? (
        <Text style={styles.meta} numberOfLines={1}>
          {laboratory}
        </Text>
      ) : null}

      <Text style={styles.protocols}>{protocolsLabel}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.md,
    padding: spacing[4],
    marginVertical: spacing[2],
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  inlineDose: {
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: spacing[1],
    marginLeft: 32 + spacing[3],
  },
  protocols: {
    marginTop: spacing[2],
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
})
