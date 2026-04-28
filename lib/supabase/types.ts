export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; weekly_income: number; created_at: string }
        Insert: { id: string; display_name: string; weekly_income: number; created_at?: string }
        Update: { id?: string; display_name?: string; weekly_income?: number; created_at?: string }
        Relationships: []
      }
      accounts: {
        Row: { id: string; name: string; type: 'joint' | 'personal' | 'loan'; owner_id: string | null; balance: number; created_at: string }
        Insert: { id?: string; name: string; type: 'joint' | 'personal' | 'loan'; owner_id?: string | null; balance?: number; created_at?: string }
        Update: { id?: string; name?: string; type?: 'joint' | 'personal' | 'loan'; owner_id?: string | null; balance?: number; created_at?: string }
        Relationships: []
      }
      categories: {
        Row: { id: string; name: string; icon: string | null; is_joint: boolean; sort_order: number }
        Insert: { id?: string; name: string; icon?: string | null; is_joint?: boolean; sort_order?: number }
        Update: { id?: string; name?: string; icon?: string | null; is_joint?: boolean; sort_order?: number }
        Relationships: []
      }
      expenses: {
        Row: { id: string; user_id: string; account_id: string; category_id: string; amount: number; note: string | null; occurred_at: string; created_at: string }
        Insert: { id?: string; user_id: string; account_id: string; category_id: string; amount: number; note?: string | null; occurred_at?: string; created_at?: string }
        Update: { id?: string; user_id?: string; account_id?: string; category_id?: string; amount?: number; note?: string | null; occurred_at?: string; created_at?: string }
        Relationships: []
      }
      recurring: {
        Row: { id: string; user_id: string | null; account_id: string; category_id: string; name: string; amount: number; frequency: 'weekly' | 'monthly'; active: boolean; next_due_at: string }
        Insert: { id?: string; user_id?: string | null; account_id: string; category_id: string; name: string; amount: number; frequency: 'weekly' | 'monthly'; active?: boolean; next_due_at: string }
        Update: { id?: string; user_id?: string | null; account_id?: string; category_id?: string; name?: string; amount?: number; frequency?: 'weekly' | 'monthly'; active?: boolean; next_due_at?: string }
        Relationships: []
      }
      transfers: {
        Row: { id: string; from_user_id: string; to_account_id: string; amount: number; occurred_at: string; notes: string | null }
        Insert: { id?: string; from_user_id: string; to_account_id: string; amount: number; occurred_at?: string; notes?: string | null }
        Update: { id?: string; from_user_id?: string; to_account_id?: string; amount?: number; occurred_at?: string; notes?: string | null }
        Relationships: []
      }
      loans: {
        Row: { id: string; debtor_id: string; creditor_id: string; principal: number; weekly_repayment: number; total_repaid: number; created_at: string }
        Insert: { id?: string; debtor_id: string; creditor_id: string; principal: number; weekly_repayment?: number; total_repaid?: number; created_at?: string }
        Update: { id?: string; debtor_id?: string; creditor_id?: string; principal?: number; weekly_repayment?: number; total_repaid?: number; created_at?: string }
        Relationships: []
      }
      joint_expense_config: {
        Row: { id: string; name: string; weekly_amount: number; hj_split_pct: number; bev_split_pct: number; category_id: string | null }
        Insert: { id?: string; name: string; weekly_amount: number; hj_split_pct?: number; bev_split_pct?: number; category_id?: string | null }
        Update: { id?: string; name?: string; weekly_amount?: number; hj_split_pct?: number; bev_split_pct?: number; category_id?: string | null }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Recurring = Database['public']['Tables']['recurring']['Row']
export type Transfer = Database['public']['Tables']['transfers']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type JointExpenseConfig = Database['public']['Tables']['joint_expense_config']['Row']
