import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db, auth } from '../config/firebase'

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
      <div className="min-h-[calc(100vh-80px)] p-8 bg-gradient-to-br from-bg-light via-sky/10 to-nature-green/10">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    )
  }

  const isSignedIn = !!currentUser

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-bg-light via-sky/10 to-nature-green/10">
      <div className="text-center text-text-dark mb-8 sm:mb-12 py-4 sm:py-8 px-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-nature-gradient bg-clip-text text-transparent">Clearview Counselling</h1>
        <p className="text-base sm:text-lg lg:text-xl text-text-light">Your journey to clarity and growth starts here</p>
        {isSignedIn && (
          <p className="mt-4 text-base sm:text-lg text-accent font-semibold">Welcome back, {userName}! Select a plan to continue.</p>
        )}
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white via-primary/10 to-sky/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-custom-lg border border-primary/20">
          {error && <div className="bg-[#fee] text-[#c33] p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-center text-sm sm:text-base">{error}</div>}

          {!isSignedIn && (
            <>
              <div className="mb-8 sm:mb-10">
                <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="flex flex-col">
                    <label htmlFor="firstName" className="font-semibold text-text-dark mb-2 text-sm">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="lastName" className="font-semibold text-text-dark mb-2 text-sm">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="email" className="font-semibold text-text-dark mb-2 text-xs sm:text-sm">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="py-2.5 sm:py-3 px-3 border-2 border-border rounded-lg text-sm sm:text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="phone" className="font-semibold text-text-dark mb-2 text-xs sm:text-sm">Phone *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="py-2.5 sm:py-3 px-3 border-2 border-border rounded-lg text-sm sm:text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-8 sm:mb-10">
                <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Account Security</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col">
                    <label htmlFor="password" className="font-semibold text-text-dark mb-2 text-sm">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="confirmPassword" className="font-semibold text-text-dark mb-2 text-sm">Confirm Password *</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      placeholder="Re-enter your password"
                      className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {isSignedIn && (
            <div className="mb-8 sm:mb-10">
              <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Contact Information</h2>
              {formData.phone ? (
                <div className="bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 p-4 sm:p-6 rounded-lg mt-4 border border-primary/20">
                  <p className="my-2 text-text-dark text-sm sm:text-base"><strong>Name:</strong> {userName}</p>
                  <p className="my-2 text-text-dark text-sm sm:text-base"><strong>Email:</strong> {formData.email || currentUser.email}</p>
                  <p className="my-2 text-text-dark"><strong>Phone:</strong> {formData.phone}</p>
                  <p className="mt-4 p-4 bg-[#e7f3ff] border-l-4 border-primary rounded text-text-dark text-sm">Your contact information is on file. You can update your phone number below if needed.</p>
                </div>
              ) : null}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 md:grid-cols-1">
                <div className="flex flex-col">
                  <label htmlFor="phone" className="font-semibold text-text-dark mb-2 text-sm">Phone Number {!formData.phone && '*'}</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required={!formData.phone}
                    placeholder={formData.phone ? "Update your phone number (optional)" : "Your phone number"}
                    className="py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                  />
                  {formData.phone && (
                    <small className="block mt-2 text-text-light text-sm italic">Optional - you already have a phone number on file</small>
                  )}
                </div>
              </div>
              {!formData.phone && (
                <div className="bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 p-6 rounded-lg mt-4 border border-primary/20">
                  <p className="my-2 text-text-dark"><strong>Name:</strong> {userName}</p>
                  <p className="my-2 text-text-dark"><strong>Email:</strong> {formData.email || currentUser.email}</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-8 sm:mb-10">
            <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Select Your Plan</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-xl p-4 sm:p-6 lg:p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br from-white via-sky/10 to-nature-green/5 relative ${
                    selectedPlan === plan.id 
                      ? 'border-primary bg-gradient-to-br from-primary/5 to-secondary/5 shadow-[0_0_0_3px_rgba(74,144,226,0.1)]' 
                      : 'border-border hover:-translate-y-1 hover:shadow-custom-lg hover:border-primary'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4 gap-2">
                    <h3 className="text-text-dark text-lg sm:text-xl lg:text-2xl font-bold flex-1">{plan.name}</h3>
                    <div className="text-lg sm:text-xl font-bold text-primary sm:ml-4">{plan.price}</div>
                  </div>
                  <p className="text-text-light mb-3 sm:mb-4 text-xs sm:text-sm">{plan.description}</p>
                  <ul className="list-none mb-4 sm:mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="py-1.5 sm:py-2 pl-5 sm:pl-6 relative text-text-dark text-xs sm:text-sm before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold">{feature}</li>
                    ))}
                  </ul>
                  <div className={`text-center py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base text-text-dark transition-all duration-300 ${
                    selectedPlan === plan.id 
                      ? 'bg-primary text-white' 
                      : 'bg-gradient-to-br from-primary/10 via-sky/10 to-nature-green/10'
                  }`}>
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!currentUser && (
            <div className="mb-8 sm:mb-10 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-border">
              <h2 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-4 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-border">Legal Agreements</h2>
              <div className="flex flex-col gap-3 sm:gap-4 mb-4">
                <div className="flex items-start">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer text-text-dark text-xs sm:text-sm leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreedToPrivacy}
                      onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="flex-1">
                      I agree to the{' '}
                      <Link 
                        to="/privacy-policy" 
                        className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline" 
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
                <div className="flex items-start">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer text-text-dark text-xs sm:text-sm leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                      className="mt-1 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer accent-primary flex-shrink-0"
                    />
                    <span className="flex-1">
                      I agree to the{' '}
                      <Link 
                        to="/terms-and-conditions" 
                        className="text-primary no-underline font-semibold transition-colors duration-300 hover:text-secondary hover:underline" 
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
              <p className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-primary/10 via-sky/10 to-nature-green/10 border-l-4 border-primary rounded text-text-dark text-xs sm:text-sm leading-relaxed">
                By creating an account, you acknowledge that you have read, understood, and agree to be bound by our Privacy Policy and Terms and Conditions.
              </p>
            </div>
          )}

          <button type="submit" className="w-full py-3 sm:py-4 px-6 sm:px-8 bg-nature-gradient text-white text-base sm:text-lg font-semibold rounded-lg mt-6 sm:mt-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none" disabled={loading || (!currentUser && (!agreedToPrivacy || !agreedToTerms))}>
            {loading 
              ? (isSignedIn ? 'Saving...' : 'Creating Account...') 
              : (isSignedIn 
                  ? (hasCompletedQuestionnaire ? 'Continue to Payment' : 'Continue to Intake Questionnaire')
                  : 'Create Account & Continue')}
          </button>
          
          {!isSignedIn && (
            <p className="text-center mt-4 sm:mt-6 text-text-light text-xs sm:text-sm">
              Already have an account? <Link to="/signin" className="text-primary no-underline font-semibold hover:underline">Sign in here</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default SignUp

