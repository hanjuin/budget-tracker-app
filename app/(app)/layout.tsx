import { BottomNav } from '@/components/bottom-nav'
import { ToastContainer } from '@/components/toast'
import { ThemeProvider } from '@/components/theme-provider'
import { PullToRefresh } from '@/components/pull-to-refresh'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { AppContextProvider } from '@/lib/context/app-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await getAuthUser()

  let displayName = 'HJ'
  let userId = ''

  if (user) {
    userId = user.id
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    if (profile) displayName = profile.display_name
  }

  return (
    <AppContextProvider userId={userId} displayName={displayName}>
      <ThemeProvider displayName={displayName} />
      <ToastContainer />
      <PullToRefresh />
      <main className="pb-20 min-h-screen">{children}</main>
      <BottomNav />
    </AppContextProvider>
  )
}
