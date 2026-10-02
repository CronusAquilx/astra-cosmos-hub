create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.models (
  id text primary key,
  provider text not null,
  display_name text not null,
  description text,
  context_length integer not null default 8192,
  capabilities text[] not null default '{}',
  enabled boolean not null default true,
  usage_multiplier numeric not null default 1,
  config jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.models to authenticated;
grant all on public.models to service_role;
alter table public.models enable row level security;
create policy "models readable" on public.models for select to authenticated using (enabled or public.has_role(auth.uid(),'admin'));
create policy "admins manage models" on public.models for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
grant insert, update, delete on public.models to authenticated;

insert into public.models (id, provider, display_name, description, context_length, capabilities, usage_multiplier, config, sort_order)
values ('astra-local','local','Astra','Local agent · Fast · Private. Runs on your own model server.',8192,array['chat','streaming','tools'],1,'{"env":"AI_BASE_URL"}',0);

create table public.reasoning_levels (
  id text primary key,
  label text not null,
  multiplier numeric not null,
  max_steps integer not null,
  sort_order integer not null
);
grant select on public.reasoning_levels to authenticated;
grant insert, update, delete on public.reasoning_levels to authenticated;
grant all on public.reasoning_levels to service_role;
alter table public.reasoning_levels enable row level security;
create policy "levels readable" on public.reasoning_levels for select to authenticated using (true);
create policy "admins manage levels" on public.reasoning_levels for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.reasoning_levels values
 ('low','Low',1,2,0),('medium','Medium',2,4,1),('high','High',4,8,2),('expert','Expert',8,16,3),('ultra','Ultra',16,32,4);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'New chat',
  model_id text not null default 'astra-local',
  reasoning text not null default 'medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.threads (user_id, updated_at desc);
grant select, insert, update, delete on public.threads to authenticated;
grant all on public.threads to service_role;
alter table public.threads enable row level security;
create policy "own threads" on public.threads for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null,
  ui_id text,
  role text not null,
  parts jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on public.messages (thread_id, created_at);
grant select, insert, update, delete on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "own messages" on public.messages for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.memories to authenticated;
grant all on public.memories to service_role;
alter table public.memories enable row level security;
create policy "own memories" on public.memories for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());