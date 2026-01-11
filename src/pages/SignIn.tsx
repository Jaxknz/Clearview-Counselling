import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signin } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      setLoading(true)
      await signin(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex justify-center items-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-bg-light via-sky/10 to-nature-green/10">
      <div className="bg-gradient-to-br from-white via-primary/10 to-sky/10 p-6 sm:p-8 lg:p-12 rounded-2xl shadow-custom-lg w-full max-w-[450px] border border-primary/20">
        <h1 className="text-text-dark text-2xl sm:text-3xl lg:text-3xl mb-2 text-center bg-nature-gradient bg-clip-text text-transparent font-bold">Sign In</h1>
        <p className="text-center text-text-light mb-6 sm:mb-8 text-sm sm:text-base">Welcome back to Clearview Counselling</p>
        
        {error && <div className="bg-[#fee] text-[#c33] py-2 sm:py-3 px-3 rounded-lg mb-4 sm:mb-6 text-center text-xs sm:text-sm">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 sm:mb-6">
            <label htmlFor="email" className="block font-semibold text-text-dark mb-2 text-xs sm:text-sm">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="w-full py-2.5 sm:py-3 px-3 border-2 border-border rounded-lg text-sm sm:text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(91,163,208,0.15)] focus:outline-none"
            />
          </div>

          <div className="mb-4 sm:mb-6">
            <label htmlFor="password" className="block font-semibold text-text-dark mb-2 text-xs sm:text-sm">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full py-2.5 sm:py-3 px-3 border-2 border-border rounded-lg text-sm sm:text-base transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_3px_rgba(91,163,208,0.15)] focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 sm:py-4 px-4 bg-nature-gradient text-white text-base sm:text-lg font-semibold rounded-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-custom-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-text-light text-xs sm:text-sm my-2">
            Don't have an account? <Link to="/signup" className="text-primary no-underline font-semibold hover:underline">Sign up here</Link>
          </p>
          <p className="text-xs sm:text-sm text-text-light mt-3 sm:mt-4 italic">
            Admin users can sign in here with their credentials
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn

