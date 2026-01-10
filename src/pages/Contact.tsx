import { useState } from 'react'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useToast } from '../contexts/ToastContext'

function Contact() {
  const { showSuccess, showError } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      // Save contact message to Firestore
      await addDoc(collection(db, 'contactMessages'), {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || '',
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        read: false,
        createdAt: Timestamp.now()
      })
      
      showSuccess('Thank you! Your message has been sent. We will get back to you soon.')
      setSubmitted(true)
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (error) {
      console.error('Error sending message:', error)
      showError('Failed to send message. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="bg-nature-gradient text-white py-20 px-8 md:py-16 md:px-4 text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_25%_35%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_75%_65%,rgba(255,255,255,0.08)_0%,transparent_50%)] before:pointer-events-none">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-6xl md:text-4xl font-bold mb-4 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">Contact Us</h1>
          <p className="text-2xl md:text-xl opacity-95 leading-relaxed">We're here to help. Get in touch with us today.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-20 px-8 md:py-12 md:px-4 grid grid-cols-[1fr_1.5fr] lg:grid-cols-[1fr_1.5fr] md:grid-cols-1 gap-16 md:gap-12">
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-primary/10 via-sky/10 to-nature-green/10 p-6 rounded-xl border border-primary/20">
            <h2 className="text-text-dark text-4xl md:text-3xl mb-4 font-bold">Get in Touch</h2>
            <p className="text-text-light leading-[1.8] text-lg mb-2">
              Have questions? Want to learn more about our services? We'd love to hear from you.
            </p>
            <p className="text-text-light leading-[1.8] text-lg">
              Fill out the form or reach out using the contact information below.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-white via-sky/10 to-primary/5 p-8 rounded-xl shadow-custom-lg border-2 border-primary/20 hover:border-primary transition-all duration-300 hover:shadow-custom-lg hover:-translate-y-1 group hover:bg-gradient-to-br hover:from-sky/15 hover:via-white hover:to-primary/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">✉️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-text-dark text-xl mb-2 font-semibold">Email</h3>
                  <a href="mailto:info@clearviewcounselling.co.nz" className="text-primary no-underline text-lg hover:text-primary-dark transition-colors duration-300 font-medium">
                    info@clearviewcounselling.co.nz
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white via-nature-green/10 to-secondary/5 p-8 rounded-xl shadow-custom-lg border-2 border-nature-green/20 hover:border-nature-green transition-all duration-300 hover:shadow-custom-lg hover:-translate-y-1 group hover:bg-gradient-to-br hover:from-nature-green/15 hover:via-white hover:to-secondary/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-nature-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📞</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-text-dark text-xl mb-2 font-semibold">Phone</h3>
                  <a href="tel:+15551234567" className="text-primary no-underline text-lg hover:text-primary-dark transition-colors duration-300 font-medium">
                    +1 (555) 123-4567
                  </a>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white via-earth/10 to-primary/5 p-8 rounded-xl shadow-custom-lg border-2 border-earth/20 hover:border-earth transition-all duration-300 hover:shadow-custom-lg hover:-translate-y-1 group hover:bg-gradient-to-br hover:from-earth/15 hover:via-white hover:to-primary/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-gradient flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🕒</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-text-dark text-xl mb-3 font-semibold">Business Hours</h3>
                  <div className="space-y-1">
                    <p className="text-text-light text-base">Monday - Friday: <span className="font-medium text-text-dark">9:00 AM - 6:00 PM</span></p>
                    <p className="text-text-light text-base">Saturday: <span className="font-medium text-text-dark">10:00 AM - 4:00 PM</span></p>
                    <p className="text-text-light text-base">Sunday: <span className="font-medium text-text-dark">Closed</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-white via-sky/10 to-nature-green/10 p-12 md:p-8 rounded-2xl shadow-custom-lg border border-primary/20">
          <div className="mb-8">
            <h2 className="text-text-dark text-4xl md:text-3xl mb-2 font-bold">Send us a Message</h2>
            <p className="text-text-light text-base">Fill out the form below and we'll get back to you as soon as possible.</p>
          </div>
          
          {submitted && (
            <div className="bg-gradient-to-r from-accent to-nature-green text-white p-5 rounded-xl mb-8 text-center font-semibold shadow-md animate-fadeIn">
              ✓ Thank you! Your message has been sent. We will get back to you soon.
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block font-semibold text-text-dark mb-3 text-base">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Your full name"
                className="w-full py-4 px-4 border-2 border-border rounded-xl text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_4px_rgba(91,163,208,0.1)] focus:outline-none hover:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
              <div>
                <label htmlFor="email" className="block font-semibold text-text-dark mb-3 text-base">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                  className="w-full py-4 px-4 border-2 border-border rounded-xl text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_4px_rgba(91,163,208,0.1)] focus:outline-none hover:border-primary/50"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block font-semibold text-text-dark mb-3 text-base">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                  className="w-full py-4 px-4 border-2 border-border rounded-xl text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_4px_rgba(91,163,208,0.1)] focus:outline-none hover:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block font-semibold text-text-dark mb-3 text-base">Subject *</label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full py-4 px-4 border-2 border-border rounded-xl text-base transition-all duration-300 font-inherit bg-white focus:border-primary focus:shadow-[0_0_0_4px_rgba(91,163,208,0.1)] focus:outline-none hover:border-primary/50 cursor-pointer"
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="appointment">Book Appointment</option>
                <option value="services">Services Information</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block font-semibold text-text-dark mb-3 text-base">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={7}
                required
                placeholder="Tell us how we can help you..."
                className="w-full py-4 px-4 border-2 border-border rounded-xl text-base transition-all duration-300 font-inherit resize-y bg-white focus:border-primary focus:shadow-[0_0_0_4px_rgba(91,163,208,0.1)] focus:outline-none hover:border-primary/50"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-5 px-8 bg-nature-gradient text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none shadow-md mt-2" 
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </span>
              ) : (
                'Send Message →'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Contact

