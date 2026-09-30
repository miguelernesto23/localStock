"use client"

import React, { useEffect, useState, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark" | "system"

type ThemeContextProps = {
  theme: Theme
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextProps | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme") as Theme | null
      if (stored) setTheme(stored)
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement

    const apply = (t: Theme) => {
      if (t === "system") {
        const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) root.classList.add("dark")
        else root.classList.remove("dark")
      } else if (t === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }

    apply(theme)

    try {
      localStorage.setItem("theme", theme)
    } catch (e) {
      // ignore
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if (theme === "system") apply("system")
    }
    if (mq.addEventListener) mq.addEventListener("change", handler)
    else mq.addListener(handler)

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler)
      else mq.removeListener(handler)
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={() => setTheme(next as Theme)}
      aria-label={`Set theme to ${next}`}
    >
      {theme === "light" ? "☀️" : theme === "dark" ? "🌙" : "🖥️"}
    </Button>
  )
}

export default ThemeProvider
