// ProtocolFormScreen.jsx — formulário CREATE de tratamento (Fase 2 T2.6).
// Spec EXEC_SPEC_FASE2_PROTOCOLOS.md §3.4.
//
// v1 PR-B (Sprint T2.2): apenas CREATE mode. Edit (T2.7) e ProtocolFormErrors
// UX banner (T2.8) entram em PR-C. ProtocolDeleteSheet (T2.11) substitui o
// Alert stub do ProtocolDetailScreen no mesmo PR-C.
//
// Composição: MedicineSelectorRow + MedicineSelectorSheet + FormInput + FormSelect
// + WeekdaySelector + TimeSchedulePicker + FormDatePicker + PlanSelectField +
// FormActions. Validação via useFormState(protocolCreateSchema). Submit:
// se PlanSelectField está em modo inline com nome preenchido, cria o plano
// via treatmentPlanService.create ANTES de criar o tratamento.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'
import {
  protocolCreateSchema,
  FREQUENCIES,
  getTodayLocal,
  parseLocalDate,
  formatLocalDate,
  pluralizeDoseUnit,
} from '@dosiq/core'
import ScreenContainer from '@shared/components/ui/ScreenContainer'
import FormInput from '@shared/components/form/FormInput'
import FormSelect from '@shared/components/form/FormSelect'
import FormDatePicker from '@shared/components/form/FormDatePicker'
import FormActions from '@shared/components/form/FormActions'
import { useFormState } from '@shared/hooks/useFormState'
import { useToast } from '@shared/components/feedback/Toast'
import { lightTap } from '@shared/utils/haptics'
import { colors, spacing, typography } from '@shared/styles/tokens'
import MedicineSelectorRow from '@treatments/components/MedicineSelectorRow'
import MedicineSelectorSheet from '@treatments/components/MedicineSelectorSheet'
import WeekdaySelector from '@treatments/components/WeekdaySelector'
import TimeSchedulePicker from '@treatments/components/TimeSchedulePicker'
import PlanSelectField from '@treatments/components/PlanSelectField'
import { treatmentPlanService } from '@treatments/services/treatmentPlanService'
import { useProtocolMutation } from '@treatments/hooks/useProtocolMutation'
import { ROUTES } from '@navigation/routes'

const FREQUENCY_OPTIONS = [
  { value: 'diário', label: 'Diário' },
  { value: 'dias_alternados', label: 'Dias alternados' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'personalizado', label: 'Personalizado' },
  { value: 'quando_necessário', label: 'Quando necessário' },
]

const REQUIRES_WEEKDAYS = new Set(['semanal', 'personalizado'])

function buildInitialValues({ todayIso, presetPlanId }) {
  return {
    medicine_id: '',
    name: '',
    dosage_per_intake: '',
    frequency: 'diário',
    weekdays: [],
    time_schedule: [],
    start_date: todayIso,
    end_date: null,
    notes: '',
    active: true,
    titration_status: 'estável',
    titration_schedule: [],
    current_stage_index: 0,
    treatment_plan_id: presetPlanId || null,
  }
}

export default function ProtocolFormScreen() {
  // States (R-010 — States → Memos → Effects → Handlers)
  const navigation = useNavigation()
  const route = useRoute()
  const presetPlanId = route.params?.treatment_plan_id ?? null
  const todayIso = useMemo(() => getTodayLocal(), [])
  const { show } = useToast()

  const form = useFormState(protocolCreateSchema, {
    initialValues: buildInitialValues({ todayIso, presetPlanId }),
  })

  // Sidecar state — UI-only (não vai pro schema)
  const [medicine, setMedicine] = useState(null) // objeto completo do medicamento selecionado
  const [sheetOpen, setSheetOpen] = useState(false)
  // Flag para reabrir o sheet ao voltar de MedicineFormScreen (UX: foco continua
  // no contexto de selecionar medicamento; sheet recarrega lista e mostra novo).
  const [pendingReopenSheet, setPendingReopenSheet] = useState(false)
  const [plans, setPlans] = useState([])
  const [planField, setPlanField] = useState(() => ({
    mode: 'select',
    planId: presetPlanId || null,
    inline: null,
  }))
  const [submitting, setSubmitting] = useState(false)

  const mutation = useProtocolMutation()

  // Memos
  const showWeekdays = REQUIRES_WEEKDAYS.has(form.values.frequency)
  const doseSuffix = useMemo(
    () => pluralizeDoseUnit(form.values.dosage_per_intake || 0, medicine?.dosage_unit),
    [form.values.dosage_per_intake, medicine]
  )

  const startDateAsDate = useMemo(
    () => (form.values.start_date ? parseLocalDate(form.values.start_date) : null),
    [form.values.start_date]
  )
  const endDateAsDate = useMemo(
    () => (form.values.end_date ? parseLocalDate(form.values.end_date) : null),
    [form.values.end_date]
  )

  // Effects — reabrir sheet ao retornar de MedicineFormScreen
  useFocusEffect(
    useCallback(() => {
      if (pendingReopenSheet) {
        setPendingReopenSheet(false)
        setSheetOpen(true)
      }
    }, [pendingReopenSheet])
  )

  // Effects — carregar planos terapêuticos para o seletor
  useEffect(() => {
    let cancelled = false
    treatmentPlanService
      .getAll()
      .then((list) => {
        if (!cancelled) setPlans(Array.isArray(list) ? list : [])
      })
      .catch(() => {
        if (!cancelled) setPlans([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Handlers
  const goBack = useCallback(() => {
    lightTap()
    navigation.goBack()
  }, [navigation])

  const handleSelectMedicine = useCallback(
    (med) => {
      setMedicine(med)
      form.handleChange('medicine_id', med.id)
    },
    [form]
  )

  const handleOpenSheet = useCallback(() => {
    lightTap()
    setSheetOpen(true)
  }, [])

  const handleCloseSheet = useCallback(() => setSheetOpen(false), [])

  const handleCreateNewMedicine = useCallback(() => {
    setPendingReopenSheet(true)
    navigation.navigate(ROUTES.MEDICINE_CREATE)
  }, [navigation])

  const handleDoseChange = useCallback(
    (name, raw) => {
      // Normaliza vírgula → ponto para Number parsing (Hermes-safe)
      const normalized = String(raw ?? '').replace(',', '.')
      const num = normalized === '' ? '' : Number(normalized)
      form.handleChange(name, Number.isFinite(num) ? num : '')
    },
    [form]
  )

  const handleStartDateChange = useCallback(
    (_name, date) => {
      form.handleChange('start_date', date ? formatLocalDate(date) : null)
    },
    [form]
  )

  const handleEndDateChange = useCallback(
    (_name, date) => {
      form.handleChange('end_date', date ? formatLocalDate(date) : null)
    },
    [form]
  )

  const handlePlanFieldChange = useCallback(
    (next) => {
      setPlanField(next)
      form.handleChange('treatment_plan_id', next.mode === 'select' ? next.planId : null)
    },
    [form]
  )

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    // Validação Zod com refinements cross-campo (AP-156)
    const ok = form.validate()
    if (!ok) {
      show('Verifique os campos destacados', { variant: 'error' })
      return
    }
    setSubmitting(true)
    try {
      // Se modo inline preenchido, criar plano antes
      let planId = form.values.treatment_plan_id || null
      if (planField.mode === 'inline' && planField.inline?.name?.trim()) {
        const created = await treatmentPlanService.create({
          name: planField.inline.name.trim(),
          color: planField.inline.color,
          emoji: planField.inline.emoji,
        })
        planId = created?.id ?? null
      }

      const payload = {
        ...form.values,
        treatment_plan_id: planId,
      }

      const result = await mutation.create(payload, { goBack: true })
      if (!result) setSubmitting(false)
    } catch (err) {
      setSubmitting(false)
      show(err?.message ?? 'Erro ao criar tratamento', { variant: 'error' })
    }
  }, [form, planField, mutation, submitting, show])

  const handleCancel = useCallback(() => {
    lightTap()
    navigation.goBack()
  }, [navigation])

  return (
    <ScreenContainer>
      <View style={styles.appbar}>
        <Pressable onPress={goBack} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.appbarTitle}>Novo tratamento</Text>
        <View style={styles.appbarSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* MEDICAMENTO */}
          <Section title="Medicamento">
            <MedicineSelectorRow
              medicine={medicine}
              onPress={handleOpenSheet}
              error={form.touched.medicine_id ? form.errors.medicine_id : null}
            />
          </Section>

          {/* INFORMAÇÕES BÁSICAS */}
          <Section title="Informações básicas">
            <FormInput
              name="name"
              label="Nome do tratamento"
              value={form.values.name}
              error={form.touched.name ? form.errors.name : null}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Ex: SeloZok manhã/noite"
              required
            />
            <FormInput
              name="dosage_per_intake"
              label="Dose por tomada"
              value={form.values.dosage_per_intake === '' ? '' : String(form.values.dosage_per_intake).replace('.', ',')}
              error={form.touched.dosage_per_intake ? form.errors.dosage_per_intake : null}
              onChange={handleDoseChange}
              onBlur={form.handleBlur}
              placeholder="0"
              keyboardType="decimal-pad"
              helperText={`Unidade: ${doseSuffix}`}
              required
            />
          </Section>

          {/* FREQUÊNCIA */}
          <Section title="Frequência">
            <FormSelect
              name="frequency"
              label="Periodicidade"
              value={form.values.frequency}
              options={FREQUENCY_OPTIONS}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.touched.frequency ? form.errors.frequency : null}
              required
            />
            {showWeekdays ? (
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Dias da semana</Text>
                <WeekdaySelector
                  value={form.values.weekdays}
                  onChange={(next) => form.handleChange('weekdays', next)}
                  error={form.touched.weekdays ? form.errors.weekdays : null}
                />
              </View>
            ) : null}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Horários</Text>
              <TimeSchedulePicker
                value={form.values.time_schedule}
                onChange={(next) => form.handleChange('time_schedule', next)}
                error={form.touched.time_schedule ? form.errors.time_schedule : null}
              />
            </View>
          </Section>

          {/* PERÍODO */}
          <Section title="Período">
            <View style={styles.dateRow}>
              <View style={styles.flex}>
                <FormDatePicker
                  name="start_date"
                  label="Início"
                  value={startDateAsDate}
                  onChange={handleStartDateChange}
                  error={form.touched.start_date ? form.errors.start_date : null}
                />
              </View>
              <View style={styles.flex}>
                <FormDatePicker
                  name="end_date"
                  label="Término"
                  value={endDateAsDate}
                  onChange={handleEndDateChange}
                  error={form.touched.end_date ? form.errors.end_date : null}
                  helperText="Sem prazo = uso contínuo"
                  minimumDate={startDateAsDate}
                />
              </View>
            </View>
          </Section>

          {/* ORGANIZAÇÃO */}
          <Section title="Organização">
            <PlanSelectField
              plans={plans}
              value={planField}
              onChange={handlePlanFieldChange}
              error={form.touched.treatment_plan_id ? form.errors.treatment_plan_id : null}
            />
          </Section>

          {/* OBSERVAÇÕES */}
          <Section title="Observações">
            <FormInput
              name="notes"
              label="Notas"
              value={form.values.notes}
              error={form.touched.notes ? form.errors.notes : null}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Notas sobre este tratamento…"
              multiline
              numberOfLines={4}
              helperText="Opcional"
            />
          </Section>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <FormActions
          primaryLabel="Criar tratamento"
          onPrimary={handleSubmit}
          primaryLoading={submitting || mutation.isLoading}
          secondaryLabel="Cancelar"
          onSecondary={handleCancel}
        />
      </KeyboardAvoidingView>

      <MedicineSelectorSheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        onSelect={handleSelectMedicine}
        onCreateNew={handleCreateNewMedicine}
        selectedId={medicine?.id}
      />
    </ScreenContainer>
  )
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  iconBtn: {
    padding: spacing[1],
  },
  appbarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    gap: spacing[5],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionBody: {
    gap: spacing[3],
  },
  fieldBlock: {
    gap: spacing[2],
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  appbarSpacer: {
    width: 32,
  },
  bottomSpacer: {
    height: spacing[10],
  },
})
