'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/toast'
import type { Recurring, JointExpenseConfig, Loan, Profile } from '@/lib/supabase/types'
import { SAVINGS_TARGETS } from '@/lib/weekly-summary'
import { LogOut, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SettingsClient() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [jointConfigs, setJointConfigs] = useState<JointExpenseConfig[]>([])
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: rec }, { data: jc }, { data: ln }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('recurring').select('*').order('name'),
        supabase.from('joint_expense_config').select('*').order('name'),
        supabase.from('loans').select('*').eq('debtor_id', user.id).maybeSingle(),
      ])

      setProfile(prof)
      setRecurring(rec ?? [])
      setJointConfigs(jc ?? [])
      setLoan(ln ?? null)
      setLoading(false)
    }
    load()
  }, [supabase])

  async function toggleRecurring(id: string, active: boolean) {
    setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active: !active } : r))
    const { error } = await supabase.from('recurring').update({ active: !active }).eq('id', id)
    if (error) {
      setRecurring((prev) => prev.map((r) => r.id === id ? { ...r, active } : r))
      toast.error('Failed to update')
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

  async function updateLoanPrincipal(value: string) {
    if (!loan) return
    const num = parseFloat(value)
    if (isNaN(num)) return
    const { error } = await supabase.from('loans').update({ principal: num }).eq('id', loan.id)
    if (error) toast.error('Failed to update')
    else {
      setLoan({ ...loan, principal: num })
      toast.success('Loan principal updated')
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="safe-top pt-6 pb-4 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-zinc-400 active:text-white"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* Profile */}
      {profile && (
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Profile</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Name</span>
              <span className="text-white font-medium">{profile.display_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Weekly income</span>
              <span className="text-white font-medium">${profile.weekly_income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400 text-sm">Savings target</span>
              <span className="text-white font-medium">${SAVINGS_TARGETS[profile.display_name]?.toFixed(2) ?? '—'}/wk</span>
            </div>
          </div>
        </section>
      )}

      {/* Joint Expenses */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Joint expenses</h2>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {jointConfigs.map((cfg) => (
            <div key={cfg.id} className="px-4 py-3 space-y-2">
              <p className="text-white text-sm font-medium">{cfg.name}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Weekly $</label>
                  <input
                    type="number"
                    defaultValue={cfg.weekly_amount}
                    onBlur={(e) => updateJointAmount(cfg.id, 'weekly_amount', e.target.value)}
                    className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-accent-500"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">HJ %</label>
                  <input
                    type="number"
                    defaultValue={cfg.hj_split_pct}
                    onBlur={(e) => updateJointAmount(cfg.id, 'hj_split_pct', e.target.value)}
                    className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-accent-500"
                    inputMode="decimal"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Bev %</label>
                  <input
                    type="number"
                    defaultValue={cfg.bev_split_pct}
                    onBlur={(e) => updateJointAmount(cfg.id, 'bev_split_pct', e.target.value)}
                    className="w-full bg-zinc-800 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-accent-500"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recurring */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Recurring expenses</h2>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {recurring.length === 0 ? (
            <p className="px-4 py-4 text-zinc-500 text-sm">No recurring expenses</p>
          ) : (
            recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-white">{r.name}</p>
                  <p className="text-xs text-zinc-500">${r.amount.toFixed(2)} / {r.frequency}</p>
                </div>
                <button onClick={() => toggleRecurring(r.id, r.active)}>
                  {r.active
                    ? <ToggleRight className="w-7 h-7 text-accent-400" />
                    : <ToggleLeft className="w-7 h-7 text-zinc-600" />
                  }
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* BV Loan */}
      {loan && (
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">BV Loan</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Principal ($)</label>
              <input
                type="number"
                defaultValue={loan.principal}
                onBlur={(e) => updateLoanPrincipal(e.target.value)}
                className="w-full bg-zinc-800 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-accent-500"
                inputMode="decimal"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Weekly repayment</span>
              <span className="text-white">${loan.weekly_repayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total repaid</span>
              <span className="text-white">${loan.total_repaid.toFixed(2)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
