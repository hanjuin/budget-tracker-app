export const dynamic = 'force-dynamic'

import { SettingsClient } from './client'
import { getAuthUser } from '@/lib/supabase/get-user'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const { data: { user } } = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    { data: profile },
    { data: recurring },
    { data: jointConfigs },
    { data: loan },
    { data: accounts },
    { data: categories },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('recurring').select('*').order('name'),
    supabase.from('joint_expense_config').select('*').order('name'),
    supabase.from('loans').select('*').eq('debtor_id', user.id).maybeSingle(),
    supabase.from('accounts').select('*').order('name'),
    supabase.from('categories').select('*').order('sort_order'),
  ])

  if (!profile) redirect('/login')

  return (
    <SettingsClient
      profile={profile}
      recurring={recurring ?? []}
      jointConfigs={jointConfigs ?? []}
      loan={loan ?? null}
      accounts={accounts ?? []}
      categories={categories ?? []}
    />
  )
}
