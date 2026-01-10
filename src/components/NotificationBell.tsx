import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../config/firebase'

interface NotificationBellProps {
  onClick?: () => void
}

function NotificationBell({ onClick }: NotificationBellProps) {
  const { currentUser } = useAuth()
  const [pendingAppointments, setPendingAppointments] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (currentUser) {
      loadNotifications()
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    } else {
      setPendingAppointments(0)
      setUnreadMessages(0)
    }
  }, [currentUser])

  const loadNotifications = async () => {
    if (!currentUser) return

    try {
      // Load pending appointments
      try {
        const appointmentsRef = collection(db, 'appointments')
        const appointmentsQuery = query(
          appointmentsRef,
          where('clientId', '==', currentUser.uid)
        )
        const appointmentsSnapshot = await getDocs(appointmentsQuery)
        
        const now = new Date()
        let pendingCount = 0
        
        appointmentsSnapshot.forEach((doc) => {
          const data = doc.data()
          const status = data.status || 'pending'
          const appointmentDate = data.date?.toDate ? data.date.toDate() : new Date(data.date)
          
          if (status === 'pending' && appointmentDate >= now) {
            pendingCount++
          }
        })
        
        setPendingAppointments(pendingCount)
      } catch (error: any) {
        if (error.code !== 'failed-precondition') {
          console.error('Error loading pending appointments:', error)
        }
      }

      // Load unread messages
      try {
        const messagesRef = collection(db, 'messages')
        // Try query with read filter first
        try {
          const messagesQuery = query(
            messagesRef,
            where('toUserId', '==', currentUser.uid),
            where('read', '==', false)
          )
          const messagesSnapshot = await getDocs(messagesQuery)
          setUnreadMessages(messagesSnapshot.size)
        } catch (error: any) {
          // If index error, load all and filter client-side
          if (error.code === 'failed-precondition') {
            const messagesQuery = query(
              messagesRef,
              where('toUserId', '==', currentUser.uid)
            )
            const messagesSnapshot = await getDocs(messagesQuery)
            let unreadCount = 0
            messagesSnapshot.forEach((doc) => {
              const data = doc.data()
              if (!data.read) {
                unreadCount++
              }
            })
            setUnreadMessages(unreadCount)
          } else {
            throw error
          }
        }
      } catch (error) {
        console.error('Error loading unread messages:', error)
        setUnreadMessages(0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const totalNotifications = pendingAppointments + unreadMessages

  if (!currentUser || totalNotifications === 0) {
    return null
  }

  return (
    <button className="relative bg-transparent border-none cursor-pointer p-2 text-2xl transition-transform duration-300 hover:scale-110" onClick={onClick} aria-label={`${totalNotifications} notifications`}>
      <span className="block">🔔</span>
      {totalNotifications > 0 && (
        <span className="absolute top-0 right-0 bg-[#ff4444] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold border-2 border-white">{totalNotifications > 99 ? '99+' : totalNotifications}</span>
      )}
    </button>
  )
}

export default NotificationBell

