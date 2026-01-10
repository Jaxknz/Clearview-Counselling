interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const confirmButtonStyles = {
    info: 'bg-nature-gradient hover:-translate-y-0.5 hover:shadow-custom',
    warning: 'bg-gradient-to-br from-[#f0c97a] to-[#e89f6f] hover:-translate-y-0.5 hover:shadow-custom',
    danger: 'bg-gradient-to-br from-[#e57373] to-[#ef5350] hover:-translate-y-0.5 hover:shadow-custom',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] animate-[fadeIn_0.2s_ease]" onClick={onCancel}>
      <div className="bg-white rounded-2xl p-0 w-[90%] max-w-[500px] md:w-[95%] md:mx-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-[slideUp_0.3s_ease] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-6 md:px-5 md:py-5 border-b-2 border-border">
          <h3 className="m-0 text-text-dark text-2xl md:text-xl font-semibold">{title}</h3>
        </div>
        <div className="p-8 md:p-5">
          <p className="m-0 text-text-dark text-base leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-6 md:px-5 md:py-5 border-t-2 border-border flex flex-col-reverse md:flex-row gap-4 justify-end">
          <button
            className="px-8 py-3 md:py-3 md:w-full md:px-4 rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 border-none font-inherit bg-bg-light text-text-dark border-2 border-border hover:bg-border"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`px-8 py-3 md:py-3 md:w-full md:px-4 rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 border-none font-inherit text-white ${confirmButtonStyles[type]}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

