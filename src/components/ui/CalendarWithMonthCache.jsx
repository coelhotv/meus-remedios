import { useState, useEffect, useCallback } from 'react'
import './Calendar.css'

/**
 * CalendarWithMonthCache - Reusable calendar with month-based lazy loading
 * Enhanced with swipe navigation and month picker
 */
export default function CalendarWithMonthCache({
  onLoadMonth,
  markedDates = [],
  selectedDate,
  onDayClick
}) {
  const [viewDate, setViewDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)



  // Load a specific month via parent callback (always call)
  const loadMonth = useCallback(async (year, month) => {
    try {
      setIsLoading(true)
      const result = await onLoadMonth(year, month)
      return result
    } catch (err) {
      console.error('Error in onLoadMonth:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [onLoadMonth])

  // When viewDate changes, always fetch that month's data
  useEffect(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    loadMonth(year, month)
  }, [viewDate, loadMonth])

  // Handle month navigation
  const handlePreviousMonth = useCallback(() => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setViewDate(newDate)
  }, [viewDate])

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setViewDate(newDate)
  }, [viewDate])

  // Handle touch events for swipe navigation
  const handleTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && !isLoading) {
      handleNextMonth()
    }
    if (isRightSwipe && !isLoading) {
      handlePreviousMonth()
    }
  }

  // Handle month picker change
  const handleMonthSelect = (e) => {
    const [selectedYear, selectedMonth] = e.target.value.split('-').map(Number)
    const newDate = new Date(selectedYear, selectedMonth, 1)
    setViewDate(newDate)
  }

  // Generate month options for last 12 months and next 3 months
  const generateMonthOptions = () => {
    const options = []
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth() - 12, 1)
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 1)

    let current = startDate
    while (current <= endDate) {
      options.push({
        value: `${current.getFullYear()}-${current.getMonth()}`,
        label: `${monthNames[current.getMonth()]} ${current.getFullYear()}`
      })
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    }

    return options.reverse()
  }

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const days = []
  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d)
    dayDate.setHours(0, 0, 0, 0)
    
    const isToday = dayDate.getTime() === today.getTime()
    const isSelected = selectedDate && 
                      dayDate.getFullYear() === selectedDate.getFullYear() && 
                      dayDate.getMonth() === selectedDate.getMonth() && 
                      dayDate.getDate() === selectedDate.getDate()
    
    const hasLog = markedDates.some(dateStr => {
      const dLog = new Date(dateStr)
      // Use UTC comparison to avoid timezone mismatches
      return dLog.getUTCFullYear() === dayDate.getFullYear() &&
             dLog.getUTCMonth() === dayDate.getMonth() &&
             dLog.getUTCDate() === dayDate.getDate()
    })

    days.push(
      <div 
        key={d} 
        className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasLog ? 'has-log' : ''}`}
        onClick={() => onDayClick && onDayClick(dayDate)}
      >
        <span className="day-number">{d}</span>
        {hasLog && <div className="log-dot"></div>}
      </div>
    )
  }

  return (
    <div className="calendar-widget">
      <div className="calendar-controls">
        <button onClick={handlePreviousMonth} disabled={isLoading} aria-label="Mês anterior">&lt;</button>
        <select
          className="month-picker"
          value={`${year}-${month}`}
          onChange={handleMonthSelect}
          disabled={isLoading}
          aria-label="Selecionar mês"
        >
          {generateMonthOptions().map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button onClick={handleNextMonth} disabled={isLoading} aria-label="Próximo mês">&gt;</button>
      </div>
      <div className="calendar-weekdays">
        <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
      </div>
      <div
        className="calendar-grid"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <div className="calendar-skeleton">
            {Array(35).fill(0).map((_, i) => (
              <div key={i} className="skeleton-day"></div>
            ))}
          </div>
        ) : (
          days
        )}
      </div>
    </div>
  )
}
