import './About.css'

function About() {
  return (
    <div className="about-container">
      <div className="about-hero">
        <h1>About Clearview Counselling</h1>
        <p className="about-subtitle">Dedicated to your mental health and well-being</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            At Clearview Counselling, we believe that everyone deserves access to quality
            mental health care. Our mission is to provide compassionate, professional, and
            accessible counselling services that empower individuals to overcome challenges,
            achieve personal growth, and live fulfilling lives.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Approach</h2>
          <p>
            We take a holistic, client-centered approach to counselling. Every individual
            is unique, and we tailor our therapeutic methods to meet your specific needs
            and goals. Our evidence-based practices combined with genuine care and empathy
            create a safe space for healing and transformation.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h3>Compassion</h3>
              <p>We approach every client with empathy, understanding, and genuine care.</p>
            </div>
            <div className="value-item">
              <h3>Professionalism</h3>
              <p>Our team maintains the highest standards of professional conduct and ethics.</p>
            </div>
            <div className="value-item">
              <h3>Confidentiality</h3>
              <p>Your privacy and trust are paramount. All sessions are strictly confidential.</p>
            </div>
            <div className="value-item">
              <h3>Accessibility</h3>
              <p>We strive to make mental health care accessible to everyone who needs it.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <ul className="services-list">
            <li>Individual counselling sessions</li>
            <li>Mentorship and ongoing support programs</li>
            <li>Flexible online video sessions</li>
            <li>Free discovery consultations</li>
            <li>Personalized treatment plans</li>
            <li>Support for various mental health concerns</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Getting Started</h2>
          <p>
            Taking the first step towards counselling can feel overwhelming, but you don't
            have to do it alone. We offer a free 15-minute discovery call to help you
            understand our services and determine if we're the right fit for you. This
            initial consultation is completely free and comes with no obligation.
          </p>
          <p>
            Whether you're dealing with anxiety, depression, relationship issues, life
            transitions, or simply seeking personal growth, we're here to support you on
            your journey to a clearer, brighter future.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About

