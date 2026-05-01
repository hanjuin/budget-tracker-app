-- Add savings target per user (was hardcoded in code as SAVINGS_TARGETS constant)
ALTER TABLE profiles ADD COLUMN savings_target_weekly numeric not null default 0;
UPDATE profiles SET savings_target_weekly = 655 WHERE display_name = 'HJ';
UPDATE profiles SET savings_target_weekly = 530 WHERE display_name = 'Bev';

-- Add default account per category for quick-add (was hardcoded CATEGORY_ACCOUNT_MAP)
ALTER TABLE categories ADD COLUMN default_account_id uuid references accounts(id);
UPDATE categories SET default_account_id = (SELECT id FROM accounts WHERE name = 'joint_daily')
  WHERE name IN ('grocery', 'food', 'rent', 'petrol', 'insurance');
