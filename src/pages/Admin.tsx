import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, orderBy, doc, getDoc, addDoc, where, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import AdminCalendar from '../components/AdminCalendar'
import ConfirmDialog from '../components/ConfirmDialog'
import './Admin.css'

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

interface ClientData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  plan: string
  submittedAt: string
  questionnaireData?: any
  paymentStatus?: string
  paymentMethod?: string
}

type AdminTab = 'clients' | 'calendar' | 'messages' | 'contactMessages'

function Admin() {
  const { currentUser, signout, isAdmin, loading: authLoading, userName } = useAuth()
  const { showSuccess, showError } = useToast()
  const [activeTab, setActiveTab] = useState<AdminTab>('clients')
  const [clients, setClients] = useState<ClientData[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState<string>('')
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingType, setBookingType] = useState<'discovery' | 'mentorship' | 'zoom'>('discovery')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [messageSubject, setMessageSubject] = useState('')
  const [messageContent, setMessageContent] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [adminMessages, setAdminMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [selectedAdminMessage, setSelectedAdminMessage] = useState<any | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [clientQuestionnaireData, setClientQuestionnaireData] = useState<any>(null)
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0)
  const [contactMessages, setContactMessages] = useState<any[]>([])
  const [loadingContactMessages, setLoadingContactMessages] = useState(false)
  const [selectedContactMessage, setSelectedContactMessage] = useState<any | null>(null)
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

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  const handleLogout = async () => {
    await signout()
    setSelectedClient(null)
  }

  const getPlanName = (plan: string): string => {
    switch (plan) {
      case 'discovery':
        return 'Free 15 min Discovery Call'
      case 'mentorship':
        return 'Mentorship Program'
      case 'zoom':
        return 'Zoom Calls'
      default:
        return plan
    }
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient || !bookingDate || !bookingTime) {
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

      // Check for conflicts with existing appointments for this client
      const conflictingAppointment = clientAppointments.find(apt => {
        const aptDate = apt.date
        const timeDiff = Math.abs(aptDate.getTime() - appointmentDateTime.getTime())
        const minDuration = Math.min(duration, apt.duration)
        return apt.status !== 'cancelled' && timeDiff < minDuration * 60 * 1000
      })

      if (conflictingAppointment) {
        showError('This time slot conflicts with an existing appointment. Please select a different time.')
        setBookingLoading(false)
        return
      }

      // Create appointment
      await addDoc(collection(db, 'appointments'), {
        clientId: selectedClient.id,
        clientName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        clientEmail: selectedClient.email,
        clientPhone: selectedClient.phone,
        date: Timestamp.fromDate(appointmentDateTime),
        time: bookingTime,
        duration,
        type: bookingType,
        notes: bookingNotes || '',
        status: 'pending',
        createdAt: Timestamp.now()
      })

      showSuccess('Appointment booked successfully!')
      setShowBookingForm(false)
      setBookingDate('')
      setBookingTime('')
      setBookingType('discovery')
      setBookingNotes('')
      loadClientAppointments(selectedClient.id)
      loadPendingAppointmentsCount()
    } catch (error) {
      console.error('Error booking appointment:', error)
      showError('Failed to book appointment. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const getMinDate = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today.toISOString().split('T')[0]
  }

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowRescheduleForm(false)
    setRescheduleDate('')
    setRescheduleTime('')
    
    // Load client questionnaire data
    try {
      const clientDoc = await getDoc(doc(db, 'clients', appointment.clientId))
      if (clientDoc.exists()) {
        const clientData = clientDoc.data()
        setClientQuestionnaireData(clientData.questionnaireData || null)
      }
    } catch (error) {
      console.error('Error loading questionnaire data:', error)
      setClientQuestionnaireData(null)
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      showError('Please fill in all fields')
      return
    }

    try {
      setRescheduleLoading(true)

      const appointmentDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`)
      
      // Check for conflicts - load all appointments for this client
      const appointmentsRef = collection(db, 'appointments')
      const q = query(
        appointmentsRef,
        where('clientId', '==', selectedAppointment.clientId)
      )
      
      let querySnapshot
      try {
        querySnapshot = await getDocs(q)
      } catch (error: any) {
        // If index error, load all and filter client-side
        querySnapshot = await getDocs(appointmentsRef)
      }
      
      let hasConflict = false
      const duration = getDuration(selectedAppointment.type)
      const [rescheduleHours, rescheduleMinutes] = rescheduleTime.split(':').map(Number)
      const newStart = new Date(appointmentDateTime)
      newStart.setHours(rescheduleHours, rescheduleMinutes, 0, 0)
      const newEnd = new Date(newStart.getTime() + duration * 60000)
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // Skip if this is the same appointment we're rescheduling
        if (doc.id === selectedAppointment.id) return
        // Only check appointments for the same client and that aren't cancelled
        if (data.clientId === selectedAppointment.clientId && data.status !== 'cancelled') {
          const existingDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
          const existingTime = data.time || ''
          const existingDuration = data.duration || 60
          
          const existingStart = new Date(existingDate)
          const [existingHours, existingMinutes] = existingTime.split(':').map(Number)
          existingStart.setHours(existingHours, existingMinutes, 0, 0)
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)
          
          // Check if time ranges overlap
          if ((newStart >= existingStart && newStart < existingEnd) ||
              (newEnd > existingStart && newEnd <= existingEnd) ||
              (newStart <= existingStart && newEnd >= existingEnd)) {
            hasConflict = true
          }
        }
      })

      if (hasConflict) {
        showError('This time slot conflicts with another appointment for this client. Please choose a different time.')
        setRescheduleLoading(false)
        return
      }

      // Update appointment with new date/time and set status to pending
      await updateDoc(doc(db, 'appointments', selectedAppointment.id), {
        date: Timestamp.fromDate(appointmentDateTime),
        time: rescheduleTime,
        status: 'pending',
        updatedAt: Timestamp.now()
      })

      showSuccess('Appointment rescheduled successfully! Status set to pending for user confirmation.')
      setShowRescheduleForm(false)
      setRescheduleDate('')
      setRescheduleTime('')
      loadClientAppointments(selectedAppointment.clientId)
      loadPendingAppointmentsCount()
      setSelectedAppointment(null)
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      showError('Failed to reschedule appointment. Please try again.')
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !currentUser || !messageSubject.trim() || !messageContent.trim()) {
      showError('Please fill in all fields')
      return
    }

    try {
      setSendingMessage(true)

      // Get admin name
      let senderName = adminName || userName || currentUser.email || 'Admin'
      try {
        const adminDoc = await getDoc(doc(db, 'users', currentUser.uid))
        if (adminDoc.exists()) {
          const adminData = adminDoc.data()
          senderName = adminData.displayName || `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || senderName
        }
      } catch (err) {
        // Use default name
      }

      // Create message
      await addDoc(collection(db, 'messages'), {
        fromUserId: currentUser.uid,
        fromUserName: senderName,
        fromUserRole: 'admin',
        toUserId: selectedClient.id,
        subject: messageSubject.trim(),
        content: messageContent.trim(),
        read: false,
        createdAt: Timestamp.now()
      })

      showSuccess('Message sent successfully!')
      setShowMessageForm(false)
      setMessageSubject('')
      setMessageContent('')
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Failed to send message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  const loadClients = async () => {
    try {
      setLoading(true)
      // Load from Firestore
      const clientsRef = collection(db, 'clients')
      const q = query(clientsRef, orderBy('submittedAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const clientsData: ClientData[] = []
      querySnapshot.forEach((doc) => {
        clientsData.push({
          id: doc.id,
          ...doc.data()
        } as ClientData)
      })
      
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading clients:', error)
      // Fallback to localStorage if Firestore fails
      const storedClients = localStorage.getItem('admin_clients')
      if (storedClients) {
        const clientsData = JSON.parse(storedClients)
        setClients(clientsData)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadClientAppointments = async (clientId: string) => {
    try {
      setLoadingAppointments(true)
      const appointmentsRef = collection(db, 'appointments')
      
      let querySnapshot
      try {
        const q = query(
          appointmentsRef,
          where('clientId', '==', clientId),
          orderBy('date', 'desc')
        )
        querySnapshot = await getDocs(q)
      } catch (error: any) {
        if (error.code === 'failed-precondition') {
          // Index not found, load all and filter client-side
          const q = query(appointmentsRef, orderBy('date', 'desc'))
          querySnapshot = await getDocs(q)
        } else {
          throw error
        }
      }
      
      const appointmentsData: Appointment[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.clientId === clientId) {
          appointmentsData.push({
            id: doc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            status: data.status || 'pending'
          } as Appointment)
        }
      })
      
      // Sort by date if filtered client-side
      appointmentsData.sort((a, b) => b.date.getTime() - a.date.getTime())
      setClientAppointments(appointmentsData)
    } catch (error) {
      console.error('Error loading client appointments:', error)
      setClientAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const loadContactMessages = async () => {
    try {
      setLoadingContactMessages(true)
      const messagesRef = collection(db, 'contactMessages')
      const q = query(messagesRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const messagesData: any[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messagesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        })
      })
      
      setContactMessages(messagesData)
    } catch (error) {
      console.error('Error loading contact messages:', error)
      setContactMessages([])
    } finally {
      setLoadingContactMessages(false)
    }
  }

  useEffect(() => {
    loadPendingAppointmentsCount()
    loadAdminMessages()
    loadContactMessages()
    
    // Refresh pending count every 30 seconds
    const interval = setInterval(() => {
      loadPendingAppointmentsCount()
    }, 30000)
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadClientAppointments(selectedClient.id)
      setShowBookingForm(false)
      setBookingDate('')
      setBookingTime('')
      setBookingType('discovery')
      setBookingNotes('')
      setShowMessageForm(false)
      setMessageSubject('')
      setMessageContent('')
    }
  }, [selectedClient])

  useEffect(() => {
    // Reload pending count when switching tabs to calendar (in case appointments were updated)
    if (activeTab === 'calendar') {
      loadPendingAppointmentsCount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadPendingAppointmentsCount = async () => {
    try {
      const appointmentsRef = collection(db, 'appointments')
      const querySnapshot = await getDocs(appointmentsRef)
      
      const now = new Date()
      let count = 0
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const status = data.status || 'pending'
        const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
        
        if (status === 'pending' && appointmentDate >= now) {
          count++
        }
      })
      
      setPendingAppointmentsCount(count)
    } catch (error) {
      console.error('Error loading pending appointments count:', error)
    }
  }

  const loadAdminMessages = async () => {
    if (!currentUser) return

    try {
      setLoadingMessages(true)
      const messagesRef = collection(db, 'messages')
      // Load messages sent TO admin (from users)
      const q = query(
        messagesRef,
        where('toUserId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      )
      
      let querySnapshot
      try {
        querySnapshot = await getDocs(q)
      } catch (error: any) {
        if (error.code === 'failed-precondition') {
          // Try without orderBy
          const q2 = query(messagesRef, where('toUserId', '==', currentUser.uid))
          querySnapshot = await getDocs(q2)
        } else {
          throw error
        }
      }
      
      const messagesData: any[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        messagesData.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate()
        })
      })
      
      // Sort if filtered client-side
      messagesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      setAdminMessages(messagesData)
    } catch (error) {
      console.error('Error loading admin messages:', error)
      setAdminMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (currentUser && isAdmin) {
      loadClients()
      // Get admin's full name from Firestore
      const loadAdminName = async () => {
        try {
          if (currentUser) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              const firstName = userData.firstName || ''
              const lastName = userData.lastName || ''
              const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                             userData.displayName || 
                             currentUser.displayName || 
                             currentUser.email || 
                             'Admin'
              setAdminName(fullName)
            } else {
              setAdminName(userName || currentUser.email || 'Admin')
            }
          }
        } catch (error) {
          console.error('Error loading admin name:', error)
          setAdminName(userName || currentUser?.email || 'Admin')
        }
      }
      loadAdminName()
    }
  }, [currentUser, isAdmin, userName])

  useEffect(() => {
    if (activeTab === 'messages' && currentUser && isAdmin) {
      loadAdminMessages()
    }
    if (activeTab === 'contactMessages' && currentUser && isAdmin) {
      loadContactMessages()
    }
  }, [activeTab, currentUser, isAdmin])

  if (authLoading) {
    return (
      <div className="admin-loading">
        <div>Loading...</div>
      </div>
    )
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="admin-access-denied">
        <h1>Access Denied</h1>
        <p>You must be an admin user to access this portal.</p>
        <p>Please sign in with an admin account.</p>
      </div>
    )
  }

  const handleEmailClient = (email: string, subject?: string, body?: string) => {
    const subjectLine = subject || 'Clearview Counselling - Appointment Update'
    const bodyText = body || ''
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(bodyText)}`
    window.location.href = mailtoLink
  }

  return (
    <div className="admin-container">
      {pendingAppointmentsCount > 0 && (
        <div className="pending-notification-banner">
          <div className="pending-notification-content">
            <span className="pending-notification-icon"></span>
            <span className="pending-notification-text">
              You have <strong>{pendingAppointmentsCount}</strong> pending appointment{pendingAppointmentsCount !== 1 ? 's' : ''} requiring attention
            </span>
            <button
              className="pending-notification-button"
              onClick={() => setActiveTab('calendar')}
            >
              View Pending Appointments
            </button>
          </div>
        </div>
      )}
      <div className="admin-header">
        <div>
          <h1>Admin Portal</h1>
          <p className="admin-user-info">Signed in as: {adminName || userName || currentUser.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          Clients ({clients.length})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
          {pendingAppointmentsCount > 0 && (
            <span className="tab-notification-badge">{pendingAppointmentsCount}</span>
          )}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button 
          className={`admin-tab ${activeTab === 'contactMessages' ? 'active' : ''}`}
          onClick={() => setActiveTab('contactMessages')}
        >
          Contact Form
          {contactMessages.filter((msg: any) => !msg.read).length > 0 && (
            <span className="tab-notification-badge">{contactMessages.filter((msg: any) => !msg.read).length}</span>
          )}
        </button>
      </div>

      {activeTab === 'clients' && (
        <div className="admin-content">
          <div className="admin-sidebar">
            <h2>Clients ({clients.length})</h2>
            {loading ? (
              <p className="loading-clients">Loading clients...</p>
            ) : (
              <div className="clients-list">
                {clients.length === 0 ? (
                  <p className="no-clients">No clients registered yet</p>
                ) : (
                  clients.map((client) => (
                    <div
                      key={client.id}
                      className={`client-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="client-name">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="client-plan">{getPlanName(client.plan)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="admin-main">
            {selectedClient ? (
              <div className="client-details">
                <h2>Client Details</h2>
                <div className="details-section">
                  <h3>Personal Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">
                      {selectedClient.email}
                      <button
                        className="email-client-button"
                        onClick={() => handleEmailClient(selectedClient.email)}
                        title="Send email to client"
                      >
                        Email
                      </button>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedClient.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Plan:</span>
                    <span className="detail-value">{getPlanName(selectedClient.plan)}</span>
                  </div>
                  {selectedClient.paymentStatus && (
                    <div className="detail-row">
                      <span className="detail-label">Payment Status:</span>
                      <span className="detail-value">
                        {selectedClient.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  )}
                  {selectedClient.paymentMethod && selectedClient.paymentMethod !== 'free' && (
                    <div className="detail-row">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">
                        {selectedClient.paymentMethod === 'paypal' ? 'PayPal' : 
                         selectedClient.paymentMethod === 'wise' ? 'Wise' : 
                         selectedClient.paymentMethod}
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">{selectedClient.submittedAt}</span>
                  </div>
                </div>

                {selectedClient.questionnaireData && (
                  <div className="details-section">
                    <h3>Questionnaire Responses</h3>
                    <div className="questionnaire-responses">
                      {Object.entries(selectedClient.questionnaireData).map(([key, value]) => (
                        <div key={key} className="response-item">
                          <span className="response-label">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="response-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="details-section">
                  <div className="section-header">
                    <h3>Appointments</h3>
                    <button
                      className="book-appointment-btn"
                      onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                      {showBookingForm ? 'Cancel Booking' : '+ Book Appointment'}
                    </button>
                  </div>

                  {showBookingForm && (
                    <div className="booking-form-container">
                      <h4>Book New Appointment</h4>
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
                            placeholder="Add any notes about this appointment..."
                          />
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="cancel-booking-btn"
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
                            className="submit-booking-btn"
                            disabled={bookingLoading}
                          >
                            {bookingLoading ? 'Booking...' : 'Create Appointment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="appointments-history">
                    <h4>All Appointments</h4>
                    {loadingAppointments ? (
                      <p className="loading-appointments">Loading appointments...</p>
                    ) : clientAppointments.length === 0 ? (
                      <p className="no-appointments">No appointments scheduled yet</p>
                    ) : (
                      <div className="appointments-list">
                        {clientAppointments.map(appointment => {
                          const isPast = appointment.date < new Date()
                          return (
                            <div
                              key={appointment.id}
                              className={`appointment-item ${appointment.status === 'cancelled' ? 'cancelled' : ''} ${isPast ? 'past' : ''} ${selectedAppointment?.id === appointment.id ? 'selected' : ''}`}
                              onClick={() => handleAppointmentClick(appointment)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="appointment-header-item">
                                <div className="appointment-date-time">
                                  <div className="appointment-date">{formatDate(appointment.date)}</div>
                                  <div className="appointment-time">{formatTime(appointment.time)}</div>
                                  <div className="appointment-duration">Duration: {appointment.duration} min</div>
                                </div>
                                <div className="appointment-status">
                                  <span className={`status-badge status-${appointment.status || 'pending'}`}>
                                    {appointment.status === 'confirmed' ? 'Confirmed' : 
                                     appointment.status === 'cancelled' ? 'Cancelled' : 
                                     'Pending Confirmation'}
                                  </span>
                                </div>
                              </div>

                              <div className="appointment-details-item">
                                <div className="appointment-type">
                                  <strong>Type:</strong> {getTypeName(appointment.type)}
                                </div>
                                {appointment.notes && (
                                  <div className="appointment-notes-item">
                                    <strong>Notes:</strong> {appointment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {selectedAppointment && (
                  <div className="appointment-detail-view">
                    <div className="appointment-detail-header">
                      <h3>Appointment Details</h3>
                      <button
                        className="close-detail-button"
                        onClick={() => {
                          setSelectedAppointment(null)
                          setShowRescheduleForm(false)
                          setClientQuestionnaireData(null)
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <div className="appointment-detail-content">
                      <div className="detail-section">
                        <h4>Appointment Information</h4>
                        <div className="detail-row">
                          <span className="detail-label">Date:</span>
                          <span className="detail-value">{formatDate(selectedAppointment.date)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Time:</span>
                          <span className="detail-value">{formatTime(selectedAppointment.time)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">{selectedAppointment.duration} minutes</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{getTypeName(selectedAppointment.type)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Status:</span>
                          <span className={`detail-value status-badge status-${selectedAppointment.status || 'pending'}`}>
                            {selectedAppointment.status === 'confirmed' ? 'Confirmed' : 
                             selectedAppointment.status === 'cancelled' ? 'Cancelled' : 
                             'Pending Confirmation'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Client Email:</span>
                          <span className="detail-value">
                            {selectedAppointment.clientEmail}
                            <button
                              className="email-client-button"
                              onClick={() => {
                                const subject = `Clearview Counselling - Appointment ${selectedAppointment.status === 'confirmed' ? 'Confirmation' : 'Update'}`
                                const body = `Dear ${selectedAppointment.clientName},\n\n` +
                                  `This email is regarding your appointment:\n\n` +
                                  `Date: ${formatDate(selectedAppointment.date)}\n` +
                                  `Time: ${formatTime(selectedAppointment.time)}\n` +
                                  `Type: ${getTypeName(selectedAppointment.type)}\n` +
                                  `Status: ${selectedAppointment.status === 'confirmed' ? 'Confirmed' : selectedAppointment.status === 'cancelled' ? 'Cancelled' : 'Pending Confirmation'}\n\n` +
                                  (selectedAppointment.notes ? `Notes: ${selectedAppointment.notes}\n\n` : '') +
                                  `Please let us know if you have any questions.\n\n` +
                                  `Best regards,\nClearview Counselling`
                                handleEmailClient(selectedAppointment.clientEmail, subject, body)
                              }}
                              title="Send email to client"
                            >
                              Email Client
                            </button>
                          </span>
                        </div>
                        {selectedAppointment.notes && (
                          <div className="detail-row">
                            <span className="detail-label">Notes:</span>
                            <span className="detail-value">{selectedAppointment.notes}</span>
                          </div>
                        )}
                      </div>

                      {clientQuestionnaireData && (
                        <div className="detail-section">
                          <h4>Intake Questionnaire</h4>
                          <div className="questionnaire-data">
                            {Object.entries(clientQuestionnaireData).map(([key, value]) => (
                              <div key={key} className="questionnaire-item">
                                <span className="questionnaire-label">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </span>
                                <span className="questionnaire-value">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="detail-actions">
                        {!showRescheduleForm ? (
                          <button
                            className="reschedule-button"
                            onClick={() => {
                              setShowRescheduleForm(true)
                              const dateStr = selectedAppointment.date.toISOString().split('T')[0]
                              setRescheduleDate(dateStr)
                              setRescheduleTime(selectedAppointment.time)
                            }}
                          >
                            Reschedule Appointment
                          </button>
                        ) : (
                          <div className="reschedule-form-container">
                            <h4>Reschedule Appointment</h4>
                            <form onSubmit={handleReschedule} className="reschedule-form">
                              <div className="form-group">
                                <label htmlFor="rescheduleDate">New Date *</label>
                                <input
                                  type="date"
                                  id="rescheduleDate"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  min={getMinDate()}
                                  required
                                />
                              </div>

                              <div className="form-group">
                                <label htmlFor="rescheduleTime">New Time *</label>
                                <select
                                  id="rescheduleTime"
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

                              <div className="form-actions">
                                <button
                                  type="button"
                                  className="cancel-reschedule-button"
                                  onClick={() => {
                                    setShowRescheduleForm(false)
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
                                  {rescheduleLoading ? 'Rescheduling...' : 'Reschedule'}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="details-section">
                  <div className="section-header">
                    <h3>Send Message</h3>
                    <button
                      className="send-message-btn"
                      onClick={() => setShowMessageForm(!showMessageForm)}
                    >
                      {showMessageForm ? 'Cancel' : '+ Send Message'}
                    </button>
                  </div>

                  {showMessageForm && (
                    <div className="message-form-container">
                      <form onSubmit={handleSendMessage} className="message-form">
                        <div className="form-group">
                          <label htmlFor="messageSubject">Subject *</label>
                          <input
                            type="text"
                            id="messageSubject"
                            value={messageSubject}
                            onChange={(e) => setMessageSubject(e.target.value)}
                            placeholder="Message subject..."
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="messageContent">Message *</label>
                          <textarea
                            id="messageContent"
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            rows={6}
                            placeholder="Type your message to the client..."
                            required
                          />
                        </div>

                        <div className="form-actions">
                          <button
                            type="button"
                            className="cancel-message-btn"
                            onClick={() => {
                              setShowMessageForm(false)
                              setMessageSubject('')
                              setMessageContent('')
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="send-message-submit-btn"
                            disabled={sendingMessage}
                          >
                            {sendingMessage ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Select a client from the sidebar to view their details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="admin-content">
          <div className="admin-main-full">
            <AdminCalendar clients={clients} />
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="admin-content">
          <div className="admin-main-full">
            <div className="admin-messages-container">
              <h2>Messages from Users</h2>
              {loadingMessages ? (
                <p className="loading-messages">Loading messages...</p>
              ) : adminMessages.length === 0 ? (
                <p className="no-messages">No messages from users yet</p>
              ) : (
                <div className="admin-messages-list">
                  {adminMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`admin-message-item ${!msg.read ? 'unread' : ''} ${selectedAdminMessage?.id === msg.id ? 'selected' : ''}`}
                      onClick={() => setSelectedAdminMessage(msg)}
                    >
                      <div className="admin-message-header">
                        <div>
                          <div className="admin-message-from">{msg.fromUserName}</div>
                          <div className="admin-message-subject">{msg.subject}</div>
                          <div className="admin-message-date">
                            {msg.createdAt.toLocaleDateString()} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!msg.read && <div className="unread-indicator" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedAdminMessage && (
                <div className="admin-message-view">
                  <h3>Message from {selectedAdminMessage.fromUserName}</h3>
                  <div className="admin-message-view-subject">
                    <strong>Subject:</strong> {selectedAdminMessage.subject}
                  </div>
                  <div className="admin-message-view-content">
                    {selectedAdminMessage.content.split('\n').map((line: string, i: number) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                  <button
                    className="close-message-button"
                    onClick={() => setSelectedAdminMessage(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contactMessages' && (
        <div className="admin-content">
          <div className="admin-main-full">
            <div className="admin-contact-messages-container">
              <h2>Contact Form Messages</h2>
              {loadingContactMessages ? (
                <p className="loading-messages">Loading messages...</p>
              ) : contactMessages.length === 0 ? (
                <p className="no-messages">No contact messages yet</p>
              ) : (
                <div className="admin-contact-messages-list">
                  {contactMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`admin-contact-message-item ${!msg.read ? 'unread' : ''} ${selectedContactMessage?.id === msg.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedContactMessage(msg)
                        // Mark as read when opened
                        if (!msg.read) {
                          updateDoc(doc(db, 'contactMessages', msg.id), {
                            read: true,
                            readAt: Timestamp.now()
                          }).then(() => {
                            loadContactMessages()
                          })
                        }
                      }}
                    >
                      <div className="admin-contact-message-header">
                        <div>
                          <div className="admin-contact-message-from">{msg.name} ({msg.email})</div>
                          <div className="admin-contact-message-subject">{msg.subject}</div>
                          <div className="admin-contact-message-date">
                            {msg.createdAt.toLocaleDateString()} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {!msg.read && <div className="unread-indicator" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedContactMessage && (
                <div className="admin-contact-message-view">
                  <div className="admin-contact-message-view-header">
                    <h3>Message from {selectedContactMessage.name}</h3>
                    <button
                      className="close-message-button"
                      onClick={() => setSelectedContactMessage(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="admin-contact-message-details">
                    <div className="contact-message-detail-row">
                      <span className="contact-message-detail-label">Name:</span>
                      <span className="contact-message-detail-value">{selectedContactMessage.name}</span>
                    </div>
                    <div className="contact-message-detail-row">
                      <span className="contact-message-detail-label">Email:</span>
                      <span className="contact-message-detail-value">
                        {selectedContactMessage.email}
                        <button
                          className="email-client-button"
                          onClick={() => handleEmailClient(selectedContactMessage.email)}
                          title="Send email"
                        >
                          Email
                        </button>
                      </span>
                    </div>
                    {selectedContactMessage.phone && (
                      <div className="contact-message-detail-row">
                        <span className="contact-message-detail-label">Phone:</span>
                        <span className="contact-message-detail-value">{selectedContactMessage.phone}</span>
                      </div>
                    )}
                    <div className="contact-message-detail-row">
                      <span className="contact-message-detail-label">Subject:</span>
                      <span className="contact-message-detail-value">{selectedContactMessage.subject}</span>
                    </div>
                    <div className="contact-message-detail-row">
                      <span className="contact-message-detail-label">Date:</span>
                      <span className="contact-message-detail-value">
                        {selectedContactMessage.createdAt.toLocaleDateString()} {selectedContactMessage.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="contact-message-detail-row full-width">
                      <span className="contact-message-detail-label">Message:</span>
                      <div className="contact-message-content">
                        {selectedContactMessage.message.split('\n').map((line: string, i: number) => (
                          <p key={i}>{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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

export default Admin

