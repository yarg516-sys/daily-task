-- =========================================================
-- DailyDesk: Complete Supabase Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/lfinbgixmzqwoqzkwqdx/sql
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    full_name text,
    avatar_url text,
    currency text default '$',
    daily_quote text default 'Focus on progress, not perfection.',
    role text default 'user', -- 'admin' or 'user'
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. TASKS TABLE
create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text default '',
    category text default 'Work', -- 'Work', 'Study', 'Personal', 'Shopping', 'Other'
    priority text default 'Medium', -- 'Low', 'Medium', 'High'
    due_date date default current_date,
    completed boolean default false,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. EXPENSES TABLE
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    amount numeric(12, 2) not null check (amount >= 0),
    category text default 'Other', -- 'Food', 'Transport', 'Shopping', 'Education', 'Bills', 'Entertainment', 'Other'
    expense_date date default current_date not null,
    description text default '',
    payment_method text default 'Card',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. NOTES TABLE
create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    content text default '',
    category text default 'General',
    color text default '#6366f1',
    is_pinned boolean default false,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. GOALS TABLE
create table if not exists public.goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text default '',
    category text default 'Personal', -- 'Study', 'Career', 'Personal', 'Savings', 'Fitness', 'Other'
    target_date date,
    target_amount numeric(12, 2) default 0,
    progress integer default 0 check (progress >= 0 and progress <= 100),
    status text default 'In Progress', -- 'In Progress', 'Completed'
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users only read/write their own data
-- =========================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.expenses enable row level security;
alter table public.notes enable row level security;
alter table public.goals enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
    for insert with check (auth.uid() = id);

-- Tasks Policies
drop policy if exists "Users can manage own tasks" on public.tasks;
create policy "Users can manage own tasks" on public.tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expenses Policies
drop policy if exists "Users can manage own expenses" on public.expenses;
create policy "Users can manage own expenses" on public.expenses
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notes Policies
drop policy if exists "Users can manage own notes" on public.notes;
create policy "Users can manage own notes" on public.notes
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Goals Policies
drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals" on public.goals
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- =========================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'role', 'user')
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- =========================================================
-- HELPER INDEXES FOR HIGH-PERFORMANCE DASHBOARDS
-- =========================================================
create index if not exists idx_tasks_user_due on public.tasks (user_id, due_date, completed);
create index if not exists idx_expenses_user_date on public.expenses (user_id, expense_date);
create index if not exists idx_notes_user_pinned on public.notes (user_id, is_pinned, created_at desc);
create index if not exists idx_goals_user_progress on public.goals (user_id, progress);
