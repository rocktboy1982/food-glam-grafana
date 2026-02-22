import { useState, createContext, useContext, ReactNode } from 'react'

type ToastVariant = 'default' | 'destructive'

interface Toast {
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextType {
  toast: (toast: Toast) => void
  toasts: Toast[]
  dismissToast: (index: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (newToast: Toast) => {
    setToasts(prev => [...prev, newToast])
    setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
  }

  const dismissToast = (index: number) => {
    setToasts(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, dismissToast }}>
      {children}
      {toasts.map((t, i) => (
        <div
          key={i}
          className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
            t.variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white text-black border'
          }`}
        >
          <div className="font-semibold">{t.title}</div>
          {t.description && <div className="text-sm mt-1">{t.description}</div>}
        </div>
      ))}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    // Return a no-op fallback when used outside ToastProvider
    return {
      toast: () => {},
      toasts: [] as Toast[],
      dismissToast: () => {},
    } satisfies ToastContextType
  }
  return context
}
