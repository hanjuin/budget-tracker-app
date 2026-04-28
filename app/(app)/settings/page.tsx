export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { SettingsClient } from './client'

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Loading…</div>}>
      <SettingsClient />
    </Suspense>
  )
}
