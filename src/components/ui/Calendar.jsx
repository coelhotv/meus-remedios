import { useState } from 'react'
import './Calendar.css'

export default function Calendar({ markedDates = [], selectedDate, onDayClick }) {
  const [viewDate, setViewDate] = useState(new Date())

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))
  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const days = []
  const totalDays = daysInMonth(year, month)
  const firstDay = firstDayOfMonth(year, month)

  // Preencher dias vazios no início
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Preencher dias do mês
  for (let d = 1; d <= totalDays; d++) {
    const dayDate = new Date(year, month, d)
    dayDate.setHours(0, 0, 0, 0)
    
    const isToday = dayDate.getTime() === today.getTime()
    const isSelected = selectedDate && 
                      dayDate.getFullYear() === selectedDate.getFullYear() && 
                      dayDate.getMonth() === selectedDate.getMonth() && 
                      dayDate.getDate() === selectedDate.getDate()
    
    // Verificar se há doses registradas neste dia
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
        <button onClick={prevMonth}>&lt;</button>
        <div className="current-month">
          {monthNames[month]} {year}
        </div>
        <button onClick={nextMonth}>&gt;</button>
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
