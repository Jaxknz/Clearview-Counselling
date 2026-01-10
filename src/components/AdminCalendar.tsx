import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, addDoc, deleteDoc, doc, where, orderBy, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import ConfirmDialog from './ConfirmDialog'
import './AdminCalendar.css'

interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  date: Date
  time: string
  duration: number // in minutes
  type: 'discovery' | 'mentorship' | 'zoom'
  notes?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  createdAt: Date
}

interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  plan: string
}

interface AdminCalendarProps {
  clients: ClientData[]
}

type CalendarView = 'calendar' | 'pending'

function AdminCalendar({ clients }: AdminCalendarProps) {
  const { showSuccess, showError } = useToast()
  const [view, setView] = useState<CalendarView>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [appointmentType, setAppointmentType] = useState<'discovery' | 'mentorship' | 'zoom'>('discovery')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([])
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type?: 'danger' | 'warning' | 'info'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  })
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  useEffect(() => {
    loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, view])

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const appointmentsRef = collection(db, 'appointments')
      
      // Load all appointments (we need all for pending view, and can filter calendar client-side)
      let querySnapshot
      
      // Try to load current month for calendar view (for performance), but need all for pending
      if (view === 'calendar') {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        startOfMonth.setHours(0, 0, 0, 0)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
        
        try {
          const q = query(
            appointmentsRef,
            where('date', '>=', Timestamp.fromDate(startOfMonth)),
            where('date', '<=', Timestamp.fromDate(endOfMonth)),
            orderBy('date', 'asc')
          )
          querySnapshot = await getDocs(q)
        } catch (error: any) {
          if (error.code === 'failed-precondition') {
            // If index not found, load all and filter client-side
            querySnapshot = await getDocs(appointmentsRef)
          } else {
            throw error
          }
        }
      } else {
        // For pending view, always load all appointments
        querySnapshot = await getDocs(appointmentsRef)
      }
      
      const allAppointmentsData: Appointment[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
        
        const appointment = {
          id: doc.id,
          ...data,
          date: appointmentDate,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || 'pending'
        } as Appointment
        allAppointmentsData.push(appointment)
      })
      
      // For calendar view, filter by month
      if (view === 'calendar') {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
        const monthAppointments = allAppointmentsData.filter(apt => {
          const aptDate = apt.date
          return aptDate >= startOfMonth && aptDate <= endOfMonth
        })
        setAppointments(monthAppointments)
      } else {
        // For pending view, show all (will be filtered to pending below)
        setAppointments(allAppointmentsData)
      }
      
      // Always filter pending appointments from ALL appointments (need to load separately if we loaded month view)
      let allAppointmentsForPending: Appointment[] = []
      
      if (view === 'pending') {
        // Already have all appointments
        allAppointmentsForPending = allAppointmentsData
      } else {
        // For calendar view, need to load all appointments separately for accurate pending count
        try {
          const allQuerySnapshot = await getDocs(appointmentsRef)
          allQuerySnapshot.forEach((doc) => {
            const data = doc.data()
            const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
            const appointment = {
              id: doc.id,
              ...data,
              date: appointmentDate,
              createdAt: data.createdAt?.toDate() || new Date(),
              status: data.status || 'pending'
            } as Appointment
            allAppointmentsForPending.push(appointment)
          })
        } catch (error) {
          // Fallback to what we have
          allAppointmentsForPending = allAppointmentsData
        }
      }
      
      const now = new Date()
      const pending = allAppointmentsForPending.filter(apt => {
        const status = apt.status || 'pending'
        const aptDate = apt.date
        return status === 'pending' && aptDate >= now
      })
      // Sort by date (earliest first)
      pending.sort((a, b) => {
        const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.time}`)
        const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.time}`)
        return dateA.getTime() - dateB.getTime()
      })
      setPendingAppointments(pending)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
      setPendingAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const getDuration = (type: 'discovery' | 'mentorship' | 'zoom') => {
    switch (type) {
      case 'discovery':
        return 15
      case 'mentorship':
        return 60
      case 'zoom':
        return 60
      default:
        return 60
    }
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const handleRequestReschedule = async (e: React.FormEvent, appointmentId: string) => {
    e.preventDefault()
    if (!rescheduleDate || !rescheduleTime) {
      showError('Please fill in all fields')
      return
    }

    try {
      setRescheduleLoading(true)
      const appointment = pendingAppointments.find(apt => apt.id === appointmentId)
      if (!appointment) {
        showError('Appointment not found')
        setRescheduleLoading(false)
        return
      }

      const appointmentDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`)
      
      // Check if date is in the past
      if (appointmentDateTime < new Date()) {
        showError('Please select a future date and time')
        setRescheduleLoading(false)
        return
      }

      // Check for conflicts with existing appointments for this client
      const appointmentsRef = collection(db, 'appointments')
      const q = query(appointmentsRef, where('clientId', '==', appointment.clientId))
      let querySnapshot
      try {
        querySnapshot = await getDocs(q)
      } catch (error: any) {
        querySnapshot = await getDocs(appointmentsRef)
      }
      
      const duration = getDuration(appointment.type)
      const [rescheduleHours, rescheduleMinutes] = rescheduleTime.split(':').map(Number)
      const newStart = new Date(appointmentDateTime)
      newStart.setHours(rescheduleHours, rescheduleMinutes, 0, 0)
      const newEnd = new Date(newStart.getTime() + duration * 60000)
      
      let hasConflict = false
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (doc.id === appointmentId) return // Skip the appointment being rescheduled
        
        const aptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
        const [aptHours, aptMinutes] = data.time.split(':').map(Number)
        const aptStart = new Date(aptDate)
        aptStart.setHours(aptHours, aptMinutes, 0, 0)
        const aptDuration = data.duration || 60
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000)
        
        // Check for overlap
        if (data.status !== 'cancelled' && 
            ((newStart >= aptStart && newStart < aptEnd) || 
             (newEnd > aptStart && newEnd <= aptEnd) ||
             (newStart <= aptStart && newEnd >= aptEnd))) {
          hasConflict = true
        }
      })

      if (hasConflict) {
        showError('This time slot conflicts with an existing appointment. Please select a different time.')
        setRescheduleLoading(false)
        return
      }

      // Update appointment with new date/time (status remains pending)
      await updateDoc(doc(db, 'appointments', appointmentId), {
        date: Timestamp.fromDate(appointmentDateTime),
        time: rescheduleTime,
        status: 'pending',
        updatedAt: Timestamp.now()
      })

      // Send email notification to client
      const newAppointmentDate = new Date(appointmentDateTime)
      const subject = `Clearview Counselling - Appointment Reschedule Request`
      const body = `Dear ${appointment.clientName},\n\n` +
        `We would like to request a reschedule of your appointment:\n\n` +
        `Previous Date/Time:\n` +
        `- Date: ${formatDate(appointment.date)}\n` +
        `- Time: ${formatTime(appointment.time)}\n\n` +
        `Requested New Date/Time:\n` +
        `- Date: ${formatDate(newAppointmentDate)}\n` +
        `- Time: ${formatTime(rescheduleTime)}\n` +
        `- Type: ${getTypeName(appointment.type)}\n` +
        `- Duration: ${duration} minutes\n\n` +
        `Please confirm if this new time works for you, or let us know if you would prefer a different time.\n\n` +
        `Best regards,\nClearview Counselling`
      const mailtoLink = `mailto:${appointment.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      showSuccess('Appointment rescheduled! Opening email to notify client...')
      window.location.href = mailtoLink
      
      setReschedulingAppointmentId(null)
      setRescheduleDate('')
      setRescheduleTime('')
      loadAppointments()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      showError('Failed to reschedule appointment. Please try again.')
    } finally {
      setRescheduleLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getAppointmentsForDate = (date: Date | null): Appointment[] => {
    if (!date) return []
    return appointments.filter(apt => {
      const aptDate = apt.date
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear()
    })
  }

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
      setShowBookingForm(true)
      setSelectedTime('')
      setSelectedClient('')
      setAppointmentNotes('')
    }
  }

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime || !selectedClient) {
      showError('Please select a date, time, and client')
      return
    }

    try {
      setLoading(true)
      
      const client = clients.find(c => c.id === selectedClient)
      if (!client) {
        showError('Client not found')
        setLoading(false)
        return
      }

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const appointmentDateTime = new Date(selectedDate)
      appointmentDateTime.setHours(hours, minutes, 0, 0)

      // Get duration based on appointment type
      const duration = appointmentType === 'discovery' ? 15 : 
                      appointmentType === 'mentorship' ? 60 : 60

      // Check for conflicts (within duration to avoid overlaps)
      const conflictingAppointment = appointments.find(apt => {
        const aptDate = apt.date
        const timeDiff = Math.abs(aptDate.getTime() - appointmentDateTime.getTime())
        const minDuration = Math.min(duration, apt.duration)
        return timeDiff < minDuration * 60 * 1000 // Check within minimum duration
      })

      if (conflictingAppointment) {
        showError('This time slot conflicts with an existing appointment. Please select a different time.')
        setLoading(false)
        return
      }

      // Create appointment with explicit pending status
      await addDoc(collection(db, 'appointments'), {
        clientId: selectedClient,
        clientName: `${client.firstName} ${client.lastName}`,
        clientEmail: client.email,
        clientPhone: client.phone,
        date: Timestamp.fromDate(appointmentDateTime),
        time: selectedTime,
        duration,
        type: appointmentType,
        notes: appointmentNotes || '',
        status: 'pending',
        createdAt: Timestamp.now()
      })

      showSuccess('Appointment booked successfully!')
      setShowBookingForm(false)
      setSelectedDate(null)
      setSelectedTime('')
      setSelectedClient('')
      setAppointmentNotes('')
      setAppointmentType('discovery')
      loadAppointments()
    } catch (error) {
      console.error('Error booking appointment:', error)
      showError('Failed to book appointment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Appointment',
      message: 'Are you sure you want to delete this appointment?',
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        try {
          await deleteDoc(doc(db, 'appointments', appointmentId))
          loadAppointments()
          showSuccess('Appointment deleted successfully')
        } catch (error) {
          console.error('Error deleting appointment:', error)
          showError('Failed to delete appointment. Please try again.')
        }
      }
    })
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'discovery':
        return 'Discovery Call'
      case 'mentorship':
        return 'Mentorship Session'
      case 'zoom':
        return 'Zoom Session'
      default:
        return type
    }
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth(currentMonth)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="admin-calendar">
      <div className="calendar-header">
        <div className="calendar-view-tabs">
          <button
            className={`calendar-view-tab ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            Calendar View
          </button>
          <button
            className={`calendar-view-tab ${view === 'pending' ? 'active' : ''}`}
            onClick={() => setView('pending')}
          >
            Pending Appointments ({pendingAppointments.length})
          </button>
        </div>
        {view === 'calendar' && (
          <div className="calendar-header-top">
            <div className="calendar-nav">
              <button onClick={prevMonth} className="nav-button">Previous</button>
              <h2>{monthName}</h2>
              <button onClick={nextMonth} className="nav-button">Next</button>
            </div>
            <button 
              onClick={() => {
                setSelectedDate(new Date())
                setShowBookingForm(true)
              }}
              className="new-appointment-button"
            >
              + New Appointment
            </button>
          </div>
        )}
      </div>

      {loadingAppointments && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading {view === 'calendar' ? 'calendar' : 'appointments'}...</p>
        </div>
      )}

      {view === 'pending' && !loadingAppointments && (
        <div className="pending-appointments-list">
          <h3>Pending Appointments ({pendingAppointments.length})</h3>
          {pendingAppointments.length === 0 ? (
            <div className="no-pending-appointments">
              <p>No pending appointments at this time</p>
            </div>
          ) : (
            <div className="pending-appointments-grid">
              {pendingAppointments.map(apt => (
                  <div key={apt.id} className="pending-appointment-card">
                    <div className="pending-appointment-header">
                      <div className="pending-appointment-client">
                        <strong>{apt.clientName}</strong>
                        <span className="pending-appointment-email">{apt.clientEmail}</span>
                      </div>
                      <span className="pending-badge">Pending</span>
                    </div>
                    <div className="pending-appointment-details">
                      <div className="pending-appointment-date">
                        <strong>Date:</strong> {formatDate(apt.date)}
                      </div>
                      <div className="pending-appointment-time">
                        <strong>Time:</strong> {formatTime(apt.time)}
                      </div>
                      <div className="pending-appointment-type">
                        <strong>Type:</strong> {getTypeName(apt.type)} ({apt.duration} min)
                      </div>
                      {apt.notes && (
                        <div className="pending-appointment-notes">
                          <strong>Notes:</strong> {apt.notes}
                        </div>
                      )}
                      <div className="pending-appointment-created">
                        <small>Requested: {apt.createdAt.toLocaleDateString()} at {apt.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    </div>
                    {reschedulingAppointmentId === apt.id ? (
                      <div className="reschedule-form-pending">
                        <h4>Request Reschedule</h4>
                        <form onSubmit={(e) => handleRequestReschedule(e, apt.id)} className="reschedule-form-pending-content">
                          <div className="form-group">
                            <label htmlFor={`rescheduleDate-${apt.id}`}>New Date *</label>
                            <input
                              type="date"
                              id={`rescheduleDate-${apt.id}`}
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              min={getMinDate()}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label htmlFor={`rescheduleTime-${apt.id}`}>New Time *</label>
                            <select
                              id={`rescheduleTime-${apt.id}`}
                              value={rescheduleTime}
                              onChange={(e) => setRescheduleTime(e.target.value)}
                              required
                            >
                              <option value="">Select a time</option>
                              {timeSlots.map(slot => (
                                <option key={slot} value={slot}>{formatTime(slot)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="reschedule-form-actions">
                            <button
                              type="button"
                              className="cancel-reschedule-button"
                              onClick={() => {
                                setReschedulingAppointmentId(null)
                                setRescheduleDate('')
                                setRescheduleTime('')
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="submit-reschedule-button"
                              disabled={rescheduleLoading}
                            >
                              {rescheduleLoading ? 'Rescheduling...' : 'Request Reschedule'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="pending-appointment-actions">
                        <button
                          className="email-pending-button"
                          onClick={() => {
                            const subject = `Clearview Counselling - Appointment Request Confirmation`
                            const body = `Dear ${apt.clientName},\n\n` +
                              `Thank you for requesting an appointment. We have received your request:\n\n` +
                              `Date: ${formatDate(apt.date)}\n` +
                              `Time: ${formatTime(apt.time)}\n` +
                              `Type: ${getTypeName(apt.type)}\n` +
                              `Duration: ${apt.duration} minutes\n\n` +
                              (apt.notes ? `Notes: ${apt.notes}\n\n` : '') +
                              `We will review your request and confirm the appointment shortly. You will receive another email once the appointment is confirmed.\n\n` +
                              `If you have any questions, please don't hesitate to contact us.\n\n` +
                              `Best regards,\nClearview Counselling`
                            const mailtoLink = `mailto:${apt.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                            window.location.href = mailtoLink
                          }}
                          title="Send email to client"
                        >
                          Email Client
                        </button>
                        <button
                          className="reschedule-pending-button"
                          onClick={() => {
                            setReschedulingAppointmentId(apt.id)
                            const dateStr = apt.date.toISOString().split('T')[0]
                            setRescheduleDate(dateStr)
                            setRescheduleTime(apt.time)
                          }}
                          title="Request reschedule for this appointment"
                        >
                          Request Reschedule
                        </button>
                        <button
                          className="confirm-pending-button"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Confirm Appointment',
                              message: `Confirm appointment with ${apt.clientName} on ${formatDate(apt.date)} at ${formatTime(apt.time)}?`,
                              type: 'info',
                              onConfirm: async () => {
                                setConfirmDialog({ ...confirmDialog, isOpen: false })
                                try {
                                  await updateDoc(doc(db, 'appointments', apt.id), {
                                    status: 'confirmed',
                                    updatedAt: Timestamp.now()
                                  })
                                  showSuccess('Appointment confirmed!')
                                  loadAppointments()
                                } catch (error) {
                                  console.error('Error confirming appointment:', error)
                                  showError('Failed to confirm appointment. Please try again.')
                                }
                              }
                            })
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          className="cancel-pending-button"
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Cancel Appointment',
                              message: `Cancel appointment with ${apt.clientName} on ${formatDate(apt.date)} at ${formatTime(apt.time)}?`,
                              type: 'warning',
                              onConfirm: async () => {
                                setConfirmDialog({ ...confirmDialog, isOpen: false })
                                try {
                                  await updateDoc(doc(db, 'appointments', apt.id), {
                                    status: 'cancelled',
                                    updatedAt: Timestamp.now()
                                  })
                                  showSuccess('Appointment cancelled')
                                  loadAppointments()
                                } catch (error) {
                                  console.error('Error cancelling appointment:', error)
                                  showError('Failed to cancel appointment. Please try again.')
                                }
                              }
                            })
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && !loadingAppointments && (
        <>
        <div className="calendar-grid">
        <div className="calendar-days-header">
          {dayNames.map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date)
            const isToday = date && 
              date.toDateString() === new Date().toDateString()
            
            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday ? 'today' : ''} ${selectedDate && date && selectedDate.toDateString() === date.toDateString() ? 'selected' : ''}`}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-appointments">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div 
                          key={apt.id} 
                          className={`appointment-badge appointment-${apt.type}`}
                          title={`${apt.clientName} - ${apt.time} (${apt.type})`}
                        >
                          {apt.time} - {apt.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="more-appointments">
                          +{dayAppointments.length - 2} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Appointments List - Show for selected date */}
      {selectedDate && !showBookingForm && (
        <div className="appointments-list">
          <h3>Appointments for {formatDate(selectedDate)}</h3>
          {getAppointmentsForDate(selectedDate).length === 0 ? (
            <p className="no-appointments">No appointments scheduled for this date</p>
          ) : (
            <div className="appointments-items">
              {getAppointmentsForDate(selectedDate)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(apt => {
                  const status = apt.status || 'pending'
                  return (
                    <div key={apt.id} className={`appointment-item ${status === 'pending' ? 'pending-item' : ''}`}>
                      <div className="appointment-time">{apt.time}</div>
                      <div className="appointment-details">
                        <div className="appointment-client">
                          {apt.clientName}
                          {status === 'pending' && <span className="pending-indicator">Pending</span>}
                        </div>
                        <div className="appointment-meta">
                          {apt.type === 'discovery' ? 'Discovery Call' : 
                           apt.type === 'mentorship' ? 'Mentorship' : 
                           'Zoom Session'} - {apt.duration} min - {apt.clientPhone}
                        </div>
                        {apt.notes && (
                          <div className="appointment-notes">{apt.notes}</div>
                        )}
                      </div>
                      <button 
                        className="delete-appointment-button"
                        onClick={() => handleDeleteAppointment(apt.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
      </>
      )}

      {showBookingForm && (
        <div className="booking-modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button 
                className="close-button" 
                onClick={() => setShowBookingForm(false)}
              >
                Close
              </button>
            </div>
            
            <form onSubmit={handleBookAppointment} className="booking-form">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="form-group">
                <label>Client *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Time *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as 'discovery' | 'mentorship' | 'zoom')}
                    required
                  >
                    <option value="discovery">Discovery Call (15 min)</option>
                    <option value="mentorship">Mentorship (60 min)</option>
                    <option value="zoom">Zoom Session (60 min)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this appointment..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        type={confirmDialog.type}
      />
    </div>
  )
}

export default AdminCalendar

