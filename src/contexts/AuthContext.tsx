import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>
  signin: (email: string, password: string) => Promise<void>
  signout: () => Promise<void>
  isAdmin: boolean
  userName: string // User's full name or email fallback
  userPhotoURL: string | null
  userFirstName: string
  userLastName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState<string>('')
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null)
  const [userFirstName, setUserFirstName] = useState<string>('')
  const [userLastName, setUserLastName] = useState<string>('')

  async function signup(email: string, password: string, firstName: string, lastName: string) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update user profile
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`
    })

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      role: 'user'
    })
  }

  async function signin(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Ensure user document exists in Firestore (for users created directly in Firebase Console)
    // Note: onAuthStateChanged will also handle this, but doing it here ensures it happens immediately
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) {
        // User document doesn't exist, create it
        // This handles users created directly in Firebase Authentication Console
        const displayName = user.displayName || ''
        const nameParts = displayName.split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email || email,
          displayName: displayName,
          firstName: firstName,
          lastName: lastName,
          createdAt: new Date().toISOString(),
          role: 'user' // Default role - can be changed to 'admin' in Firestore
        })
        
        // Set userName for immediate display
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : displayName || user.email || 'User'
        setUserName(fullName)
        setUserFirstName(firstName)
        setUserLastName(lastName)
        setUserPhotoURL(user.photoURL || null)
      } else {
        // User document exists, get name from Firestore
        const userData = userDoc.data()
        const firstName = userData.firstName || ''
        const lastName = userData.lastName || ''
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                       userData.displayName || 
                       user.displayName || 
                       user.email || 
                       'User'
        setUserName(fullName)
        setUserFirstName(firstName)
        setUserLastName(lastName)
        setUserPhotoURL(userData.photoURL || user.photoURL || null)
      }
    } catch (error) {
      console.error('Error ensuring user document exists on sign-in:', error)
      // Don't throw - sign-in should still succeed even if Firestore write fails
      // The onAuthStateChanged handler will also try to create the document
      // Set fallback name from Auth profile
      setUserName(user.displayName || user.email || 'User')
    }
  }

  async function signout() {
    await firebaseSignOut(auth)
    setIsAdmin(false)
    setUserName('')
    setUserPhotoURL(null)
    setUserFirstName('')
    setUserLastName('')
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user)
        // Ensure user document exists in Firestore and check admin status
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          
          if (!userDoc.exists()) {
            // User document doesn't exist, create it
            // This handles users created directly in Firebase Authentication Console
            try {
              const displayName = user.displayName || ''
              const nameParts = displayName.split(' ')
              const firstName = nameParts[0] || ''
              const lastName = nameParts.slice(1).join(' ') || ''
              
              await setDoc(doc(db, 'users', user.uid), {
                email: user.email || '',
                displayName: displayName,
                firstName: firstName,
                lastName: lastName,
                createdAt: new Date().toISOString(),
                role: 'user' // Default role - can be changed to 'admin' in Firestore
              })
              // New users default to non-admin
              setIsAdmin(false)
              // Set user name for display
              const fullName = firstName && lastName ? `${firstName} ${lastName}` : displayName || user.email || 'User'
              setUserName(fullName)
              setUserFirstName(firstName)
              setUserLastName(lastName)
              setUserPhotoURL(user.photoURL || null)
            } catch (error) {
              console.error('Error creating user document:', error)
              // If Firestore write fails, assume not admin for security
              setIsAdmin(false)
              // Fallback to displayName or email
              const displayName = user.displayName || ''
              const nameParts = displayName.split(' ')
              setUserName(displayName || user.email || 'User')
              setUserFirstName(nameParts[0] || '')
              setUserLastName(nameParts.slice(1).join(' ') || '')
              setUserPhotoURL(user.photoURL || null)
            }
          } else {
            // User document exists, check admin status and get name
            const userData = userDoc.data()
            setIsAdmin(userData.role === 'admin')
            // Get name from Firestore (firstName + lastName) or fallback to displayName/email
            const firstName = userData.firstName || ''
            const lastName = userData.lastName || ''
            const fullName = firstName && lastName ? `${firstName} ${lastName}` : 
                           userData.displayName || 
                           user.displayName || 
                           user.email || 
                           'User'
            setUserName(fullName)
            setUserFirstName(firstName)
            setUserLastName(lastName)
            setUserPhotoURL(userData.photoURL || user.photoURL || null)
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
          // Fallback values
          const displayName = user.displayName || ''
          const nameParts = displayName.split(' ')
          setUserName(displayName || user.email || 'User')
          setUserFirstName(nameParts[0] || '')
          setUserLastName(nameParts.slice(1).join(' ') || '')
          setUserPhotoURL(user.photoURL || null)
        }
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
        setUserName('')
        setUserPhotoURL(null)
        setUserFirstName('')
        setUserLastName('')
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    signup,
    signin,
    signout,
    isAdmin,
    userName,
    userPhotoURL,
    userFirstName,
    userLastName
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

