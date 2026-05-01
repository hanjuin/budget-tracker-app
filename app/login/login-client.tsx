'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Wallet } from 'lucide-react'

const USERS = [
  { name: 'HJ', email: 'hanjuin@live.com', password: process.env.NEXT_PUBLIC_DEV_HJ_PASSWORD },
  { name: 'Bev', email: 'mooitinghuey@gmail.com', password: process.env.NEXT_PUBLIC_DEV_BEV_PASSWORD },
]

export function LoginClient() {
  const [selected, setSelected] = useState<'HJ' | 'Bev' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  async function handleSignIn() {
    if (!selected) return
    const user = USERS.find((u) => u.name === selected)!
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password ?? '',
    })

    setLoading(false)
    if (error) setError(error.message)
    else router.push('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget</h1>
          <p className="text-gray-400 dark:text-zinc-400 text-sm">Who are you?</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {USERS.map((u) => (
            <button
              key={u.name}
              onClick={() => setSelected(u.name as 'HJ' | 'Bev')}
              className={`
                py-6 rounded-2xl border-2 text-lg font-semibold transition-all
                ${selected === u.name
                  ? 'border-accent-500 bg-accent-500/10 text-accent-400'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-500 dark:text-zinc-400'
                }
              `}
            >
              {u.name}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button
          onClick={handleSignIn}
          disabled={!selected || loading}
          className="w-full py-4 bg-accent-500 text-black font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:bg-accent-400 transition-colors text-lg"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
