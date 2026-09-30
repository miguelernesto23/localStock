"use client"

import * as React from "react"

type Toast = {
  id: string
  title: string
  description?: string
  variant?: "success" | "error" | "info"
}

const ToastContext = React.createContext<{
  push: (t: Omit<Toast, "id">) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const push = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2, 9)
    const toast: Toast = { id, ...t }
    setToasts((s) => [toast, ...s])
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}

      <div aria-live="polite" className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm rounded-md border p-3 shadow-sm animate-in fade-in-0 ${
              t.variant === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : t.variant === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-background border-border text-foreground"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description && <div className="text-sm">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return {
    success: (title: string, description?: string) => ctx.push({ title, description, variant: "success" }),
    error: (title: string, description?: string) => ctx.push({ title, description, variant: "error" }),
    info: (title: string, description?: string) => ctx.push({ title, description, variant: "info" }),
  }
}

export default ToastProvider
