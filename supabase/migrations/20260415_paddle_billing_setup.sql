-- Paddle Billing Integration Tables

-- Create billing_customers table to sync with Paddle customers
create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  paddle_customer_id text unique not null,
  email text not null,
  name text,
  status text default 'active', -- active, archived
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Create billing_subscriptions table to track subscriptions
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete cascade,
  paddle_subscription_id text unique not null,
  paddle_product_id text not null,
  paddle_price_id text,
  plan_name text not null, -- free, pro, enterprise
  plan_price numeric not null,
  currency text default 'INR',
  billing_cycle text, -- monthly, yearly
  status text not null default 'trialing', -- active, paused, past_due, canceled, trialing
  started_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  paused_at timestamp with time zone,
  canceled_at timestamp with time zone,
  cancel_reason text,
  next_billed_at timestamp with time zone,
  trial_ends_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create billing_transactions table to track billing history
create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid not null references public.billing_customers(id) on delete cascade,
  billing_subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  paddle_transaction_id text unique not null,
  amount numeric not null,
  currency text not null,
  status text not null, -- completed, pending, failed, ready, processing
  type text not null, -- subscription, one_time
  receipt_url text,
  receipt_number text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create billing_events table for audit trail
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  billing_customer_id uuid references public.billing_customers(id) on delete set null,
  paddle_event_id text unique not null,
  event_type text not null, -- subscription.created, subscription.updated, etc.
  event_data jsonb,
  processed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_billing_customers_user_id on public.billing_customers(user_id);
create index idx_billing_customers_paddle_customer_id on public.billing_customers(paddle_customer_id);
create index idx_billing_subscriptions_customer_id on public.billing_subscriptions(billing_customer_id);
create index idx_billing_subscriptions_paddle_id on public.billing_subscriptions(paddle_subscription_id);
create index idx_billing_subscriptions_status on public.billing_subscriptions(status);
create index idx_billing_transactions_customer_id on public.billing_transactions(billing_customer_id);
create index idx_billing_transactions_status on public.billing_transactions(status);
create index idx_billing_events_paddle_event_id on public.billing_events(paddle_event_id);
create index idx_billing_events_customer_id on public.billing_events(billing_customer_id);

-- Enable RLS policies
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.billing_events enable row level security;

-- RLS Policies for billing_customers
create policy "Users can view their own billing customer record" on public.billing_customers
  for select using (auth.uid() = user_id);

create policy "Users can update their own billing customer record" on public.billing_customers
  for update using (auth.uid() = user_id);

-- RLS Policies for billing_subscriptions
create policy "Users can view their own subscriptions" on public.billing_subscriptions
  for select using (
    billing_customer_id in (
      select id from public.billing_customers
      where user_id = auth.uid()
    )
  );

-- RLS Policies for billing_transactions
create policy "Users can view their own transactions" on public.billing_transactions
  for select using (
    billing_customer_id in (
      select id from public.billing_customers
      where user_id = auth.uid()
    )
  );

-- RLS Policies for billing_events (service role only)
create policy "Service role can insert events" on public.billing_events
  for insert with check (
    (select auth.role()) = 'service_role'
  );

create policy "Service role can view events" on public.billing_events
  for select using (
    (select auth.role()) = 'service_role'
  );
