import { useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'

interface ToastProps {
  message: string
  visible: boolean
  onDismiss: () => void
  duration?: number
}

export function Toast({
  message,
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(onDismiss, duration)
    return () => clearTimeout(t)
  }, [visible, duration, onDismiss])

  if (!visible) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-lg border border-slate-200 bg-surface px-4 py-3 shadow-lg transition-all duration-200"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
      <span className="text-sm font-medium text-text">{message}</span>
    </div>
  )
}
