create table if not exists public.nexa_subscriptions (
  subscription_id text primary key,
  user_id text not null,
  plan_id text not null default 'starter',
  paypal_subscription_id text unique,
  status text not null default 'unknown',
  current_period_start timestamptz,
  current_period_end timestamptz,
  renewal_date timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nexa_subscriptions_user_updated_idx
  on public.nexa_subscriptions (user_id, updated_at desc);

create index if not exists nexa_subscriptions_status_idx
  on public.nexa_subscriptions (status);

create table if not exists public.nexa_payments (
  payment_id text primary key,
  user_id text not null,
  subscription_id text,
  paypal_transaction_id text unique,
  amount numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'unknown',
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nexa_payments_user_paid_idx
  on public.nexa_payments (user_id, paid_at desc);

create table if not exists public.nexa_plan_usage (
  document_id text primary key,
  user_id text not null,
  tenant_id text not null default 'personal',
  plan_id text not null default 'starter',
  metric text not null,
  period_type text not null,
  period_start text not null,
  used integer not null default 0,
  usage_limit integer,
  status text not null default 'normal',
  reset_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, metric, period_type, period_start)
);

create index if not exists nexa_plan_usage_user_period_idx
  on public.nexa_plan_usage (user_id, metric, period_type, period_start);

alter table public.nexa_subscriptions enable row level security;
alter table public.nexa_payments enable row level security;
alter table public.nexa_plan_usage enable row level security;

drop policy if exists "Service role can manage Nexa subscriptions" on public.nexa_subscriptions;
create policy "Service role can manage Nexa subscriptions"
  on public.nexa_subscriptions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage Nexa payments" on public.nexa_payments;
create policy "Service role can manage Nexa payments"
  on public.nexa_payments
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage Nexa plan usage" on public.nexa_plan_usage;
create policy "Service role can manage Nexa plan usage"
  on public.nexa_plan_usage
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
