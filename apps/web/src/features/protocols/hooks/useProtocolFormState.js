import { useState, useEffect, useCallback } from 'react'
import {
  getInitialFormData,
  validateProtocolForm,
  prepareDataToSave,
  handleAddTime,
  handleRemoveTime,
} from './protocolFormUtils'
import { submitProtocolForm } from './_protocolFormSubmit'

export function useProtocolFormState({
  protocol,
  initialValues,
  preselectedMedicine,
  isSimpleMode,
  onSave,
  onSuccess,
  autoAdvance,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(protocol, initialValues, preselectedMedicine, isSimpleMode)
  )

  const [enableTitration, setEnableTitration] = useState(
    protocol?.titration_schedule?.length > 0 || protocol?.titration_status === 'titulando'
  )

  const [timeInput, setTimeInput] = useState('')
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shakeFields, setShakeFields] = useState({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Sync initial dosage with first stage if titration is enabled for new protocols
  useEffect(() => {
    if (!protocol && enableTitration && formData.titration_schedule?.length > 0) {
      const firstStage = formData.titration_schedule[0]
      if (firstStage.dosage && !formData.dosage_per_intake) {
        setFormData((prev) => ({ ...prev, dosage_per_intake: firstStage.dosage }))
      }
    }
  }, [enableTitration, formData.titration_schedule, protocol, formData.dosage_per_intake])

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      }
      return prev
    })
  }, [])

  const addTime = useCallback(() => {
    handleAddTime(timeInput, formData, setFormData, setErrors, setTimeInput)
  }, [timeInput, formData, setFormData, setErrors, setTimeInput])

  const removeTime = useCallback((time) => {
    handleRemoveTime(time, setFormData)
  }, [setFormData])

  const validate = useCallback(() => {
    return validateProtocolForm(formData, setErrors, setShakeFields)
  }, [formData])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!validate()) return

      try {
        await submitProtocolForm({
          formData,
          enableTitration,
          onSave,
          onSuccess,
          isSimpleMode,
          autoAdvance,
          setIsSubmitting,
          setErrors,
          setSaveSuccess,
        })
      } catch (error) {
        // Error already handled in submitProtocolForm
      }
    },
    [formData, enableTitration, isSimpleMode, autoAdvance, onSave, onSuccess, validate]
  )

  const handleTitrationEnable = useCallback((enabled) => {
    setEnableTitration(enabled)
    setFormData((prev) => ({
      ...prev,
      titration_status: enabled ? 'titulando' : 'estável',
    }))
  }, [])

  const setTitrationSchedule = useCallback((newSchedule) => {
    setFormData((prev) => ({ ...prev, titration_schedule: newSchedule }))
  }, [])

  return {
    formData,
    enableTitration,
    timeInput,
    errors,
    isSubmitting,
    shakeFields,
    saveSuccess,
    handleChange,
    setTimeInput,
    addTime,
    removeTime,
    handleSubmit,
    handleTitrationEnable,
    setTitrationSchedule,
  }
}
