'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/toast'
import {
  ShoppingCart, Utensils, Home, Fuel, Shield, Dumbbell,
  RefreshCw, Bot, Tv, Star, CreditCard, MoreHorizontal, Check
} from 'lucide-react'
import type { Category, Account } from '@/lib/supabase/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart, Utensils, Home, Fuel, Shield, Dumbbell,
  RefreshCw, Bot, Tv, Star, CreditCard, MoreHorizontal,
}

// Default account per category
const CATEGORY_ACCOUNT_MAP: Record<string, string> = {
  grocery: 'joint_daily',
  food: 'joint_daily',
  rent: 'joint_daily',
  petrol: 'joint_daily',
  insurance: 'joint_daily',
}

function getDefaultAccount(categoryName: string): string {
  return CATEGORY_ACCOUNT_MAP[categoryName] ?? 'hj_personal_save'
}

export function QuickAddClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const paramAmount = searchParams.get('amount')
  const paramCategory = searchParams.get('category')
  const paramAccount = searchParams.get('account')

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Form state
  const [amount, setAmount] = useState(paramAmount ?? '')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(paramAccount ?? null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [{ data: cats }, { data: accts }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order').returns<Category[]>(),
        supabase.from('accounts').select('*').order('name').returns<Account[]>(),
      ])

      if (cats) setCategories(cats)
      if (accts) setAccounts(accts)

      // Set default category from param
      if (paramCategory && cats) {
        const cat = cats.find((c) => c.name === paramCategory)
        if (cat) {
          setSelectedCategory(cat)
          if (!paramAccount) {
            setSelectedAccount(getDefaultAccount(cat.name))
          }
        }
      }
    }
    load()
  }, [paramCategory, paramAccount])

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat)
    if (!selectedAccount) {
      setSelectedAccount(getDefaultAccount(cat.name))
    }
  }

  const logExpense = useCallback(async (amt: string, cat: Category | null, acctName: string | null) => {
    if (!userId || !cat || !acctName) return false

    const account = accounts.find((a) => a.name === acctName)
    if (!account) return false

    const amountNum = parseFloat(amt)
    if (isNaN(amountNum) || amountNum <= 0) return false

    const { error } = await supabase.from('expenses').insert({
      user_id: userId,
      account_id: account.id,
      category_id: cat.id,
      amount: amountNum,
      note: note || null,
    })

    return !error
  }, [userId, accounts, note, supabase])

  // Auto-log mode: all params present
  useEffect(() => {
    if (!paramAmount || !paramCategory || !userId || categories.length === 0 || accounts.length === 0) return

    async function autoLog() {
      const cat = categories.find((c) => c.name === paramCategory)
      if (!cat) return

      const acctName = paramAccount ?? getDefaultAccount(paramCategory!)
      const ok = await logExpense(paramAmount!, cat, acctName)

      if (ok) {
        setSaved(true)
        toast.success(`Logged $${parseFloat(paramAmount!).toFixed(2)} — ${cat.name}`)
        setTimeout(() => router.push('/'), 1500)
      } else {
        toast.error('Failed to log expense')
      }
    }
    autoLog()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, categories.length, accounts.length])

  async function handleSave() {
    if (!amount || !selectedCategory || !selectedAccount) return
    setSaving(true)

    const ok = await logExpense(amount, selectedCategory, selectedAccount)

    setSaving(false)
    if (ok) {
      setSaved(true)
      toast.success(`Logged $${parseFloat(amount).toFixed(2)} — ${selectedCategory.name}`)
      setTimeout(() => {
        setAmount('')
        setSelectedCategory(null)
        setNote('')
        setSaved(false)
      }, 1500)
    } else {
      toast.error('Failed to save expense')
    }
  }

  // Numpad input
  function handleNumpad(key: string) {
    if (key === 'del') {
      setAmount((v) => v.slice(0, -1))
      return
    }
    if (key === '.' && amount.includes('.')) return
    if (key === '.' && amount === '') { setAmount('0.'); return }
    // Max 2 decimal places
    const parts = (amount + key).split('.')
    if (parts[1] && parts[1].length > 2) return
    setAmount((v) => v + key)
  }

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','.','0','del']

  // Auto-log mode: show spinner/success
  if (paramAmount && paramCategory) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        {saved ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-accent-400" />
            </div>
            <p className="text-white font-semibold">Logged!</p>
            <p className="text-zinc-400 text-sm">${parseFloat(paramAmount).toFixed(2)} — {paramCategory}</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm">Logging expense…</p>
          </div>
        )}
      </div>
    )
  }

  // Manual mode
  const canSave = amount && parseFloat(amount) > 0 && selectedCategory && selectedAccount

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-white">Quick Add</h1>
      </div>

      {/* Amount display */}
      <div className="px-4 py-4 text-center">
        <div className="text-5xl font-bold text-white tracking-tight min-h-[60px] flex items-center justify-center">
          {amount ? `$${amount}` : <span className="text-zinc-700">$0.00</span>}
        </div>
        {/* Note input */}
        <input
          type="text"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 text-sm text-zinc-400 bg-transparent text-center w-full outline-none placeholder-zinc-700"
        />
      </div>

      {/* Category chips */}
      <div className="px-4 py-2">
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Category</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = ICON_MAP[cat.icon ?? ''] ?? MoreHorizontal
            const active = selectedCategory?.id === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 active:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Account selector */}
      <div className="px-4 py-2">
        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Account</p>
        <div className="flex flex-wrap gap-2">
          {accounts.map((acct) => {
            const active = selectedAccount === acct.name
            return (
              <button
                key={acct.id}
                onClick={() => setSelectedAccount(acct.name)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/50'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 active:border-zinc-700'
                }`}
              >
                {acct.name.replace(/_/g, ' ')}
              </button>
            )
          })}
        </div>
      </div>

      {/* Numpad */}
      <div className="flex-1 flex flex-col justify-end px-4 pb-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {numpadKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              className="h-14 rounded-2xl bg-zinc-900 text-white text-xl font-semibold active:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className={`w-full py-4 rounded-2xl text-lg font-semibold transition-all ${
            canSave && !saving
              ? saved
                ? 'bg-accent-600 text-white'
                : 'bg-accent-500 text-black active:bg-accent-400'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
