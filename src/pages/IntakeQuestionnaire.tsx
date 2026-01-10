import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import './IntakeQuestionnaire.css'

interface QuestionnaireData {
  reasonForSeeking: string
  previousTherapy: string
  previousTherapyDetails: string
  currentMedications: string
  mentalHealthHistory: string
  goals: string
  preferredCommunication: string
  emergencyContact: string
  emergencyPhone: string
  additionalInfo: string
}

function IntakeQuestionnaire() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { showError } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false)
  const [formData, setFormData] = useState<QuestionnaireData>({
    reasonForSeeking: '',
    previousTherapy: '',
    previousTherapyDetails: '',
    currentMedications: '',
    mentalHealthHistory: '',
    goals: '',
    preferredCommunication: '',
    emergencyContact: '',
    emergencyPhone: '',
    additionalInfo: ''
  })

  useEffect(() => {
    // Check if user came from sign up
    const selectedPlan = sessionStorage.getItem('selectedPlan')
    if (!selectedPlan || !currentUser) {
      navigate('/')
      return
    }

    // Check if questionnaire is already completed
    const loadExistingQuestionnaire = async () => {
      try {
        const clientDoc = await getDoc(doc(db, 'clients', currentUser.uid))
        if (clientDoc.exists()) {
          const clientData = clientDoc.data()
          
          // If questionnaire already completed, check if we should skip
          if (clientData.questionnaireData) {
            const questionnaireData = clientData.questionnaireData
            
            // Check if all required fields are filled
            const hasRequiredFields = 
              questionnaireData.reasonForSeeking &&
              questionnaireData.goals &&
              questionnaireData.preferredCommunication &&
              questionnaireData.emergencyContact &&
              questionnaireData.emergencyPhone
            
            if (hasRequiredFields) {
              setIsAlreadyCompleted(true)
              setFormData(questionnaireData)
              // Auto-redirect to payment after a brief moment
              setTimeout(() => {
                navigate('/payment')
              }, 2000)
            } else {
              // Load partial data
              setFormData(questionnaireData)
            }
          }
        }
      } catch (error) {
        console.error('Error loading existing questionnaire:', error)
      }
    }

    loadExistingQuestionnaire()
  }, [navigate, currentUser])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      navigate('/signin')
      return
    }

    try {
      // Store questionnaire data
      sessionStorage.setItem('questionnaireData', JSON.stringify(formData))
      
      // Save to Firestore
      const userInfo = sessionStorage.getItem('userInfo')
      const selectedPlan = sessionStorage.getItem('selectedPlan')
      
      if (userInfo && selectedPlan) {
        const user = JSON.parse(userInfo)
        const clientRef = doc(db, 'clients', currentUser.uid)
        
        await setDoc(clientRef, {
          ...user,
          plan: selectedPlan,
          questionnaireData: formData,
          submittedAt: new Date().toISOString(),
          userId: currentUser.uid
        }, { merge: true })
      }
      
      navigate('/payment')
    } catch (error) {
      console.error('Error saving questionnaire:', error)
      showError('Error saving questionnaire. Please try again.')
    }
  }

  const totalSteps = 3

  // Show message if already completed
  if (isAlreadyCompleted) {
    return (
      <div className="questionnaire-container">
        <div className="questionnaire-header">
          <h1>Intake Questionnaire</h1>
          <p>Your questionnaire has already been completed</p>
        </div>
        <div className="questionnaire-form">
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem',
            background: 'var(--bg-light)',
            borderRadius: '12px',
            margin: '2rem 0'
          }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              You've already completed the intake questionnaire. Redirecting to payment...
            </p>
            <p style={{ color: 'var(--text-light)' }}>
              If you need to update your information, you can do so from your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-header">
        <h1>Intake Questionnaire</h1>
        <p>Help us understand your needs better</p>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="step-indicator">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="questionnaire-form">
        {currentStep === 1 && (
          <div className="questionnaire-step">
            <h2>Background Information</h2>
            
            <div className="form-group">
              <label htmlFor="reasonForSeeking">
                What brings you to counselling today? *
              </label>
              <textarea
                id="reasonForSeeking"
                name="reasonForSeeking"
                value={formData.reasonForSeeking}
                onChange={handleInputChange}
                rows={4}
                required
                placeholder="Please share what you're hoping to achieve through counselling..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="previousTherapy">
                Have you received therapy or counselling before? *
              </label>
              <select
                id="previousTherapy"
                name="previousTherapy"
                value={formData.previousTherapy}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.previousTherapy === 'yes' && (
              <div className="form-group">
                <label htmlFor="previousTherapyDetails">
                  Please provide details about your previous therapy experience
                </label>
                <textarea
                  id="previousTherapyDetails"
                  name="previousTherapyDetails"
                  value={formData.previousTherapyDetails}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What type of therapy, duration, and outcomes..."
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="currentMedications">
                Are you currently taking any medications? (Please list if applicable)
              </label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows={3}
                placeholder="Include medication name, dosage, and reason..."
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="questionnaire-step">
            <h2>Health & Goals</h2>
            
            <div className="form-group">
              <label htmlFor="mentalHealthHistory">
                Mental Health History (if applicable)
              </label>
              <textarea
                id="mentalHealthHistory"
                name="mentalHealthHistory"
                value={formData.mentalHealthHistory}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any previous diagnoses, treatments, or relevant health information..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="goals">
                What are your main goals for counselling? *
              </label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                rows={4}
                required
                placeholder="What would you like to achieve? What does success look like for you?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferredCommunication">
                Preferred Method of Communication *
              </label>
              <select
                id="preferredCommunication"
                name="preferredCommunication"
                value={formData.preferredCommunication}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an option</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
                <option value="video">Video Call</option>
              </select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="questionnaire-step">
            <h2>Emergency & Additional Information</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencyPhone">
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="additionalInfo">
                Is there anything else you'd like us to know?
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={5}
                placeholder="Any additional information, concerns, or questions..."
              />
            </div>
          </div>
        )}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={handleBack} className="nav-button back-button">
              Back
            </button>
          )}
          {currentStep < totalSteps ? (
            <button type="button" onClick={handleNext} className="nav-button next-button">
              Next
            </button>
          ) : (
            <button type="submit" className="nav-button submit-button">
              Continue to Payment
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default IntakeQuestionnaire

