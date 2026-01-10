import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, doc, updateDoc, addDoc, where, Timestamp, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import ConfirmDialog from '../components/ConfirmDialog'

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
  const { showSuccess, showError } = useToast()
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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type?: 'warning' | 'danger' | 'info'
    onConfirm?: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  })

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
      <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-gradient-to-b from-bg-light via-sky/10 to-nature-green/10">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-white via-sky/10 to-nature-green/10 p-12 md:p-8 rounded-2xl shadow-custom-lg border border-primary/20">
          <p className="text-text-dark text-center">Please sign in to view your appointments.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">My Appointments</h1>
        <p className="text-lg text-text-light">View and manage your scheduled appointments</p>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-10 md:p-6 rounded-2xl shadow-custom-lg">
        <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-border flex-wrap gap-4 md:flex-col md:items-stretch">
        <div className="flex gap-4 flex-wrap md:w-full">
          <button
            className={`py-3 px-6 rounded-lg font-semibold text-text-dark cursor-pointer transition-all duration-300 border-2 ${
              filter === 'all' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-bg-light border-border hover:border-primary hover:bg-primary/10'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`py-3 px-6 rounded-lg font-semibold text-text-dark cursor-pointer transition-all duration-300 border-2 ${
              filter === 'upcoming' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-bg-light border-border hover:border-primary hover:bg-primary/10'
            }`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`py-3 px-6 rounded-lg font-semibold text-text-dark cursor-pointer transition-all duration-300 border-2 ${
              filter === 'past' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-bg-light border-border hover:border-primary hover:bg-primary/10'
            }`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>
        <button
          className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-custom md:w-full"
          onClick={() => setShowBookingForm(!showBookingForm)}
        >
          {showBookingForm ? 'Cancel Booking' : '+ Request Appointment'}
        </button>
      </div>

        {showBookingForm && (
          <div className="mb-8 p-8 bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 rounded-xl border-2 border-primary/20">
            <h2 className="mt-0 mb-6 text-text-dark text-2xl md:text-xl">Book New Appointment</h2>
            <form onSubmit={handleBookAppointment} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="bookingType" className="font-semibold text-text-dark text-sm">Appointment Type *</label>
                <select
                  id="bookingType"
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value as 'discovery' | 'mentorship' | 'zoom')}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base font-inherit transition-[border-color] duration-300 focus:outline-none focus:border-primary"
                >
                  <option value="discovery">Discovery Call (15 min)</option>
                  <option value="mentorship">Mentorship Session (60 min)</option>
                  <option value="zoom">Zoom Session (60 min)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="bookingDate" className="font-semibold text-text-dark text-sm">Date *</label>
                <input
                  type="date"
                  id="bookingDate"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={getMinDate()}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base font-inherit transition-[border-color] duration-300 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="bookingTime" className="font-semibold text-text-dark text-sm">Time *</label>
                <select
                  id="bookingTime"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  required
                  className="py-3 px-3 border-2 border-border rounded-lg text-base font-inherit transition-[border-color] duration-300 focus:outline-none focus:border-primary"
                >
                  <option value="">Select a time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{formatTime(slot)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="bookingNotes" className="font-semibold text-text-dark text-sm">Notes (Optional)</label>
                <textarea
                  id="bookingNotes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={4}
                  placeholder="Any additional information or preferences..."
                  className="py-3 px-3 border-2 border-border rounded-lg text-base font-inherit resize-y min-h-[100px] transition-[border-color] duration-300 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-4 justify-end mt-2 md:flex-col">
                <button
                  type="button"
                  className="py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:border-text-dark hover:bg-text-light hover:text-white md:w-full"
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
                  className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Request Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-text-light">
            <p>Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-text-light">
            <p>
              {filter === 'upcoming' 
                ? 'You have no upcoming appointments.' 
                : filter === 'past'
                ? 'You have no past appointments.'
                : 'You have no appointments scheduled.'}
            </p>
            <p className="mt-4 text-sm">Request an appointment using the form above. You'll see the status of all your appointments here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredAppointments.map(appointment => {
              const isPast = appointment.date < new Date()
              const isUpcoming = appointment.date >= new Date()
              const status = appointment.status || 'pending'
              
              return (
                <div 
                  key={appointment.id} 
                  className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                    status === 'cancelled' 
                      ? 'opacity-60 border-[#e8a5a5] bg-[#fef5f5]' 
                      : status === 'pending' 
                      ? 'border-[#f5d89c] bg-[#fffaf5] border-l-4 hover:border-[#f0c97a] hover:shadow-[0_4px_12px_rgba(245,216,156,0.2)]'
                      : isPast
                      ? 'opacity-70 bg-bg-light border-border'
                      : 'border-border'
                  } hover:shadow-custom hover:border-primary`}
                >
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-4 md:flex-col">
                    <div className="flex-1">
                      <div className="text-xl font-bold text-text-dark mb-1">{formatDate(appointment.date)}</div>
                      <div className="text-lg text-primary font-semibold mb-1">{formatTime(appointment.time)}</div>
                      <div className="text-sm text-text-light">Duration: {appointment.duration} min</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`py-2 px-4 rounded-full text-sm font-semibold ${
                        status === 'pending' 
                          ? 'bg-[#fff8e8] text-[#b8860b]'
                          : status === 'confirmed'
                          ? 'bg-[#e8f5e9] text-[#2e7d32]'
                          : 'bg-[#fce4ec] text-[#c2185b]'
                      }`}>
                        {status === 'confirmed' ? 'Confirmed' : 
                         status === 'cancelled' ? 'Cancelled' : 
                         'Pending Confirmation'}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-border">
                    <div className="text-text-dark mb-2">
                      <strong className="text-text-dark mr-2">Type:</strong> {getTypeName(appointment.type)}
                    </div>
                    {appointment.notes && (
                      <div className="text-text-light italic mt-2">
                        <strong className="text-text-dark not-italic mr-2">Notes:</strong> {appointment.notes}
                      </div>
                    )}
                  </div>

                  {/* Status-specific messages */}
                  {status === 'pending' && (
                    <div className="mt-4 p-4 rounded-lg border-l-4 border-[#f5d89c] bg-[#fff8e8] text-[#b8860b]">
                      <strong className="block mb-2 text-base text-[#b8860b]">Status: Pending</strong>
                      <p className="m-0 text-sm leading-relaxed">Your appointment request is awaiting confirmation. You will be notified once it's been reviewed and confirmed by the admin.</p>
                    </div>
                  )}

                  {status === 'confirmed' && isUpcoming && (
                    <>
                      <div className="mt-4 p-4 rounded-lg border-l-4 border-[#81c784] bg-[#e8f5e9] text-[#2e7d32]">
                        <strong className="block mb-2 text-base text-[#2e7d32]">Status: Confirmed</strong>
                        <p className="m-0 text-sm leading-relaxed">This appointment has been confirmed. We look forward to meeting with you!</p>
                      </div>
                      <div className="flex gap-4 mt-4 pt-4 border-t border-border flex-wrap md:flex-col">
                        <button
                          className="py-3 px-6 bg-[#e57373] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom md:w-full"
                          onClick={() => handleCancelAppointment(appointment.id)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    </>
                  )}

                  {status === 'confirmed' && isPast && (
                    <div className="mt-4 p-4 rounded-lg border-l-4 border-[#81c784] bg-[#e8f5e9] text-[#2e7d32]">
                      <strong className="block mb-2 text-base text-[#2e7d32]">Status: Confirmed (Past)</strong>
                      <p className="m-0 text-sm leading-relaxed">This appointment was completed.</p>
                    </div>
                  )}

                  {status === 'cancelled' && (
                    <div className="mt-4 p-4 rounded-lg border-l-4 border-[#e57373] bg-[#fce4ec] text-[#c2185b]">
                      <strong className="block mb-2 text-base text-[#c2185b]">Status: Cancelled</strong>
                      <p className="m-0 text-sm leading-relaxed">This appointment has been cancelled.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {confirmDialog.isOpen && confirmDialog.onConfirm && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          type={confirmDialog.type}
        />
      )}
    </div>
  )
}

export default MyAppointments

