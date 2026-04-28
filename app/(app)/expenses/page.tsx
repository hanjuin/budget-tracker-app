export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { ExpensesClient } from './client'

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Loading…</div>}>
      <ExpensesClient />
    </Suspense>
  )
}
