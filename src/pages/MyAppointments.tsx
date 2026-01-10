import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, doc, updateDoc, addDoc, where, orderBy, Timestamp, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import ConfirmDialog from '../components/ConfirmDialog'
import './MyAppointments.css'

interface Appointment {
  id: string
  clientId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  date: Date
  time: string
  duration: number
  type: 'discovery' | 'mentorship' | 'zoom'
  notes?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  createdAt: Date
}

function MyAppointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingType, setBookingType] = useState<'discovery' | 'mentorship' | 'zoom'>('discovery')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [userData, setUserData] = useState<{ firstName: string; lastName: string; email: string; phone: string } | null>(null)

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  useEffect(() => {
    if (currentUser) {
      loadUserData()
      loadAppointments()
    }
  }, [currentUser])

  const loadUserData = async () => {
    if (!currentUser) return

    try {
      // Load from users collection
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
      const clientDoc = await getDoc(doc(db, 'clients', currentUser.uid))
      
      const userDataObj = userDoc.data()
      const clientDataObj = clientDoc.data()
      
      setUserData({
        firstName: userDataObj?.firstName || currentUser.displayName?.split(' ')[0] || '',
        lastName: userDataObj?.lastName || currentUser.displayName?.split(' ')[1] || '',
        email: currentUser.email || '',
        phone: clientDataObj?.phone || userDataObj?.phone || ''
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadAppointments = async () => {
    if (!currentUser) return

    try {
      setLoading(true)
      const appointmentsRef = collection(db, 'appointments')
      
      let querySnapshot
      try {
        // First try with just where clause (no orderBy) - this should work without index
        // and respects security rules better
        const q = query(
          appointmentsRef,
          where('clientId', '==', currentUser.uid)
        )
        querySnapshot = await getDocs(q)
      } catch (error: any) {
        throw error
      }
      
      const appointmentsData: Appointment[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Filter by clientId if we loaded all appointments
        if (data.clientId === currentUser.uid) {
          // Ensure status is always set - default to 'pending' if missing or invalid
          let appointmentStatus = 'pending'
          if (data.status === 'pending' || data.status === 'confirmed' || data.status === 'cancelled') {
            appointmentStatus = data.status
          }
          
          // Users can now see all appointments including pending ones to see status
          const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
          const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
          
          appointmentsData.push({
            id: doc.id,
            clientId: data.clientId || '',
            clientName: data.clientName || '',
            clientEmail: data.clientEmail || '',
            clientPhone: data.clientPhone || '',
            date: appointmentDate,
            time: data.time || '',
            duration: data.duration || 60,
            type: data.type || 'discovery',
            notes: data.notes || '',
            status: appointmentStatus,
            createdAt: createdAtDate
          } as Appointment)
        }
      })
      
      // Sort by date (always sort client-side in case we loaded without orderBy)
      appointmentsData.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      setAppointments(appointmentsData)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    if (!currentUser) return

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'confirmed',
        confirmedAt: Timestamp.now()
      })
      
      // Reload appointments
      loadAppointments()
      showSuccess('Appointment confirmed successfully!')
    } catch (error) {
      console.error('Error confirming appointment:', error)
      showError('Failed to confirm appointment. Please try again.')
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      type: 'warning',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false })
        if (!currentUser) return

        try {
          const appointmentRef = doc(db, 'appointments', appointmentId)
          await updateDoc(appointmentRef, {
            status: 'cancelled',
            cancelledAt: Timestamp.now()
          })
          
          // Reload appointments
          loadAppointments()
          showSuccess('Appointment cancelled successfully')
        } catch (error) {
          console.error('Error cancelling appointment:', error)
          showError('Failed to cancel appointment. Please try again.')
        }
      }
    })
  }

  const getFilteredAppointments = (): Appointment[] => {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Set to start of day for accurate comparison
    
    switch (filter) {
      case 'upcoming':
        // Show all future appointments (pending, confirmed) that haven't been cancelled
        return appointments.filter(apt => {
          const status = apt.status || 'pending'
          const aptDate = new Date(apt.date)
          aptDate.setHours(0, 0, 0, 0)
          return aptDate >= now && status !== 'cancelled'
        })
      case 'past':
        // Show past appointments or cancelled appointments
        return appointments.filter(apt => {
          const status = apt.status || 'pending'
          const aptDate = new Date(apt.date)
          aptDate.setHours(0, 0, 0, 0)
          return aptDate < now || status === 'cancelled'
        })
      default:
        // Show all appointments including pending
        return appointments
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentUser || !userData || !bookingDate || !bookingTime) {
      showError('Please fill in all required fields')
      return
    }

    try {
      setBookingLoading(true)

      // Combine date and time
      const [hours, minutes] = bookingTime.split(':').map(Number)
      const appointmentDateTime = new Date(bookingDate)
      appointmentDateTime.setHours(hours, minutes, 0, 0)

      // Check if date is in the past
      if (appointmentDateTime < new Date()) {
        showError('Please select a future date and time')
        setBookingLoading(false)
        return
      }

      const duration = getDuration(bookingType)

      // Check for conflicts
      const conflictingAppointment = appointments.find(apt => {
        const aptStatus = apt.status || 'pending'
        if (aptStatus === 'cancelled') return false
        const aptDate = apt.date
        const timeDiff = Math.abs(aptDate.getTime() - appointmentDateTime.getTime())
        const minDuration = Math.min(duration, apt.duration)
        return timeDiff < minDuration * 60 * 1000
      })

      if (conflictingAppointment) {
        showError('This time slot conflicts with an existing appointment. Please select a different time.')
        setBookingLoading(false)
        return
      }

      // Create appointment with explicit pending status
      const appointmentData = {
        clientId: currentUser.uid,
        clientName: `${userData.firstName} ${userData.lastName}`,
        clientEmail: userData.email,
        clientPhone: userData.phone,
        date: Timestamp.fromDate(appointmentDateTime),
        time: bookingTime,
        duration,
        type: bookingType,
        notes: bookingNotes || '',
        status: 'pending' as const,
        createdAt: Timestamp.now()
      }
      
      await addDoc(collection(db, 'appointments'), appointmentData)

      showSuccess('Appointment requested successfully!')
      setShowBookingForm(false)
      setBookingDate('')
      setBookingTime('')
      setBookingType('discovery')
      setBookingNotes('')
      loadAppointments()
    } catch (error) {
      console.error('Error booking appointment:', error)
      showError('Failed to book appointment. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  // Get minimum date (today) for booking
  const getMinDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString().split('T')[0]
  }

  const filteredAppointments = getFilteredAppointments()

  if (!currentUser) {
    return (
      <div className="appointments-container">
        <div className="appointments-content">
          <p>Please sign in to view your appointments.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="appointments-container">
      <div className="appointments-header">
        <h1>My Appointments</h1>
        <p>View and manage your scheduled appointments</p>
      </div>

      <div className="appointments-content">
        <div className="appointments-header-actions">
        <div className="appointments-filters">
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === 'upcoming' ? 'active' : ''}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`filter-button ${filter === 'past' ? 'active' : ''}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>
        <button
          className="book-appointment-button"
          onClick={() => setShowBookingForm(!showBookingForm)}
        >
          {showBookingForm ? 'Cancel Booking' : '+ Request Appointment'}
        </button>
      </div>

        {showBookingForm && (
          <div className="booking-form-container">
            <h2>Book New Appointment</h2>
            <form onSubmit={handleBookAppointment} className="booking-form">
              <div className="form-group">
                <label htmlFor="bookingType">Appointment Type *</label>
                <select
                  id="bookingType"
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as 'discovery' | 'mentorship' | 'zoom')}
                  required
                >
                  <option value="discovery">Discovery Call (15 min)</option>
                  <option value="mentorship">Mentorship Session (60 min)</option>
                  <option value="zoom">Zoom Session (60 min)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bookingDate">Date *</label>
                <input
                  type="date"
                  id="bookingDate"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getMinDate()}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="bookingTime">Time *</label>
                <select
                  id="bookingTime"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                >
                  <option value="">Select a time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{formatTime(slot)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bookingNotes">Notes (Optional)</label>
                <textarea
                  id="bookingNotes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional information or preferences..."
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-booking-button"
                  onClick={() => {
                    setShowBookingForm(false)
                    setBookingDate('')
                    setBookingTime('')
                    setBookingNotes('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-booking-button"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Request Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-message">
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="no-appointments">
            <p>
              {filter === 'upcoming' 
                ? 'You have no upcoming appointments.' 
                : filter === 'past'
                ? 'You have no past appointments.'
                : 'You have no appointments scheduled.'}
            </p>
            <p className="help-text">Request an appointment using the form above. You'll see the status of all your appointments here.</p>
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map(appointment => {
              const isPast = appointment.date < new Date()
              const isUpcoming = appointment.date >= new Date()
              
              return (
                <div 
                  key={appointment.id} 
                  className={`appointment-card ${appointment.status === 'cancelled' ? 'cancelled' : ''} ${appointment.status === 'pending' || appointment.status === undefined ? 'pending' : ''} ${isPast ? 'past' : ''}`}
                >
                  <div className="appointment-header">
                    <div className="appointment-date-time">
                      <div className="appointment-date">{formatDate(appointment.date)}</div>
                      <div className="appointment-time">{formatTime(appointment.time)}</div>
                      <div className="appointment-duration">Duration: {appointment.duration} min</div>
                    </div>
                    <div className="appointment-status">
                      <span className={`status-badge status-${appointment.status || 'pending'}`}>
                        {(appointment.status || 'pending') === 'confirmed' ? 'Confirmed' : 
                         (appointment.status || 'pending') === 'cancelled' ? 'Cancelled' : 
                         'Pending Confirmation'}
                      </span>
                    </div>
                  </div>

                  <div className="appointment-details">
                    <div className="appointment-type">
                      <strong>Type:</strong> {getTypeName(appointment.type)}
                    </div>
                    {appointment.notes && (
                      <div className="appointment-notes">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  {/* Status-specific messages */}
                  {appointment.status === 'pending' && (
                    <div className="appointment-status-message pending-message">
                      <strong>Status: Pending</strong>
                      <p>Your appointment request is awaiting confirmation. You will be notified once it's been reviewed and confirmed by the admin.</p>
                    </div>
                  )}

                  {appointment.status === 'confirmed' && isUpcoming && (
                    <>
                      <div className="appointment-status-message confirmed-message">
                        <strong>Status: Confirmed</strong>
                        <p>This appointment has been confirmed. We look forward to meeting with you!</p>
                      </div>
                      <div className="appointment-actions">
                        <button
                          className="cancel-button"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    </>
                  )}

                  {appointment.status === 'confirmed' && isPast && (
                    <div className="appointment-status-message confirmed-message">
                      <strong>Status: Confirmed (Past)</strong>
                      <p>This appointment was completed.</p>
                    </div>
                  )}

                  {appointment.status === 'cancelled' && (
                    <div className="appointment-status-message cancelled-message">
                      <strong>Status: Cancelled</strong>
                      <p>This appointment has been cancelled.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
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

export default MyAppointments

