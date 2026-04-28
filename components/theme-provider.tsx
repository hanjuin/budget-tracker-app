'use client'

import { useEffect } from 'react'

export function ThemeProvider({ displayName }: { displayName: string }) {
  useEffect(() => {
    if (displayName === 'Bev') {
      document.documentElement.setAttribute('data-theme', 'bev')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [displayName])

  return null
}
