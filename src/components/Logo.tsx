interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  className?: string
}

function Logo({ size = 'medium', showText = true, className = '' }: LogoProps) {
  const wrapperClasses = {
    small: 'py-1 px-2 w-[150px]',
    medium: 'py-2 px-3 w-[200px]',
    large: 'py-4 px-6 bg-white rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.12)] w-[280px]',
  }

  const textOverlayClasses = {
    small: 'leading-[1.15]',
    medium: 'leading-[1.1]',
    large: 'leading-[1.05]',
  }

  const clearviewClasses = {
    small: 'text-[1.1rem] -mb-[0.15rem]',
    medium: 'text-2xl -mb-[0.2rem]',
    large: 'text-3xl -mb-[0.25rem]',
  }

  const counsellingClasses = {
    small: 'text-[0.85rem] pl-[0.7rem] -mt-[0.1rem]',
    medium: 'text-[1.15rem] pl-4 -mt-[0.15rem]',
    large: 'text-2xl pl-[1.3rem] -mt-[0.2rem]',
  }

  return (
    <div className={`inline-flex items-center justify-center select-none flex-shrink-0 w-auto max-w-full ${className}`}>
      <div className={`relative inline-block ${wrapperClasses[size]} bg-transparent whitespace-nowrap overflow-visible`}>
        {showText && (
          <div className={`relative z-[3] flex flex-col items-start ${textOverlayClasses[size]} p-0 w-full min-w-0`}
               style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" }}>
            <div className={`flex items-baseline whitespace-nowrap relative not-italic min-w-0 w-full ${clearviewClasses[size]} z-[4] font-bold tracking-[-0.02em]`}
                 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif", background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              <span className="text-[1.4em] font-bold inline-block relative leading-none align-baseline not-italic flex-shrink-0 scale-[1.4] translate-y-0 mr-[0.05em] z-[6] -mb-[0.1em] font-extrabold"
                    style={{ background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>C</span>
              <span className="text-transparent font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>learview</span>
            </div>
            <div className={`flex items-baseline whitespace-nowrap relative not-italic min-w-0 w-full ${counsellingClasses[size]} z-[3] font-semibold tracking-[-0.01em]`}
                 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif", background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              <span className="text-[1.4em] font-bold inline-block relative leading-none align-baseline not-italic flex-shrink-0 scale-[1.1] translate-y-[0.04em] mr-[0.05em] z-[4] -mt-[0.2em] font-bold"
                    style={{ background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>C</span>
              <span className="text-transparent font-semibold flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #5BA3D0 0%, #8FB88F 50%, #6AB77B 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>ounselling</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Logo
