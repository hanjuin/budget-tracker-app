'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 80

export function PullToRefresh() {
  const router = useRouter()
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const active = useRef(false)

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY
        active.current = true
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0) setDistance(Math.min(delta, THRESHOLD + 20))
    }

    const onTouchEnd = async (e: TouchEvent) => {
      if (!active.current) return
      active.current = false
      const delta = e.changedTouches[0].clientY - startY.current
      setDistance(0)
      startY.current = 0
      if (delta >= THRESHOLD && !refreshing) {
        setRefreshing(true)
        router.refresh()
        setTimeout(() => setRefreshing(false), 1000)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [router, refreshing])

  const visible = distance > 10 || refreshing
  const progress = Math.min(distance / THRESHOLD, 1)

  if (!visible) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center z-50 pointer-events-none transition-all"
      style={{ paddingTop: refreshing ? 12 : Math.max(4, distance * 0.15) }}
    >
      <div
        className={`w-8 h-8 border-2 border-accent-500 rounded-full ${refreshing ? 'animate-spin border-t-transparent' : ''}`}
        style={!refreshing ? {
          borderTopColor: 'transparent',
          transform: `rotate(${progress * 270}deg)`,
          opacity: progress,
        } : {}}
      />
    </div>
  )
}
