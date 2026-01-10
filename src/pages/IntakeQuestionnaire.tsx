import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

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
      <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Intake Questionnaire</h1>
          <p className="text-lg text-text-light">Your questionnaire has already been completed</p>
        </div>
        <div className="max-w-3xl mx-auto bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
          <div className="text-center py-12 px-8 bg-bg-light rounded-xl my-8">
            <p className="text-lg mb-4 text-text-dark">
              You've already completed the intake questionnaire. Redirecting to payment...
            </p>
            <p className="text-text-light">
              If you need to update your information, you can do so from your account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Intake Questionnaire</h1>
        <p className="text-lg text-text-light mb-6">Help us understand your needs better</p>
        <div className="w-full max-w-[600px] h-2 bg-border rounded-full mx-auto mb-4 overflow-hidden">
          <div 
            className="h-full bg-nature-gradient rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="text-sm text-text-light">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-10 md:p-6 rounded-2xl shadow-custom-lg">
        {currentStep === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-border">Background Information</h2>
            
            <div className="mb-6">
              <label htmlFor="reasonForSeeking" className="block font-semibold text-text-dark mb-2 text-sm">
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
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="previousTherapy" className="block font-semibold text-text-dark mb-2 text-sm">
                Have you received therapy or counselling before? *
              </label>
              <select
                id="previousTherapy"
                name="previousTherapy"
                value={formData.previousTherapy}
                onChange={handleInputChange}
                required
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              >
                <option value="">Select an option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            {formData.previousTherapy === 'yes' && (
              <div className="mb-6">
                <label htmlFor="previousTherapyDetails" className="block font-semibold text-text-dark mb-2 text-sm">
                  Please provide details about your previous therapy experience
                </label>
                <textarea
                  id="previousTherapyDetails"
                  name="previousTherapyDetails"
                  value={formData.previousTherapyDetails}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What type of therapy, duration, and outcomes..."
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="currentMedications" className="block font-semibold text-text-dark mb-2 text-sm">
                Are you currently taking any medications? (Please list if applicable)
              </label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows={3}
                placeholder="Include medication name, dosage, and reason..."
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="animate-fadeIn">
            <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-border">Health & Goals</h2>
            
            <div className="mb-6">
              <label htmlFor="mentalHealthHistory" className="block font-semibold text-text-dark mb-2 text-sm">
                Mental Health History (if applicable)
              </label>
              <textarea
                id="mentalHealthHistory"
                name="mentalHealthHistory"
                value={formData.mentalHealthHistory}
                onChange={handleInputChange}
                rows={4}
                placeholder="Any previous diagnoses, treatments, or relevant health information..."
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="goals" className="block font-semibold text-text-dark mb-2 text-sm">
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
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="preferredCommunication" className="block font-semibold text-text-dark mb-2 text-sm">
                Preferred Method of Communication *
              </label>
              <select
                id="preferredCommunication"
                name="preferredCommunication"
                value={formData.preferredCommunication}
                onChange={handleInputChange}
                required
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
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
          <div className="animate-fadeIn">
            <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-border">Emergency & Additional Information</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6 md:grid-cols-1">
              <div className="mb-6 md:mb-0">
                <label htmlFor="emergencyContact" className="block font-semibold text-text-dark mb-2 text-sm">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
              <div className="mb-6 md:mb-0">
                <label htmlFor="emergencyPhone" className="block font-semibold text-text-dark mb-2 text-sm">
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  required
                  className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                />
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="additionalInfo" className="block font-semibold text-text-dark mb-2 text-sm">
                Is there anything else you'd like us to know?
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={5}
                placeholder="Any additional information, concerns, or questions..."
                className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit resize-y focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-t-2 border-border md:flex-col md:items-stretch">
          {currentStep > 1 && (
            <button type="button" onClick={handleBack} className="py-3 px-8 bg-bg-light text-text-dark border-2 border-border rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-border md:w-full">
              Back
            </button>
          )}
          <div className="flex-1"></div>
          {currentStep < totalSteps ? (
            <button type="button" onClick={handleNext} className="py-3 px-8 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg md:w-full">
              Next
            </button>
          ) : (
            <button type="submit" className="py-3 px-8 bg-nature-gradient text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg md:w-full">
              Continue to Payment
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default IntakeQuestionnaire

