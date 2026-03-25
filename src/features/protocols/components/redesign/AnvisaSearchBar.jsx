/**
 * AnvisaSearchBar — Busca inline na base ANVISA com smart routing
 * Click em resultado: se medicina tem protocolo → edita; se não → abre TreatmentWizard
 */
import { useState } from 'react'
import MedicineAutocomplete from '@medications/components/MedicineAutocomplete'

export default function AnvisaSearchBar({ existingProtocols, onNavigateToProtocol, onOpenWizard }) {
  const [query, setQuery] = useState('')

  /**
   * Lidar com seleção de medicamento da base ANVISA
   * anvisaMedicine = { name, activeIngredient, therapeuticClass, ... }
   */
  function handleSelect(anvisaMedicine) {
    // Verificar se já existe protocolo para este medicamento (match por nome, case-insensitive)
    const match = existingProtocols.find(
      item => item.medicineName.toLowerCase() === anvisaMedicine.name.toLowerCase()
    )

    if (match) {
      // Protocolo existente → navegar para edição
      onNavigateToProtocol(match)
    } else {
      // Sem protocolo → abrir TreatmentWizard com medicamento pré-selecionado
      onOpenWizard({
        name: anvisaMedicine.name,
        active_ingredient: anvisaMedicine.activeIngredient || null,
        therapeutic_class: anvisaMedicine.therapeuticClass || null,
      })
    }

    setQuery('')
  }

  return (
    <div className="anvisa-search-bar">
      <MedicineAutocomplete
        value={query}
        onChange={setQuery}
        onSelect={handleSelect}
        placeholder="Buscar na base ANVISA..."
      />
    </div>
  )
}
