begin;

-- Required for UUID generation in the reminder outbox.
create extension if not exists pgcrypto;

create type public.account_state as enum ('active', 'deleting');
create type public.reminder_status as enum ('pending', 'sending', 'sent', 'failed');
create type public.reminder_channel as enum ('email');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  timezone text not null default 'Asia/Shanghai' check (timezone = 'Asia/Shanghai'),
  account_state public.account_state not null default 'active',
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp()
);

create table public.letters (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 50),
  body_ciphertext text not null,
  body_nonce text not null,
  encryption_version smallint not null default 1 check (encryption_version = 1),
  key_id text not null,
  created_at timestamptz not null default transaction_timestamp(),
  unlock_at timestamptz not null,
  original_unlock_at timestamptz not null,
  unlock_changed_at timestamptz,
  unlock_version integer not null default 1 check (unlock_version between 1 and 2),
  opened_at timestamptz,
  created_idempotency_key uuid not null,
  created_payload_hmac text not null,
  payload_hmac_key_id text not null,
  terms_version text not null,
  unique (user_id, created_idempotency_key),
  check (unlock_at = date_trunc('minute', unlock_at)),
  check (original_unlock_at = date_trunc('minute', original_unlock_at)),
  check ((unlock_changed_at is null and unlock_version = 1) or (unlock_changed_at is not null and unlock_version = 2))
);

create index letters_user_unlock_idx on public.letters (user_id, unlock_at desc);
create index letters_due_idx on public.letters (unlock_at) where opened_at is null;

create table public.reminder_deliveries (
  id uuid primary key,
  letter_id uuid not null references public.letters(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel public.reminder_channel not null default 'email',
  event_key text not null,
  status public.reminder_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count between 0 and 20),
  provider_message_id text,
  last_error_code text,
  last_error_message text,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  next_attempt_at timestamptz not null default transaction_timestamp(),
  sent_at timestamptz,
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  unique (letter_id, channel, event_key)
);

create index reminder_due_idx on public.reminder_deliveries (status, next_attempt_at, lease_expires_at);

-- Internal table for application-level OTP throttling. Keys are HMACs, never raw email or IP values.
create table public.auth_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  updated_at timestamptz not null default transaction_timestamp()
);

alter table public.profiles enable row level security;
alter table public.letters enable row level security;
alter table public.reminder_deliveries enable row level security;
alter table public.auth_rate_limits enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.letters from anon, authenticated;
revoke all on public.reminder_deliveries from anon, authenticated;
revoke all on public.auth_rate_limits from anon, authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(coalesce(new.email, '')))
  on conflict (id) do update set email = excluded.email, updated_at = transaction_timestamp();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.change_letter_unlock_date(
  p_user_id uuid,
  p_letter_id uuid,
  p_new_unlock_at timestamptz
)
returns setof public.letters
language sql
security definer
set search_path = public
as $$
  update public.letters
  set unlock_at = p_new_unlock_at,
      unlock_changed_at = transaction_timestamp(),
      unlock_version = 2
  where id = p_letter_id
    and user_id = p_user_id
    and unlock_at > transaction_timestamp()
    and unlock_changed_at is null
    and p_new_unlock_at <> unlock_at
    and p_new_unlock_at >= ((date_trunc('day', transaction_timestamp() at time zone 'Asia/Shanghai') + interval '1 day') at time zone 'Asia/Shanghai')
    and p_new_unlock_at <= ((date_trunc('day', transaction_timestamp() at time zone 'Asia/Shanghai') + interval '10 years') at time zone 'Asia/Shanghai')
  returning *;
$$;

create or replace function public.open_letter(
  p_user_id uuid,
  p_letter_id uuid
)
returns setof public.letters
language sql
security definer
set search_path = public
as $$
  update public.letters
  set opened_at = coalesce(opened_at, transaction_timestamp())
  where id = p_letter_id
    and user_id = p_user_id
    and unlock_at <= transaction_timestamp()
  returning *;
$$;

create or replace function public.begin_account_deletion(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set account_state = 'deleting', updated_at = transaction_timestamp()
  where id = p_user_id and account_state = 'active';
  return found;
end;
$$;

create or replace function public.consume_auth_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := transaction_timestamp();
  v_count integer;
begin
  insert into public.auth_rate_limits(rate_key, window_started_at, request_count)
  values (p_rate_key, v_now, 1)
  on conflict (rate_key) do update
    set window_started_at = case
          when public.auth_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
          else public.auth_rate_limits.window_started_at
        end,
        request_count = case
          when public.auth_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
          else public.auth_rate_limits.request_count + 1
        end,
        updated_at = v_now
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$$;

create or replace function public.enqueue_due_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.reminder_deliveries(id, letter_id, user_id, event_key)
  select gen_random_uuid(), l.id, l.user_id, 'unlock_v' || l.unlock_version::text
  from public.letters l
  join public.profiles p on p.id = l.user_id and p.account_state = 'active'
  where l.unlock_at <= transaction_timestamp()
  on conflict (letter_id, channel, event_key) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.claim_reminder_batch(p_limit integer, p_lease_seconds integer)
returns setof public.reminder_deliveries
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select id from public.reminder_deliveries
    where status in ('pending', 'failed')
      and next_attempt_at <= transaction_timestamp()
      and (lease_expires_at is null or lease_expires_at <= transaction_timestamp())
      and attempt_count < 8
    order by next_attempt_at, created_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  )
  update public.reminder_deliveries r
  set status = 'sending',
      attempt_count = r.attempt_count + 1,
      locked_at = transaction_timestamp(),
      lease_expires_at = transaction_timestamp() + make_interval(secs => p_lease_seconds),
      updated_at = transaction_timestamp()
  from candidates c
  where r.id = c.id
  returning r.*;
end;
$$;

revoke all on function public.change_letter_unlock_date(uuid, uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.open_letter(uuid, uuid) from public, anon, authenticated;
revoke all on function public.begin_account_deletion(uuid) from public, anon, authenticated;
revoke all on function public.consume_auth_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.enqueue_due_reminders() from public, anon, authenticated;
revoke all on function public.claim_reminder_batch(integer, integer) from public, anon, authenticated;
grant execute on function public.change_letter_unlock_date(uuid, uuid, timestamptz) to service_role;
grant execute on function public.open_letter(uuid, uuid) to service_role;
grant execute on function public.begin_account_deletion(uuid) to service_role;
grant execute on function public.consume_auth_rate_limit(text, integer, integer) to service_role;
grant execute on function public.enqueue_due_reminders() to service_role;
grant execute on function public.claim_reminder_batch(integer, integer) to service_role;

commit;
