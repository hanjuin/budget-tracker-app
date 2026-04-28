export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { QuickAddClient } from './client'

export default function QuickAddPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="text-zinc-500">Loading…</div></div>}>
      <QuickAddClient />
    </Suspense>
  )
}
