'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/toast'
import type { Recurring, JointExpenseConfig, Loan, Profile, Account, Category } from '@/lib/supabase/types'
import { formatAccountName } from '@/lib/weekly-summary'
import { LogOut, ToggleLeft, ToggleRight, Sun, Moon, Trash2, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDarkMode } from '@/components/theme-provider'

function getNextDueAt(frequency: 'weekly' | 'monthly'): string {
  const today = new Date()
  if (frequency === 'weekly') {
    const day = today.getDay()
    const daysUntilMonday = day === 0 ? 1 : 8 - day
    const next = new Date(today)
    next.setDate(today.getDate() + daysUntilMonday)
    return next.toISOString().split('T')[0]
  }
  return new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]
}

export function SettingsClient() {
  const supabase = createClient()
  const router = useRouter()
  const { mode, toggle } = useDarkMode()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [jointConfigs, setJointConfigs] = useState<JointExpenseConfig[]>([])
  const [loan, setLoan] = useState<Loan | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [newJoint, setNewJoint] = useState<{ name: string; weekly_amount: string; hj_split_pct: string; bev_split_pct: string } | null>(null)
  const [newRecurring, setNewRecurring] = useState<{ name: string; amount: string; frequency: 'weekly' | 'monthly'; category_id: string; account_id: string } | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: rec }, { data: jc }, { data: ln }, { data: accts }, { data: cats }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('recurring').select('*').order('name'),
        supabase.from('joint_expense_config').select('*').order('name'),
        supabase.from('loans').select('*').eq('debtor_id', user.id).maybeSingle(),
        supabase.from('accounts').select('*').order('name'),
        supabase.from('categories').select('*').order('sort_order'),
      ])

      setProfile(prof)
      setRecurring(rec ?? [])
      setJointConfigs(jc ?? [])
      setLoan(ln ?? null)
      setAccounts(accts ?? [])
      setCategories(cats ?? [])
      setLoading(false)
    }
    load()
  }, [supabase])

  async function updateProfile(field: 'weekly_income' | 'savings_target_weekly', value: string) {
    if (!profile) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    setProfile({ ...profile, [field]: num })
    const update = field === 'weekly_income' ? { weekly_income: num } : { savings_target_weekly: num }
    const { error } = await supabase.from('profiles').update(update).eq('id', profile.id)
    if (error) toast.error('Failed to update')
    else toast.success('Updated')
  }

  async function toggleRecurring(id: string, active: boolean) {
    setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active: !active } : r))
    const { error } = await supabase.from('recurring').update({ active: !active }).eq('id', id)
    if (error) {
      setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active } : r))
      toast.error('Failed to update')
    }
  }

  async function deleteRecurring(id: string) {
    setRecurring(prev => prev.filter(r => r.id !== id))
    const { error } = await supabase.from('recurring').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
      const { data } = await supabase.from('recurring').select('*').order('name')
      setRecurring(data ?? [])
    } else {
      toast.success('Deleted')
    }
  }

  async function addRecurring() {
    if (!newRecurring || !profile) return
    const amount = parseFloat(newRecurring.amount)
    if (!newRecurring.name || isNaN(amount) || !newRecurring.category_id || !newRecurring.account_id) {
      toast.error('Fill in all fields')
      return
    }
    const { data, error } = await supabase.from('recurring').insert({
      user_id: profile.id,
      name: newRecurring.name,
      amount,
      frequency: newRecurring.frequency,
      category_id: newRecurring.category_id,
      account_id: newRecurring.account_id,
      next_due_at: getNextDueAt(newRecurring.frequency),
      active: true,
    }).select().single()
    if (error) toast.error('Failed to add')
    else {
      setRecurring(prev => [...prev, data])
      setNewRecurring(null)
      toast.success('Added')
    }
  }

  async function updateJointAmount(id: string, field: 'weekly_amount' | 'hj_split_pct' | 'bev_split_pct', value: string) {
    const num = parseFloat(value)
    if (isNaN(num)) return
    setJointConfigs((prev) => prev.map((c) => c.id === id ? { ...c, [field]: num } : c))
    const update = field === 'weekly_amount' ? { weekly_amount: num }
      : field === 'hj_split_pct' ? { hj_split_pct: num }
      : { bev_split_pct: num }
    const { error } = await supabase.from('joint_expense_config').update(update).eq('id', id)
    if (error) toast.error('Failed to update')
    else toast.success('Updated')
  }

  async function deleteJointConfig(id: string) {
    setJointConfigs(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('joint_expense_config').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
      const { data } = await supabase.from('joint_expense_config').select('*').order('name')
      setJointConfigs(data ?? [])
    } else {
      toast.success('Deleted')
    }
  }

  async function addJointConfig() {
    if (!newJoint) return
    const amount = parseFloat(newJoint.weekly_amount)
    const hjPct = parseFloat(newJoint.hj_split_pct)
    const bevPct = parseFloat(newJoint.bev_split_pct)
    if (!newJoint.name || isNaN(amount) || isNaN(hjPct) || isNaN(bevPct)) {
      toast.error('Fill in all fields')
      return
    }
    const { data, error } = await supabase.from('joint_expense_config').insert({
      name: newJoint.name,
      weekly_amount: amount,
      hj_split_pct: hjPct,
      bev_split_pct: bevPct,
    }).select().single()
    if (error) toast.error('Failed to add')
    else {
      setJointConfigs(prev => [...prev, data])
      setNewJoint(null)
      toast.success('Added')
    }
  }

  async function updateLoanPrincipal(value: string) {
    if (!loan) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    const { error } = await supabase.from('loans').update({ principal: num }).eq('id', loan.id)
    if (error) toast.error('Failed to update')
    else { setLoan({ ...loan, principal: num }); toast.success('Updated') }
  }

  async function updateLoanRepayment(value: string) {
    if (!loan) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    const { error } = await supabase.from('loans').update({ weekly_repayment: num }).eq('id', loan.id)
    if (error) toast.error('Failed to update')
    else { setLoan({ ...loan, weekly_repayment: num }); toast.success('Updated') }
  }

  async function updateCategoryDefault(categoryId: string, accountId: string | null) {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, default_account_id: accountId } : c))
    const { error } = await supabase.from('categories').update({ default_account_id: accountId }).eq('id', categoryId)
    if (error) toast.error('Failed to update')
    else toast.success('Updated')
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputClass = "w-full bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
  const selectClass = "w-full bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"

  return (
    <div className="safe-top pt-6 pb-4 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <div className="flex items-center gap-3">
          <button onClick={toggle} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white">
            {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleSignOut} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Profile */}
      {profile && (
        <section>
          <h2 className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Profile</h2>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-zinc-400">Name</span>
              <span className="text-gray-900 dark:text-white font-medium">{profile.display_name}</span>
            </div>
            <div>
              <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Weekly income ($)</label>
              <input type="number" defaultValue={profile.weekly_income}
                onBlur={(e) => updateProfile('weekly_income', e.target.value)}
                className={inputClass} inputMode="decimal" />
            </div>
            <div>
              <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Savings target ($/wk)</label>
              <input type="number" defaultValue={profile.savings_target_weekly}
                onBlur={(e) => updateProfile('savings_target_weekly', e.target.value)}
                className={inputClass} inputMode="decimal" />
            </div>
          </div>
        </section>
      )}

      {/* Joint Expenses */}
      <section>
        <h2 className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Joint expenses</h2>
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
          {jointConfigs.map((cfg) => (
            <div key={cfg.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-gray-900 dark:text-white text-sm font-medium">{cfg.name}</p>
                <button onClick={() => deleteJointConfig(cfg.id)} className="text-gray-300 dark:text-zinc-600 active:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Weekly $</label>
                  <input type="number" defaultValue={cfg.weekly_amount}
                    onBlur={(e) => updateJointAmount(cfg.id, 'weekly_amount', e.target.value)}
                    className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">HJ %</label>
                  <input type="number" defaultValue={cfg.hj_split_pct}
                    onBlur={(e) => updateJointAmount(cfg.id, 'hj_split_pct', e.target.value)}
                    className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Bev %</label>
                  <input type="number" defaultValue={cfg.bev_split_pct}
                    onBlur={(e) => updateJointAmount(cfg.id, 'bev_split_pct', e.target.value)}
                    className={inputClass} inputMode="decimal" />
                </div>
              </div>
            </div>
          ))}

          {newJoint ? (
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider">New item</p>
                <button onClick={() => setNewJoint(null)} className="text-gray-400 dark:text-zinc-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input type="text" placeholder="Name"
                value={newJoint.name}
                onChange={(e) => setNewJoint({ ...newJoint, name: e.target.value })}
                className={inputClass} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Weekly $</label>
                  <input type="number" placeholder="0"
                    value={newJoint.weekly_amount}
                    onChange={(e) => setNewJoint({ ...newJoint, weekly_amount: e.target.value })}
                    className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">HJ %</label>
                  <input type="number" placeholder="50"
                    value={newJoint.hj_split_pct}
                    onChange={(e) => setNewJoint({ ...newJoint, hj_split_pct: e.target.value })}
                    className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Bev %</label>
                  <input type="number" placeholder="50"
                    value={newJoint.bev_split_pct}
                    onChange={(e) => setNewJoint({ ...newJoint, bev_split_pct: e.target.value })}
                    className={inputClass} inputMode="decimal" />
                </div>
              </div>
              <button onClick={addJointConfig}
                className="w-full py-2 bg-accent-500 text-black text-sm font-semibold rounded-xl active:bg-accent-400">
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNewJoint({ name: '', weekly_amount: '', hj_split_pct: '50', bev_split_pct: '50' })}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white w-full">
              <Plus className="w-4 h-4" />
              Add item
            </button>
          )}
        </div>
      </section>

      {/* Recurring */}
      <section>
        <h2 className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Recurring expenses</h2>
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
          {recurring.length === 0 && !newRecurring && (
            <p className="px-4 py-4 text-gray-400 dark:text-zinc-500 text-sm">No recurring expenses</p>
          )}
          {recurring.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">{r.name}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">${r.amount.toFixed(2)} / {r.frequency}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleRecurring(r.id, r.active)}>
                  {r.active
                    ? <ToggleRight className="w-7 h-7 text-accent-400" />
                    : <ToggleLeft className="w-7 h-7 text-gray-300 dark:text-zinc-600" />
                  }
                </button>
                <button onClick={() => deleteRecurring(r.id)} className="text-gray-300 dark:text-zinc-600 active:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {newRecurring ? (
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium uppercase tracking-wider">New recurring</p>
                <button onClick={() => setNewRecurring(null)} className="text-gray-400 dark:text-zinc-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input type="text" placeholder="Name"
                value={newRecurring.name}
                onChange={(e) => setNewRecurring({ ...newRecurring, name: e.target.value })}
                className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Amount ($)</label>
                  <input type="number" placeholder="0"
                    value={newRecurring.amount}
                    onChange={(e) => setNewRecurring({ ...newRecurring, amount: e.target.value })}
                    className={inputClass} inputMode="decimal" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Frequency</label>
                  <select value={newRecurring.frequency}
                    onChange={(e) => setNewRecurring({ ...newRecurring, frequency: e.target.value as 'weekly' | 'monthly' })}
                    className={selectClass}>
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Category</label>
                <select value={newRecurring.category_id}
                  onChange={(e) => setNewRecurring({ ...newRecurring, category_id: e.target.value })}
                  className={selectClass}>
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Account</label>
                <select value={newRecurring.account_id}
                  onChange={(e) => setNewRecurring({ ...newRecurring, account_id: e.target.value })}
                  className={selectClass}>
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{formatAccountName(a.name)}</option>
                  ))}
                </select>
              </div>
              <button onClick={addRecurring}
                className="w-full py-2 bg-accent-500 text-black text-sm font-semibold rounded-xl active:bg-accent-400">
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNewRecurring({ name: '', amount: '', frequency: 'monthly', category_id: '', account_id: '' })}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-zinc-400 active:text-gray-900 dark:active:text-white w-full">
              <Plus className="w-4 h-4" />
              Add recurring
            </button>
          )}
        </div>
      </section>

      {/* Quick-add defaults */}
      <section>
        <h2 className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Quick-add defaults</h2>
        <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden divide-y divide-gray-200 dark:divide-zinc-800">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-4 py-2.5">
              <p className="text-sm text-gray-900 dark:text-white w-24 shrink-0">
                {cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}
              </p>
              <select
                value={cat.default_account_id ?? ''}
                onChange={(e) => updateCategoryDefault(cat.id, e.target.value || null)}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
              >
                <option value="">Personal save</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{formatAccountName(a.name)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* BV Loan */}
      {loan && (
        <section>
          <h2 className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">BV Loan</h2>
          <div className="bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-4 space-y-3">
            <div>
              <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Principal ($)</label>
              <input type="number" defaultValue={loan.principal}
                onBlur={(e) => updateLoanPrincipal(e.target.value)}
                className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
                inputMode="decimal" />
            </div>
            <div>
              <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1">Weekly repayment ($)</label>
              <input type="number" defaultValue={loan.weekly_repayment}
                onBlur={(e) => updateLoanRepayment(e.target.value)}
                className="w-full bg-gray-100 dark:bg-zinc-800 rounded-xl px-3 py-2 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-accent-500"
                inputMode="decimal" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-zinc-400">Total repaid</span>
              <span className="text-gray-900 dark:text-white">${loan.total_repaid.toFixed(2)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
