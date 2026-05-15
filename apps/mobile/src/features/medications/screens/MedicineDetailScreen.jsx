// MedicineDetailScreen.jsx — detalhe do medicamento (Sprint M1.1 Fase 1)
// Layout: header fixo + hero card + sections (Identificação / Dosagem / Em uso)

import { useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import {
  ChevronLeft,
  Pencil,
  MoreVertical,
  Pill,
  PillBottle,
} from 'lucide-react-native'

import ScreenContainer from '@shared/components/ui/ScreenContainer'
import LoadingState from '@shared/components/states/LoadingState'
import ErrorState from '@shared/components/states/ErrorState'
import { ROUTES } from '@navigation/routes'
import { useMedicine } from '@medications/hooks/useMedicines'
import { colors, spacing, borderRadius, shadows } from '@shared/styles/tokens'

const TYPE_LABELS = {
  medicamento: 'Medicamento',
  suplemento: 'Suplemento',
}

function capitalize(value) {
  if (!value || typeof value !== 'string') return '—'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function KVRow({ label, value, isLast }) {
  return (
    <View style={[styles.kvRow, isLast && styles.kvRowLast]}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue} numberOfLines={2}>
        {displayValue(value)}
      </Text>
    </View>
  )
}

// eslint-disable-next-line max-lines-per-function
export default function MedicineDetailScreen() {
  // States (via hooks)
  const navigation = useNavigation()
  const route = useRoute()
  const id = route.params?.id
  const { data, loading, error, refresh } = useMedicine(id)

  // Memos
  const typeLabel = useMemo(() => {
    if (!data?.type) return '—'
    return TYPE_LABELS[data.type] ?? capitalize(data.type)
  }, [data])

  const doseLabel = useMemo(() => {
    if (!data?.dosage_per_pill) return null
    const unit = data.dosage_unit ?? ''
    return `${data.dosage_per_pill}${unit ? ` ${unit}` : ''}`
  }, [data])

  const protocols = useMemo(() => {
    if (!data?.protocols || !Array.isArray(data.protocols)) return []
    return data.protocols
  }, [data])

  // Handlers
  const handleBack = () => navigation.goBack()
  const handleEdit = () => {
    if (!data) return
    navigation.navigate(ROUTES.MEDICINE_EDIT, { medicine: data })
  }
  const handleMenu = () => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[MedicineDetail] menu placeholder (v1 sem ação)')
    }
  }

  // Header (reaproveitado em todos os estados)
  const Header = (
    <View style={styles.header}>
      <Pressable
        onPress={handleBack}
        hitSlop={8}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <ChevronLeft size={24} color={colors.text.primary} />
      </Pressable>
      <View style={styles.headerActions}>
        <Pressable
          onPress={handleEdit}
          hitSlop={8}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Editar medicamento"
          disabled={!data}
        >
          <Pencil
            size={22}
            color={data ? colors.text.primary : colors.text.muted}
          />
        </Pressable>
        <Pressable
          onPress={handleMenu}
          hitSlop={8}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Mais opções"
        >
          <MoreVertical size={22} color={colors.text.primary} />
        </Pressable>
      </View>
    </View>
  )

  if (loading) {
    return (
      <ScreenContainer>
        {Header}
        <LoadingState />
      </ScreenContainer>
    )
  }

  if (error) {
    return (
      <ScreenContainer>
        {Header}
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    )
  }

  if (!data) {
    return (
      <ScreenContainer>
        {Header}
        <ErrorState message="Medicamento não encontrado" onRetry={refresh} />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
      {Header}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIconWrap,
              {
                backgroundColor:
                  data.type === 'suplemento' ? colors.supplement[50] : colors.primary[50],
              },
            ]}
          >
            {data.type === 'suplemento' ? (
              <PillBottle size={48} color={colors.supplement[500]} />
            ) : (
              <Pill size={48} color={colors.primary[500]} />
            )}
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroName} numberOfLines={2}>
              {data.name}
            </Text>
            {doseLabel && (
              <View style={styles.dosePill}>
                <Text style={styles.dosePillText}>{doseLabel}</Text>
              </View>
            )}
            {data.active_ingredient && (
              <Text style={styles.heroIngredient} numberOfLines={2}>
                {data.active_ingredient}
              </Text>
            )}
            <View style={styles.heroBadges}>
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Text style={[styles.badgeText, styles.badgeTextSuccess]}>
                  ESTÁVEL
                </Text>
              </View>
              <View style={[styles.badge, styles.badgeNeutral]}>
                <Text style={[styles.badgeText, styles.badgeTextNeutral]}>
                  {(data.type ?? '—').toString().toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Identificação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>IDENTIFICAÇÃO</Text>
          <View style={styles.sectionCard}>
            <KVRow label="Tipo" value={typeLabel} />
            <KVRow label="Princípio Ativo" value={data.active_ingredient} />
            <KVRow label="Laboratório" value={data.laboratory} />
            <KVRow label="Classe Terapêutica" value={data.therapeutic_class} />
            <KVRow
              label="Categoria Regulatória"
              value={data.regulatory_category}
              isLast
            />
          </View>
        </View>

        {/* Dosagem */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOSAGEM</Text>
          <View style={styles.sectionCard}>
            <KVRow
              label="Dose por unidade"
              value={
                data.dosage_per_pill
                  ? `${data.dosage_per_pill} ${data.dosage_unit ?? ''}`.trim()
                  : null
              }
              isLast
            />
          </View>
        </View>

        {/* Em uso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EM USO</Text>
          <View style={styles.sectionCard}>
            {protocols.length > 0 ? (
              protocols.map((p, idx) => {
                const name = p?.name ?? `Tratamento #${p?.id ?? idx + 1}`
                return (
                  <View
                    key={p?.id ?? `protocol-${idx}`}
                    style={[
                      styles.kvRow,
                      idx === protocols.length - 1 && styles.kvRowLast,
                    ]}
                  >
                    <Text style={styles.kvValue}>{name}</Text>
                  </View>
                )
              })
            ) : (
              <Text style={styles.emptyText}>
                Nenhum tratamento ativo usando este medicamento
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.screen,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    padding: spacing[1],
    borderRadius: borderRadius.sm,
  },

  // Scroll
  scrollContent: {
    paddingBottom: spacing[8],
  },

  // Hero
  heroCard: {
    flexDirection: 'row',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[4],
    gap: spacing[4],
    ...shadows.sm,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
    gap: spacing[2],
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    lineHeight: 28,
  },
  dosePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: colors.neutral[300],
  },
  dosePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  heroIngredient: {
    fontSize: 13,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  badgeSuccess: {
    backgroundColor: colors.status.success + '20',
  },
  badgeNeutral: {
    backgroundColor: colors.neutral[200],
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  badgeTextSuccess: {
    color: colors.status.success,
  },
  badgeTextNeutral: {
    color: colors.neutral[700],
  },

  // Sections
  section: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.text.muted,
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  sectionCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // KV rows
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing[3],
  },
  kvRowLast: {
    borderBottomWidth: 0,
  },
  kvLabel: {
    fontSize: 13,
    color: colors.text.secondary,
    flexShrink: 0,
  },
  kvValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Empty
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    paddingVertical: spacing[3],
    textAlign: 'center',
  },
})
