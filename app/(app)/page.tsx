export const dynamic = 'force-dynamic'

import { getAuthUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'
import { getWeeklySummary, getWeekStart } from '@/lib/weekly-summary'
import { startOfWeek, endOfWeek } from 'date-fns'

export default async function DashboardPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')
  const supabase = await createClient()
  const weekStart = getWeekStart()
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

  const [
    { data: profile },
    { data: jointConfigs },
    { data: recurring },
    { data: adHocExpenses },
    { data: loan },
    { data: recentExpenses },
    { data: accounts },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('joint_expense_config').select('*'),
    supabase.from('recurring').select('*').eq('active', true),
    supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('occurred_at', weekStart.toISOString())
      .lte('occurred_at', weekEnd.toISOString())
      .returns<{ amount: number }[]>(),
    supabase
      .from('loans')
      .select('*')
      .eq('debtor_id', user.id)
      .maybeSingle(),
    supabase
      .from('expenses')
      .select('*, categories(name, icon), accounts(name)')
      .order('occurred_at', { ascending: false })
      .limit(10),
    supabase.from('accounts').select('*').order('name'),
  ])

  if (!profile) redirect('/login')

  const adHocTotal = (adHocExpenses ?? []).reduce((s, e) => s + e.amount, 0)

  const summary = getWeeklySummary({
    profile,
    weekStart,
    jointExpenseConfigs: jointConfigs ?? [],
    recurringItems: recurring ?? [],
    adHocExpensesTotal: adHocTotal,
    loan: loan ?? null,
  })

  return (
    <DashboardClient
      summary={summary}
      recentExpenses={recentExpenses ?? []}
      accounts={accounts ?? []}
      loan={loan ?? null}
      profile={profile}
    />
  )
}
