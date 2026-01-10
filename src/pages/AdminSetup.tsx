import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import './AdminSetup.css'

/**
 * One-time admin setup tool
 * This allows you to promote a user to admin if you're already an admin
 * For the first admin, use Firebase Console (see ADMIN_SETUP.md)
 */
function AdminSetup() {
  const { currentUser, isAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePromoteToAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!currentUser) {
      setMessage({ type: 'error', text: 'You must be signed in to use this tool.' })
      return
    }

    if (!isAdmin) {
      setMessage({ 
        type: 'error', 
        text: 'Only existing admins can promote users. For your first admin, use Firebase Console (see ADMIN_SETUP.md).' 
      })
      return
    }

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter an email address.' })
      return
    }

    try {
      setLoading(true)

      // Find user by email in users collection
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        setMessage({ 
          type: 'error', 
          text: 'No user found with that email address. Make sure the user has signed up first.' 
        })
        return
      }

      // Update the first matching user document
      const userDoc = querySnapshot.docs[0]
      await setDoc(doc(db, 'users', userDoc.id), {
        ...userDoc.data(),
        role: 'admin'
      }, { merge: true })

      setMessage({ 
        type: 'success', 
        text: `Successfully promoted ${email} to admin. They need to sign out and sign back in for changes to take effect.` 
      })
      setEmail('')
    } catch (error: any) {
      console.error('Error promoting user:', error)
      setMessage({ 
        type: 'error', 
        text: `Error: ${error.message || 'Failed to promote user to admin'}` 
      })
    } finally {
      setLoading(false)
    }
  }

  // If not admin, show instructions
  if (!isAdmin) {
    return (
      <div className="admin-setup-container">
        <div className="admin-setup-box">
          <h1>Admin Setup Tool</h1>
          <div className="instructions">
            <h2>To create your first admin account:</h2>
            <p className="info-paragraph">
              Firebase has two separate sections:
            </p>
            <ul className="firebase-sections">
              <li><strong>Authentication</strong> - Shows users who signed up (email, UID)</li>
              <li><strong>Firestore Database</strong> - Stores user metadata including the <code>role</code> field</li>
            </ul>
            <ol>
              <li>Sign up a user account through the app's signup page</li>
              <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li><strong>Verify user exists:</strong> Check Authentication → Users (note the UID)</li>
              <li><strong>Set admin role:</strong> Navigate to Firestore Database → <code>users</code> collection</li>
              <li>Find the user document (match by UID or email address)</li>
              <li>Edit the <code>role</code> field and change it from <code>"user"</code> to <code>"admin"</code></li>
              <li>Sign out and sign back in with that account</li>
              <li>Once you're an admin, you can use this tool to promote other users</li>
            </ol>
            <p className="important-note">
              <strong>Important:</strong> The <code>role</code> field is stored in Firestore Database, NOT in the Authentication section. 
              Authentication only handles sign-up/sign-in; Firestore stores your application data.
            </p>
            <p>
              <strong>Note:</strong> See <code>ADMIN_SETUP.md</code> for detailed step-by-step instructions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-setup-container">
      <div className="admin-setup-box">
        <h1>Admin Setup Tool</h1>
        <p className="subtitle">Promote a user to admin</p>

        {message && (
          <div className={`message message-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePromoteToAdmin}>
          <div className="form-group">
            <label htmlFor="email">User Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
            <small>The user must have already signed up through the app</small>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing...' : 'Promote to Admin'}
          </button>
        </form>

        <div className="info-box">
          <h3>Important Notes:</h3>
          <ul>
            <li>The user must sign out and sign back in for admin privileges to take effect</li>
            <li>Only users who have signed up can be promoted</li>
            <li>Admin users can access the admin portal and view all client data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminSetup

