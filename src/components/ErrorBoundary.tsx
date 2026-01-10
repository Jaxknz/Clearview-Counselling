import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred'
      
      // Check if it's a Firebase configuration error
      if (errorMessage.includes('Firebase') || errorMessage.includes('Missing')) {
        return (
          <div className="min-h-screen flex justify-center items-center p-8 bg-bg-light">
            <div className="max-w-3xl bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
              <h1 className="text-[#c33] text-3xl md:text-2xl mb-4 font-bold">Firebase Configuration Error</h1>
              <p className="text-text-dark text-lg md:text-base mb-8 p-4 bg-[#fee] rounded-lg border-l-4 border-[#c33]">{errorMessage}</p>
              <div className="bg-bg-light p-8 md:p-6 rounded-xl my-8">
                <h2 className="text-text-dark text-2xl md:text-xl mb-4 font-semibold">To fix this issue:</h2>
                <ol className="text-text-dark leading-[1.8] ml-6 list-decimal">
                  <li className="mb-4">
                    Create a <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">.env</code> file in the root directory of your project
                  </li>
                  <li className="mb-4">
                    Add your Firebase configuration:
                    <pre className="bg-[#2c3e50] text-[#ecf0f1] p-4 rounded-lg overflow-x-auto my-4 text-sm leading-relaxed font-mono">{`
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
                    `}</pre>
                  </li>
                  <li className="mb-4">
                    Restart your development server (stop and run <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">npm run dev</code> again)
                  </li>
                  <li className="mb-4">
                    Make sure the file is named exactly <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">.env</code> (not <code className="bg-white py-1 px-2 rounded font-mono text-sm border border-border">.env.development</code> unless you want to use that specifically)
                  </li>
                </ol>
                <p className="text-text-dark">
                  <strong>Note:</strong> You can get your Firebase configuration from{' '}
                  <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary no-underline font-semibold hover:underline">
                    Firebase Console
                  </a>
                  {' '}→ Project Settings → General → Your apps
                </p>
              </div>
              <button onClick={() => window.location.reload()} className="py-4 px-8 bg-nature-gradient text-white border-none rounded-lg text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg">
                Reload Page
              </button>
            </div>
          </div>
        )
      }

      // Generic error
      return (
        <div className="min-h-screen flex justify-center items-center p-8 bg-bg-light">
          <div className="max-w-3xl bg-white p-12 md:p-8 rounded-2xl shadow-custom-lg">
            <h1 className="text-[#c33] text-3xl md:text-2xl mb-4 font-bold">Something went wrong</h1>
            <p className="text-text-dark text-lg md:text-base mb-8 p-4 bg-[#fee] rounded-lg border-l-4 border-[#c33]">{errorMessage}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="py-4 px-8 bg-nature-gradient text-white border-none rounded-lg text-lg font-semibold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-custom-lg">
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

