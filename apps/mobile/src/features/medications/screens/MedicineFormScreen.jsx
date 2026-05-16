// MedicineFormScreen.jsx — tela unificada create + edit (Sprint M1.2)
//
// Recebe `medicine` em route.params para modo edição. Sem param = modo criação.
// ANVISA bottom sheet preenche campos automaticamente via setValues.

import { useState, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ChevronLeft } from 'lucide-react-native'
import {
  medicineCreateSchema,
  medicineUpdateSchema,
  MEDICINE_TYPES,
  MEDICINE_TYPE_LABELS,
  DOSAGE_UNITS,
  REGULATORY_CATEGORIES,
  REGULATORY_CATEGORY_LABELS,
} from '@dosiq/core'
import { useFormState } from '@shared/hooks/useFormState'
import FormInput from '@shared/components/form/FormInput'
import FormSelect from '@shared/components/form/FormSelect'
import FormSection from '@shared/components/form/FormSection'
import FormActions from '@shared/components/form/FormActions'
import { useMedicineMutation } from '@medications/hooks/useMedicineMutation'
import { AnvisaBanner } from '@medications/components/AnvisaBanner'
import { MedicineAnvisaSheet } from '@medications/components/MedicineAnvisaSheet'
import { colors, spacing, typography } from '@shared/styles/tokens'

const TYPE_OPTIONS = MEDICINE_TYPES.map((value) => ({
  value,
  label: MEDICINE_TYPE_LABELS[value] ?? value,
}))

const UNIT_OPTIONS = DOSAGE_UNITS.map((value) => ({ value, label: value }))

const REGULATORY_OPTIONS = REGULATORY_CATEGORIES.map((value) => ({
  value,
  label: REGULATORY_CATEGORY_LABELS[value] ?? value,
}))

const DEFAULT_INITIAL = { type: 'medicamento', dosage_unit: 'mg' }

function formProps(form, name) {
  return {
    value: form.values[name],
    error: form.touched[name] ? form.errors[name] : undefined,
    onChange: form.handleChange,
    onBlur: form.handleBlur,
  }
}

export default function MedicineFormScreen() {
  // States
  const navigation = useNavigation()
  const route = useRoute()
  const medicine = route.params?.medicine ?? null
  const isEditing = !!medicine

  const initialValues = useMemo(
    () => (medicine ?? DEFAULT_INITIAL),
    [medicine]
  )

  const form = useFormState(
    isEditing ? medicineUpdateSchema : medicineCreateSchema,
    { initialValues }
  )
  const { create, update, isLoading } = useMedicineMutation()
  const [sheetOpen, setSheetOpen] = useState(false)

  // Handlers
  const openSheet = useCallback(() => setSheetOpen(true), [])
  const closeSheet = useCallback(() => setSheetOpen(false), [])

  const handleAnvisaSelect = useCallback(
    (item) => {
      form.setValues({
        name: item.name ?? form.values.name,
        active_ingredient: item.activeIngredient ?? form.values.active_ingredient,
        therapeutic_class: item.therapeuticClass ?? form.values.therapeutic_class,
        regulatory_category: item.regulatoryCategory ?? form.values.regulatory_category,
      })
      setSheetOpen(false)
    },
    [form]
  )

  const handleSubmit = useCallback(async () => {
    if (!form.validate()) return
    if (isEditing) {
      await update(medicine.id, form.values, { goBack: true })
    } else {
      await create(form.values, { goBack: true })
    }
  }, [form, isEditing, medicine, create, update])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.title}>
          {isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {!isEditing && <AnvisaBanner onPress={openSheet} />}

        <FormSection title="Identificação">
          <FormInput
            name="name"
            label="Nome"
            required
            {...formProps(form, 'name')}
          />
          <FormInput
            name="active_ingredient"
            label="Princípio Ativo"
            {...formProps(form, 'active_ingredient')}
          />
        </FormSection>

        <FormSection title="Dosagem">
          <FormInput
            name="dosage_per_pill"
            label="Dose por unidade"
            required
            keyboardType="numeric"
            {...formProps(form, 'dosage_per_pill')}
          />
          <FormSelect
            name="dosage_unit"
            label="Unidade"
            required
            options={UNIT_OPTIONS}
            {...formProps(form, 'dosage_unit')}
          />
        </FormSection>

        <FormSection title="Classificação">
          <FormSelect
            name="type"
            label="Tipo"
            options={TYPE_OPTIONS}
            {...formProps(form, 'type')}
          />
          <FormInput
            name="laboratory"
            label="Laboratório"
            {...formProps(form, 'laboratory')}
          />
          <FormInput
            name="therapeutic_class"
            label="Classe Terapêutica"
            {...formProps(form, 'therapeutic_class')}
          />
          <FormSelect
            name="regulatory_category"
            label="Categoria Regulatória"
            options={REGULATORY_OPTIONS}
            {...formProps(form, 'regulatory_category')}
          />
        </FormSection>
      </ScrollView>

      <FormActions
        primaryLabel={isEditing ? 'Salvar' : 'Criar medicamento'}
        onPrimary={handleSubmit}
        primaryLoading={isLoading}
        secondaryLabel="Cancelar"
        onSecondary={() => navigation.goBack()}
      />

      <MedicineAnvisaSheet
        open={sheetOpen}
        onClose={closeSheet}
        onSelect={handleAnvisaSelect}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.bg.card,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    paddingBottom: spacing[12],
  },
})
