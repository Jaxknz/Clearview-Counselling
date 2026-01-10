import './Logo.css'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
  return (
    <div className={`logo-container logo-${size} ${className}`}>
      <div className="logo-wrapper">
        {/* Text with overlapping C's */}
        {showText && (
          <div className="logo-text-overlay">
            <div className="logo-clearview-text">
              <span className="logo-c-letter logo-c-1">C</span>
              <span className="logo-rest-of-text">learview</span>
            </div>
            <div className="logo-counselling-text">
              <span className="logo-c-letter logo-c-2">C</span>
              <span className="logo-rest-of-text">ounselling</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Logo
