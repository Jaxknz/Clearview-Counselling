import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { collection, query, getDocs, orderBy, doc, getDoc, addDoc, where, Timestamp, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import AdminCalendar from '../components/AdminCalendar'
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
  const { currentUser, isAdmin, loading: authLoading, userName } = useAuth()
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
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('')
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
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center bg-bg-light p-8 text-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center bg-bg-light p-8 text-center">
        <h1 className="text-text-dark text-3xl md:text-2xl mb-4">Access Denied</h1>
        <p className="text-text-light text-lg mb-2">You must be an admin user to access this portal.</p>
        <p className="text-text-light text-lg">Please sign in with an admin account.</p>
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
    <div className="min-h-screen bg-bg-light">
      {pendingAppointmentsCount > 0 && (
        <div className="bg-gradient-to-r from-[#f5d89c] to-[#f0c97a] text-[#8b6914] py-4 px-8 md:px-4 shadow-custom border-b-[3px] border-[#f0c97a]">
          <div className="flex items-center gap-4 max-w-[1200px] mx-auto flex-wrap">
            <span className="w-5 h-5 rounded-full bg-[#8b6914] inline-block flex-shrink-0"></span>
            <span className="flex-1 font-semibold text-base">
              You have <strong className="text-lg text-[#8b6914]">{pendingAppointmentsCount}</strong> pending appointment{pendingAppointmentsCount !== 1 ? 's' : ''} requiring attention
            </span>
            <button
              className="py-2 px-6 bg-white text-[#8b6914] border-2 border-[#8b6914] rounded-lg font-bold cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#8b6914] hover:text-white hover:-translate-y-0.5 hover:shadow-custom"
              onClick={() => setActiveTab('calendar')}
            >
              View Pending Appointments
            </button>
          </div>
        </div>
      )}
      <div className="bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 py-6 px-8 md:px-4 shadow-custom border-b border-border">
        <div>
          <h1 className="text-text-dark text-3xl md:text-2xl mb-1 m-0 font-semibold">Admin Portal</h1>
          <p className="text-text-light text-sm m-0">Signed in as: {adminName || userName || currentUser.email}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-white via-bg-light to-white border-b-2 border-border overflow-x-auto">
        <div className="flex justify-center">
          <div className="flex min-w-full sm:min-w-0">
            <button 
              className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'clients' 
                  ? 'text-primary border-b-primary' 
                  : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setActiveTab('clients')}
            >
              Clients ({clients.length})
            </button>
            <button 
              className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                activeTab === 'calendar' 
                  ? 'text-primary border-b-primary' 
                  : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setActiveTab('calendar')}
            >
              <span>Calendar</span>
              {pendingAppointmentsCount > 0 && (
                <span className="inline-block py-1 px-2 bg-primary text-white rounded-full text-xs font-bold min-w-[20px] text-center">{pendingAppointmentsCount}</span>
              )}
            </button>
            <button 
              className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'messages' 
                  ? 'text-primary border-b-primary' 
                  : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
            <button 
              className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${
                activeTab === 'contactMessages' 
                  ? 'text-primary border-b-primary' 
                  : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
              }`}
              onClick={() => setActiveTab('contactMessages')}
            >
              <span>Contact Form</span>
              {contactMessages.filter((msg: any) => !msg.read).length > 0 && (
                <span className="inline-block py-1 px-2 bg-primary text-white rounded-full text-xs font-bold min-w-[20px] text-center">{contactMessages.filter((msg: any) => !msg.read).length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'clients' && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-250px)] gap-4 lg:gap-6">
            <div className="lg:w-80 w-full lg:flex-shrink-0 bg-gradient-to-b from-primary/10 via-sky/10 to-white lg:border-r-2 border-b-2 lg:border-b-0 border-border flex flex-col lg:rounded-l-xl rounded-lg shadow-custom-lg lg:max-h-none max-h-[300px] overflow-hidden lg:overflow-visible">
              <div className="p-4 sm:p-6 border-b-2 border-border flex-shrink-0 bg-gradient-to-r from-primary/15 to-sky/10">
                <h2 className="text-text-dark text-xl sm:text-2xl mb-4 font-semibold">Clients ({clients.length})</h2>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={clientSearchQuery}
                  onChange={(e) => setClientSearchQuery(e.target.value)}
                  className="w-full py-2 px-3 border-2 border-border rounded-lg text-sm transition-all duration-300 font-inherit bg-white/90 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none focus:bg-white"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-white/60 lg:block">
                {loading ? (
                  <p className="text-text-light text-center py-8">Loading clients...</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const filteredClients = clients.filter(client => {
                        if (!clientSearchQuery.trim()) return true
                        const searchLower = clientSearchQuery.toLowerCase()
                        const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
                        return fullName.includes(searchLower)
                      })
                      
                      if (filteredClients.length === 0) {
                        return (
                          <p className="text-text-light text-center py-8">
                            {clientSearchQuery ? 'No clients found' : 'No clients registered yet'}
                          </p>
                        )
                      }
                      
                      return filteredClients.map((client) => (
                        <div
                          key={client.id}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                            selectedClient?.id === client.id 
                              ? 'border-primary bg-gradient-to-r from-primary/15 to-sky/10 shadow-md' 
                              : 'border-border/60 bg-white/80 hover:border-primary hover:bg-gradient-to-r hover:from-sky/10 hover:to-nature-green/5'
                          }`}
                          onClick={() => setSelectedClient(client)}
                        >
                          <div className="font-semibold text-text-dark mb-1 text-sm">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-xs text-text-light">{getPlanName(client.plan)}</div>
                        </div>
                      ))
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 overflow-y-auto lg:overflow-y-auto">
              <div className="min-h-full bg-gradient-to-br from-white via-bg-light to-primary/5 p-4 sm:p-6 lg:p-8 lg:rounded-r-xl rounded-lg shadow-custom-lg border border-border">
            {selectedClient ? (
              <div>
                <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-4 border-b-2 border-border bg-gradient-to-r from-primary/10 to-transparent p-4 rounded-lg -mx-4 -mt-4">Client Details</h2>
                <div className="mb-8 pb-6 border-b-2 border-border bg-gradient-to-r from-sky/10 via-white to-nature-green/10 p-6 rounded-lg">
                  <h3 className="text-text-dark text-xl md:text-lg mb-4 pb-2 border-b border-border">Personal Information</h3>
                  <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                    <span className="font-semibold text-text-dark text-sm">Name:</span>
                    <span className="text-text-dark">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4 items-center">
                    <span className="font-semibold text-text-dark text-sm">Email:</span>
                    <span className="text-text-dark flex items-center gap-2 flex-wrap">
                      {selectedClient.email}
                      <button
                        className="py-1.5 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
                        onClick={() => handleEmailClient(selectedClient.email)}
                        title="Send email to client"
                      >
                        Email
                      </button>
                    </span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                    <span className="font-semibold text-text-dark text-sm">Phone:</span>
                    <span className="text-text-dark">{selectedClient.phone}</span>
                  </div>
                  <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                    <span className="font-semibold text-text-dark text-sm">Plan:</span>
                    <span className="text-text-dark">{getPlanName(selectedClient.plan)}</span>
                  </div>
                  {selectedClient.paymentStatus && (
                    <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                      <span className="font-semibold text-text-dark text-sm">Payment Status:</span>
                      <span className="text-text-dark">
                        {selectedClient.paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  )}
                  {selectedClient.paymentMethod && selectedClient.paymentMethod !== 'free' && (
                    <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                      <span className="font-semibold text-text-dark text-sm">Payment Method:</span>
                      <span className="text-text-dark">
                        {selectedClient.paymentMethod === 'paypal' ? 'PayPal' : 
                         selectedClient.paymentMethod === 'wise' ? 'Wise' : 
                         selectedClient.paymentMethod}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                    <span className="font-semibold text-text-dark text-sm">Submitted:</span>
                    <span className="text-text-dark">{selectedClient.submittedAt}</span>
                  </div>
                </div>

                {selectedClient.questionnaireData && (
                  <div className="mb-8 pb-6 border-b-2 border-border">
                    <h3 className="text-text-dark text-xl md:text-lg mb-4 pb-2 border-b border-border">Questionnaire Responses</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedClient.questionnaireData).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4">
                          <span className="font-semibold text-text-dark text-sm">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          </span>
                          <span className="text-text-dark">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8 pb-6 border-b-2 border-border">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-text-dark text-xl md:text-lg mb-0">Appointments</h3>
                    <button
                      className="py-2 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-sm md:w-full"
                      onClick={() => setShowBookingForm(!showBookingForm)}
                    >
                      {showBookingForm ? 'Cancel Booking' : '+ Book Appointment'}
                    </button>
                  </div>

                  {showBookingForm && (
                    <div className="mt-6 p-6 bg-bg-light rounded-xl border-2 border-border">
                      <h4 className="text-text-dark text-lg md:text-base mb-4 mt-0">Book New Appointment</h4>
                      <form onSubmit={handleBookAppointment} className="flex flex-col gap-6">
                        <div className="mb-6">
                          <label htmlFor="bookingType" className="block font-semibold text-text-dark mb-2 text-sm">Appointment Type *</label>
                          <select
                            id="bookingType"
                            value={bookingType}
                            onChange={(e) => setBookingType(e.target.value as 'discovery' | 'mentorship' | 'zoom')}
                            required
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          >
                            <option value="discovery">Discovery Call (15 min)</option>
                            <option value="mentorship">Mentorship Session (60 min)</option>
                            <option value="zoom">Zoom Session (60 min)</option>
                          </select>
                        </div>

                        <div className="mb-6">
                          <label htmlFor="bookingDate" className="block font-semibold text-text-dark mb-2 text-sm">Date *</label>
                          <input
                            type="date"
                            id="bookingDate"
                            value={bookingDate}
                            onChange={(e) => setBookingDate(e.target.value)}
                            min={getMinDate()}
                            required
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          />
                        </div>

                        <div className="mb-6">
                          <label htmlFor="bookingTime" className="block font-semibold text-text-dark mb-2 text-sm">Time *</label>
                          <select
                            id="bookingTime"
                            value={bookingTime}
                            onChange={(e) => setBookingTime(e.target.value)}
                            required
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          >
                            <option value="">Select a time</option>
                            {timeSlots.map(slot => (
                              <option key={slot} value={slot}>{formatTime(slot)}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-6">
                          <label htmlFor="bookingNotes" className="block font-semibold text-text-dark mb-2 text-sm">Notes (Optional)</label>
                          <textarea
                            id="bookingNotes"
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                            rows={4}
                            placeholder="Add any notes about this appointment..."
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-4 justify-end mt-2 md:flex-col">
                          <button
                            type="button"
                            className="py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
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
                            {bookingLoading ? 'Booking...' : 'Create Appointment'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="mt-8">
                    <h4 className="text-text-dark text-xl md:text-lg mb-4">All Appointments</h4>
                    {loadingAppointments ? (
                      <p className="text-text-light text-center py-8">Loading appointments...</p>
                    ) : clientAppointments.length === 0 ? (
                      <p className="text-text-light text-center py-8">No appointments scheduled yet</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {clientAppointments.map(appointment => {
                          const isPast = appointment.date < new Date()
                          const status = appointment.status || 'pending'
                          return (
                            <div
                              key={appointment.id}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                                appointment.status === 'cancelled' 
                                  ? 'opacity-60 border-[#e8a5a5] bg-[#fef5f5]' 
                                  : isPast
                                  ? 'opacity-70 bg-bg-light border-border'
                                  : 'border-border bg-white'
                              } ${
                                selectedAppointment?.id === appointment.id 
                                  ? 'border-primary bg-primary/10 shadow-md' 
                                  : 'hover:border-primary hover:shadow-custom'
                              }`}
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <div className="flex justify-between items-start mb-3 flex-wrap gap-4 md:flex-col">
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

                              <div className="pt-3 border-t border-border">
                                <div className="text-text-dark mb-2">
                                  <strong className="text-text-dark mr-2">Type:</strong> {getTypeName(appointment.type)}
                                </div>
                                {appointment.notes && (
                                  <div className="text-text-light italic text-sm">
                                    <strong className="text-text-dark not-italic mr-2">Notes:</strong> {appointment.notes}
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
                  <div className="mt-8 p-6 bg-bg-light rounded-xl border-2 border-border">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-border">
                      <h3 className="text-text-dark text-2xl md:text-xl m-0">Appointment Details</h3>
                      <button
                        className="py-2 px-4 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border"
                        onClick={() => {
                          setSelectedAppointment(null)
                          setShowRescheduleForm(false)
                          setClientQuestionnaireData(null)
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex flex-col gap-6">
                      <div className="mb-6 pb-6 border-b-2 border-border">
                        <h4 className="text-text-dark text-lg md:text-base mb-4">Appointment Information</h4>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                          <span className="font-semibold text-text-dark text-sm">Date:</span>
                          <span className="text-text-dark">{formatDate(selectedAppointment.date)}</span>
                        </div>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                          <span className="font-semibold text-text-dark text-sm">Time:</span>
                          <span className="text-text-dark">{formatTime(selectedAppointment.time)}</span>
                        </div>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                          <span className="font-semibold text-text-dark text-sm">Duration:</span>
                          <span className="text-text-dark">{selectedAppointment.duration} minutes</span>
                        </div>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                          <span className="font-semibold text-text-dark text-sm">Type:</span>
                          <span className="text-text-dark">{getTypeName(selectedAppointment.type)}</span>
                        </div>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                          <span className="font-semibold text-text-dark text-sm">Status:</span>
                          <span className={`py-2 px-4 rounded-full text-sm font-semibold inline-block ${
                            (selectedAppointment.status || 'pending') === 'pending' 
                              ? 'bg-[#fff8e8] text-[#b8860b]'
                              : (selectedAppointment.status || 'pending') === 'confirmed'
                              ? 'bg-[#e8f5e9] text-[#2e7d32]'
                              : 'bg-[#fce4ec] text-[#c2185b]'
                          }`}>
                            {selectedAppointment.status === 'confirmed' ? 'Confirmed' : 
                             selectedAppointment.status === 'cancelled' ? 'Cancelled' : 
                             'Pending Confirmation'}
                          </span>
                        </div>
                        <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4 items-center">
                          <span className="font-semibold text-text-dark text-sm">Client Email:</span>
                          <span className="text-text-dark flex items-center gap-2 flex-wrap">
                            {selectedAppointment.clientEmail}
                            <button
                              className="py-1.5 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
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
                          <div className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4 mb-4">
                            <span className="font-semibold text-text-dark text-sm">Notes:</span>
                            <span className="text-text-dark">{selectedAppointment.notes}</span>
                          </div>
                        )}
                      </div>

                      {clientQuestionnaireData && (
                        <div className="mb-6 pb-6 border-b-2 border-border">
                          <h4 className="text-text-dark text-lg md:text-base mb-4">Intake Questionnaire</h4>
                          <div className="space-y-3">
                            {Object.entries(clientQuestionnaireData).map(([key, value]) => (
                              <div key={key} className="grid grid-cols-[200px_1fr] md:grid-cols-1 gap-4">
                                <span className="font-semibold text-text-dark text-sm">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                                </span>
                                <span className="text-text-dark">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-6 border-t-2 border-border">
                        {!showRescheduleForm ? (
                          <button
                            className="py-3 px-6 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
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
                          <div className="mt-6 p-6 bg-white rounded-xl border-2 border-border">
                            <h4 className="text-text-dark text-lg md:text-base mb-4 mt-0">Reschedule Appointment</h4>
                            <form onSubmit={handleReschedule} className="flex flex-col gap-6">
                              <div className="mb-6">
                                <label htmlFor="rescheduleDate" className="block font-semibold text-text-dark mb-2 text-sm">New Date *</label>
                                <input
                                  type="date"
                                  id="rescheduleDate"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                  min={getMinDate()}
                                  required
                                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                                />
                              </div>

                              <div className="mb-6">
                                <label htmlFor="rescheduleTime" className="block font-semibold text-text-dark mb-2 text-sm">New Time *</label>
                                <select
                                  id="rescheduleTime"
                                  value={rescheduleTime}
                                  onChange={(e) => setRescheduleTime(e.target.value)}
                                  required
                                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                                >
                                  <option value="">Select a time</option>
                                  {timeSlots.map(slot => (
                                    <option key={slot} value={slot}>{formatTime(slot)}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex gap-4 justify-end mt-2 md:flex-col">
                                <button
                                  type="button"
                                  className="py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
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
                                  className="py-3 px-6 bg-gradient-to-r from-[#f0c97a] to-[#e89f6f] text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
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

                <div className="mt-8 pb-6 border-b-2 border-border">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <h3 className="text-text-dark text-xl md:text-lg mb-0">Send Message</h3>
                    <button
                      className="py-2 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom text-sm md:w-full"
                      onClick={() => setShowMessageForm(!showMessageForm)}
                    >
                      {showMessageForm ? 'Cancel' : '+ Send Message'}
                    </button>
                  </div>

                  {showMessageForm && (
                    <div className="mt-6 p-6 bg-bg-light rounded-xl border-2 border-border">
                      <form onSubmit={handleSendMessage} className="flex flex-col gap-6">
                        <div className="mb-6">
                          <label htmlFor="messageSubject" className="block font-semibold text-text-dark mb-2 text-sm">Subject *</label>
                          <input
                            type="text"
                            id="messageSubject"
                            value={messageSubject}
                            onChange={(e) => setMessageSubject(e.target.value)}
                            placeholder="Message subject..."
                            required
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          />
                        </div>

                        <div className="mb-6">
                          <label htmlFor="messageContent" className="block font-semibold text-text-dark mb-2 text-sm">Message *</label>
                          <textarea
                            id="messageContent"
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            rows={6}
                            placeholder="Type your message to the client..."
                            required
                            className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-4 justify-end mt-2 md:flex-col">
                          <button
                            type="button"
                            className="py-3 px-6 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full"
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
                            className="py-3 px-6 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none md:w-full"
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
              <div className="text-center py-16 text-text-light">
                <p>Select a client from the sidebar to view their details</p>
              </div>
            )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full bg-gradient-to-br from-white via-sky/10 to-nature-green/10 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-custom-lg border border-border">
            <AdminCalendar clients={clients} />
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full bg-gradient-to-br from-white via-sky/20 to-nature-green/10 rounded-2xl shadow-custom-lg overflow-hidden flex flex-col min-h-[500px] h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] md:h-[calc(100vh-250px)] max-h-[800px] border border-border">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/15 via-sky/10 to-nature-green/10">
              <h2 className="text-text-dark text-2xl font-semibold">Messages from Users</h2>
            </div>
            {loadingMessages ? (
              <div className="flex-1 flex items-center justify-center bg-white/50">
                <p className="text-text-light">Loading messages...</p>
              </div>
            ) : adminMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-white/50">
                <p className="text-text-light">No messages from users yet</p>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
                {/* Message List - Left Sidebar */}
                <div className="md:w-[380px] w-full border-r border-b md:border-b-0 border-border bg-gradient-to-b from-sky/10 to-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border bg-gradient-to-r from-primary/20 to-sky/10">
                    <div className="text-sm font-medium text-text-dark">{adminMessages.length} {adminMessages.length === 1 ? 'message' : 'messages'}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white/60">
                    {adminMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-4 border-b border-border/60 cursor-pointer transition-colors duration-200 ${
                          selectedAdminMessage?.id === msg.id 
                            ? 'bg-gradient-to-r from-primary/15 to-sky/10 border-l-4 border-l-primary shadow-sm' 
                            : 'hover:bg-gradient-to-r hover:from-sky/10 hover:to-nature-green/5'
                        } ${
                          !msg.read ? 'bg-gradient-to-r from-sky/20 to-white' : 'bg-white/80'
                        }`}
                        onClick={() => {
                          setSelectedAdminMessage(msg)
                          if (!msg.read) {
                            updateDoc(doc(db, 'messages', msg.id), {
                              read: true,
                              readAt: Timestamp.now()
                            }).then(() => {
                              loadAdminMessages()
                            })
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className={`text-sm font-semibold truncate ${!msg.read ? 'text-text-dark' : 'text-text-dark/80'}`}>
                                {msg.fromUserName}
                              </div>
                              {!msg.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <div className={`text-sm mb-1 truncate ${!msg.read ? 'font-medium text-text-dark' : 'text-text-light'}`}>
                              {msg.subject}
                            </div>
                            <div className="text-xs text-text-light">
                              {msg.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Display - Right Panel */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-bg-light to-sky/5">
                  {selectedAdminMessage ? (
                    <>
                      <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => setSelectedAdminMessage(null)}
                              className="md:hidden mb-3 text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                            >
                              <span>←</span> Back to messages
                            </button>
                            <h3 className="text-lg md:text-xl font-semibold text-text-dark mb-2 break-words">{selectedAdminMessage.subject}</h3>
                            <div className="text-xs md:text-sm text-text-light">
                              <span className="font-medium text-text-dark">{selectedAdminMessage.fromUserName}</span>
                              <span className="mx-2">•</span>
                              <span className="break-words">{selectedAdminMessage.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedAdminMessage.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/70">
                        <div className="prose max-w-none bg-white/80 p-6 rounded-lg border border-border/50 shadow-sm">
                          <div className="text-text-dark leading-relaxed whitespace-pre-wrap text-sm md:text-[15px]">
                            {selectedAdminMessage.content.split('\n').map((line: string, i: number) => (
                              <p key={i} className="mb-4 last:mb-0">{line || '\u00A0'}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 bg-white/50">
                      <div className="text-center">
                        <p className="text-text-light text-lg mb-2">Select a message to view</p>
                        <p className="text-text-light text-sm">Choose a message from the list to read its contents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contactMessages' && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="w-full bg-gradient-to-br from-white via-nature-green/10 to-earth/10 rounded-2xl shadow-custom-lg overflow-hidden flex flex-col min-h-[500px] h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)] md:h-[calc(100vh-250px)] max-h-[800px] border border-border">
            <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-nature-green/15 via-secondary/10 to-earth/10">
              <h2 className="text-text-dark text-2xl font-semibold">Contact Form Messages</h2>
            </div>
            {loadingContactMessages ? (
              <div className="flex-1 flex items-center justify-center bg-white/50">
                <p className="text-text-light">Loading messages...</p>
              </div>
            ) : contactMessages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center bg-white/50">
                <p className="text-text-light">No contact messages yet</p>
              </div>
            ) : (
              <div className="flex flex-1 overflow-hidden md:flex-row flex-col">
                {/* Message List - Left Sidebar */}
                <div className="md:w-[380px] w-full border-r border-b md:border-b-0 border-border bg-gradient-to-b from-nature-green/10 to-white flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-border bg-gradient-to-r from-nature-green/20 to-secondary/10">
                    <div className="text-sm font-medium text-text-dark">{contactMessages.length} {contactMessages.length === 1 ? 'message' : 'messages'}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white/60">
                    {contactMessages.map(msg => (
                      <div
                        key={msg.id}
                        className={`p-4 border-b border-border/60 cursor-pointer transition-colors duration-200 ${
                          selectedContactMessage?.id === msg.id 
                            ? 'bg-gradient-to-r from-nature-green/15 to-secondary/10 border-l-4 border-l-nature-green shadow-sm' 
                            : 'hover:bg-gradient-to-r hover:from-nature-green/10 hover:to-earth/5'
                        } ${
                          !msg.read ? 'bg-gradient-to-r from-nature-green/20 to-white' : 'bg-white/80'
                        }`}
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
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className={`text-sm font-semibold truncate ${!msg.read ? 'text-text-dark' : 'text-text-dark/80'}`}>
                                {msg.name}
                              </div>
                              {!msg.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <div className={`text-sm mb-1 truncate ${!msg.read ? 'font-medium text-text-dark' : 'text-text-light'}`}>
                              {msg.subject}
                            </div>
                            <div className="text-xs text-text-light truncate">
                              {msg.email}
                            </div>
                            <div className="text-xs text-text-light mt-1">
                              {msg.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Display - Right Panel */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-bg-light to-nature-green/5">
                  {selectedContactMessage ? (
                    <>
                      <div className="p-4 md:p-6 border-b border-border bg-gradient-to-r from-nature-green/10 via-secondary/10 to-earth/10">
                        <button
                          onClick={() => setSelectedContactMessage(null)}
                          className="md:hidden mb-3 text-nature-green hover:text-nature-green/80 text-sm font-medium flex items-center gap-1"
                        >
                          <span>←</span> Back to messages
                        </button>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold text-text-dark mb-2 break-words">{selectedContactMessage.subject}</h3>
                            <div className="text-xs md:text-sm text-text-light">
                              <span className="font-medium text-text-dark">{selectedContactMessage.name}</span>
                              <span className="mx-2">•</span>
                              <span className="break-words">{selectedContactMessage.email}</span>
                              <span className="mx-2">•</span>
                              <span className="break-words">{selectedContactMessage.createdAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedContactMessage.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white/70">
                        <div className="prose max-w-none bg-white/80 p-6 rounded-lg border border-border/50 shadow-sm mb-6">
                          <div className="text-text-dark leading-relaxed whitespace-pre-wrap text-sm md:text-[15px]">
                            {selectedContactMessage.message.split('\n').map((line: string, i: number) => (
                              <p key={i} className="mb-4 last:mb-0">{line || '\u00A0'}</p>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-nature-green/10 to-secondary/10 p-6 rounded-lg border border-border/50 space-y-3">
                          <div className="flex items-start gap-4">
                            <span className="font-semibold text-text-dark text-sm min-w-[80px]">Name:</span>
                            <span className="text-text-dark">{selectedContactMessage.name}</span>
                          </div>
                          <div className="flex items-start gap-4">
                            <span className="font-semibold text-text-dark text-sm min-w-[80px]">Email:</span>
                            <span className="text-text-dark flex items-center gap-2 flex-wrap">
                              {selectedContactMessage.email}
                              <button
                                className="py-1.5 px-4 bg-nature-gradient text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom"
                                onClick={() => handleEmailClient(selectedContactMessage.email)}
                                title="Send email"
                              >
                                Email
                              </button>
                            </span>
                          </div>
                          {selectedContactMessage.phone && (
                            <div className="flex items-start gap-4">
                              <span className="font-semibold text-text-dark text-sm min-w-[80px]">Phone:</span>
                              <span className="text-text-dark">{selectedContactMessage.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-6 bg-white/50">
                      <div className="text-center">
                        <p className="text-text-light text-lg mb-2">Select a message to view</p>
                        <p className="text-text-light text-sm">Choose a message from the list to read its contents</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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

export default Admin

