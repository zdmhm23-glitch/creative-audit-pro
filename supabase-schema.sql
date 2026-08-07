-- شغل هذا في Supabase > SQL Editor

-- 1. جدول البروفايلات
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits int default 3, -- 3 مجانا
  subscription_status text default 'free', -- free, pro, expired
  subscription_expires_at timestamp,
  created_at timestamp default now()
);

-- 2. جدول التحليلات
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text,
  goal text,
  niche text,
  overall_score int,
  result jsonb,
  image_url text,
  created_at timestamp default now()
);

-- 3. جدول الكوبونات
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, -- مثلا HATEM50
  type text default 'credits', -- credits أو subscription
  value int default 5, -- عدد الكريديت أو أيام الاشتراك
  max_uses int default 100,
  used_count int default 0,
  is_active boolean default true,
  expires_at timestamp,
  created_at timestamp default now()
);

-- 4. جدول مدفوعات BaridiMob اليدوية
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  method text, -- baridimob, lemonsqueezy
  amount int,
  receipt_url text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp default now()
);

-- تفعيل RLS
alter table profiles enable row level security;
alter table analyses enable row level security;
alter table payments enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own analyses" on analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses" on analyses for insert with check (auth.uid() = user_id);

-- Function: انشاء بروفايل تلقائيا عند التسجيل
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, credits) values (new.id, new.email, 3);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- كوبونات تجريبية
insert into coupons (code, type, value, max_uses) values 
('WELCOME10', 'credits', 10, 100),
('HATEM50', 'subscription', 30, 50), -- 30 يوم مجانا
('DZFREE', 'credits', 5, 200);
