import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
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
    return <div className="min-h-[calc(100vh-80px)] flex justify-center items-center p-8 bg-bg-light text-center">Loading...</div>
  }

  const price = getPlanPrice(paymentData.selectedPlan)
  const planName = getPlanName(paymentData.selectedPlan)

  return (
    <div className="min-h-[calc(100vh-80px)] p-8 md:p-4 bg-bg-light">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-3xl font-bold mb-2 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent">Complete Your Registration</h1>
        <p className="text-lg text-text-light">Review your selection and choose a payment method</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-[1fr_1.5fr] lg:grid-cols-1 gap-8 md:gap-6">
        <div className="bg-white p-8 md:p-6 rounded-2xl shadow-custom-lg">
          <h2 className="text-text-dark text-2xl md:text-xl mb-6 pb-4 border-b-2 border-border">Order Summary</h2>
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-dark text-sm">Plan:</span>
              <span className="text-text-dark">{planName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-dark text-sm">Name:</span>
              <span className="text-text-dark">
                {paymentData.userInfo?.firstName} {paymentData.userInfo?.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-text-dark text-sm">Email:</span>
              <span className="text-text-dark">{paymentData.userInfo?.email}</span>
            </div>
          </div>
          <div className="pt-4 border-t-2 border-border flex justify-between items-center">
            <span className="font-bold text-text-dark text-lg">Total:</span>
            <span className="text-primary font-bold text-xl">
              {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
            </span>
          </div>
        </div>

        {price === 0 ? (
          <div className="bg-white p-10 md:p-8 rounded-2xl shadow-custom-lg text-center">
            <h3 className="text-text-dark text-2xl md:text-xl mb-4 mt-0">Free Discovery Call</h3>
            <p className="text-text-light mb-6 text-lg">No payment required. Click below to complete your registration.</p>
            <button 
              onClick={handlePaymentSuccess}
              className="py-4 px-8 bg-nature-gradient text-white border-none rounded-lg font-semibold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg"
            >
              Complete Registration
            </button>
          </div>
        ) : (
          <div className="bg-white p-10 md:p-8 rounded-2xl shadow-custom-lg">
            <h2 className="text-text-dark text-2xl md:text-xl mb-6 pb-4 border-b-2 border-border">Select Payment Method</h2>
            
            <div className="flex gap-4 mb-8 border-b-2 border-border md:flex-col">
              <button
                className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap relative bottom-[-2px] ${
                  paymentMethod === 'paypal' 
                    ? 'text-primary border-b-primary' 
                    : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setPaymentMethod('paypal')}
              >
                PayPal
              </button>
              <button
                className={`py-4 px-6 bg-none border-none border-b-4 font-semibold text-base cursor-pointer transition-all duration-300 whitespace-nowrap relative bottom-[-2px] ${
                  paymentMethod === 'wise' 
                    ? 'text-primary border-b-primary' 
                    : 'text-text-light border-b-transparent hover:text-primary hover:bg-primary/5'
                }`}
                onClick={() => setPaymentMethod('wise')}
              >
                Wise
              </button>
            </div>

            {paymentMethod === 'paypal' && (
              <div className="mt-8">
                <div className="p-6 bg-bg-light rounded-xl border-2 border-border">
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
              <div className="mt-8">
                <form onSubmit={handleWiseSubmit} className="flex flex-col gap-6">
                  <div className="p-4 bg-bg-light rounded-lg border-l-4 border-primary">
                    <p className="text-text-dark m-0 leading-relaxed">
                      Please provide your bank account details for Wise transfer.
                      You will receive payment instructions via email.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label htmlFor="accountName" className="block font-semibold text-text-dark mb-2 text-sm">Account Holder Name *</label>
                    <input
                      type="text"
                      id="accountName"
                      name="accountName"
                      value={wiseDetails.accountName}
                      onChange={(e) => setWiseDetails({ ...wiseDetails, accountName: e.target.value })}
                      required
                      className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="accountNumber" className="block font-semibold text-text-dark mb-2 text-sm">Account Number *</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={wiseDetails.accountNumber}
                      onChange={(e) => setWiseDetails({ ...wiseDetails, accountNumber: e.target.value })}
                      required
                      className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 md:grid-cols-1">
                    <div className="mb-6 md:mb-0">
                      <label htmlFor="routingNumber" className="block font-semibold text-text-dark mb-2 text-sm">Routing Number *</label>
                      <input
                        type="text"
                        id="routingNumber"
                        name="routingNumber"
                        value={wiseDetails.routingNumber}
                        onChange={(e) => setWiseDetails({ ...wiseDetails, routingNumber: e.target.value })}
                        required
                        className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                      />
                    </div>
                    <div className="mb-6 md:mb-0">
                      <label htmlFor="swiftCode" className="block font-semibold text-text-dark mb-2 text-sm">SWIFT Code *</label>
                      <input
                        type="text"
                        id="swiftCode"
                        name="swiftCode"
                        value={wiseDetails.swiftCode}
                        onChange={(e) => setWiseDetails({ ...wiseDetails, swiftCode: e.target.value })}
                        required
                        className="w-full py-3 px-3 border-2 border-border rounded-lg text-base transition-all duration-300 font-inherit focus:border-primary focus:shadow-[0_0_0_3px_rgba(74,144,226,0.1)] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button type="submit" className="py-4 px-8 bg-nature-gradient text-white border-none rounded-lg font-semibold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg mt-4">
                    Submit Payment Details
                  </button>
                </form>
              </div>
            )}

            {!paymentMethod && (
              <div className="text-center py-12 text-text-light">
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

