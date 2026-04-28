'use client'

import { formatMoney } from '@/lib/weekly-summary'
import type { WeeklySummary } from '@/lib/weekly-summary'
import type { Account, Loan, Profile } from '@/lib/supabase/types'
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardProps {
  summary: WeeklySummary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentExpenses: any[]
  accounts: Account[]
  loan: Loan | null
  profile: Profile
}

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d)) return format(d, 'EEE')
  return format(d, 'dd MMM')
}

export function DashboardClient({ summary, recentExpenses, accounts, loan, profile }: DashboardProps) {
  const isHJ = profile.display_name === 'HJ'
  const loanBalance = loan ? loan.principal - loan.total_repaid : 0
  const loanWeeksLeft = loan ? Math.ceil(loanBalance / loan.weekly_repayment) : 0
  const loanPct = loan ? Math.min(100, (loan.total_repaid / loan.principal) * 100) : 0

  const ACCOUNT_LABELS: Record<string, string> = {
    joint_daily: 'Joint Daily',
    joint_saving: 'Joint Savings',
    hj_personal_save: 'HJ Personal',
    bev_personal_save: 'Bev Personal',
    bv_loan: 'BV Loan',
  }

  return (
    <div className="px-4 safe-top pt-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-400 text-sm">Hi, {profile.display_name}</p>
          <h1 className="text-2xl font-bold text-white">Budget</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent-500/20 flex items-center justify-center">
          <span className="text-accent-400 font-bold text-sm">{profile.display_name.slice(0, 2)}</span>
        </div>
      </div>

      {/* 1. Transfer Instructions */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">This week, transfer</h2>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {summary.transferInstructions.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-accent-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white">{t.label}</p>
                  <p className="text-xs text-zinc-500">{t.account.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className="text-white font-semibold">{formatMoney(t.amount)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
            <span className="text-sm text-zinc-400 font-medium">Total transfers</span>
            <span className="text-accent-400 font-bold">
              {formatMoney(summary.transferInstructions.reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Weekly Summary */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Weekly summary</h2>
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
          {[
            { label: 'Income', value: summary.income, positive: true },
            { label: 'Personal savings', value: -summary.personalSavingsTarget, positive: false },
            { label: 'Joint share', value: -summary.jointShare, positive: false },
            { label: 'Subscriptions', value: -summary.personalRecurringWeekly, positive: false },
            { label: 'Ad hoc expenses', value: -summary.adHocExpenses, positive: false },
            ...(summary.bvLoanRepayment > 0
              ? [{ label: 'BV loan repayment', value: -summary.bvLoanRepayment, positive: false }]
              : []),
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-zinc-400">{row.label}</span>
              <span className={`text-sm font-medium ${row.positive ? 'text-white' : 'text-zinc-300'}`}>
                {row.positive ? '' : '−'}{formatMoney(Math.abs(row.value))}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50">
            <span className="text-sm font-medium text-zinc-300">Leftover spending</span>
            <span className={`font-bold text-base ${summary.leftover >= 0 ? 'text-accent-400' : 'text-red-400'}`}>
              {summary.leftover < 0 ? '−' : ''}{formatMoney(Math.abs(summary.leftover))}
              {summary.leftover >= 0
                ? <TrendingUp className="inline w-4 h-4 ml-1 mb-0.5" />
                : <TrendingDown className="inline w-4 h-4 ml-1 mb-0.5" />
              }
            </span>
          </div>
        </div>
      </section>

      {/* 3. Recent Expenses */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Recent expenses</h2>
        {recentExpenses.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 px-4 py-8 text-center text-zinc-600 text-sm">
            No expenses yet
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400">
                    {exp.user_id === profile.id ? profile.display_name.slice(0, 2) : 'Bv'}
                  </div>
                  <div>
                    <p className="text-sm text-white capitalize">{exp.categories?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-zinc-500">{relativeDate(exp.occurred_at)}</p>
                  </div>
                </div>
                <span className="text-white text-sm font-medium">{formatMoney(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. BV Loan (HJ only) */}
      {isHJ && loan && (
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">BV loan</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Principal', value: loan.principal },
                { label: 'Repaid', value: loan.total_repaid },
                { label: 'Balance', value: loanBalance },
                { label: 'Weeks left', value: null, text: `${loanWeeksLeft} wks` },
              ].map((item) => (
                <div key={item.label} className="bg-zinc-800/50 rounded-xl p-3">
                  <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                  <p className="text-white font-semibold">
                    {item.text ?? formatMoney(item.value!)}
                  </p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>Progress</span>
                <span>{loanPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all"
                  style={{ width: `${loanPct}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Account Balances */}
      <section>
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Accounts</h2>
        <div className="grid grid-cols-2 gap-2 pb-4">
          {accounts.map((acct) => (
            <div key={acct.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-3">
              <p className="text-xs text-zinc-500 mb-1">{ACCOUNT_LABELS[acct.name] ?? acct.name}</p>
              <p className={`font-semibold ${acct.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                {formatMoney(acct.balance)}
              </p>
              <p className="text-xs text-zinc-600 capitalize mt-0.5">{acct.type}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
