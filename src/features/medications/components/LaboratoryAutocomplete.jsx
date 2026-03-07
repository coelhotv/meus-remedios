import { useState, useCallback, useRef, useEffect } from 'react'
import { searchLaboratories } from '@medications/services/laboratoryDatabaseService'
import './Autocomplete.css'

/**
 * Componente de autocomplete para laboratórios ANVISA.
 *
 * Debounce de 300ms + dropdown com navegação por teclado.
 *
 * Props:
 * - value: string — valor do input
 * - onChange: (value) => void — callback ao digitar
 * - onSelect: (laboratory) => void — callback ao selecionar
 * - placeholder: string (default: "Digite o nome do laboratório...")
 * - disabled: boolean (default: false)
 */
export default function LaboratoryAutocomplete({ value = '', onChange, onSelect, placeholder, disabled = false }) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  /**
   * Executa busca com debounce de 300ms
   */
  const debouncedSearch = useCallback(
    async (query) => {
      if (!query || query.length < 1) {
        setSuggestions([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const results = await searchLaboratories(query, 10)
        setSuggestions(results)
        setIsOpen(results.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Erro ao buscar laboratórios:', error)
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  /**
   * Debounce wrapper
   */
  const handleSearch = useCallback(
    (query) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        debouncedSearch(query)
      }, 300)
    },
    [debouncedSearch]
  )

  /**
   * Ao digitar no input
   */
  const handleInputChange = (e) => {
    const newValue = e.target.value
    onChange?.(newValue)
    handleSearch(newValue)
  }

  /**
   * Ao selecionar uma sugestão
   */
  const handleSelect = (laboratory) => {
    onSelect?.(laboratory)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
  }

  /**
   * Navegação por teclado (setas, Enter, Escape)
   */
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex])
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break

      default:
        break
    }
  }

  /**
   * Fechar dropdown ao clicar fora
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (inputRef.current && !inputRef.current.contains(event.target)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Scroll para item selecionado
   */
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[role="option"]')
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  return (
    <div className="autocomplete-wrapper">
      <div className="autocomplete-input-container">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Digite o nome do laboratório...'}
          autoComplete="off"
          disabled={disabled}
          className="autocomplete-input"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls="laboratory-dropdown"
        />
        {isLoading && <span className="autocomplete-spinner">⟳</span>}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="laboratory-dropdown"
          className="autocomplete-dropdown"
          role="listbox"
        >
          {suggestions.map((laboratory, index) => (
            <div
              key={index}
              role="option"
              aria-selected={selectedIndex === index}
              className={`autocomplete-item ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => handleSelect(laboratory)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="autocomplete-item-name">{laboratory.laboratory}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
