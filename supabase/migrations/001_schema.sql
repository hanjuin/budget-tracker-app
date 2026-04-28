-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (mirrors auth.users)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  weekly_income numeric not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles" on public.profiles
  for select using (auth.uid() is not null);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Accounts
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null check (type in ('joint', 'personal', 'loan')),
  owner_id uuid references public.profiles,
  balance numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "Users can view own and joint accounts" on public.accounts
  for select using (
    auth.uid() is not null and (
      owner_id is null or
      owner_id = auth.uid()
    )
  );

create policy "Users can update own and joint accounts" on public.accounts
  for update using (
    auth.uid() is not null and (
      owner_id is null or
      owner_id = auth.uid()
    )
  );

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text,
  is_joint boolean default false,
  sort_order int default 0
);

alter table public.categories enable row level security;

create policy "All authenticated users can view categories" on public.categories
  for select using (auth.uid() is not null);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  account_id uuid references public.accounts not null,
  category_id uuid references public.categories not null,
  amount numeric not null check (amount > 0),
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view own and joint expenses" on public.expenses
  for select using (
    auth.uid() is not null and (
      user_id = auth.uid() or
      account_id in (select id from public.accounts where owner_id is null)
    )
  );

create policy "Users can insert own expenses" on public.expenses
  for insert with check (user_id = auth.uid());

create policy "Users can delete own expenses" on public.expenses
  for delete using (user_id = auth.uid());

-- Recurring
create table public.recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles,
  account_id uuid references public.accounts not null,
  category_id uuid references public.categories not null,
  name text not null,
  amount numeric not null,
  frequency text not null check (frequency in ('weekly', 'monthly')),
  active boolean default true,
  next_due_at date not null
);

alter table public.recurring enable row level security;

create policy "Users can view own and joint recurring" on public.recurring
  for select using (
    auth.uid() is not null and (
      user_id = auth.uid() or user_id is null
    )
  );

create policy "Users can update own recurring" on public.recurring
  for update using (
    auth.uid() is not null and (
      user_id = auth.uid() or user_id is null
    )
  );

-- Transfers
create table public.transfers (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references public.profiles not null,
  to_account_id uuid references public.accounts not null,
  amount numeric not null,
  occurred_at timestamptz not null default now(),
  notes text
);

alter table public.transfers enable row level security;

create policy "Users can view own transfers" on public.transfers
  for select using (from_user_id = auth.uid());

create policy "Users can insert own transfers" on public.transfers
  for insert with check (from_user_id = auth.uid());

-- Loans
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  debtor_id uuid references public.profiles not null,
  creditor_id uuid references public.profiles not null,
  principal numeric not null,
  weekly_repayment numeric not null default 100,
  total_repaid numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.loans enable row level security;

create policy "Loan parties can view loans" on public.loans
  for select using (debtor_id = auth.uid() or creditor_id = auth.uid());

create policy "Debtor can update loans" on public.loans
  for update using (debtor_id = auth.uid());

-- Joint expense config (editable split rules)
create table public.joint_expense_config (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  weekly_amount numeric not null,
  hj_split_pct numeric not null default 50,
  bev_split_pct numeric not null default 50,
  category_id uuid references public.categories
);

alter table public.joint_expense_config enable row level security;

create policy "All authenticated users can view joint config" on public.joint_expense_config
  for select using (auth.uid() is not null);

create policy "All authenticated users can update joint config" on public.joint_expense_config
  for update using (auth.uid() is not null);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, weekly_income)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'User'),
    coalesce((new.raw_user_meta_data->>'weekly_income')::numeric, 0)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
