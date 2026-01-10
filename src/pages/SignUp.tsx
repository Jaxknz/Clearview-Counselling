import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '../config/firebase'
import './SignUp.css'

export type PlanType = 'discovery' | 'mentorship' | 'zoom'

export interface Plan {
  id: PlanType
  name: string
  description: string
  price: string
  features: string[]
}

const plans: Plan[] = [
  {
    id: 'discovery',
    name: 'Free 15 min Discovery Call',
    description: 'A brief consultation to understand your needs',
    price: 'Free',
    features: [
      '15-minute consultation',
      'Initial assessment',
      'Goal discussion',
      'No commitment required'
    ]
  },
  {
    id: 'mentorship',
    name: 'Mentorship Program',
    description: 'Ongoing guidance and support',
    price: 'Custom Pricing',
    features: [
      'Regular sessions',
      'Personalized guidance',
      'Progress tracking',
      'Email support'
    ]
  },
  {
    id: 'zoom',
    name: 'Zoom Calls',
    description: 'Flexible video counselling sessions',
    price: 'Per Session',
    features: [
      'Video sessions',
      'Flexible scheduling',
      'Recorded sessions (optional)',
      'Secure platform'
    ]
  }
]

function SignUp() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUserData, setLoadingUserData] = useState(true)
  const [hasCompletedQuestionnaire, setHasCompletedQuestionnaire] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const navigate = useNavigate()
  const { signup, currentUser, userName } = useAuth()

  // Load existing user data if signed in
  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        try {
          // Check both users and clients collections
          const [userDoc, clientDoc] = await Promise.all([
            getDoc(doc(db, 'users', currentUser.uid)),
            getDoc(doc(db, 'clients', currentUser.uid))
          ])

          let firstName = ''
          let lastName = ''
          let email = currentUser.email || ''
          let phone = ''

          // Get data from users collection
          if (userDoc.exists()) {
            const userData = userDoc.data()
            firstName = userData.firstName || ''
            lastName = userData.lastName || ''
            email = userData.email || email
            phone = userData.phone || phone
          } else {
            // Parse from displayName if user doc doesn't exist
            const displayName = currentUser.displayName || ''
            const nameParts = displayName.split(' ')
            firstName = nameParts[0] || ''
            lastName = nameParts.slice(1).join(' ') || ''
          }

          // Get phone and plan from clients collection if not found in users
          if (clientDoc.exists()) {
            const clientData = clientDoc.data()
            phone = phone || clientData.phone || ''
            // Pre-select previously chosen plan
            if (clientData.plan) {
              setSelectedPlan(clientData.plan as PlanType)
            }
            // Check if questionnaire is already completed
            if (clientData.questionnaireData) {
              const questionnaireData = clientData.questionnaireData
              const hasRequiredFields = 
                questionnaireData.reasonForSeeking &&
                questionnaireData.goals &&
                questionnaireData.preferredCommunication &&
                questionnaireData.emergencyContact &&
                questionnaireData.emergencyPhone
              if (hasRequiredFields) {
                setHasCompletedQuestionnaire(true)
              }
            }
          }

          setFormData(prev => ({
            ...prev,
            firstName,
            lastName,
            email,
            phone
          }))
        } catch (error) {
          console.error('Error loading user data:', error)
          setFormData(prev => ({
            ...prev,
            email: currentUser.email || '',
            firstName: currentUser.displayName?.split(' ')[0] || '',
            lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || ''
          }))
        }
      }
      setLoadingUserData(false)
    }

    loadUserData()
  }, [currentUser])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedPlan) {
      setError('Please select a plan')
      return
    }

    // Require agreement to Privacy Policy and Terms for new sign-ups
    if (!currentUser) {
      if (!agreedToPrivacy || !agreedToTerms) {
        setError('Please agree to the Privacy Policy and Terms and Conditions to continue')
        return
      }
    }

    // If user is already signed in, skip account creation
    if (currentUser) {
      try {
        setLoading(true)

        // Get existing user data to preserve phone if not updating
        let phoneNumber = formData.phone
        if (!phoneNumber) {
          // Try to get phone from existing client or user document
          try {
            const [userDoc, clientDoc] = await Promise.all([
              getDoc(doc(db, 'users', currentUser.uid)),
              getDoc(doc(db, 'clients', currentUser.uid))
            ])
            phoneNumber = userDoc.exists() && userDoc.data().phone 
              ? userDoc.data().phone 
              : (clientDoc.exists() && clientDoc.data().phone ? clientDoc.data().phone : '')
          } catch (err) {
            console.error('Error loading existing phone:', err)
          }
        }

        // Update user phone in users collection if provided
        if (formData.phone) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            await setDoc(doc(db, 'users', currentUser.uid), {
              phone: formData.phone
            }, { merge: true })
          }
        }

        // Get existing user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
        let firstName = formData.firstName
        let lastName = formData.lastName
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          firstName = userData.firstName || firstName
          lastName = userData.lastName || lastName
        }

        // Save client data to Firestore
        const userInfo = {
          firstName,
          lastName,
          email: formData.email || currentUser.email || '',
          phone: phoneNumber || formData.phone
        }

        // Store selected plan in sessionStorage
        sessionStorage.setItem('selectedPlan', selectedPlan)
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo))
        
        // Save initial client data to Firestore (will be updated after intake and payment)
        if (auth.currentUser) {
          const clientRef = doc(db, 'clients', auth.currentUser.uid)
          const clientDoc = await getDoc(clientRef)
          
          // Check if questionnaire is already completed
          const hasQuestionnaire = clientDoc.exists() && clientDoc.data().questionnaireData
          
          await setDoc(clientRef, {
            ...userInfo,
            plan: selectedPlan,
            submittedAt: new Date().toISOString(),
            userId: auth.currentUser.uid
          }, { merge: true })
          
          // Skip intake if questionnaire already completed
          if (hasQuestionnaire) {
            navigate('/payment')
          } else {
            navigate('/intake')
          }
        } else {
          navigate('/intake')
        }
      } catch (err: any) {
        console.error('Error saving plan selection:', err)
        setError('Failed to save plan selection. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    // New user signup flow
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      // Create Firebase account
      await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      )

      // Save client data to Firestore
      const userInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      }

      // Store selected plan in sessionStorage
      sessionStorage.setItem('selectedPlan', selectedPlan)
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // Save initial client data to Firestore (will be updated after intake and payment)
      if (auth.currentUser) {
        const clientRef = doc(db, 'clients', auth.currentUser.uid)
        await setDoc(clientRef, {
          ...userInfo,
          plan: selectedPlan,
          submittedAt: new Date().toISOString(),
          userId: auth.currentUser.uid
        })
      }
      
      navigate('/intake')
    } catch (err: any) {
      let errorMessage = 'Failed to create account. Please try again.'
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address. Please check your email.'
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.'
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loadingUserData) {
    return (
      <div className="signup-container">
        <div className="signup-content">
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        </div>
      </div>
    )
  }

  const isSignedIn = !!currentUser

  return (
    <div className="signup-container">
      <div className="signup-header">
        <h1>Clearview Counselling</h1>
        <p>Your journey to clarity and growth starts here</p>
        {isSignedIn && (
          <p className="signed-in-notice">Welcome back, {userName}! Select a plan to continue.</p>
        )}
      </div>

      <div className="signup-content">
        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message">{error}</div>}

          {!isSignedIn && (
            <>
              <div className="form-section">
                <h2>Personal Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h2>Account Security</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {isSignedIn && (
            <div className="form-section">
              <h2>Contact Information</h2>
              {formData.phone ? (
                <div className="user-info-display">
                  <p><strong>Name:</strong> {userName}</p>
                  <p><strong>Email:</strong> {formData.email || currentUser.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p className="info-note">Your contact information is on file. You can update your phone number below if needed.</p>
                </div>
              ) : null}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number {!formData.phone && '*'}</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required={!formData.phone}
                    placeholder={formData.phone ? "Update your phone number (optional)" : "Your phone number"}
                  />
                  {formData.phone && (
                    <small className="optional-note">Optional - you already have a phone number on file</small>
                  )}
                </div>
              </div>
              {!formData.phone && (
                <div className="user-info-display">
                  <p><strong>Name:</strong> {userName}</p>
                  <p><strong>Email:</strong> {formData.email || currentUser.email}</p>
                </div>
              )}
            </div>
          )}

          <div className="form-section">
            <h2>Select Your Plan</h2>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="plan-header">
                    <h3>{plan.name}</h3>
                    <div className="plan-price">{plan.price}</div>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <div className="plan-select-indicator">
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!currentUser && (
            <div className="form-section terms-section">
              <h2>Legal Agreements</h2>
              <div className="terms-checkboxes">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <Link 
                        to="/privacy-policy" 
                        className="terms-link" 
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open('/privacy-policy', '_blank', 'noopener,noreferrer')
                          e.preventDefault()
                        }}
                      >
                        Privacy Policy
                      </Link>
                      {' '}*
                    </span>
                  </label>
                </div>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the{' '}
                      <Link 
                        to="/terms-and-conditions" 
                        className="terms-link" 
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open('/terms-and-conditions', '_blank', 'noopener,noreferrer')
                          e.preventDefault()
                        }}
                      >
                        Terms and Conditions
                      </Link>
                      {' '}*
                    </span>
                  </label>
                </div>
              </div>
              <p className="terms-note">
                By creating an account, you acknowledge that you have read, understood, and agree to be bound by our Privacy Policy and Terms and Conditions.
              </p>
            </div>
          )}

          <button type="submit" className="submit-button" disabled={loading || (!currentUser && (!agreedToPrivacy || !agreedToTerms))}>
            {loading 
              ? (isSignedIn ? 'Saving...' : 'Creating Account...') 
              : (isSignedIn 
                  ? (hasCompletedQuestionnaire ? 'Continue to Payment' : 'Continue to Intake Questionnaire')
                  : 'Create Account & Continue')}
          </button>
          
          {!isSignedIn && (
            <p className="signup-footer">
              Already have an account? <Link to="/signin">Sign in here</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default SignUp

