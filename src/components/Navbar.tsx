import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import Logo from './Logo'
import './Navbar.css'

function Navbar() {
  const location = useLocation()
  const { currentUser, signout, isAdmin, userName } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLLIElement>(null)
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)

  const isActive = (path: string) => {
    return location.pathname === path ? 'active' : ''
  }

  const handleSignOut = async () => {
    try {
      await signout()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Load notification count
  useEffect(() => {
    if (currentUser) {
      loadNotificationCount()
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotificationCount, 30000)
      return () => clearInterval(interval)
    } else {
      setPendingAppointmentsCount(0)
      setUnreadMessagesCount(0)
    }
  }, [currentUser])

  const loadNotificationCount = async () => {
    if (!currentUser) return

    try {
      let pendingAppointments = 0
      let unreadMessages = 0

      // Users should not see pending appointments, so don't count them for notifications
      // Only admins see pending appointments
      setPendingAppointmentsCount(0)

      // Load unread messages
      try {
        const messagesRef = collection(db, 'messages')
        try {
          const messagesQuery = query(
            messagesRef,
            where('toUserId', '==', currentUser.uid),
            where('read', '==', false)
          )
          const messagesSnapshot = await getDocs(messagesQuery)
          unreadMessages = messagesSnapshot.size
        } catch (error: any) {
          if (error.code === 'failed-precondition') {
            // Try without read filter
            const messagesQuery = query(
              messagesRef,
              where('toUserId', '==', currentUser.uid)
            )
            const messagesSnapshot = await getDocs(messagesQuery)
            messagesSnapshot.forEach((doc) => {
              const data = doc.data()
              if (!data.read) {
                unreadMessages++
              }
            })
          }
        }
      } catch (error) {
        // Ignore errors
      }

      setPendingAppointmentsCount(pendingAppointments)
      setUnreadMessagesCount(unreadMessages)
    } catch (error) {
      // Ignore errors
    }
  }
  
  const totalNotificationCount = pendingAppointmentsCount + unreadMessagesCount

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Logo size="small" showText={true} />
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link to="/" className={isActive('/')}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={isActive('/about')}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={isActive('/contact')}>
              Contact Us
            </Link>
          </li>
          {currentUser ? (
            <>
              <li>
                <span className="user-greeting">Hello, {userName}</span>
              </li>
              <li ref={dropdownRef} className="dropdown-container">
                <button 
                  className="dropdown-toggle"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  My Account
                  {totalNotificationCount > 0 && (
                    <span className="notification-badge-inline">{totalNotificationCount > 99 ? '99+' : totalNotificationCount}</span>
                  )}
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}></span>
                </button>
                {dropdownOpen && (
                  <ul className="dropdown-menu">
                    <li>
                      <Link 
                        to="/profile" 
                        className={isActive('/profile')}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/appointments" 
                        className={isActive('/appointments')}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Appointments
                        {pendingAppointmentsCount > 0 && (
                          <span className="dropdown-notification-badge">{pendingAppointmentsCount}</span>
                        )}
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/messages" 
                        className={isActive('/messages')}
                        onClick={() => setDropdownOpen(false)}
                      >
                        Messages
                        {unreadMessagesCount > 0 && (
                          <span className="dropdown-notification-badge">{unreadMessagesCount}</span>
                        )}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className={isActive('/admin')}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={handleSignOut} className="signout-button">
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/signin" className={isActive('/signin')}>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className={`signup-link ${isActive('/signup')}`}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar

