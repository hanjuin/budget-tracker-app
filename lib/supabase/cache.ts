import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import type { Category, Account } from './types'

const TTL_MS = 5 * 60 * 1000

let categoriesCache: { data: Category[]; fetchedAt: number } | null = null
let accountsCache: { data: Account[]; fetchedAt: number } | null = null

export async function fetchCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  if (categoriesCache && Date.now() - categoriesCache.fetchedAt < TTL_MS) {
    return categoriesCache.data
  }
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  const result: Category[] = data ?? []
  categoriesCache = { data: result, fetchedAt: Date.now() }
  return result
}

export async function fetchAccounts(supabase: SupabaseClient<Database>): Promise<Account[]> {
  if (accountsCache && Date.now() - accountsCache.fetchedAt < TTL_MS) {
    return accountsCache.data
  }
  const { data } = await supabase.from('accounts').select('*').order('name')
  const result: Account[] = data ?? []
  accountsCache = { data: result, fetchedAt: Date.now() }
  return result
}

export function invalidateCategories(): void {
  categoriesCache = null
}
