import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'info', onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  const color = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-slate-800'

  return (
    <div className={`fixed left-1/2 -translate-x-1/2 bottom-6 z-[100] text-white px-4 py-2 rounded-lg shadow-xl ${color} animate-[fadeIn_150ms_ease-out]`}>
      <span className="text-sm font-semibold">{message}</span>
    </div>
  )
}

// tailwind keyframes not required; simple appearance handled by default


