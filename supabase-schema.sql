create extension if not exists pgcrypto;

create type topic_status as enum ('OPEN', 'CLAIMED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text not null default '',
  requester_id uuid not null references public.profiles(id) on delete cascade,
  speaker_id uuid references public.profiles(id) on delete set null,
  status topic_status not null default 'OPEN',
  scheduled_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  location text,
  capacity integer check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'OPEN' and scheduled_at is null)
    or status in ('CLAIMED', 'SCHEDULED', 'COMPLETED', 'CANCELLED')
  )
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (topic_id, user_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (topic_id, user_id)
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, user_id)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger topics_touch_updated_at before update on public.topics
for each row execute function public.touch_updated_at();

create trigger ratings_touch_updated_at before update on public.ratings
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.recommendations enable row level security;
alter table public.enrollments enable row level security;
alter table public.ratings enable row level security;

create policy "Profiles readable by authenticated users" on public.profiles
for select to authenticated using (true);

create policy "Users can update own profile" on public.profiles
for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
for insert to authenticated with check (auth.uid() = id);

create policy "Topics readable by authenticated users" on public.topics
for select to authenticated using (true);

create policy "Authenticated users create own topics" on public.topics
for insert to authenticated with check (auth.uid() = requester_id and status = 'OPEN');

create policy "Requesters and speakers update allowed topics" on public.topics
for update to authenticated using (auth.uid() = requester_id or auth.uid() = speaker_id)
with check (auth.uid() = requester_id or auth.uid() = speaker_id);

create policy "Authenticated users can lazily complete past sessions" on public.topics
for update to authenticated using (status = 'SCHEDULED' and scheduled_at < now())
with check (status = 'COMPLETED');

create policy "Recommendations readable" on public.recommendations
for select to authenticated using (true);

create policy "Users create own recommendations" on public.recommendations
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete own recommendations" on public.recommendations
for delete to authenticated using (auth.uid() = user_id);

create policy "Enrollments readable" on public.enrollments
for select to authenticated using (true);

create policy "Users create own enrollments" on public.enrollments
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users delete own enrollments" on public.enrollments
for delete to authenticated using (auth.uid() = user_id);

create policy "Ratings readable" on public.ratings
for select to authenticated using (true);

create policy "Users create own ratings" on public.ratings
for insert to authenticated with check (auth.uid() = user_id);

create policy "Users update own ratings" on public.ratings
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
