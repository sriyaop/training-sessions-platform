"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDark = stored ? stored === "dark" : prefersDark
    document.documentElement.classList.toggle("dark", shouldUseDark)
    window.setTimeout(() => setDark(shouldUseDark), 0)
  }, [])

  function toggleTheme() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    window.localStorage.setItem("theme", next ? "dark" : "light")
    setDark(next)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={toggleTheme}
      title={dark ? "Use light mode" : "Use dark mode"}
      aria-label={dark ? "Use light mode" : "Use dark mode"}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
