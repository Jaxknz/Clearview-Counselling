import React, { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

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
          <div className="error-boundary">
            <div className="error-content">
              <h1>Firebase Configuration Error</h1>
              <p>{errorMessage}</p>
              <div className="error-instructions">
                <h2>To fix this issue:</h2>
                <ol>
                  <li>
                    Create a <code>.env</code> file in the root directory of your project
                  </li>
                  <li>
                    Add your Firebase configuration:
                    <pre>{`
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
                    `}</pre>
                  </li>
                  <li>
                    Restart your development server (stop and run <code>npm run dev</code> again)
                  </li>
                  <li>
                    Make sure the file is named exactly <code>.env</code> (not <code>.env.development</code> unless you want to use that specifically)
                  </li>
                </ol>
                <p>
                  <strong>Note:</strong> You can get your Firebase configuration from{' '}
                  <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
                    Firebase Console
                  </a>
                  {' '}→ Project Settings → General → Your apps
                </p>
              </div>
              <button onClick={() => window.location.reload()}>
                Reload Page
              </button>
            </div>
          </div>
        )
      }

      // Generic error
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>Something went wrong</h1>
            <p>{errorMessage}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}>
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

