import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, addDoc, deleteDoc, doc, where, orderBy, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import ConfirmDialog from './ConfirmDialog'

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

type CalendarView = 'calendar' | 'pending' | 'all'

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
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [showDayBreakdown, setShowDayBreakdown] = useState(false)
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
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  useEffect(() => {
    loadAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, view])

  // Disable body scroll when modals are open
  useEffect(() => {
    if (showDayBreakdown || showBookingForm || reschedulingAppointmentId) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDayBreakdown, showBookingForm, reschedulingAppointmentId])

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const appointmentsRef = collection(db, 'appointments')
      
      // Load all appointments (we need all for pending view, and can filter calendar client-side)
      let querySnapshot
      
      // Try to load current month for calendar view (for performance), but need all for pending/all views
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
        // For pending/all views, always load all appointments
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
      
      // Store all appointments
      setAllAppointments(allAppointmentsData)
      
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
        // For pending/all views, show all (will be filtered to pending below)
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
      // Keep day breakdown open and refresh
      if (selectedDate) {
        setShowDayBreakdown(true)
      }
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
    // Use allAppointments to get all appointments for the date, not just month-filtered ones
    const appointmentsToSearch = view === 'calendar' ? allAppointments : appointments
    return appointmentsToSearch.filter(apt => {
      const aptDate = apt.date
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear()
    })
  }

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
      setShowDayBreakdown(true)
      setShowBookingForm(false)
    }
  }

  const handleCreateAppointmentFromDay = () => {
    setShowBookingForm(true)
    setShowDayBreakdown(false)
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
      // If we came from day breakdown, keep the date selected and show breakdown again
      if (selectedDate) {
        setShowDayBreakdown(true)
      } else {
        setShowDayBreakdown(false)
        setSelectedDate(null)
      }
      setSelectedTime('')
      setSelectedClient('')
      setAppointmentNotes('')
      setAppointmentType('discovery')
      // Small delay to ensure appointment is saved before reloading
      setTimeout(() => {
        loadAppointments()
      }, 500)
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

  const handleEditNotes = async (appointmentId: string, currentNotes: string) => {
    setEditingAppointmentId(appointmentId)
    setEditingNotes(currentNotes || '')
  }

  const handleSaveNotes = async (appointmentId: string) => {
    try {
      setSavingNotes(true)
      await updateDoc(doc(db, 'appointments', appointmentId), {
        notes: editingNotes,
        updatedAt: Timestamp.now()
      })
      showSuccess('Notes updated successfully')
      setEditingAppointmentId(null)
      setEditingNotes('')
      // Small delay to ensure appointment is saved before reloading
      setTimeout(() => {
        loadAppointments()
      }, 300)
    } catch (error) {
      console.error('Error updating notes:', error)
      showError('Failed to update notes. Please try again.')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleRescheduleFromDayBreakdown = (apt: Appointment) => {
    setReschedulingAppointmentId(apt.id)
    const dateStr = apt.date.toISOString().split('T')[0]
    setRescheduleDate(dateStr)
    setRescheduleTime(apt.time)
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
    <div className="bg-white p-8 md:p-4 rounded-xl shadow-custom">
        <div className="flex flex-col gap-6 mb-8">
        <div className="flex gap-2 sm:gap-4 border-b-2 border-border pb-0 overflow-x-auto">
          <button
            className={`py-2 sm:py-3 px-3 sm:px-6 bg-none border-none border-b-[3px] font-semibold text-text-light cursor-pointer transition-all duration-300 text-sm sm:text-base relative bottom-[-2px] whitespace-nowrap flex-shrink-0 ${
              view === 'calendar' 
                ? 'text-primary border-b-primary' 
                : 'border-b-transparent hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => {
              setView('calendar')
              setShowDayBreakdown(false)
              setShowBookingForm(false)
              setSelectedDate(null)
            }}
          >
            Calendar View
          </button>
          <button
            className={`py-2 sm:py-3 px-3 sm:px-6 bg-none border-none border-b-[3px] font-semibold text-text-light cursor-pointer transition-all duration-300 text-sm sm:text-base relative bottom-[-2px] whitespace-nowrap flex-shrink-0 ${
              view === 'pending' 
                ? 'text-primary border-b-primary' 
                : 'border-b-transparent hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => {
              setView('pending')
              setShowDayBreakdown(false)
              setShowBookingForm(false)
              setSelectedDate(null)
            }}
          >
            Pending ({pendingAppointments.length})
          </button>
          <button
            className={`py-2 sm:py-3 px-3 sm:px-6 bg-none border-none border-b-[3px] font-semibold text-text-light cursor-pointer transition-all duration-300 text-sm sm:text-base relative bottom-[-2px] whitespace-nowrap flex-shrink-0 ${
              view === 'all' 
                ? 'text-primary border-b-primary' 
                : 'border-b-transparent hover:text-primary hover:bg-primary/5'
            }`}
            onClick={() => {
              setView('all')
              setShowDayBreakdown(false)
              setShowBookingForm(false)
              setSelectedDate(null)
            }}
          >
            All ({allAppointments.length})
          </button>
        </div>
        {view === 'calendar' && (
          <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <button onClick={prevMonth} className="py-2 px-3 sm:px-4 bg-bg-light border-2 border-border rounded-lg font-semibold text-text-dark cursor-pointer transition-all duration-300 hover:bg-primary hover:text-white hover:border-primary text-sm sm:text-base">Previous</button>
              <h2 className="m-0 text-lg sm:text-xl md:text-2xl text-text-dark text-center flex-1 sm:flex-initial sm:min-w-[200px]">{monthName}</h2>
              <button onClick={nextMonth} className="py-2 px-3 sm:px-4 bg-bg-light border-2 border-border rounded-lg font-semibold text-text-dark cursor-pointer transition-all duration-300 hover:bg-primary hover:text-white hover:border-primary text-sm sm:text-base">Next</button>
            </div>
            <button 
              onClick={() => {
                setSelectedDate(new Date())
                setShowDayBreakdown(true)
                setShowBookingForm(false)
              }}
              className="py-2 sm:py-3 px-4 sm:px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg text-sm sm:text-base w-full sm:w-auto"
            >
              + New Appointment
            </button>
          </div>
        )}
      </div>

      {loadingAppointments && (
        <div className="text-center py-8">
          <p>Loading {view === 'calendar' ? 'calendar' : 'appointments'}...</p>
        </div>
      )}

      {view === 'all' && !loadingAppointments && (
        <div className="mt-4">
          <h3 className="text-text-dark text-2xl md:text-xl mb-6 pb-4 border-b-2 border-border">All Appointments ({allAppointments.length})</h3>
          {allAppointments.length === 0 ? (
            <div className="text-center py-16 px-8 text-text-light bg-white rounded-xl border-2 border-dashed border-border">
              <p>No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allAppointments
                .sort((a, b) => {
                  const dateA = new Date(`${a.date.toISOString().split('T')[0]}T${a.time}`)
                  const dateB = new Date(`${b.date.toISOString().split('T')[0]}T${b.time}`)
                  return dateB.getTime() - dateA.getTime() // Most recent first
                })
                .map(apt => {
                  const status = apt.status || 'pending'
                  return (
                    <div key={apt.id} className={`bg-white border-2 rounded-xl p-6 transition-all duration-300 flex flex-col gap-4 hover:shadow-lg ${
                      status === 'pending' 
                        ? 'border-l-4 border-l-[#f5d89c]' 
                        : status === 'confirmed'
                        ? 'border-l-4 border-l-primary'
                        : 'border-l-4 border-l-gray-400 opacity-70'
                    }`}>
                      <div className="flex justify-between items-start pb-4 border-b-2 border-border">
                        <div className="flex flex-col gap-1">
                          <strong className="text-text-dark text-lg">{apt.clientName}</strong>
                          <span className="text-text-light text-sm">{apt.clientEmail}</span>
                        </div>
                        <span className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap ${
                          status === 'pending' 
                            ? 'bg-[#f5d89c] text-[#8b6914]' 
                            : status === 'confirmed'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {status === 'pending' ? 'Pending' : status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="text-text-dark text-sm">
                          <strong className="text-text-dark mr-2">Date:</strong> {formatDate(apt.date)}
                        </div>
                        <div className="text-text-dark text-sm">
                          <strong className="text-text-dark mr-2">Time:</strong> {formatTime(apt.time)}
                        </div>
                        <div className="text-text-dark text-sm">
                          <strong className="text-text-dark mr-2">Type:</strong> {getTypeName(apt.type)} ({apt.duration} min)
                        </div>
                        {editingAppointmentId === apt.id ? (
                          <div className="mt-3 p-3 bg-white rounded-lg border border-primary/20">
                            <label className="block font-semibold text-text-dark mb-2 text-xs">Notes</label>
                            <textarea
                              value={editingNotes}
                              onChange={(e) => setEditingNotes(e.target.value)}
                              rows={3}
                              placeholder="Add notes about this appointment..."
                              className="w-full py-2 px-3 border-2 border-border rounded-lg text-sm transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none bg-white"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveNotes(apt.id)}
                                disabled={savingNotes}
                                className="py-1.5 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {savingNotes ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAppointmentId(null)
                                  setEditingNotes('')
                                }}
                                className="py-1.5 px-4 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2">
                            {apt.notes ? (
                              <div className="text-xs text-text-light italic bg-white p-2 rounded border border-border/50 relative group">
                                <strong className="text-text-dark not-italic mr-1">Notes:</strong>
                                {apt.notes}
                                <button
                                  onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                                  className="ml-2 text-xs text-primary hover:text-primary-dark font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Edit
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-text-light">
                                <button
                                  onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                                  className="text-primary hover:text-primary-dark font-medium cursor-pointer"
                                >
                                  + Add notes
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="pt-2 border-t border-border text-text-light text-xs">
                          <small>Created: {apt.createdAt.toLocaleDateString()} at {apt.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                      </div>
                      <div className="flex gap-1.5 pt-4 border-t-2 border-border flex-wrap">
                        <button
                          className="py-1.5 px-3 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                          onClick={() => handleRescheduleFromDayBreakdown(apt)}
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                          className="py-1.5 px-3 bg-primary text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                        >
                          {apt.notes ? 'Edit Notes' : 'Add Notes'}
                        </button>
                        <button
                          className="py-1.5 px-3 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                          onClick={() => {
                            const subject = `Clearview Counselling - Appointment Update`
                            const body = `Dear ${apt.clientName},\n\n` +
                              `This email is regarding your appointment:\n\n` +
                              `Date: ${formatDate(apt.date)}\n` +
                              `Time: ${formatTime(apt.time)}\n` +
                              `Type: ${getTypeName(apt.type)}\n` +
                              `Status: ${status === 'confirmed' ? 'Confirmed' : status === 'cancelled' ? 'Cancelled' : 'Pending Confirmation'}\n\n` +
                              (apt.notes ? `Notes: ${apt.notes}\n\n` : '') +
                              `Please let us know if you have any questions.\n\n` +
                              `Best regards,\nClearview Counselling`
                            const mailtoLink = `mailto:${apt.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                            window.location.href = mailtoLink
                          }}
                        >
                          Email
                        </button>
                        {status === 'pending' && (
                          <button
                            className="py-1.5 px-3 bg-gradient-to-r from-accent to-[#66bb6a] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
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
                        )}
                        <button
                          className="py-1.5 px-3 bg-[#e57373] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                          onClick={() => handleDeleteAppointment(apt.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {view === 'pending' && !loadingAppointments && (
        <div className="mt-4">
          <h3 className="text-text-dark text-2xl md:text-xl mb-6 pb-4 border-b-2 border-border">Pending Appointments ({pendingAppointments.length})</h3>
          {pendingAppointments.length === 0 ? (
            <div className="text-center py-16 px-8 text-text-light bg-bg-light rounded-xl border-2 border-dashed border-border">
              <p>No pending appointments at this time</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-6 md:grid-cols-1">
              {pendingAppointments.map(apt => (
                  <div key={apt.id} className="bg-white border-2 border-border border-l-4 border-l-[#f5d89c] rounded-xl p-6 transition-all duration-300 flex flex-col gap-4 hover:shadow-custom-lg hover:border-primary hover:-translate-y-0.5">
                    <div className="flex justify-between items-start pb-4 border-b-2 border-border">
                      <div className="flex flex-col gap-1">
                        <strong className="text-text-dark text-lg">{apt.clientName}</strong>
                        <span className="text-text-light text-sm">{apt.clientEmail}</span>
                      </div>
                      <span className="bg-[#f5d89c] text-[#8b6914] py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap">Pending</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="text-text-dark text-sm">
                        <strong className="text-text-dark mr-2">Date:</strong> {formatDate(apt.date)}
                      </div>
                      <div className="text-text-dark text-sm">
                        <strong className="text-text-dark mr-2">Time:</strong> {formatTime(apt.time)}
                      </div>
                      <div className="text-text-dark text-sm">
                        <strong className="text-text-dark mr-2">Type:</strong> {getTypeName(apt.type)} ({apt.duration} min)
                      </div>
                      {apt.notes && (
                        <div className="p-3 bg-bg-light rounded-md italic text-text-dark text-sm">
                          <strong className="text-text-dark not-italic mr-2">Notes:</strong> {apt.notes}
                        </div>
                      )}
                      <div className="pt-2 border-t border-border text-text-light text-xs">
                        <small>Requested: {apt.createdAt.toLocaleDateString()} at {apt.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    </div>
                    {reschedulingAppointmentId === apt.id ? (
                      <div className="pt-4 border-t-2 border-border mt-4">
                        <h4 className="text-text-dark mb-4 text-lg">Request Reschedule</h4>
                        <form onSubmit={(e) => handleRequestReschedule(e, apt.id)} className="flex flex-col gap-4 bg-bg-light p-4 rounded-lg">
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`rescheduleDate-${apt.id}`} className="font-semibold text-text-dark text-sm">New Date *</label>
                            <input
                              type="date"
                              id={`rescheduleDate-${apt.id}`}
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              min={getMinDate()}
                              required
                              className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor={`rescheduleTime-${apt.id}`} className="font-semibold text-text-dark text-sm">New Time *</label>
                            <select
                              id={`rescheduleTime-${apt.id}`}
                              value={rescheduleTime}
                              onChange={(e) => setRescheduleTime(e.target.value)}
                              required
                              className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                            >
                              <option value="">Select a time</option>
                              {timeSlots.map(slot => (
                                <option key={slot} value={slot}>{formatTime(slot)}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-4 mt-2 md:flex-col">
                            <button
                              type="button"
                              className="flex-1 py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
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
                              className="flex-1 py-3 px-6 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
                              disabled={rescheduleLoading}
                            >
                              {rescheduleLoading ? 'Rescheduling...' : 'Request Reschedule'}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 pt-4 border-t-2 border-border flex-wrap">
                        <button
                          className="py-1.5 px-3 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
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
                          Email
                        </button>
                        <button
                          className="py-1.5 px-3 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                          onClick={() => {
                            setReschedulingAppointmentId(apt.id)
                            const dateStr = apt.date.toISOString().split('T')[0]
                            setRescheduleDate(dateStr)
                            setRescheduleTime(apt.time)
                          }}
                          title="Request reschedule for this appointment"
                        >
                          Reschedule
                        </button>
                        <button
                          className="py-1.5 px-3 bg-gradient-to-r from-accent to-[#66bb6a] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
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
                          className="py-1.5 px-3 bg-[#e57373] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
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
        <div className="mb-8 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 min-w-[600px]">
          {dayNames.map(day => (
            <div key={day} className="text-center font-semibold text-text-dark py-2 text-xs sm:text-sm">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[600px]">
          {days.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date)
            const isToday = date && 
              date.toDateString() === new Date().toDateString()
            const isSelected = selectedDate && date && selectedDate.toDateString() === date.toDateString()
            
            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[100px] border-2 rounded-lg p-1 sm:p-2 cursor-pointer transition-all duration-300 bg-white ${
                  !date 
                    ? 'border-transparent cursor-default' 
                    : isToday 
                    ? 'border-primary bg-primary/10' 
                    : isSelected
                    ? 'border-primary bg-primary/15 shadow-[0_0_0_3px_rgba(74,144,226,0.2)]'
                    : 'border-border hover:bg-bg-light hover:border-primary'
                }`}
                onClick={() => handleDateClick(date)}
              >
                {date && (
                  <>
                    <div className="font-semibold text-text-dark mb-1 sm:mb-2 text-xs sm:text-sm">{date.getDate()}</div>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      {dayAppointments.slice(0, 2).map(apt => (
                        <div 
                          key={apt.id} 
                          className={`text-[10px] sm:text-xs py-0.5 sm:py-1 px-1 sm:px-2 rounded text-white whitespace-nowrap overflow-hidden text-ellipsis ${
                            apt.type === 'discovery' 
                              ? 'bg-accent' 
                              : apt.type === 'mentorship' 
                              ? 'bg-primary' 
                              : 'bg-secondary'
                          }`}
                          title={`${apt.clientName} - ${apt.time} (${apt.type})`}
                        >
                          {apt.time} - {apt.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayAppointments.length > 2 && (
                        <div className="text-[10px] sm:text-xs text-text-light italic">
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

      </>
      )}

      {/* Day Breakdown Modal/Popup */}
      {showDayBreakdown && selectedDate && !showBookingForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1000]" onClick={() => {
          setShowDayBreakdown(false)
          setSelectedDate(null)
        }}>
          <div className="bg-white rounded-2xl p-8 md:p-6 w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto shadow-custom-lg border border-primary/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-text-dark text-2xl md:text-xl font-semibold">Appointments for {formatDate(selectedDate)}</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleCreateAppointmentFromDay}
                  className="py-2 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-sm"
                >
                  + New Appointment
                </button>
                <button
                  onClick={() => {
                    setShowDayBreakdown(false)
                    setSelectedDate(null)
                  }}
                  className="bg-transparent border-none text-2xl text-text-light cursor-pointer leading-none p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/20 hover:text-text-dark"
                >
                  ×
                </button>
              </div>
            </div>
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-border">
                <p className="text-text-light mb-4 text-lg">No appointments scheduled for this date</p>
                <button
                  onClick={handleCreateAppointmentFromDay}
                  className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
                >
                  Create First Appointment
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {getAppointmentsForDate(selectedDate)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(apt => {
                    const status = apt.status || 'pending'
                    return (
                      <div key={apt.id} className={`flex gap-4 p-4 bg-white rounded-lg border-l-4 shadow-sm ${
                        status === 'pending' 
                          ? 'border-l-[#f5d89c] bg-[rgba(245,216,156,0.15)]' 
                          : status === 'confirmed'
                          ? 'border-l-primary bg-primary/5'
                          : 'border-l-gray-400 bg-gray-50'
                      } md:flex-col`}>
                        <div className="font-bold text-primary min-w-[100px] text-lg">{formatTime(apt.time)}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-text-dark mb-1 text-lg">
                            {apt.clientName}
                            <span className={`inline-block ml-3 py-1 px-2 rounded-lg text-xs font-bold ${
                              status === 'pending' 
                                ? 'bg-[#f5d89c] text-[#8b6914]' 
                                : status === 'confirmed'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {status === 'pending' ? 'Pending' : status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                            </span>
                          </div>
                          <div className="text-sm text-text-light mb-2">
                            {getTypeName(apt.type)} - {apt.duration} min
                          </div>
                          <div className="text-sm text-text-light mb-2">
                            📧 {apt.clientEmail} | 📞 {apt.clientPhone}
                          </div>
                          {editingAppointmentId === apt.id ? (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-primary/20">
                              <label className="block font-semibold text-text-dark mb-2 text-xs">Notes</label>
                              <textarea
                                value={editingNotes}
                                onChange={(e) => setEditingNotes(e.target.value)}
                                rows={3}
                                placeholder="Add notes about this appointment..."
                                className="w-full py-2 px-3 border-2 border-border rounded-lg text-sm transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none bg-white"
                              />
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleSaveNotes(apt.id)}
                                  disabled={savingNotes}
                                  className="py-1.5 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {savingNotes ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingAppointmentId(null)
                                    setEditingNotes('')
                                  }}
                                  className="py-1.5 px-4 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border text-xs"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              {apt.notes ? (
                                <div className="text-xs text-text-light italic bg-white p-2 rounded border border-border/50 relative group">
                                  <strong className="text-text-dark not-italic mr-1">Notes:</strong>
                                  {apt.notes}
                                  <button
                                    onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                                    className="ml-2 text-xs text-primary hover:text-primary-dark font-medium cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Edit
                                  </button>
                                </div>
                              ) : (
                                <div className="text-xs text-text-light">
                                  <button
                                    onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                                    className="text-primary hover:text-primary-dark font-medium cursor-pointer"
                                  >
                                    + Add notes
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row gap-1.5 flex-wrap">
                          <button 
                            className="py-1.5 px-3 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                            onClick={() => handleRescheduleFromDayBreakdown(apt)}
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleEditNotes(apt.id, apt.notes || '')}
                            className="py-1.5 px-3 bg-primary text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                          >
                            {apt.notes ? 'Edit Notes' : 'Add Notes'}
                          </button>
                          {status === 'pending' && (
                            <button
                              className="py-1.5 px-3 bg-gradient-to-r from-accent to-[#66bb6a] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
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
                          )}
                          <button 
                            className="py-1.5 px-3 bg-[#e57373] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom text-xs whitespace-nowrap"
                            onClick={() => handleDeleteAppointment(apt.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal/Popup */}
      {reschedulingAppointmentId && !showBookingForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1002]" onClick={() => {
          setReschedulingAppointmentId(null)
          setRescheduleDate('')
          setRescheduleTime('')
        }}>
          <div className="bg-white rounded-2xl p-8 md:p-6 w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-custom-lg border border-primary/20" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const apt = allAppointments.find(a => a.id === reschedulingAppointmentId)
              if (!apt) return null
              
              return (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-text-dark text-2xl md:text-xl font-semibold">Reschedule Appointment</h3>
                    <button
                      onClick={() => {
                        setReschedulingAppointmentId(null)
                        setRescheduleDate('')
                        setRescheduleTime('')
                      }}
                      className="bg-transparent border-none text-2xl text-text-light cursor-pointer leading-none p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/20 hover:text-text-dark"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="mb-6 p-4 bg-white rounded-lg border border-primary/20">
                    <h4 className="font-semibold text-text-dark mb-2">Current Appointment:</h4>
                    <p className="text-text-light text-sm mb-1"><strong>Client:</strong> {apt.clientName}</p>
                    <p className="text-text-light text-sm mb-1"><strong>Date:</strong> {formatDate(apt.date)}</p>
                    <p className="text-text-light text-sm mb-1"><strong>Time:</strong> {formatTime(apt.time)}</p>
                    <p className="text-text-light text-sm"><strong>Type:</strong> {getTypeName(apt.type)}</p>
                  </div>

                  <form onSubmit={(e) => handleRequestReschedule(e, apt.id)} className="flex flex-col gap-6">
                    <div>
                      <label htmlFor="rescheduleDate-modal" className="block font-semibold text-text-dark mb-2 text-sm">New Date *</label>
                      <input
                        type="date"
                        id="rescheduleDate-modal"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        min={getMinDate()}
                        required
                        className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="rescheduleTime-modal" className="block font-semibold text-text-dark mb-2 text-sm">New Time *</label>
                      <select
                        id="rescheduleTime-modal"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        required
                        className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                      >
                        <option value="">Select a time</option>
                        {timeSlots.map(slot => (
                          <option key={slot} value={slot}>{formatTime(slot)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 mt-4 pt-6 border-t border-border md:flex-col">
                      <button
                        type="button"
                        className="flex-1 py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
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
                        className="flex-1 py-3 px-6 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
                        disabled={rescheduleLoading}
                      >
                        {rescheduleLoading ? 'Rescheduling...' : 'Reschedule'}
                      </button>
                    </div>
                  </form>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[1001]" onClick={() => {
          setShowBookingForm(false)
          if (selectedDate && view === 'calendar') {
            setShowDayBreakdown(true)
          } else {
            setShowDayBreakdown(false)
            setSelectedDate(null)
          }
        }}>
          <div className="bg-white rounded-2xl p-8 md:p-6 w-[90%] max-w-[600px] max-h-[90vh] overflow-y-auto shadow-custom-lg border border-primary/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="m-0 text-text-dark text-2xl md:text-xl font-semibold">Book Appointment</h2>
              <button 
                className="bg-transparent border-none text-2xl text-text-light cursor-pointer leading-none p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/20 hover:text-text-dark" 
                onClick={() => {
                  setShowBookingForm(false)
                  if (selectedDate) {
                    setShowDayBreakdown(true)
                  }
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleBookAppointment} className="flex flex-col gap-6">
              <div className="mb-6">
                <label className="block font-semibold text-text-dark mb-2 text-sm">Date *</label>
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-text-dark mb-2 text-sm">Client *</label>
                <select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
                <div className="mb-6 md:mb-0">
                  <label className="block font-semibold text-text-dark mb-2 text-sm">Time *</label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-6 md:mb-0">
                  <label className="block font-semibold text-text-dark mb-2 text-sm">Type *</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as 'discovery' | 'mentorship' | 'zoom')}
                    required
                    className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                  >
                    <option value="discovery">Discovery Call (15 min)</option>
                    <option value="mentorship">Mentorship (60 min)</option>
                    <option value="zoom">Zoom Session (60 min)</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block font-semibold text-text-dark mb-2 text-sm">Notes (Optional)</label>
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this appointment..."
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-border md:flex-col">
                <button 
                  type="button" 
                  className="py-3 px-8 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
                  onClick={() => {
                    setShowBookingForm(false)
                    if (selectedDate) {
                      setShowDayBreakdown(true)
                    }
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="py-3 px-8 bg-nature-gradient text-white border-none rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
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

