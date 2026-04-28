-- Run this AFTER creating users in Supabase Auth and after 001/002
-- Replace a6095363-9d0d-4d02-8176-2c41e7b78d39 and a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283 with actual UUIDs from auth.users

-- Update profiles (the trigger creates them, we update with correct data)
update public.profiles set display_name = 'HJ', weekly_income = 1120 where id = 'a6095363-9d0d-4d02-8176-2c41e7b78d39';
update public.profiles set display_name = 'Bev', weekly_income = 954 where id = 'a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283';

-- Update account ownership
update public.accounts set owner_id = 'a6095363-9d0d-4d02-8176-2c41e7b78d39' where name = 'hj_personal_save';
update public.accounts set owner_id = 'a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283' where name = 'bev_personal_save';

-- Insert BV loan
insert into public.loans (debtor_id, creditor_id, principal, weekly_repayment)
values ('a6095363-9d0d-4d02-8176-2c41e7b78d39', 'a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283', 3400, 100);

-- Insert HJ recurring expenses
insert into public.recurring (user_id, account_id, category_id, name, amount, frequency, next_due_at) values
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='pilates'), 'Pilates', 48, 'weekly', current_date),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='convert'), 'Convert', 200, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='bv_loan'), (select id from categories where name='bv_loan'), 'BV Repayment', 400, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='gpt'), 'GPT', 18, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='claude'), 'Claude', 40, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='netflix'), 'Netflix', 20, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a6095363-9d0d-4d02-8176-2c41e7b78d39', (select id from accounts where name='hj_personal_save'), (select id from categories where name='disney'), 'Disney', 20, 'monthly', date_trunc('month', current_date) + interval '1 month');

-- Insert Bev recurring expenses
insert into public.recurring (user_id, account_id, category_id, name, amount, frequency, next_due_at) values
  ('a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283', (select id from accounts where name='bev_personal_save'), (select id from categories where name='pilates'), 'Pilates', 49, 'weekly', current_date),
  ('a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283', (select id from accounts where name='bev_personal_save'), (select id from categories where name='convert'), 'Convert', 250, 'monthly', date_trunc('month', current_date) + interval '1 month'),
  ('a0a4d0ea-9ee9-4c2a-8352-1b30dc78c283', (select id from accounts where name='bev_personal_save'), (select id from categories where name='gpt'), 'GPT', 18, 'monthly', date_trunc('month', current_date) + interval '1 month');

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Invite user" for hanjuin@live.com (HJ)
-- 3. Click "Invite user" for mooitinghuey@gmail.com (Bev)
-- 4. After they confirm, get their UUIDs from the users table
-- 5. Uncomment the statements above, replace the UUIDs, and run
