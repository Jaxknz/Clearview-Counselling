import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

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
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center p-8 bg-bg-light">
        <div className="bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg w-full max-w-[600px]">
          <h1 className="text-text-dark text-3xl md:text-2xl mb-2 text-center bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Admin Setup Tool</h1>
          <div className="bg-bg-light p-8 md:p-6 rounded-xl">
            <h2 className="text-text-dark text-2xl md:text-xl mb-4">To create your first admin account:</h2>
            <p className="text-text-dark mb-4 font-medium">
              Firebase has two separate sections:
            </p>
            <ul className="bg-white p-4 rounded-lg my-4 list-none m-0">
              <li className="py-2 text-text-dark"><strong>Authentication</strong> - Shows users who signed up (email, UID)</li>
              <li className="py-2 text-text-dark"><strong>Firestore Database</strong> - Stores user metadata including the <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">role</code> field</li>
            </ul>
            <ol className="text-text-dark leading-[1.8] ml-6 mb-4">
              <li className="mb-3">Sign up a user account through the app's signup page</li>
              <li className="mb-3">Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold hover:underline">Firebase Console</a></li>
              <li className="mb-3"><strong>Verify user exists:</strong> Check Authentication → Users (note the UID)</li>
              <li className="mb-3"><strong>Set admin role:</strong> Navigate to Firestore Database → <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">users</code> collection</li>
              <li className="mb-3">Find the user document (match by UID or email address)</li>
              <li className="mb-3">Edit the <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">role</code> field and change it from <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">"user"</code> to <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">"admin"</code></li>
              <li className="mb-3">Sign out and sign back in with that account</li>
              <li className="mb-3">Once you're an admin, you can use this tool to promote other users</li>
            </ol>
            <p className="bg-[#fff8e8] border-l-4 border-[#f5d89c] p-4 rounded-lg my-6 text-[#8b6914]">
              <strong>Important:</strong> The <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">role</code> field is stored in Firestore Database, NOT in the Authentication section. 
              Authentication only handles sign-up/sign-in; Firestore stores your application data.
            </p>
            <p className="text-text-dark">
              <strong>Note:</strong> See <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">ADMIN_SETUP.md</code> for detailed step-by-step instructions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex justify-center items-center p-8 bg-bg-light">
      <div className="bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg w-full max-w-[600px]">
        <h1 className="text-text-dark text-3xl md:text-2xl mb-2 text-center bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Admin Setup Tool</h1>
        <p className="text-center text-text-light mb-8 text-base">Promote a user to admin</p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-center ${
            message.type === 'success' 
              ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7]' 
              : 'bg-[#fce4ec] text-[#c2185b] border border-[#f8bbd0]'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePromoteToAdmin}>
          <div className="mb-6">
            <label htmlFor="email" className="block font-semibold text-text-dark mb-2 text-sm">User Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
            />
            <small className="block mt-2 text-text-light text-sm">The user must have already signed up through the app</small>
          </div>

          <button type="submit" className="w-full py-4 px-4 bg-nature-gradient text-white text-lg font-semibold rounded-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Processing...' : 'Promote to Admin'}
          </button>
        </form>

        <div className="mt-8 p-6 bg-bg-light rounded-lg border-l-4 border-primary">
          <h3 className="text-text-dark text-lg mb-3">Important Notes:</h3>
          <ul className="text-text-light leading-[1.8] ml-6">
            <li className="mb-2">The user must sign out and sign back in for admin privileges to take effect</li>
            <li className="mb-2">Only users who have signed up can be promoted</li>
            <li className="mb-2">Admin users can access the admin portal and view all client data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminSetup

