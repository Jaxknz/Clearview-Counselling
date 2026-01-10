import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Clearview Counselling</h1>
          <p className="hero-subtitle">
            Your journey to clarity, growth, and well-being starts here
          </p>
          <p className="hero-description">
            We provide compassionate, professional counselling services to help you navigate
            life's challenges and achieve your personal goals. Our experienced therapists
            are here to support you every step of the way.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2>Our Services</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Free Discovery Call</h3>
              <p>
                Start with a complimentary 15-minute consultation to discuss your needs
                and see if we're a good fit for your journey.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Mentorship Program</h3>
              <p>
                Ongoing guidance and support through our comprehensive mentorship program
                designed to help you achieve long-term growth.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"></div>
              <h3>Zoom Sessions</h3>
              <p>
                Flexible video counselling sessions that fit your schedule, providing
                the same quality care from the comfort of your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="why-choose-section">
        <div className="container">
          <h2>Why Choose Clearview Counselling?</h2>
          <div className="why-grid">
            <div className="why-item">
              <h4>Experienced Professionals</h4>
              <p>Our team consists of licensed and experienced counsellors dedicated to your well-being.</p>
            </div>
            <div className="why-item">
              <h4>Personalized Approach</h4>
              <p>Every client receives a tailored treatment plan designed for their unique needs.</p>
            </div>
            <div className="why-item">
              <h4>Flexible Scheduling</h4>
              <p>We offer flexible appointment times to accommodate your busy lifestyle.</p>
            </div>
            <div className="why-item">
              <h4>Safe & Confidential</h4>
              <p>Your privacy is our priority. All sessions are confidential and secure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Ready to Begin Your Journey?</h2>
          <p>Take the first step towards a clearer, brighter future</p>
          <Link to="/signup" className="btn btn-primary btn-large">
            Sign Up Today
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home

