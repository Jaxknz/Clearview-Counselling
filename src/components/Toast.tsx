import { useEffect } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration || 5000)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  const toastStyles = {
    success: { container: 'border-l-[#66bb6a] bg-[#f1f8f4]', text: 'text-[#2e7d32]' },
    error: { container: 'border-l-[#e57373] bg-[#fef5f5]', text: 'text-[#c2185b]' },
    warning: { container: 'border-l-[#f5d89c] bg-[#fffaf5]', text: 'text-[#8b6914]' },
    info: { container: 'border-l-primary bg-[#f0f7ff]', text: 'text-primary' },
  }

  const style = toastStyles[toast.type]

  return (
    <div className={`min-w-[300px] max-w-[500px] md:max-w-[500px] w-full md:w-auto px-5 py-4 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.15)] mb-4 animate-toastSlideIn border-l-4 bg-white ${style.container}`}>
      <div className="flex items-center justify-between gap-4">
        <span className={`flex-1 font-medium leading-relaxed ${style.text}`}>{toast.message}</span>
        <button
          className="bg-transparent border-none text-text-light text-[1.75rem] cursor-pointer p-0 w-7 h-7 flex items-center justify-center rounded transition-all duration-200 flex-shrink-0 leading-none font-light hover:bg-black/10 hover:text-text-dark hover:scale-110"
          onClick={() => onClose(toast.id)}
          aria-label="Close notification"
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default ToastItem

