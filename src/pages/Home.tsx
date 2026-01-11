import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen">
      <section className="bg-nature-gradient text-white py-24 px-4 sm:px-6 lg:px-8 md:py-20 lg:py-24 text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,0.08)_0%,transparent_50%)] before:pointer-events-none">
        <div className="max-w-3xl mx-auto relative z-10 px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl md:text-5xl font-bold mb-4 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">Welcome to Clearview Counselling</h1>
          <p className="text-xl sm:text-2xl lg:text-2xl md:text-2xl mb-6 opacity-95">
            Your journey to clarity, growth, and well-being starts here
          </p>
          <p className="text-base sm:text-lg lg:text-lg leading-relaxed mb-10 opacity-90 px-2 sm:px-0">
            We provide compassionate, professional counselling services to help you navigate
            life's challenges and achieve your personal goals. Our experienced therapists
            are here to support you every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap">
            <Link to="/signup" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-lg no-underline font-semibold text-base sm:text-lg transition-all duration-300 inline-block bg-white text-primary shadow-[0_4px_12px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,255,255,0.4)] hover:bg-white/95">
              Get Started
            </Link>
            <Link to="/about" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 rounded-lg no-underline font-semibold text-base sm:text-lg transition-all duration-300 inline-block bg-transparent text-white border-2 border-white/90 backdrop-blur-[10px] hover:bg-white/20 hover:border-white hover:-translate-y-0.5">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-sky/10 to-nature-green/10 relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-48 before:bg-gradient-to-b before:from-transparent before:to-[rgba(175,214,241,0.2)] before:pointer-events-none">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-center text-3xl sm:text-4xl lg:text-4xl text-text-dark mb-8 sm:mb-12 font-bold">Our Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-white via-sky/10 to-nature-green/5 p-6 sm:p-8 lg:p-10 rounded-xl text-center transition-all duration-300 border-2 border-primary/20 hover:-translate-y-1 hover:shadow-custom-lg hover:border-primary hover:bg-gradient-to-br hover:from-sky/15 hover:via-white hover:to-nature-green/10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-sky-gradient flex items-center justify-center relative shadow-[0_4px_12px_rgba(91,163,208,0.2)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_6px_16px_rgba(91,163,208,0.3)] before:content-[''] before:absolute before:w-[48px] sm:before:w-[60px] before:h-[48px] sm:before:h-[60px] before:rounded-full before:bg-earth-gradient before:opacity-30 before:animate-pulse after:content-[''] after:absolute after:w-8 sm:after:w-10 after:h-8 sm:after:h-10 after:rounded-full after:bg-white after:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"></div>
              <h3 className="text-xl sm:text-2xl lg:text-2xl text-text-dark mb-3 sm:mb-4">Free Discovery Call</h3>
              <p className="text-text-light leading-relaxed">
                Start with a complimentary 15-minute consultation to discuss your needs
                and see if we're a good fit for your journey.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white via-nature-green/10 to-secondary/5 p-10 md:p-6 rounded-xl text-center transition-all duration-300 border-2 border-nature-green/20 hover:-translate-y-1 hover:shadow-custom-lg hover:border-nature-green hover:bg-gradient-to-br hover:from-nature-green/15 hover:via-white hover:to-secondary/10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sky-gradient flex items-center justify-center relative shadow-[0_4px_12px_rgba(91,163,208,0.2)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_6px_16px_rgba(91,163,208,0.3)] before:content-[''] before:absolute before:w-[60px] before:h-[60px] before:rounded-full before:bg-earth-gradient before:opacity-30 before:animate-pulse after:content-[''] after:absolute after:w-10 after:h-10 after:rounded-full after:bg-white after:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"></div>
              <h3 className="text-2xl md:text-xl text-text-dark mb-4 font-semibold">Mentorship Program</h3>
              <p className="text-text-light leading-relaxed">
                Ongoing guidance and support through our comprehensive mentorship program
                designed to help you achieve long-term growth.
              </p>
            </div>
            <div className="bg-gradient-to-br from-white via-primary/10 to-sky/10 p-10 md:p-6 rounded-xl text-center transition-all duration-300 border-2 border-primary/20 hover:-translate-y-1 hover:shadow-custom-lg hover:border-primary hover:bg-gradient-to-br hover:from-primary/15 hover:via-white hover:to-sky/15">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sky-gradient flex items-center justify-center relative shadow-[0_4px_12px_rgba(91,163,208,0.2)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_6px_16px_rgba(91,163,208,0.3)] before:content-[''] before:absolute before:w-[60px] before:h-[60px] before:rounded-full before:bg-earth-gradient before:opacity-30 before:animate-pulse after:content-[''] after:absolute after:w-10 after:h-10 after:rounded-full after:bg-white after:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"></div>
              <h3 className="text-2xl md:text-xl text-text-dark mb-4">Zoom Sessions</h3>
              <p className="text-text-light leading-relaxed">
                Flexible video counselling sessions that fit your schedule, providing
                the same quality care from the comfort of your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-light via-white to-primary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl lg:text-4xl text-text-dark mb-8 sm:mb-12 font-bold">Why Choose Clearview Counselling?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-gradient-to-br from-white via-sky/10 to-nature-green/5 p-8 md:p-6 rounded-xl border-l-4 border-primary transition-all duration-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-sky-gradient before:opacity-0 before:transition-opacity before:duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(91,163,208,0.25)] hover:before:opacity-100 hover:bg-gradient-to-br hover:from-sky/15 hover:via-white hover:to-nature-green/10">
              <h4 className="text-xl text-text-dark mb-3">Experienced Professionals</h4>
              <p className="text-text-light leading-relaxed">Our team consists of licensed and experienced counsellors dedicated to your well-being.</p>
            </div>
            <div className="bg-gradient-to-br from-white via-nature-green/10 to-secondary/5 p-8 md:p-6 rounded-xl border-l-4 border-nature-green transition-all duration-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-nature-gradient before:opacity-0 before:transition-opacity before:duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(107,183,123,0.25)] hover:before:opacity-100 hover:bg-gradient-to-br hover:from-nature-green/15 hover:via-white hover:to-secondary/10">
              <h4 className="text-xl text-text-dark mb-3 font-semibold">Personalized Approach</h4>
              <p className="text-text-light leading-relaxed">Every client receives a tailored treatment plan designed for their unique needs.</p>
            </div>
            <div className="bg-gradient-to-br from-white via-earth/10 to-primary/5 p-8 md:p-6 rounded-xl border-l-4 border-earth transition-all duration-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-earth-gradient before:opacity-0 before:transition-opacity before:duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(184,159,122,0.25)] hover:before:opacity-100 hover:bg-gradient-to-br hover:from-earth/15 hover:via-white hover:to-primary/10">
              <h4 className="text-xl text-text-dark mb-3 font-semibold">Flexible Scheduling</h4>
              <p className="text-text-light leading-relaxed">We offer flexible appointment times to accommodate your busy lifestyle.</p>
            </div>
            <div className="bg-gradient-to-br from-white via-primary/10 to-sky/10 p-8 md:p-6 rounded-xl border-l-4 border-primary transition-all duration-300 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-sky-gradient before:opacity-0 before:transition-opacity before:duration-300 hover:translate-x-1 hover:shadow-[0_4px_12px_rgba(91,163,208,0.25)] hover:before:opacity-100 hover:bg-gradient-to-br hover:from-primary/15 hover:via-white hover:to-sky/15">
              <h4 className="text-xl text-text-dark mb-3">Safe & Confidential</h4>
              <p className="text-text-light leading-relaxed">Your privacy is our priority. All sessions are confidential and secure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-earth-gradient text-white text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.08)_0%,transparent_50%)] before:pointer-events-none">
        <div className="max-w-6xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-4xl mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-lg sm:text-xl lg:text-xl mb-6 sm:mb-8 opacity-95 px-4">Take the first step towards a clearer, brighter future</p>
          <Link to="/signup" className="px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-lg no-underline font-semibold text-base sm:text-lg lg:text-xl transition-all duration-300 inline-block bg-white text-primary shadow-[0_4px_12px_rgba(255,255,255,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,255,255,0.4)] hover:bg-white/95">
            Sign Up Today
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home

