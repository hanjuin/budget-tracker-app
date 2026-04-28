import { startOfWeek, endOfWeek } from 'date-fns'
import type { Profile, Loan, JointExpenseConfig, Recurring } from './supabase/types'

export interface WeeklySummary {
  userId: string
  displayName: string
  weekStart: Date
  weekEnd: Date
  income: number
  personalSavingsTarget: number
  jointShare: number
  personalRecurringWeekly: number
  adHocExpenses: number
  bvLoanRepayment: number
  leftover: number
  transferInstructions: TransferInstruction[]
  jointExpenses: JointExpenseConfig[]
}

export interface TransferInstruction {
  label: string
  account: string
  amount: number
}

// Personal savings targets (weekly)
export const SAVINGS_TARGETS: Record<string, number> = {
  HJ: 655,
  Bev: 530,
}

export function normalizeToWeekly(amount: number, frequency: 'weekly' | 'monthly'): number {
  if (frequency === 'weekly') return amount
  return (amount * 12) / 52
}

export interface WeeklySummaryInput {
  profile: Profile
  weekStart: Date
  jointExpenseConfigs: JointExpenseConfig[]
  recurringItems: Recurring[]
  adHocExpensesTotal: number
  loan: Loan | null
  jointSavingContribution?: number
}

export function getWeeklySummary(input: WeeklySummaryInput): WeeklySummary {
  const {
    profile,
    weekStart,
    jointExpenseConfigs,
    recurringItems,
    adHocExpensesTotal,
    loan,
    jointSavingContribution = 0,
  } = input

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const isHJ = profile.display_name === 'HJ'

  // Joint share: sum of (weeklyAmount * userSplitPct/100)
  const jointShare = jointExpenseConfigs.reduce((sum, cfg) => {
    const splitPct = isHJ ? cfg.hj_split_pct : cfg.bev_split_pct
    return sum + cfg.weekly_amount * (splitPct / 100)
  }, 0)

  // Personal recurring normalized to weekly (only items belonging to this user)
  const personalRecurringWeekly = recurringItems
    .filter((r) => r.active && r.user_id === profile.id)
    .reduce((sum, r) => sum + normalizeToWeekly(r.amount, r.frequency), 0)

  const personalSavingsTarget = SAVINGS_TARGETS[profile.display_name] ?? 0

  // BV loan: only HJ pays
  const bvLoanRepayment = isHJ && loan ? loan.weekly_repayment : 0

  const leftover =
    profile.weekly_income -
    personalSavingsTarget -
    jointShare -
    personalRecurringWeekly -
    adHocExpensesTotal -
    bvLoanRepayment -
    jointSavingContribution

  // Transfer instructions
  const transfers: TransferInstruction[] = [
    {
      label: 'Joint daily (shared expenses)',
      account: 'joint_daily',
      amount: jointShare,
    },
    {
      label: `Personal savings (${profile.display_name})`,
      account: isHJ ? 'hj_personal_save' : 'bev_personal_save',
      amount: personalSavingsTarget,
    },
  ]

  if (isHJ && loan) {
    transfers.push({
      label: 'BV loan repayment',
      account: 'bv_loan',
      amount: loan.weekly_repayment,
    })
  }

  if (jointSavingContribution > 0) {
    transfers.push({
      label: 'Joint savings',
      account: 'joint_saving',
      amount: jointSavingContribution,
    })
  }

  return {
    userId: profile.id,
    displayName: profile.display_name,
    weekStart,
    weekEnd,
    income: profile.weekly_income,
    personalSavingsTarget,
    jointShare,
    personalRecurringWeekly,
    adHocExpenses: adHocExpensesTotal,
    bvLoanRepayment,
    leftover,
    transferInstructions: transfers,
    jointExpenses: jointExpenseConfigs,
  }
}

export function formatMoney(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('en-NZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `$${formatted}`
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday
}
