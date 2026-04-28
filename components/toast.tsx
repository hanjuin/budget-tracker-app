'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
  action?: { label: string; onClick: () => void }
}

let listeners: ((toasts: ToastMessage[]) => void)[] = []
let toasts: ToastMessage[] = []

function notify(toast: Omit<ToastMessage, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toasts = [...toasts, { ...toast, id }]
  listeners.forEach((l) => l(toasts))
  // Auto-dismiss after 4s
  setTimeout(() => dismiss(id), toast.action ? 6000 : 3000)
  return id
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  listeners.forEach((l) => l(toasts))
}

export const toast = {
  success: (message: string, action?: ToastMessage['action']) =>
    notify({ message, type: 'success', action }),
  error: (message: string) => notify({ message, type: 'error' }),
}

export function ToastContainer() {
  const [msgs, setMsgs] = useState<ToastMessage[]>([])

  useEffect(() => {
    listeners.push(setMsgs)
    return () => {
      listeners = listeners.filter((l) => l !== setMsgs)
    }
  }, [])

  if (msgs.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {msgs.map((msg) => (
        <div
          key={msg.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto
            ${msg.type === 'success' ? 'bg-accent-900 border border-accent-700' : 'bg-red-900 border border-red-700'}
          `}
        >
          {msg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-accent-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-sm text-white flex-1">{msg.message}</span>
          {msg.action && (
            <button
              onClick={msg.action.onClick}
              className="text-sm font-semibold text-accent-400 underline flex-shrink-0"
            >
              {msg.action.label}
            </button>
          )}
          <button onClick={() => dismiss(msg.id)} className="text-zinc-400 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
