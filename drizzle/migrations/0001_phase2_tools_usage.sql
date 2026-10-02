create table public.tools (
  id text primary key,
  display_name text not null,
  description text not null,
  permission text not null default 'user',
  enabled boolean not null default true,
  sort_order integer not null default 0
);
grant select on public.tools to authenticated;
grant insert, update, delete on public.tools to authenticated;
grant all on public.tools to service_role;
alter table public.tools enable row level security;
create policy "tools readable" on public.tools for select to authenticated using (true);
create policy "admins manage tools" on public.tools for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.tools (id, display_name, description, sort_order) values
 ('calculator','Calculator','Evaluate math expressions',0),
 ('datetime','Date & time','Current date and time in any timezone',1),
 ('web_search','Web search','Search the web and return sources',2),
 ('url_fetch','URL fetch','Read the text of a web page',3),
 ('remember','Memory','Save facts to long-term memory',4),
 ('html_preview','HTML preview','Build a web page and show it live',5);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  thread_id uuid,
  model_id text not null,
  reasoning text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  units numeric not null default 0,
  created_at timestamptz not null default now()
);
create index on public.usage_events (user_id, created_at desc);
grant select, insert on public.usage_events to authenticated;
grant all on public.usage_events to service_role;
alter table public.usage_events enable row level security;
create policy "own usage read" on public.usage_events for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own usage insert" on public.usage_events for insert to authenticated with check (user_id = auth.uid());