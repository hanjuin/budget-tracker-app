'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/toast'
import { Check } from 'lucide-react'
import { formatAccountName } from '@/lib/weekly-summary'
import type { Category, Account } from '@/lib/supabase/types'
import { useAppContext } from '@/lib/context/app-context'
import { fetchCategories, fetchAccounts } from '@/lib/supabase/cache'


function getDefaultAccount(cat: Category, accounts: Account[], userId: string): string | null {
  if (cat.default_account_id) {
    return accounts.find(a => a.id === cat.default_account_id)?.name ?? null
  }
  return accounts.find(a => a.type === 'personal' && a.owner_id === userId)?.name ?? null
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
  const { userId } = useAppContext()

  const [amount, setAmount] = useState(paramAmount ?? '')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(paramAccount ?? null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const [cats, accts] = await Promise.all([
        fetchCategories(supabase),
        fetchAccounts(supabase),
      ])

      setCategories(cats)
      setAccounts(accts)

      if (paramCategory) {
        const cat = cats.find((c) => c.name === paramCategory)
        if (cat) {
          setSelectedCategory(cat)
          if (!paramAccount) setSelectedAccount(getDefaultAccount(cat, accts, userId))
        }
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramCategory, paramAccount])

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat)
    if (!selectedAccount) setSelectedAccount(getDefaultAccount(cat, accounts, userId))
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

  useEffect(() => {
    if (!paramAmount || !paramCategory || !userId || categories.length === 0 || accounts.length === 0) return
    async function autoLog() {
      const cat = categories.find((c) => c.name === paramCategory)
      if (!cat) return
      const cat2 = categories.find((c) => c.name === paramCategory)
      const acctName = paramAccount ?? (cat2 ? getDefaultAccount(cat2, accounts, userId!) : null)
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
        setAmount(''); setSelectedCategory(null); setNote(''); setSaved(false)
      }, 1500)
    } else {
      toast.error('Failed to save expense')
    }
  }

  function handleNumpad(key: string) {
    if (key === 'del') { setAmount((v) => v.slice(0, -1)); return }
    if (key === '.' && amount.includes('.')) return
    if (key === '.' && amount === '') { setAmount('0.'); return }
    const parts = (amount + key).split('.')
    if (parts[1] && parts[1].length > 2) return
    setAmount((v) => v + key)
  }

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','.','0','del']

  if (paramAmount && paramCategory) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        {saved ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-accent-400" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold">Logged!</p>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">${parseFloat(paramAmount).toFixed(2)} — {paramCategory}</p>
          </div>
        ) : (
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 dark:text-zinc-400 text-sm">Logging expense…</p>
          </div>
        )}
      </div>
    )
  }

  const canSave = amount && parseFloat(amount) > 0 && selectedCategory && selectedAccount

  return (
    <div className="h-screen overflow-hidden bg-white dark:bg-zinc-950 flex flex-col safe-top">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quick Add</h1>
      </div>

      <div className="px-4 py-4 text-center">
        <div className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight min-h-[60px] flex items-center justify-center">
          {amount ? `$${amount}` : <span className="text-gray-300 dark:text-zinc-700">$0.00</span>}
        </div>
        <input
          type="text"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-2 text-sm text-gray-500 dark:text-zinc-400 bg-transparent text-center w-full outline-none placeholder-gray-300 dark:placeholder-zinc-700"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 py-2">
        <div>
          <label className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Category</label>
          <select
            value={selectedCategory?.id ?? ''}
            onChange={(e) => {
              const cat = categories.find(c => c.id === e.target.value) ?? null
              if (cat) handleCategorySelect(cat)
            }}
            className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="">Select…</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Account</label>
          <select
            value={selectedAccount ?? ''}
            onChange={(e) => setSelectedAccount(e.target.value || null)}
            className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
          >
            <option value="">Select…</option>
            {accounts.map(acct => (
              <option key={acct.id} value={acct.name}>
                {formatAccountName(acct.name)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 pb-4 mt-4">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {numpadKeys.map((key) => (
            <button
              key={key}
              onClick={() => handleNumpad(key)}
              className="h-14 rounded-2xl bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white text-xl font-semibold active:bg-gray-200 dark:active:bg-zinc-800 transition-colors flex items-center justify-center"
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
              : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}
