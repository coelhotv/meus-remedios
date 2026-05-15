// FormKitDemoScreen — playground dos primitivos do Form Kit (Sprint P.1)
// Apenas para validação visual em ambiente DEV. Não usar em produção.

import { useState } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronLeft } from 'lucide-react-native'
import {
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTimePicker,
  FormSection,
  FormActions,
} from '@shared/components/form'
import { colors, spacing } from '@shared/styles/tokens'

const FREQUENCY_OPTIONS = [
  { label: 'Diário', value: 'diario' },
  { label: 'Dias alternados', value: 'dias_alternados' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Personalizado', value: 'personalizado' },
  { label: 'Quando necessário', value: 'quando_necessario' },
]

export default function FormKitDemoScreen({ navigation }) {
  // Inputs interativos
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState(undefined)
  const [dose, setDose] = useState('500')
  const [notes, setNotes] = useState('')
  const [frequency, setFrequency] = useState(null)
  const [frequencyErr, setFrequencyErr] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [reminderTime, setReminderTime] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Filtra dígitos + um único separador decimal (vírgula ou ponto)
  function handleDoseChange(_, v) {
    const cleaned = v.replace(/[^0-9.,]/g, '')
    // Mantém apenas o primeiro separador decimal
    const match = cleaned.match(/^(\d*)([.,]?)(\d*)/)
    setDose(match ? match[1] + match[2] + match[3] : '')
  }

  function toggleNameError() {
    setNameError(nameError ? undefined : 'Nome deve ter pelo menos 2 caracteres')
  }

  function handleSubmit() {
    setSubmitLoading(true)
    setTimeout(() => setSubmitLoading(false), 1500)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Form Kit · Demo</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Seção 1 — FormInput em todos estados */}
        <FormSection
          title="FormInput"
          description="Texto, número, com erro, desabilitado, helper, multiline"
        >
          <FormInput
            name="nameDefault"
            label="Nome do medicamento"
            placeholder="Ex.: Paracetamol"
            value={name}
            onChange={(_, v) => setName(v)}
            required
            helperText="Toque no botão abaixo para alternar o estado de erro"
          />
          <TouchableOpacity onPress={toggleNameError} style={styles.toggleBtn}>
            <Text style={styles.toggleBtnText}>
              {nameError ? 'Limpar erro' : 'Forçar erro'}
            </Text>
          </TouchableOpacity>

          <FormInput
            name="nameError"
            label="Nome (com erro)"
            value={name}
            onChange={(_, v) => setName(v)}
            error={nameError}
            placeholder="Digite algo curto"
          />

          <FormInput
            name="dose"
            label="Dose (mg)"
            value={dose}
            onChange={handleDoseChange}
            keyboardType="numeric"
            placeholder="0"
            helperText="Apenas números (filtro no onChange)"
          />

          <FormInput
            name="disabled"
            label="Campo desabilitado"
            value="Não posso editar"
            onChange={() => {}}
            disabled
          />

          <FormInput
            name="notes"
            label="Observações"
            placeholder="Notas sobre o medicamento…"
            value={notes}
            onChange={(_, v) => setNotes(v)}
            multiline
            numberOfLines={4}
          />
        </FormSection>

        {/* Seção 2 — FormSelect */}
        <FormSection
          title="FormSelect"
          description="Modal sheet com lista de opções"
        >
          <FormSelect
            name="frequency"
            label="Frequência"
            placeholder="Selecione uma frequência"
            value={frequency}
            options={FREQUENCY_OPTIONS}
            onChange={(_, v) => setFrequency(v)}
            required
          />

          <FormSelect
            name="frequencyError"
            label="Frequência (erro)"
            placeholder="Toque para abrir"
            value={frequencyErr}
            options={FREQUENCY_OPTIONS}
            onChange={(_, v) => setFrequencyErr(v)}
            error={frequencyErr ? undefined : 'Campo obrigatório'}
            helperText="Erro some ao selecionar"
          />
        </FormSection>

        {/* Seção 3 — Pickers de data/hora */}
        <FormSection
          title="FormDatePicker / FormTimePicker"
          description="iOS abre modal spinner; Android abre dialog nativo"
        >
          <FormDatePicker
            name="startDate"
            label="Data de início"
            placeholder="dd/mm/aaaa"
            value={startDate}
            onChange={(_, v) => setStartDate(v)}
            required
          />

          <FormTimePicker
            name="reminderTime"
            label="Horário do lembrete"
            placeholder="--:--"
            value={reminderTime}
            onChange={(_, v) => setReminderTime(v)}
            helperText="Use o formato 24h"
          />
        </FormSection>

        {/* Seção 4 — FormActions em todas variantes */}
        <FormSection
          title="FormActions"
          description="Botões primary/secondary, loading e variante destrutiva"
        >
          <FormActions
            primaryLabel="Salvar"
            onPrimary={handleSubmit}
            secondaryLabel="Cancelar"
            onSecondary={() => navigation?.goBack()}
            primaryLoading={submitLoading}
          />

          <View style={styles.gap} />

          <FormActions
            primaryLabel="Excluir"
            onPrimary={() => {}}
            secondaryLabel="Cancelar"
            onSecondary={() => {}}
            destructive
          />

          <View style={styles.gap} />

          <FormActions
            primaryLabel="Apenas confirmar"
            onPrimary={() => {}}
          />

          <View style={styles.gap} />

          <FormActions
            primaryLabel="Desabilitado"
            onPrimary={() => {}}
            primaryDisabled
          />
        </FormSection>

        {/* Estado atual (debug) */}
        <FormSection
          title="Estado atual"
          description="Snapshot dos valores controlados nesta tela"
        >
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>
              {JSON.stringify(
                { name, dose, notes, frequency, frequencyErr, startDate, reminderTime },
                null,
                2,
              )}
            </Text>
          </View>
        </FormSection>
      </ScrollView>
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
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    padding: spacing[5],
    paddingBottom: spacing[12],
  },
  toggleBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.primary[50],
    borderRadius: 8,
    marginTop: -spacing[2],
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary[700],
  },
  gap: {
    height: spacing[3],
  },
  debugBox: {
    backgroundColor: colors.neutral[800],
    borderRadius: 12,
    padding: spacing[4],
  },
  debugText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: colors.text.inverse,
  },
})
