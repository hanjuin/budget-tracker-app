import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { addDays, addMonths, format } from 'date-fns'
import type { Database } from '@/lib/supabase/types'

// This route is called by Vercel Cron every Monday at 00:00
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  // Get all active recurring items due today or earlier
  const { data: dueItems, error } = await supabase
    .from('recurring')
    .select('*')
    .eq('active', true)
    .lte('next_due_at', todayStr)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let processed = 0
  const errors: string[] = []

  for (const item of dueItems ?? []) {
    // Create expense
    const { error: insertError } = await supabase.from('expenses').insert({
      user_id: item.user_id!,
      account_id: item.account_id,
      category_id: item.category_id,
      amount: item.amount,
      note: `Auto: ${item.name}`,
    })

    if (insertError) {
      errors.push(`${item.name}: ${insertError.message}`)
      continue
    }

    // Advance next_due_at
    const nextDue = item.frequency === 'weekly'
      ? addDays(new Date(item.next_due_at), 7)
      : addMonths(new Date(item.next_due_at), 1)

    await supabase
      .from('recurring')
      .update({ next_due_at: format(nextDue, 'yyyy-MM-dd') })
      .eq('id', item.id)

    processed++
  }

  return NextResponse.json({ processed, errors })
}
