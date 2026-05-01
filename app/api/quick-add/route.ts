import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const TOKEN_TO_EMAIL: Record<string, string> = {
  [process.env.QUICK_ADD_TOKEN_HJ!]: 'hanjuin@live.com',
  [process.env.QUICK_ADD_TOKEN_BEV!]: 'mooitinghuey@gmail.com',
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const token = searchParams.get('token')
  const amount = parseFloat(searchParams.get('amount') ?? '')
  const categoryName = searchParams.get('category')
  const accountName = searchParams.get('account')
  const note = searchParams.get('note')

  if (!token || !TOKEN_TO_EMAIL[token])
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!categoryName || isNaN(amount) || amount <= 0)
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const email = TOKEN_TO_EMAIL[token]

  // Resolve user profile ID via auth.users (profiles has no email column)
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const authUser = users.find((u) => u.email === email)
  if (!authUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authUser.id)
    .single()
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Resolve category
  const { data: category } = await supabase
    .from('categories')
    .select('id, default_account_id')
    .eq('name', categoryName)
    .single()
  if (!category) return NextResponse.json({ error: `Category "${categoryName}" not found` }, { status: 404 })

  // Resolve account (explicit > category default)
  let accountId: string | null = category.default_account_id ?? null
  if (accountName) {
    const { data: account } = await supabase
      .from('accounts')
      .select('id')
      .eq('name', accountName)
      .single()
    if (account) accountId = account.id
  }
  if (!accountId) return NextResponse.json({ error: 'No account resolved' }, { status: 400 })

  const { error } = await supabase.from('expenses').insert({
    user_id: profile.id,
    account_id: accountId,
    category_id: category.id,
    amount,
    note: note ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, amount, category: categoryName })
}
