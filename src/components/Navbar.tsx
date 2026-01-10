import { Link, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { collection, query, getDocs, where } from 'firebase/firestore'
import { db } from '../config/firebase'
import Logo from './Logo'

function Navbar() {
  const location = useLocation()
  const { currentUser, signout, isAdmin, userName } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLLIElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
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
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Check if click is not on hamburger button
        const target = event.target as HTMLElement
        if (!target.closest('[data-hamburger]')) {
          setMobileMenuOpen(false)
        }
      }
    }

    if (dropdownOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen, mobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Calculate dropdown position before paint to prevent layout shifts
  useLayoutEffect(() => {
    if (dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [dropdownOpen])

  return (
    <nav className="bg-white/95 backdrop-blur-[10px] shadow-[0_2px_8px_rgba(91,163,208,0.1)] sticky top-0 z-[1000] border-b border-[rgba(212,228,212,0.5)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center w-full box-border">
        <Link to="/" className="no-underline text-text-dark flex items-center transition-transform duration-300 flex-shrink-0 hover:-translate-y-0.5" onClick={() => setMobileMenuOpen(false)}>
          <Logo size="small" showText={true} />
        </Link>
        
        {/* Desktop Navigation */}
        <ul className="hidden lg:flex list-none gap-6 xl:gap-8 items-center m-0 p-0 flex-shrink-0">
          <li>
            <Link to="/" className={`no-underline text-text-dark font-medium transition-colors duration-300 py-2 relative hover:text-primary ${isActive('/') === 'active' ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className={`no-underline text-text-dark font-medium transition-colors duration-300 py-2 relative hover:text-primary ${isActive('/about') === 'active' ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''}`}>
              About
            </Link>
          </li>
          <li>
            <Link to="/contact" className={`no-underline text-text-dark font-medium transition-colors duration-300 py-2 relative hover:text-primary ${isActive('/contact') === 'active' ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''}`}>
              Contact Us
            </Link>
          </li>
          {currentUser ? (
            <>
              <li>
                <span className="text-text-dark font-medium py-2 text-sm">Hello, {userName}</span>
              </li>
              <li ref={dropdownRef} className="relative flex-shrink-0" style={{ position: 'relative', isolation: 'isolate' }}>
                <button 
                  ref={buttonRef}
                  className="bg-transparent border-none text-text-dark font-medium text-base py-2 px-4 cursor-pointer flex items-center gap-1.5 transition-colors duration-300 font-inherit hover:text-primary whitespace-nowrap"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  type="button"
                >
                  <span className="flex-shrink-0">My Account</span>
                  {totalNotificationCount > 0 && (
                    <span className="flex-shrink-0 bg-nature-gradient text-white rounded-xl py-[0.15rem] px-2 text-xs font-bold min-w-[20px] text-center leading-[1.4]">{totalNotificationCount > 99 ? '99+' : totalNotificationCount}</span>
                  )}
                  <span className={`flex-shrink-0 text-[0.7rem] transition-transform duration-300 inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-text-dark ${dropdownOpen ? 'rotate-180' : ''} hover:border-t-primary`} style={{ width: '8px', height: '5px' }}></span>
                </button>
                {dropdownOpen && (
                  <ul 
                    className="fixed bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] list-none py-2 min-w-[180px] z-[1001] border border-border" 
                    style={{ 
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      transform: 'translateZ(0)'
                    }}
                  >
                  <li className="m-0">
                    <Link 
                      to="/profile" 
                      className={`flex items-center justify-between py-3 px-6 text-text-dark no-underline transition-all duration-200 rounded-none hover:bg-bg-light hover:text-primary ${isActive('/profile') === 'active' ? 'bg-bg-light text-primary font-semibold' : ''}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                  </li>
                  <li className="m-0">
                    <Link 
                      to="/appointments" 
                      className={`flex items-center justify-between py-3 px-6 text-text-dark no-underline transition-all duration-200 rounded-none hover:bg-bg-light hover:text-primary ${isActive('/appointments') === 'active' ? 'bg-bg-light text-primary font-semibold' : ''}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Appointments
                      {pendingAppointmentsCount > 0 && (
                        <span className="bg-nature-gradient text-white rounded-xl py-[0.15rem] px-2 text-xs font-bold ml-2 min-w-[20px] text-center flex-shrink-0">{pendingAppointmentsCount}</span>
                      )}
                    </Link>
                  </li>
                  <li className="m-0">
                    <Link 
                      to="/messages" 
                      className={`flex items-center justify-between py-3 px-6 text-text-dark no-underline transition-all duration-200 rounded-none hover:bg-bg-light hover:text-primary ${isActive('/messages') === 'active' ? 'bg-bg-light text-primary font-semibold' : ''}`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      Messages
                      {unreadMessagesCount > 0 && (
                        <span className="bg-nature-gradient text-white rounded-xl py-[0.15rem] px-2 text-xs font-bold ml-2 min-w-[20px] text-center flex-shrink-0">{unreadMessagesCount}</span>
                      )}
                    </Link>
                  </li>
                  </ul>
                )}
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" className={`no-underline text-text-dark font-medium transition-colors duration-300 py-2 relative hover:text-primary ${isActive('/admin') === 'active' ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''}`}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={handleSignOut} className="bg-text-light text-white py-2 px-6 rounded-lg font-semibold text-sm transition-all duration-300 border-none cursor-pointer font-inherit hover:bg-text-dark hover:-translate-y-0.5 hover:shadow-custom">
                  Sign Out
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/signin" className={`no-underline text-text-dark font-medium transition-colors duration-300 py-2 relative hover:text-primary ${isActive('/signin') === 'active' ? 'text-primary after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary' : ''}`}>
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className={`bg-nature-gradient text-white py-2 px-6 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom no-underline relative ${isActive('/signup') === 'active' ? 'bg-gradient-to-br from-primary-dark to-secondary after:hidden' : ''}`}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Hamburger Button */}
        <button
          data-hamburger
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden bg-transparent border-none cursor-pointer p-2 flex flex-col gap-1.5 transition-all duration-300 hover:opacity-70"
          aria-label="Toggle mobile menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-6 h-0.5 bg-text-dark transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden fixed inset-0 top-[73px] bg-white z-[999] transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } overflow-y-auto`}
      >
        <div className="flex flex-col p-4 space-y-4">
          <Link
            to="/"
            className={`text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/about') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            About
          </Link>
          <Link
            to="/contact"
            className={`text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/contact') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact Us
          </Link>
          
          {currentUser ? (
            <>
              <div className="pt-4 border-t border-border mt-2">
                <div className="px-4 py-2 text-text-dark font-medium text-sm">
                  Hello, {userName}
                </div>
                <Link
                  to="/profile"
                  className={`block text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/profile') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/appointments"
                  className={`flex items-center justify-between text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/appointments') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Appointments
                  {pendingAppointmentsCount > 0 && (
                    <span className="bg-nature-gradient text-white rounded-xl py-[0.15rem] px-2 text-xs font-bold min-w-[20px] text-center">{pendingAppointmentsCount}</span>
                  )}
                </Link>
                <Link
                  to="/messages"
                  className={`flex items-center justify-between text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/messages') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Messages
                  {unreadMessagesCount > 0 && (
                    <span className="bg-nature-gradient text-white rounded-xl py-[0.15rem] px-2 text-xs font-bold min-w-[20px] text-center">{unreadMessagesCount}</span>
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/admin') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleSignOut()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full mt-4 bg-text-light text-white py-3 px-6 rounded-lg font-semibold text-sm transition-all duration-300 border-none cursor-pointer hover:bg-text-dark"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className={`text-text-dark font-medium py-3 px-4 rounded-lg transition-colors duration-300 hover:bg-primary/10 hover:text-primary ${isActive('/signin') === 'active' ? 'bg-primary/10 text-primary' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className={`bg-nature-gradient text-white py-3 px-4 rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom no-underline text-center ${isActive('/signup') === 'active' ? 'bg-gradient-to-br from-primary-dark to-secondary' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay - positioned behind menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[998]"
          onClick={() => setMobileMenuOpen(false)}
          style={{ top: '73px' }}
        />
      )}
    </nav>
  )
}

export default Navbar

