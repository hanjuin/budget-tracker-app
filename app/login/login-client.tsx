'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet } from 'lucide-react'

const USERS = [
  { name: 'HJ', email: 'hanjuin@live.com' },
  { name: 'Bev', email: 'mooitinghuey@gmail.com' },
]

export function LoginClient() {
  const [selected, setSelected] = useState<'HJ' | 'Bev' | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleLogin() {
    if (!selected) return
    const user = USERS.find((u) => u.name === selected)!
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">Check your email</h1>
          <p className="text-zinc-400 text-sm max-w-xs">
            We sent a magic link to{' '}
            <span className="text-white">
              {USERS.find((u) => u.name === selected)?.email}
            </span>
            . Tap it to sign in.
          </p>
          <button
            onClick={() => { setSent(false); setSelected(null) }}
            className="text-sm text-zinc-500 underline"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-accent-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <Wallet className="w-8 h-8 text-accent-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Budget</h1>
          <p className="text-zinc-400 text-sm">Who are you?</p>
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
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 active:border-zinc-700'
                }
              `}
            >
              {u.name}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={!selected || loading}
          className="w-full py-4 bg-accent-500 text-black font-semibold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed active:bg-accent-400 transition-colors text-lg"
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </div>
    </div>
  )
}
