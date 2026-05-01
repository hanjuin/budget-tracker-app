-- ── Categories ──────────────────────────────────────────────────────────────

-- Move any expenses/recurring using removed categories to 'other'
UPDATE expenses SET category_id = (SELECT id FROM categories WHERE name = 'other')
  WHERE category_id IN (SELECT id FROM categories WHERE name IN ('gpt', 'claude', 'netflix', 'pilates'));

UPDATE recurring SET category_id = (SELECT id FROM categories WHERE name = 'other')
  WHERE category_id IN (SELECT id FROM categories WHERE name IN ('gpt', 'claude', 'netflix', 'pilates'));

DELETE FROM categories WHERE name IN ('gpt', 'claude', 'netflix', 'pilates');

-- Rename 'convert' → 'remittance' (currency exchange / sending money to MYR)
UPDATE categories SET name = 'remittance', icon = 'ArrowRightLeft' WHERE name = 'convert';

-- Add common daily expense categories
INSERT INTO categories (name, icon, is_joint, sort_order) VALUES
  ('transport', 'Car',         false, 6),
  ('health',    'Heart',       false, 7),
  ('shopping',  'ShoppingBag', false, 8)
ON CONFLICT (name) DO NOTHING;

-- Fix sort order after removals
UPDATE categories SET sort_order = 9  WHERE name = 'remittance';
UPDATE categories SET sort_order = 10 WHERE name = 'disney';
UPDATE categories SET sort_order = 11 WHERE name = 'bv_loan';

-- ── Accounts ─────────────────────────────────────────────────────────────────

-- Reassign any data referencing removed accounts before deleting
UPDATE recurring SET account_id = (SELECT id FROM accounts WHERE name = 'hj_personal_save')
  WHERE account_id IN (SELECT id FROM accounts WHERE name IN ('bv_loan', 'bev_personal_save'));

UPDATE expenses SET account_id = (SELECT id FROM accounts WHERE name = 'joint_daily')
  WHERE account_id IN (SELECT id FROM accounts WHERE name IN ('bv_loan', 'bev_personal_save'));

DELETE FROM accounts WHERE name IN ('bv_loan', 'bev_personal_save');
