import { BottomNav } from '@/components/bottom-nav'
import { ToastContainer } from '@/components/toast'
import { ThemeProvider } from '@/components/theme-provider'
import { createClient } from '@/lib/supabase/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let displayName = 'HJ'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    if (profile) displayName = profile.display_name
  }

  return (
    <>
      <ThemeProvider displayName={displayName} />
      <ToastContainer />
      <main className="pb-20 min-h-screen">{children}</main>
      <BottomNav />
    </>
  )
}
