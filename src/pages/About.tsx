function About() {
  return (
    <div className="min-h-screen bg-bg-light relative">
      <div className="bg-nature-gradient text-white py-16 px-8 md:py-12 md:px-4 text-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_85%_75%,rgba(255,255,255,0.08)_0%,transparent_50%)] before:pointer-events-none">
        <div className="relative z-10">
          <h1 className="text-5xl md:text-3xl font-bold mb-4 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">About Clearview Counselling</h1>
          <p className="text-2xl md:text-xl opacity-95">Dedicated to your mental health and well-being</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-16 px-8 md:py-8 md:px-4">
        <section className="bg-gradient-to-br from-white via-sky/10 to-primary/5 p-10 md:p-6 rounded-xl mb-8 shadow-custom border border-primary/20">
          <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-primary/30 font-bold">Our Mission</h2>
          <p className="text-text-light leading-[1.8] text-lg md:text-base mb-4">
            At Clearview Counselling, we believe that everyone deserves access to quality
            mental health care. Our mission is to provide compassionate, professional, and
            accessible counselling services that empower individuals to overcome challenges,
            achieve personal growth, and live fulfilling lives.
          </p>
        </section>

        <section className="bg-gradient-to-br from-white via-nature-green/10 to-secondary/5 p-10 md:p-6 rounded-xl mb-8 shadow-custom border border-nature-green/20">
          <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-nature-green/30 font-bold">Our Approach</h2>
          <p className="text-text-light leading-[1.8] text-lg md:text-base mb-4">
            We take a holistic, client-centered approach to counselling. Every individual
            is unique, and we tailor our therapeutic methods to meet your specific needs
            and goals. Our evidence-based practices combined with genuine care and empathy
            create a safe space for healing and transformation.
          </p>
        </section>

        <section className="bg-gradient-to-br from-white via-earth/10 to-primary/5 p-10 md:p-6 rounded-xl mb-8 shadow-custom border border-earth/20">
          <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-earth/30 font-bold">Our Values</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6 mt-6 md:grid-cols-1">
            <div className="p-6 bg-gradient-to-r from-primary/10 to-sky/10 rounded-lg border-l-4 border-primary hover:bg-gradient-to-r hover:from-primary/15 hover:to-sky/15 transition-all">
              <h3 className="text-text-dark text-xl mb-3 font-semibold">Compassion</h3>
              <p className="text-text-light text-base m-0">We approach every client with empathy, understanding, and genuine care.</p>
            </div>
            <div className="p-6 bg-gradient-to-r from-nature-green/10 to-secondary/10 rounded-lg border-l-4 border-nature-green hover:bg-gradient-to-r hover:from-nature-green/15 hover:to-secondary/15 transition-all">
              <h3 className="text-text-dark text-xl mb-3 font-semibold">Professionalism</h3>
              <p className="text-text-light text-base m-0">Our team maintains the highest standards of professional conduct and ethics.</p>
            </div>
            <div className="p-6 bg-gradient-to-r from-sky/10 to-primary/10 rounded-lg border-l-4 border-sky hover:bg-gradient-to-r hover:from-sky/15 hover:to-primary/15 transition-all">
              <h3 className="text-text-dark text-xl mb-3 font-semibold">Confidentiality</h3>
              <p className="text-text-light text-base m-0">Your privacy and trust are paramount. All sessions are strictly confidential.</p>
            </div>
            <div className="p-6 bg-gradient-to-r from-earth/10 to-nature-green/10 rounded-lg border-l-4 border-earth hover:bg-gradient-to-r hover:from-earth/15 hover:to-nature-green/15 transition-all">
              <h3 className="text-text-dark text-xl mb-3">Accessibility</h3>
              <p className="text-text-light text-base m-0">We strive to make mental health care accessible to everyone who needs it.</p>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-white via-primary/10 to-sky/10 p-10 md:p-6 rounded-xl mb-8 shadow-custom border border-primary/20">
          <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-primary/30 font-bold">What We Offer</h2>
          <ul className="list-none p-0 mt-6">
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Individual counselling sessions</li>
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Mentorship and ongoing support programs</li>
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Flexible online video sessions</li>
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Free discovery consultations</li>
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Personalized treatment plans</li>
            <li className="py-3 pl-8 relative text-text-dark text-lg md:text-base before:content-['•'] before:absolute before:left-0 before:text-accent before:font-bold before:text-xl">Support for various mental health concerns</li>
          </ul>
        </section>

        <section className="bg-gradient-to-br from-white via-nature-green/10 to-earth/10 p-10 md:p-6 rounded-xl mb-8 shadow-custom border border-nature-green/20">
          <h2 className="text-text-dark text-3xl md:text-2xl mb-6 pb-3 border-b-2 border-nature-green/30 font-bold">Getting Started</h2>
          <p className="text-text-light leading-[1.8] text-lg md:text-base mb-4">
            Taking the first step towards counselling can feel overwhelming, but you don't
            have to do it alone. We offer a free 15-minute discovery call to help you
            understand our services and determine if we're the right fit for you. This
            initial consultation is completely free and comes with no obligation.
          </p>
          <p className="text-text-light leading-[1.8] text-lg md:text-base mb-4">
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

