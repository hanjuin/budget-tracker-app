'use client'

import { useEffect, useState } from 'react'

export function ThemeProvider({ displayName }: { displayName: string }) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  // Apply user color theme
  useEffect(() => {
    if (displayName === 'Bev') {
      document.documentElement.setAttribute('data-theme', 'bev')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [displayName])

  // Load saved mode preference, fall back to system
  useEffect(() => {
    const saved = localStorage.getItem('color-mode') as 'dark' | 'light' | null
    if (saved) {
      setMode(saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setMode(prefersDark ? 'dark' : 'light')
    }
  }, [])

  // Apply dark class to <html>
  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [mode])

  return null
}

export function useDarkMode() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('color-mode') as 'dark' | 'light' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setMode(saved ?? (prefersDark ? 'dark' : 'light'))
  }, [])

  function toggle() {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('color-mode', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return { mode, toggle }
}
