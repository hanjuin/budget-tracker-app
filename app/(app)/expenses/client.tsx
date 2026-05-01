'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatMoney } from '@/lib/weekly-summary'
import { toast } from '@/components/toast'
import { format, isToday, isYesterday, isThisWeek } from 'date-fns'
import { Trash2, ChevronDown } from 'lucide-react'

interface ExpenseRow {
  id: string
  amount: number
  note: string | null
  occurred_at: string
  user_id: string
  categories: { name: string; icon: string | null } | null
  accounts: { name: string } | null
}

const PAGE_SIZE = 20

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  if (isThisWeek(d)) return format(d, 'EEE d MMM')
  return format(d, 'dd MMM yyyy')
}

function groupByDate(expenses: ExpenseRow[]): Map<string, ExpenseRow[]> {
  const map = new Map<string, ExpenseRow[]>()
  for (const exp of expenses) {
    const key = relativeDate(exp.occurred_at)
    const arr = map.get(key) ?? []
    arr.push(exp)
    map.set(key, arr)
  }
  return map
}

export function ExpensesClient() {
  const supabase = createClient()
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState<string | null>(null)
  const touchStartX = useRef<number>(0)

  const fetchExpenses = useCallback(async (off: number) => {
    const { data } = await supabase
      .from('expenses')
      .select('*, categories(name, icon), accounts(name)')
      .order('occurred_at', { ascending: false })
      .range(off, off + PAGE_SIZE - 1)

    if (data) {
      if (off === 0) {
        setExpenses(data as unknown as ExpenseRow[])
      } else {
        setExpenses((prev) => [...prev, ...(data as unknown as ExpenseRow[])])
      }
      setHasMore(data.length === PAGE_SIZE)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchExpenses(0)
  }, [fetchExpenses, supabase])

  async function deleteExpense(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete')
      fetchExpenses(0)
    } else {
      toast.success('Expense deleted')
    }
  }

  function handleTouchStart(e: React.TouchEvent, id: string) {
    touchStartX.current = e.touches[0].clientX
    setSwiping(id)
  }

  function handleTouchEnd(e: React.TouchEvent, id: string) {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (dx > 80) deleteExpense(id)
    setSwiping(null)
  }

  function loadMore() {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchExpenses(newOffset)
  }

  const grouped = groupByDate(expenses)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="safe-top pt-6 pb-4">
      <div className="px-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-0.5">Swipe left to delete</p>
      </div>

      {expenses.length === 0 ? (
        <div className="px-4 py-16 text-center text-gray-400 dark:text-zinc-600 text-sm">No expenses yet</div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([dateLabel, exps]) => (
            <div key={dateLabel}>
              <p className="px-4 text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{dateLabel}</p>
              <div className="bg-gray-50 dark:bg-zinc-900 border-y border-gray-200 dark:border-zinc-800 divide-y divide-gray-200 dark:divide-zinc-800 overflow-hidden">
                {exps.map((exp) => (
                  <div
                    key={exp.id}
                    className="relative overflow-hidden"
                    onTouchStart={(e) => handleTouchStart(e, exp.id)}
                    onTouchEnd={(e) => handleTouchEnd(e, exp.id)}
                  >
                    <div className="absolute inset-y-0 right-0 flex items-center px-6 bg-red-900">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div
                      className={`relative bg-gray-50 dark:bg-zinc-900 flex items-center justify-between px-4 py-3 transition-transform ${
                        swiping === exp.id ? '-translate-x-16' : 'translate-x-0'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-zinc-400">
                          {exp.user_id === userId ? 'Me' : 'Bv'}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">{exp.categories?.name ?? 'Other'}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">
                            {exp.accounts?.name?.replace(/_/g, ' ') ?? ''}
                            {exp.note ? ` · ${exp.note}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 dark:text-white font-medium">{formatMoney(exp.amount)}</span>
                        {exp.user_id === userId && (
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            className="text-gray-300 dark:text-zinc-600 active:text-red-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="px-4">
              <button
                onClick={loadMore}
                className="w-full py-3 flex items-center justify-center gap-2 text-gray-500 dark:text-zinc-400 text-sm bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800"
              >
                <ChevronDown className="w-4 h-4" />
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
