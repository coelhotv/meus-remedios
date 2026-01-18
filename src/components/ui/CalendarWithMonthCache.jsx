import { useState, useEffect, useCallback } from 'react'
import './Calendar.css'

/**
 * CalendarWithMonthCache - Reusable calendar with month-based lazy loading
 * Handles all caching and month navigation logic internally
 * 
 * @param {Function} onLoadMonth - Called when a month needs to be loaded: (year, month) => Promise
 * @param {Array} markedDates - Current month's marked dates (ISO strings)
 * @param {Date} selectedDate - Currently selected date
 * @param {Function} onDayClick - Callback when a day is clicked
 */
export default function CalendarWithMonthCache({
  onLoadMonth,
  markedDates = [],
  selectedDate,
  onDayClick
}) {
  const [viewDate, setViewDate] = useState(new Date())
  const [monthCache, setMonthCache] = useState({})
  const [loadedMonths, setLoadedMonths] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Get cache key for a month
  const getMonthKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`
  }

  // Load a specific month
  const loadMonth = useCallback(async (year, month) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    
    // Return if already loaded
    if (loadedMonths.has(monthKey)) {
      return
    }
    
    try {
      setIsLoading(true)
      const result = await onLoadMonth(year, month)
      
      if (result && result.data) {
        setMonthCache(prev => ({
          ...prev,
          [monthKey]: result.data
        }))
        setLoadedMonths(prev => new Set(prev).add(monthKey))
      }
    } catch (err) {
      console.error(`Error loading month ${monthKey}:`, err)
    } finally {
      setIsLoading(false)
    }
  }, [loadedMonths, onLoadMonth])

  // Handle month navigation
  const handlePreviousMonth = useCallback(() => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setViewDate(newDate)
    
    // Lazy load the previous month
    loadMonth(newDate.getFullYear(), newDate.getMonth())
  }, [viewDate, loadMonth])

  const handleNextMonth = useCallback(() => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setViewDate(newDate)
    
    // Lazy load the next month
    loadMonth(newDate.getFullYear(), newDate.getMonth())
  }, [viewDate, loadMonth])

  // Initial load of current month
  useEffect(() => {
    loadMonth(viewDate.getFullYear(), viewDate.getMonth())
  }, []) // Only on mount

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

  // Fill empty days
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fill month days
  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d)
    dayDate.setHours(0, 0, 0, 0)
    
    const isToday = dayDate.getTime() === today.getTime()
    const isSelected = selectedDate && 
                      dayDate.getFullYear() === selectedDate.getFullYear() && 
                      dayDate.getMonth() === selectedDate.getMonth() && 
                      dayDate.getDate() === selectedDate.getDate()
    
    // Check marked dates from current month
    const hasLog = markedDates.some(dateStr => {
      const dLog = new Date(dateStr)
      dLog.setHours(0, 0, 0, 0)
      return dLog.getTime() === dayDate.getTime()
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
        <button onClick={handlePreviousMonth} disabled={isLoading}>&lt;</button>
        <div className="current-month">
          {monthNames[month]} {year}
        </div>
        <button onClick={handleNextMonth} disabled={isLoading}>&gt;</button>
      </div>
      <div className="calendar-weekdays">
        <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
      </div>
      <div className="calendar-grid">
        {days}
      </div>
    </div>
  )
}
