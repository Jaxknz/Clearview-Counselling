import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gradient-to-b from-forest to-[#5A6B5A] text-white mt-auto py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.03)_0%,transparent_50%)] before:pointer-events-none">
      <div className="relative z-10 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <h3 className="text-2xl md:text-xl mb-4 text-white font-bold">Clearview Counselling</h3>
            <p className="text-white/80 leading-relaxed">Professional counselling services to help you navigate life's challenges.</p>
          </div>

          <div>
            <h4 className="text-lg mb-4 text-white">Quick Links</h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-3"><Link to="/" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">Home</Link></li>
              <li className="mb-3"><Link to="/about" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">About Us</Link></li>
              <li className="mb-3"><Link to="/contact" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">Contact Us</Link></li>
              <li className="mb-3"><Link to="/signup" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">Sign Up</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg mb-4 text-white">Legal</h4>
            <ul className="list-none p-0 m-0">
              <li className="mb-3"><Link to="/privacy-policy" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">Privacy Policy</Link></li>
              <li className="mb-3"><Link to="/terms-and-conditions" className="text-white/80 no-underline transition-colors duration-300 text-[0.95rem] hover:text-primary">Terms and Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 text-center">
          <p className="text-white/60 text-sm m-0">&copy; {new Date().getFullYear()} Clearview Counselling. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

