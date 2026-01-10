import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import './Payment.css'
import type { PlanType } from './SignUp'

interface PaymentData {
  selectedPlan: PlanType | null
  userInfo: any
  questionnaireData: any
}

function Payment() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { showSuccess, showError, showInfo } = useToast()
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'wise' | null>(null)
  const [wiseDetails, setWiseDetails] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    swiftCode: ''
  })

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin')
      return
    }

    // Retrieve data from sessionStorage and Firestore
    const selectedPlan = sessionStorage.getItem('selectedPlan') as PlanType | null
    const userInfo = sessionStorage.getItem('userInfo')
    const questionnaireData = sessionStorage.getItem('questionnaireData')

    if (!selectedPlan || !userInfo) {
      navigate('/')
      return
    }

    setPaymentData({
      selectedPlan,
      userInfo: userInfo ? JSON.parse(userInfo) : null,
      questionnaireData: questionnaireData ? JSON.parse(questionnaireData) : null
    })
  }, [navigate, currentUser])

  const getPlanPrice = (plan: PlanType | null): number => {
    switch (plan) {
      case 'discovery':
        return 0
      case 'mentorship':
        return 150 // Example price
      case 'zoom':
        return 75 // Example price per session
      default:
        return 0
    }
  }

  const getPlanName = (plan: PlanType | null): string => {
    switch (plan) {
      case 'discovery':
        return 'Free 15 min Discovery Call'
      case 'mentorship':
        return 'Mentorship Program'
      case 'zoom':
        return 'Zoom Calls'
      default:
        return ''
    }
  }

  const handleWiseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, this would send the payment details to your backend
    // which would then process the Wise payment
    showInfo('Wise payment details submitted. You will receive payment instructions via email.')
    // Here you would typically redirect to a confirmation page
  }

  const handlePaymentSuccess = async () => {
    if (!currentUser) {
      navigate('/signin')
      return
    }

    try {
      // Store payment confirmation
      sessionStorage.setItem('paymentConfirmed', 'true')
      
      // Update client data in Firestore with payment info
      if (paymentData && currentUser) {
        const clientRef = doc(db, 'clients', currentUser.uid)
        const clientDoc = await getDoc(clientRef)
        
        if (clientDoc.exists()) {
          await setDoc(clientRef, {
            paymentStatus: 'completed',
            paymentMethod: paymentMethod || 'free',
            paymentDate: new Date().toISOString()
          }, { merge: true })
        }
      }
      
      showSuccess('Payment successful! You will receive a confirmation email shortly.')
      // In a real app, you would redirect to a confirmation page
    } catch (error) {
      console.error('Error updating payment status:', error)
      showError('Payment was successful, but there was an error updating your record. Please contact support.')
    }
  }

  if (!paymentData) {
    return <div className="payment-loading">Loading...</div>
  }

  const price = getPlanPrice(paymentData.selectedPlan)
  const planName = getPlanName(paymentData.selectedPlan)

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Complete Your Registration</h1>
        <p>Review your selection and choose a payment method</p>
      </div>

      <div className="payment-content">
        <div className="payment-summary">
          <h2>Order Summary</h2>
          <div className="summary-item">
            <span className="summary-label">Plan:</span>
            <span className="summary-value">{planName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Name:</span>
            <span className="summary-value">
              {paymentData.userInfo?.firstName} {paymentData.userInfo?.lastName}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Email:</span>
            <span className="summary-value">{paymentData.userInfo?.email}</span>
          </div>
          <div className="summary-total">
            <span className="total-label">Total:</span>
            <span className="total-value">
              {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
            </span>
          </div>
        </div>

        {price === 0 ? (
          <div className="free-plan-message">
            <h3>Free Discovery Call</h3>
            <p>No payment required. Click below to complete your registration.</p>
            <button 
              onClick={handlePaymentSuccess}
              className="complete-registration-button"
            >
              Complete Registration
            </button>
          </div>
        ) : (
          <div className="payment-methods">
            <h2>Select Payment Method</h2>
            
            <div className="payment-method-tabs">
              <button
                className={`payment-tab ${paymentMethod === 'paypal' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                PayPal
              </button>
              <button
                className={`payment-tab ${paymentMethod === 'wise' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('wise')}
              >
                Wise
              </button>
            </div>

            {paymentMethod === 'paypal' && (
              <div className="payment-method-content">
                <div className="paypal-container">
                  <PayPalScriptProvider
                    options={{
                      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'YOUR_PAYPAL_CLIENT_ID',
                      currency: 'USD',
                    }}
                  >
                    <PayPalButtons
                      createOrder={(_data, actions) => {
                        return actions.order.create({
                          intent: 'CAPTURE',
                          purchase_units: [
                            {
                              description: planName,
                              amount: {
                                value: price.toString(),
                                currency_code: 'USD',
                              },
                            },
                          ],
                        })
                      }}
                      onApprove={(_data, actions) => {
                        return actions.order!.capture().then((_details) => {
                          handlePaymentSuccess()
                        })
                      }}
                      onError={(err) => {
                        console.error('PayPal error:', err)
                        showError('Payment failed. Please try again.')
                      }}
                    />
                  </PayPalScriptProvider>
                </div>
              </div>
            )}

            {paymentMethod === 'wise' && (
              <div className="payment-method-content">
                <form onSubmit={handleWiseSubmit} className="wise-form">
                  <div className="wise-info">
                    <p>
                      Please provide your bank account details for Wise transfer.
                      You will receive payment instructions via email.
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="accountName">Account Holder Name *</label>
                    <input
                      type="text"
                      id="accountName"
                      name="accountName"
                      value={wiseDetails.accountName}
                      onChange={(e) => setWiseDetails({ ...wiseDetails, accountName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="accountNumber">Account Number *</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={wiseDetails.accountNumber}
                      onChange={(e) => setWiseDetails({ ...wiseDetails, accountNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="routingNumber">Routing Number *</label>
                      <input
                        type="text"
                        id="routingNumber"
                        name="routingNumber"
                        value={wiseDetails.routingNumber}
                        onChange={(e) => setWiseDetails({ ...wiseDetails, routingNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="swiftCode">SWIFT Code *</label>
                      <input
                        type="text"
                        id="swiftCode"
                        name="swiftCode"
                        value={wiseDetails.swiftCode}
                        onChange={(e) => setWiseDetails({ ...wiseDetails, swiftCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="wise-submit-button">
                    Submit Payment Details
                  </button>
                </form>
              </div>
            )}

            {!paymentMethod && (
              <div className="payment-method-prompt">
                <p>Please select a payment method above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Payment

