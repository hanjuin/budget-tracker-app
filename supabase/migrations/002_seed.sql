-- NOTE: Run this AFTER creating the two users in Supabase Auth dashboard
-- Replace the UUIDs below with the actual auth user IDs after creating them
-- The trigger will auto-create profiles, but we need to update them with correct data

-- Categories
insert into public.categories (name, icon, is_joint, sort_order) values
  ('grocery',    'ShoppingCart',  true,  1),
  ('food',       'Utensils',      true,  2),
  ('rent',       'Home',          true,  3),
  ('petrol',     'Fuel',          true,  4),
  ('insurance',  'Shield',        true,  5),
  ('pilates',    'Dumbbell',      false, 6),
  ('convert',    'RefreshCw',     false, 7),
  ('gpt',        'Bot',           false, 8),
  ('claude',     'Bot',           false, 9),
  ('netflix',    'Tv',            false, 10),
  ('disney',     'Star',          false, 11),
  ('bv_loan',    'CreditCard',    false, 12),
  ('other',      'MoreHorizontal',false, 99)
on conflict (name) do nothing;

-- Accounts (will need owner_id updated after user creation)
insert into public.accounts (name, type, owner_id, balance) values
  ('joint_daily',       'joint',    null, 0),
  ('joint_saving',      'joint',    null, 0),
  ('hj_personal_save',  'personal', null, 0),
  ('bev_personal_save', 'personal', null, 0),
  ('bv_loan',           'loan',     null, 0)
on conflict (name) do nothing;

-- Joint expense config
insert into public.joint_expense_config (name, weekly_amount, hj_split_pct, bev_split_pct, category_id) values
  ('Grocery',        100.00, 50, 50, (select id from public.categories where name = 'grocery')),
  ('Food / Eating Out', 150.00, 50, 50, (select id from public.categories where name = 'food')),
  ('Rent',           550.00, 50, 50, (select id from public.categories where name = 'rent')),
  ('Petrol',          67.50, 50, 50, (select id from public.categories where name = 'petrol')),
  ('Car Insurance',   17.50, 50, 50, (select id from public.categories where name = 'insurance'))
on conflict (name) do nothing;
