-- Fix missing RLS policies for recurring, joint_expense_config, and categories

-- recurring: was missing INSERT and DELETE
create policy "Users can insert own recurring" on public.recurring
  for insert with check (
    auth.uid() is not null and (
      user_id = auth.uid() or user_id is null
    )
  );

create policy "Users can delete own recurring" on public.recurring
  for delete using (
    auth.uid() is not null and (
      user_id = auth.uid() or user_id is null
    )
  );

-- joint_expense_config: was missing INSERT and DELETE
create policy "All authenticated users can insert joint config" on public.joint_expense_config
  for insert with check (auth.uid() is not null);

create policy "All authenticated users can delete joint config" on public.joint_expense_config
  for delete using (auth.uid() is not null);

-- categories: was missing UPDATE (needed for updateCategoryDefault in settings)
create policy "All authenticated users can update categories" on public.categories
  for update using (auth.uid() is not null);
